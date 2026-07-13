package service

import (
	"context"
	cryptoRand "crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// StartCourse creates a student's learning state when a published course is opened.
func StartCourse(ctx context.Context, studentID, courseID string) (*model.LearningProgress, error) {
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, fmt.Errorf("parse student id: %w", err)
	}
	parsedCourseID, err := uuid.Parse(courseID)
	if err != nil {
		return nil, fmt.Errorf("parse course id: %w", err)
	}

	var course model.Course
	if err := database.DB.WithContext(ctx).Where("id = ? AND status = ?", parsedCourseID, "published").First(&course).Error; err != nil {
		return nil, errors.New("published course not found")
	}

	now := time.Now()
	progress := model.LearningProgress{
		StudentID: parsedStudentID, CourseID: parsedCourseID, CompletedModules: model.StringArray{},
		Progress: 0, Status: "in_progress", StartedAt: now, LastAccessedAt: now,
	}
	if err := database.DB.WithContext(ctx).Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "student_id"}, {Name: "course_id"}},
		DoUpdates: clause.Assignments(map[string]any{"last_accessed_at": now, "updated_at": now}),
	}).Create(&progress).Error; err != nil {
		return nil, fmt.Errorf("start course: %w", err)
	}
	if err := database.DB.WithContext(ctx).Preload("Course.Teacher").Where("student_id = ? AND course_id = ?", parsedStudentID, parsedCourseID).First(&progress).Error; err != nil {
		return nil, fmt.Errorf("load learning progress: %w", err)
	}
	AppCache.InvalidatePrefix("learning:")
	AppCache.InvalidatePrefix("dashboard:")
	return &progress, nil
}

// GetMyLearningProgress returns all courses a student has opened.
func GetMyLearningProgress(ctx context.Context, studentID string) ([]model.LearningProgress, error) {
	var progresses []model.LearningProgress
	err := database.DB.WithContext(ctx).Preload("Course.Teacher").Preload("LastModule").
		Where("student_id = ?", studentID).Order("last_accessed_at DESC").Find(&progresses).Error
	return progresses, err
}

// GetRecentLearningProgress returns the latest platform learning activity.
func GetRecentLearningProgress(ctx context.Context, limit int) ([]model.LearningProgress, error) {
	var progresses []model.LearningProgress
	err := database.DB.WithContext(ctx).Preload("Student").Preload("Course").
		Order("last_accessed_at DESC").Limit(limit).Find(&progresses).Error
	return progresses, err
}

// GetAllLearningProgress returns a paginated administrator view across students and courses.
func GetAllLearningProgress(
	ctx context.Context,
	page int,
	limit int,
	search string,
	status string,
) (*dto.PaginatedResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	query := database.DB.WithContext(ctx).Model(&model.LearningProgress{}).
		Joins("JOIN users ON users.id = learning_progresses.student_id AND users.deleted_at IS NULL").
		Joins("JOIN courses ON courses.id = learning_progresses.course_id AND courses.deleted_at IS NULL")
	if search = strings.TrimSpace(search); search != "" {
		pattern := "%" + search + "%"
		query = query.Where(
			"users.name ILIKE ? OR users.email ILIKE ? OR courses.title ILIKE ?",
			pattern,
			pattern,
			pattern,
		)
	}
	if status != "" && status != "all" {
		query = query.Where("learning_progresses.status = ?", status)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, fmt.Errorf("count learning progress: %w", err)
	}

	var progresses []model.LearningProgress
	if err := query.Select("learning_progresses.*").
		Preload("Student").
		Preload("Course").
		Order("learning_progresses.last_accessed_at DESC").
		Offset((page - 1) * limit).
		Limit(limit).
		Find(&progresses).Error; err != nil {
		return nil, fmt.Errorf("load learning progress: %w", err)
	}

	return &dto.PaginatedResponse{
		Data: progresses,
		Meta: dto.PaginationMeta{
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: int((total + int64(limit) - 1) / int64(limit)),
		},
	}, nil
}

// GetCourseLearners returns students who started a course.
func GetCourseLearners(ctx context.Context, courseID string) ([]model.LearningProgress, error) {
	var progresses []model.LearningProgress
	err := database.DB.WithContext(ctx).Preload("Student").Where("course_id = ?", courseID).
		Order("last_accessed_at DESC").Find(&progresses).Error
	return progresses, err
}

