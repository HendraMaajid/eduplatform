package service

import (
	"errors"
	"fmt"
	"math/rand"
	"time"

	"github.com/google/uuid"
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
)

// Enrollment
func EnrollCourse(studentID string, courseID string, req dto.EnrollCourseRequest) (*model.Enrollment, error) {
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, err
	}
	parsedCourseID, err := uuid.Parse(courseID)
	if err != nil {
		return nil, err
	}

	// Check if already enrolled
	var existing model.Enrollment
	if err := database.DB.Where("student_id = ? AND course_id = ?", parsedStudentID, parsedCourseID).First(&existing).Error; err == nil {
		return nil, errors.New("student already enrolled in this course")
	}

	enrollment := model.Enrollment{
		StudentID:     parsedStudentID,
		CourseID:      parsedCourseID,
		PaymentAmount: req.PaymentAmount,
		Progress:      0,
		Status:        "active",
		EnrolledAt:    time.Now(),
	}

	// Transaction to create enrollment and payment record
	tx := database.DB.Begin()

	if err := tx.Create(&enrollment).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	payment := model.Payment{
		StudentID: parsedStudentID,
		CourseID:  parsedCourseID,
		Amount:    req.PaymentAmount,
		PaidAt:    time.Now(),
	}

	if err := tx.Create(&payment).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	tx.Commit()

	var course model.Course
	database.DB.First(&course, "id = ?", courseID)
	var student model.User
	database.DB.First(&student, "id = ?", studentID)
	if course.TeacherID != uuid.Nil {
		CreateNotification(course.TeacherID.String(), "Pendaftaran Baru", fmt.Sprintf("%s mendaftar di %s", student.Name, course.Title), "info", "/dashboard/teacher/courses")
	}

	// Invalidate related caches
	AppCache.InvalidatePrefix("enrollments:")
	AppCache.InvalidatePrefix("dashboard:")
	AppCache.InvalidatePrefix("courses:")

	return &enrollment, nil
}

func GetMyEnrollments(studentID string) ([]model.Enrollment, error) {
	var enrollments []model.Enrollment
	err := database.DB.Preload("Course").Where("student_id = ?", studentID).Find(&enrollments).Error
	return enrollments, err
}

func GetRecentEnrollments(limit int) ([]model.Enrollment, error) {
	// Check cache
	cacheKey := fmt.Sprintf("enrollments:recent:%d", limit)
	if cached, ok := AppCache.Get(cacheKey); ok {
		return cached.([]model.Enrollment), nil
	}

	var enrollments []model.Enrollment
	err := database.DB.Preload("Student").Preload("Course").
		Order("enrolled_at desc").Limit(limit).Find(&enrollments).Error
	if err != nil {
		return nil, err
	}

	AppCache.Set(cacheKey, enrollments)
	return enrollments, err
}

func GetCourseEnrollments(courseID string) ([]model.Enrollment, error) {
	var enrollments []model.Enrollment
	err := database.DB.Preload("Student").Where("course_id = ?", courseID).Find(&enrollments).Error
	return enrollments, err
}

// recalculateProgress calculates the overall course progress based on:
// - Modules completed (50% weight)
// - Quizzes attempted (25% weight)
// - Assignments submitted & graded >= 80 (25% weight)
func recalculateProgress(studentID string, courseID string, enrollment *model.Enrollment) {
	// Single query to get all counts needed for progress calculation (1 round-trip instead of 5)
	var counts struct {
		TotalModules      int64
		TotalQuizzes      int64
		CompletedQuizzes  int64
		TotalAssignments  int64
		GradedAssignments int64
	}
	database.DB.Raw(`
		SELECT
			(SELECT count(*) FROM modules WHERE course_id = ? AND deleted_at IS NULL) as total_modules,
			(SELECT count(*) FROM quizzes WHERE course_id = ? AND deleted_at IS NULL) as total_quizzes,
			(SELECT count(DISTINCT qa.quiz_id) FROM quiz_attempts qa JOIN quizzes q ON q.id = qa.quiz_id WHERE q.course_id = ? AND qa.student_id = ? AND q.deleted_at IS NULL) as completed_quizzes,
			(SELECT count(*) FROM assignments WHERE course_id = ? AND deleted_at IS NULL) as total_assignments,
			(SELECT count(*) FROM submissions s JOIN assignments a ON a.id = s.assignment_id WHERE a.course_id = ? AND s.student_id = ? AND s.score >= 80 AND s.deleted_at IS NULL AND a.deleted_at IS NULL) as graded_assignments
	`, courseID, courseID, courseID, studentID, courseID, courseID, studentID).Scan(&counts)

	// Modules: 50%
	moduleProgress := 1.0
	if counts.TotalModules > 0 {
		moduleProgress = float64(len(enrollment.CompletedModules)) / float64(counts.TotalModules)
	}

	// Quizzes: 25%
	quizProgress := 1.0
	if counts.TotalQuizzes > 0 {
		quizProgress = float64(counts.CompletedQuizzes) / float64(counts.TotalQuizzes)
	}

	// Assignments: 25%
	assignmentProgress := 1.0
	if counts.TotalAssignments > 0 {
		assignmentProgress = float64(counts.GradedAssignments) / float64(counts.TotalAssignments)
	}

	// Weighted total
	progress := (moduleProgress * 50) + (quizProgress * 25) + (assignmentProgress * 25)
	enrollment.Progress = int(progress)
	if enrollment.Progress > 100 {
		enrollment.Progress = 100
	}
}