type learningRequirementCounts struct {
	TotalModules      int64
	TotalQuizzes      int64
	CompletedQuizzes  int64
	TotalAssignments  int64
	GradedAssignments int64
}

func calculateWeightedProgress(moduleDone int, counts learningRequirementCounts) int {
	categoryProgress := func(done, total int64) float64 {
		if total == 0 {
			return 1
		}
		value := float64(done) / float64(total)
		if value > 1 {
			return 1
		}
		return value
	}
	value := categoryProgress(int64(moduleDone), counts.TotalModules)*50 +
		categoryProgress(counts.CompletedQuizzes, counts.TotalQuizzes)*25 +
		categoryProgress(counts.GradedAssignments, counts.TotalAssignments)*25
	return min(int(value), 100)
}

func recalculateProgressWithDB(ctx context.Context, db *gorm.DB, studentID, courseID string, progress *model.LearningProgress) error {
	var counts learningRequirementCounts
	err := db.WithContext(ctx).Raw(`
		SELECT
			(SELECT count(*) FROM modules WHERE course_id = ? AND is_published = true AND deleted_at IS NULL) AS total_modules,
			(SELECT count(*) FROM quizzes WHERE course_id = ? AND is_published = true AND deleted_at IS NULL) AS total_quizzes,
			(SELECT count(DISTINCT qa.quiz_id) FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id WHERE q.course_id = ? AND qa.student_id = ? AND qa.passed = true AND q.is_published = true AND q.deleted_at IS NULL) AS completed_quizzes,
			(SELECT count(*) FROM assignments WHERE course_id = ? AND is_published = true AND deleted_at IS NULL) AS total_assignments,
			(SELECT count(*) FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.course_id = ? AND s.student_id = ? AND s.score >= 80 AND a.is_published = true AND s.deleted_at IS NULL AND a.deleted_at IS NULL) AS graded_assignments
	`, courseID, courseID, courseID, studentID, courseID, courseID, studentID).Scan(&counts).Error
	if err != nil {
		return fmt.Errorf("count learning requirements: %w", err)
	}

	progress.Progress = calculateWeightedProgress(len(progress.CompletedModules), counts)
	if progress.Progress == 100 && progress.Status != "certified" {
		progress.Status = "completed"
	} else if progress.Progress < 100 {
		progress.Status = "in_progress"
	}
	return nil
}

func recalculateProgress(ctx context.Context, studentID, courseID string, progress *model.LearningProgress) error {
	return recalculateProgressWithDB(ctx, database.DB, studentID, courseID, progress)
}