func CompleteModule(studentID string, courseID string, moduleID string) (*model.Enrollment, error) {
	var enrollment model.Enrollment
	if err := database.DB.Where("student_id = ? AND course_id = ?", studentID, courseID).First(&enrollment).Error; err != nil {
		return nil, errors.New("enrollment not found")
	}

	// Check if already completed
	for _, id := range enrollment.CompletedModules {
		if id == moduleID {
			return &enrollment, nil // Already completed
		}
	}

	// Add module to completed modules
	enrollment.CompletedModules = append(enrollment.CompletedModules, moduleID)

	// Recalculate progress
	recalculateProgress(studentID, courseID, &enrollment)

	if err := database.DB.Save(&enrollment).Error; err != nil {
		return nil, err
	}

	return &enrollment, nil
}

// Submissions
func SubmitAssignment(studentID string, assignmentID string, req dto.SubmitAssignmentRequest) (*model.Submission, error) {
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, err
	}
	parsedAssignmentID, err := uuid.Parse(assignmentID)
	if err != nil {
		return nil, err
	}

	submission := model.Submission{
		StudentID:    parsedStudentID,
		AssignmentID: parsedAssignmentID,
		FileURL:      req.FileURL,
		FileName:     req.FileName,
		Description:  req.Description,
		Status:       "submitted",
		SubmittedAt:  time.Now(),
	}

	if err := database.DB.Create(&submission).Error; err != nil {
		return nil, err
	}

	var assignment model.Assignment
	database.DB.Preload("Course").First(&assignment, "id = ?", assignmentID)
	var student model.User
	database.DB.First(&student, "id = ?", studentID)
	if assignment.Course != nil && assignment.Course.TeacherID != uuid.Nil {
		CreateNotification(assignment.Course.TeacherID.String(), "Submission Baru", fmt.Sprintf("%s mengumpulkan tugas '%s'", student.Name, assignment.Title), "info", "/dashboard/teacher/grading")
	}

	return &submission, nil
}

func GradeSubmission(submissionID string, req dto.GradeSubmissionRequest) (*model.Submission, error) {
	var submission model.Submission
	if err := database.DB.Preload("Assignment").Where("id = ?", submissionID).First(&submission).Error; err != nil {
		return nil, err
	}

	submission.Score = req.Score
	submission.Feedback = req.Feedback
	
	if req.Score >= 80 {
		submission.Status = "passed"
	} else {
		submission.Status = "failed"
	}

	if err := database.DB.Save(&submission).Error; err != nil {
		return nil, err
	}

	// Recalculate enrollment progress for the student
	if submission.Assignment != nil {
		courseID := submission.Assignment.CourseID.String()
		studentID := submission.StudentID.String()
		var enrollment model.Enrollment
		if err := database.DB.Where("student_id = ? AND course_id = ?", studentID, courseID).First(&enrollment).Error; err == nil {
			recalculateProgress(studentID, courseID, &enrollment)
			database.DB.Save(&enrollment)
		}
		
		CreateNotification(submission.StudentID.String(), "Nilai Tugas", fmt.Sprintf("Tugas '%s' telah dinilai. Skor: %d/100", submission.Assignment.Title, req.Score), "info", fmt.Sprintf("/dashboard/student/courses/%s/assignments/%s", courseID, submission.AssignmentID.String()))
	}

	return &submission, nil
}

func GetMySubmissions(studentID string) ([]model.Submission, error) {
	var submissions []model.Submission
	err := database.DB.Preload("Assignment").Where("student_id = ?", studentID).Find(&submissions).Error
	return submissions, err
}

func GetTeacherSubmissions(teacherID string) ([]model.Submission, error) {
	var submissions []model.Submission
	// We need to join with Assignments and Courses to filter by teacherID
	err := database.DB.
		Preload("Student").
		Preload("Assignment").
		Preload("Assignment.Course").
		Joins("JOIN assignments ON assignments.id = submissions.assignment_id").
		Joins("JOIN courses ON courses.id = assignments.course_id").
		Where("courses.teacher_id = ?", teacherID).
		Find(&submissions).Error
	return submissions, err
}

// Certificate
func GenerateCertificate(studentID string, courseID string) (*model.Certificate, error) {
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, err
	}
	parsedCourseID, err := uuid.Parse(courseID)
	if err != nil {
		return nil, err
	}

	// Check if already has certificate
	var existing model.Certificate
	if err := database.DB.Where("student_id = ? AND course_id = ?", parsedStudentID, parsedCourseID).First(&existing).Error; err == nil {
		return &existing, nil
	}

	// ===== VALIDATION: All modules must be completed =====
	var totalModules int64
	database.DB.Model(&model.Module{}).Where("course_id = ?", parsedCourseID).Count(&totalModules)

	var enrollment model.Enrollment
	if err := database.DB.Where("student_id = ? AND course_id = ?", parsedStudentID, parsedCourseID).First(&enrollment).Error; err != nil {
		return nil, errors.New("anda belum terdaftar di kursus ini")
	}

	if totalModules > 0 && int64(len(enrollment.CompletedModules)) < totalModules {
		return nil, fmt.Errorf("anda belum menyelesaikan semua materi (%d/%d)", len(enrollment.CompletedModules), totalModules)
	}

	// ===== VALIDATION: All quizzes must be attempted =====
	// Batch query: find quizzes that student has NOT attempted (1 query instead of N)
	var unattemptedQuizzes []model.Quiz
	database.DB.Raw(`
		SELECT q.* FROM quizzes q
		WHERE q.course_id = ? AND q.deleted_at IS NULL
		AND q.id NOT IN (
			SELECT DISTINCT qa.quiz_id FROM quiz_attempts qa WHERE qa.student_id = ?
		)
	`, parsedCourseID, parsedStudentID).Scan(&unattemptedQuizzes)

	if len(unattemptedQuizzes) > 0 {
		return nil, fmt.Errorf("anda belum mengerjakan kuis: %s", unattemptedQuizzes[0].Title)
	}

	// ===== VALIDATION: All assignments must be submitted AND graded >= 80 =====
	// Batch query: get all assignments with their submissions for this student (2 queries instead of N+1)
	var assignments []model.Assignment
	database.DB.Where("course_id = ?", parsedCourseID).Find(&assignments)

	if len(assignments) > 0 {
		// Batch fetch all submissions for this student in this course's assignments
		assignmentIDs := make([]uuid.UUID, len(assignments))
		for i, a := range assignments {
			assignmentIDs[i] = a.ID
		}

		var submissions []model.Submission
		database.DB.Where("assignment_id IN ? AND student_id = ?", assignmentIDs, parsedStudentID).Find(&submissions)

		// Build lookup map
		submissionMap := make(map[uuid.UUID]*model.Submission, len(submissions))
		for i := range submissions {
			submissionMap[submissions[i].AssignmentID] = &submissions[i]
		}

		// Validate each assignment
		for _, assignment := range assignments {
			sub, exists := submissionMap[assignment.ID]
			if !exists {
				return nil, fmt.Errorf("anda belum mengumpulkan tugas: %s", assignment.Title)
			}
			if sub.Status == "submitted" {
				return nil, fmt.Errorf("tugas '%s' belum dinilai oleh pengajar", assignment.Title)
			}
			if sub.Score < 80 {
				return nil, fmt.Errorf("nilai tugas '%s' belum mencukupi (%d/100, minimum 80)", assignment.Title, sub.Score)
			}
		}
	}

	// All validations passed — generate certificate
	certNumber := fmt.Sprintf("CERT-%s-%d", time.Now().Format("20060102"), rand.Intn(10000))

	certificate := model.Certificate{
		StudentID:         parsedStudentID,
		CourseID:          parsedCourseID,
		CertificateNumber: certNumber,
		IssuedAt:          time.Now(),
	}

	if err := database.DB.Create(&certificate).Error; err != nil {
		return nil, err
	}

	// Update enrollment status
	enrollment.Status = "certified"
	database.DB.Save(&enrollment)

	return &certificate, nil
}

func GetMyCertificates(studentID string) ([]model.Certificate, error) {
	var certificates []model.Certificate
	err := database.DB.Preload("Course").Where("student_id = ?", studentID).Find(&certificates).Error
	return certificates, err
}