// CompleteModule marks a published module complete and recalculates progress.
func CompleteModule(ctx context.Context, studentID, courseID, moduleID string) (*model.LearningProgress, error) {
	if _, err := StartCourse(ctx, studentID, courseID); err != nil {
		return nil, err
	}
	var result model.LearningProgress
	err := database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("student_id = ? AND course_id = ?", studentID, courseID).First(&result).Error; err != nil {
			return fmt.Errorf("lock learning progress: %w", err)
		}
		var module model.Module
		if err := tx.Where("id = ? AND course_id = ? AND is_published = true", moduleID, courseID).First(&module).Error; err != nil {
			return errors.New("published module not found")
		}
		alreadyCompleted := false
		for _, completedID := range result.CompletedModules {
			if completedID == moduleID {
				alreadyCompleted = true
				break
			}
		}
		if !alreadyCompleted {
			result.CompletedModules = append(result.CompletedModules, moduleID)
		}
		result.LastModuleID = &module.ID
		result.LastAccessedAt = time.Now()
		if err := recalculateProgressWithDB(ctx, tx, studentID, courseID, &result); err != nil {
			return err
		}
		if err := tx.Save(&result).Error; err != nil {
			return fmt.Errorf("save module progress: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	AppCache.InvalidatePrefix("dashboard:")
	return &result, nil
}

// SubmitAssignment creates or replaces a student's submission for a published assignment.
func SubmitAssignment(ctx context.Context, studentID, assignmentID string, req dto.SubmitAssignmentRequest) (*model.Submission, error) {
	if !isSafeResourceURL(req.FileURL) {
		return nil, errors.New("submission link must use http or https")
	}
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, fmt.Errorf("parse student id: %w", err)
	}
	parsedAssignmentID, err := uuid.Parse(assignmentID)
	if err != nil {
		return nil, fmt.Errorf("parse assignment id: %w", err)
	}
	var assignment model.Assignment
	if err := database.DB.WithContext(ctx).Preload("Course").Where("id = ? AND is_published = true", parsedAssignmentID).First(&assignment).Error; err != nil || assignment.Course == nil || assignment.Course.Status != "published" {
		return nil, errors.New("published assignment not found")
	}
	if _, err := StartCourse(ctx, studentID, assignment.CourseID.String()); err != nil {
		return nil, err
	}

	now := time.Now()
	submission := model.Submission{AssignmentID: parsedAssignmentID, StudentID: parsedStudentID, FileURL: req.FileURL, FileName: req.FileName, Description: req.Description, Status: "submitted", SubmittedAt: now}
	if err := database.DB.WithContext(ctx).Clauses(clause.OnConflict{
		Columns: []clause.Column{{Name: "student_id"}, {Name: "assignment_id"}},
		DoUpdates: clause.Assignments(map[string]any{
			"file_url": req.FileURL, "file_name": req.FileName, "description": req.Description,
			"status": "submitted", "score": 0, "feedback": "", "submitted_at": now, "deleted_at": nil,
		}),
	}).Create(&submission).Error; err != nil {
		return nil, fmt.Errorf("save assignment submission: %w", err)
	}
	if assignment.Course.TeacherID != uuid.Nil {
		var student model.User
		settings, settingsErr := GetPlatformSettings(ctx)
		if settingsErr == nil && settings.NotifyNewSubmission {
			if err := database.DB.WithContext(ctx).First(&student, "id = ?", studentID).Error; err == nil {
				if err := CreateNotification(assignment.Course.TeacherID.String(), "Submission Baru", fmt.Sprintf("%s mengumpulkan tugas '%s'", student.Name, assignment.Title), "info", "/dashboard/teacher/grading"); err != nil {
					log.Printf("create submission notification: %v", err)
				}
			}
		}
	}
	AppCache.InvalidatePrefix("dashboard:")
	return &submission, nil
}

// GradeSubmission grades a submission after verifying course ownership.
func GradeSubmission(ctx context.Context, submissionID string, req dto.GradeSubmissionRequest, userID, role string) (*model.Submission, error) {
	var submission model.Submission
	if err := database.DB.WithContext(ctx).Preload("Assignment.Course").Where("id = ?", submissionID).First(&submission).Error; err != nil {
		return nil, fmt.Errorf("find submission: %w", err)
	}
	if submission.Assignment == nil || submission.Assignment.Course == nil {
		return nil, errors.New("submission course not found")
	}
	if err := AuthorizeCourseManagement(ctx, submission.Assignment.CourseID.String(), userID, role); err != nil {
		return nil, err
	}
	submission.Score = req.Score
	submission.Feedback = req.Feedback
	if req.Score >= 80 {
		submission.Status = "passed"
	} else {
		submission.Status = "failed"
	}
	if err := database.DB.WithContext(ctx).Save(&submission).Error; err != nil {
		return nil, fmt.Errorf("save grade: %w", err)
	}

	courseID := submission.Assignment.CourseID.String()
	studentID := submission.StudentID.String()
	var progress model.LearningProgress
	if err := database.DB.WithContext(ctx).Where("student_id = ? AND course_id = ?", studentID, courseID).First(&progress).Error; err == nil {
		if err := recalculateProgress(ctx, studentID, courseID, &progress); err == nil {
			_ = database.DB.WithContext(ctx).Save(&progress).Error
		}
	}
	settings, settingsErr := GetPlatformSettings(ctx)
	preferences, preferencesErr := GetMyPreferences(ctx, studentID)
	if settingsErr == nil && preferencesErr == nil && settings.NotifyGradePublished && preferences.NotifyGrades {
		if err := CreateNotification(studentID, "Nilai Tugas", fmt.Sprintf("Tugas '%s' telah dinilai. Skor: %d/100", submission.Assignment.Title, req.Score), "info", fmt.Sprintf("/dashboard/student/courses/%s/assignments/%s", courseID, submission.AssignmentID)); err != nil {
			log.Printf("create grade notification: %v", err)
		}
	}
	AppCache.InvalidatePrefix("dashboard:")
	return &submission, nil
}

func GetMySubmissions(ctx context.Context, studentID string) ([]model.Submission, error) {
	var submissions []model.Submission
	err := database.DB.WithContext(ctx).Preload("Assignment.Course").Where("student_id = ?", studentID).Order("submitted_at DESC").Find(&submissions).Error
	return submissions, err
}

func GetTeacherSubmissions(ctx context.Context, teacherID, role string) ([]model.Submission, error) {
	var submissions []model.Submission
	query := database.DB.WithContext(ctx).Preload("Student").Preload("Assignment.Course").
		Joins("JOIN assignments ON assignments.id = submissions.assignment_id").
		Joins("JOIN courses ON courses.id = assignments.course_id")
	if role == "teacher" {
		query = query.Where("courses.teacher_id = ?", teacherID)
	}
	err := query.Order("submissions.submitted_at DESC").Find(&submissions).Error
	return submissions, err
}

// GenerateCertificate issues a certificate after all published requirements pass.
func GenerateCertificate(ctx context.Context, studentID, courseID string) (*model.Certificate, error) {
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, fmt.Errorf("parse student id: %w", err)
	}
	parsedCourseID, err := uuid.Parse(courseID)
	if err != nil {
		return nil, fmt.Errorf("parse course id: %w", err)
	}
	var certificate model.Certificate
	err = database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var existing model.Certificate
		lookupErr := tx.Where("student_id = ? AND course_id = ?", parsedStudentID, parsedCourseID).First(&existing).Error
		if lookupErr == nil {
			certificate = existing
			return nil
		}
		if !errors.Is(lookupErr, gorm.ErrRecordNotFound) {
			return lookupErr
		}
		var course model.Course
		if err := tx.Select("id").Where("id = ? AND status = 'published'", parsedCourseID).First(&course).Error; err != nil {
			return errors.New("published course not found")
		}
		var progress model.LearningProgress
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("student_id = ? AND course_id = ?", parsedStudentID, parsedCourseID).First(&progress).Error; err != nil {
			return errors.New("mulai course ini sebelum mengambil sertifikat")
		}
		if err := recalculateProgressWithDB(ctx, tx, studentID, courseID, &progress); err != nil {
			return err
		}
		if progress.Progress < 100 {
			return fmt.Errorf("progress course belum selesai (%d%%)", progress.Progress)
		}
		randBytes := make([]byte, 6)
		if _, err := cryptoRand.Read(randBytes); err != nil {
			return fmt.Errorf("generate certificate number: %w", err)
		}
		issuer := defaultPlatformSettings().CertificateIssuer
		var platformSettings model.PlatformSettings
		if settingsErr := tx.Select("certificate_issuer").First(&platformSettings, 1).Error; settingsErr == nil && strings.TrimSpace(platformSettings.CertificateIssuer) != "" {
			issuer = platformSettings.CertificateIssuer
		}
		certificate = model.Certificate{
			StudentID: parsedStudentID, CourseID: parsedCourseID,
			CertificateNumber: fmt.Sprintf("CERT-%s-%s", time.Now().Format("20060102"), hex.EncodeToString(randBytes)),
			Issuer:            issuer, IssuedAt: time.Now(),
		}
		if err := tx.Create(&certificate).Error; err != nil {
			return fmt.Errorf("create certificate: %w", err)
		}
		progress.Status = "certified"
		progress.Progress = 100
		if err := tx.Save(&progress).Error; err != nil {
			return fmt.Errorf("certify learning progress: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	AppCache.InvalidatePrefix("dashboard:")
	return &certificate, nil
}

func GetMyCertificates(ctx context.Context, studentID string) ([]model.Certificate, error) {
	var certificates []model.Certificate
	err := database.DB.WithContext(ctx).Preload("Course.Teacher").Where("student_id = ?", studentID).Order("issued_at DESC").Find(&certificates).Error
	return certificates, err
}
