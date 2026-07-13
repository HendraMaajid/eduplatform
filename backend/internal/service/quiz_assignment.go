package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
)

// Quizzes
func GetQuizzesByCourse(ctx context.Context, courseID string) ([]model.Quiz, error) {
	var quizzes []model.Quiz
	err := database.DB.WithContext(ctx).Joins("JOIN courses ON courses.id = quizzes.course_id").
		Where("quizzes.course_id = ? AND quizzes.is_published = true AND courses.status = 'published' AND courses.deleted_at IS NULL", courseID).Find(&quizzes).Error
	return quizzes, err
}

func GetManagedQuizzesByCourse(ctx context.Context, courseID string) ([]model.Quiz, error) {
	var quizzes []model.Quiz
	err := database.DB.WithContext(ctx).Preload("Questions").Where("course_id = ?", courseID).Find(&quizzes).Error
	return quizzes, err
}

func AuthorizeQuizManagement(ctx context.Context, quizID, userID, role string) error {
	var quiz model.Quiz
	if err := database.DB.WithContext(ctx).Select("course_id").First(&quiz, "id = ?", quizID).Error; err != nil {
		return err
	}
	return AuthorizeCourseManagement(ctx, quiz.CourseID.String(), userID, role)
}

func AuthorizeAssignmentManagement(ctx context.Context, assignmentID, userID, role string) error {
	var assignment model.Assignment
	if err := database.DB.WithContext(ctx).Select("course_id").First(&assignment, "id = ?", assignmentID).Error; err != nil {
		return err
	}
	return AuthorizeCourseManagement(ctx, assignment.CourseID.String(), userID, role)
}

func AuthorizeQuestionManagement(ctx context.Context, questionID, userID, role string) error {
	var question model.Question
	if err := database.DB.WithContext(ctx).Select("quiz_id").First(&question, "id = ?", questionID).Error; err != nil {
		return err
	}
	return AuthorizeQuizManagement(ctx, question.QuizID.String(), userID, role)
}

func CreateQuiz(ctx context.Context, courseID string, req dto.CreateQuizRequest) (*model.Quiz, error) {
	parsedCourseID, err := uuid.Parse(courseID)
	if err != nil {
		return nil, err
	}

	quiz := model.Quiz{
		CourseID:     parsedCourseID,
		Title:        req.Title,
		Description:  req.Description,
		PassingScore: req.PassingScore,
		TimeLimit:    req.TimeLimit,
		IsPublished:  req.IsPublished,
	}

	if err := database.DB.WithContext(ctx).Create(&quiz).Error; err != nil {
		return nil, err
	}

	return &quiz, nil
}

func UpdateQuiz(ctx context.Context, id string, req dto.UpdateQuizRequest) (*model.Quiz, error) {
	db := database.DB.WithContext(ctx)
	var quiz model.Quiz
	if err := db.First(&quiz, "id = ?", id).Error; err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.PassingScore != 0 {
		updates["passing_score"] = req.PassingScore
	}
	if req.TimeLimit != 0 {
		updates["time_limit"] = req.TimeLimit
	}
	if req.IsPublished != nil {
		updates["is_published"] = *req.IsPublished
	}

	if err := db.Model(&quiz).Updates(updates).Error; err != nil {
		return nil, err
	}
	if err := db.First(&quiz, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &quiz, nil
}

func DeleteQuiz(ctx context.Context, id string) error {
	db := database.DB.WithContext(ctx)
	var quiz model.Quiz
	if err := db.First(&quiz, "id = ?", id).Error; err != nil {
		return err
	}

	return db.Delete(&quiz).Error
}

// Assignments
func SubmitQuiz(ctx context.Context, studentID string, quizID string, req dto.SubmitQuizRequest) (*model.QuizAttempt, error) {
	db := database.DB.WithContext(ctx)
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, err
	}
	parsedQuizID, err := uuid.Parse(quizID)
	if err != nil {
		return nil, err
	}

	var existingAttempt model.QuizAttempt
	attemptErr := db.Where("student_id = ? AND quiz_id = ?", parsedStudentID, parsedQuizID).
		Order("completed_at desc").
		First(&existingAttempt).Error
	if attemptErr != nil && !errors.Is(attemptErr, gorm.ErrRecordNotFound) {
		return nil, attemptErr
	}
	alreadyAttempted := attemptErr == nil
	wasPassed := alreadyAttempted && existingAttempt.Passed

	// Fetch quiz and its questions
	var quiz model.Quiz
	if err := db.Select("quizzes.id", "quizzes.course_id", "quizzes.passing_score").
		Joins("JOIN courses ON courses.id = quizzes.course_id").
		Preload("Questions", func(query *gorm.DB) *gorm.DB {
			return query.Select("id", "quiz_id", "correct_answer", "points")
		}).
		Where("quizzes.id = ? AND quizzes.is_published = true AND courses.status = 'published'", parsedQuizID).
		First(&quiz).Error; err != nil {
		return nil, err
	}

	if _, err := StartCourse(ctx, studentID, quiz.CourseID.String()); err != nil {
		return nil, err
	}

	now := time.Now()
	attempt := model.QuizAttempt{
		QuizID:      parsedQuizID,
		StudentID:   parsedStudentID,
		CompletedAt: now,
		Score:       0,
		TotalPoints: 0,
	}

	// Map questions for quick lookup
	questionMap := make(map[uuid.UUID]model.Question, len(quiz.Questions))
	for _, q := range quiz.Questions {
		questionMap[q.ID] = q
		attempt.TotalPoints += q.Points
	}

	// Calculate score
	answers := make([]model.QuizAnswer, 0, len(req.Answers))
	for _, ansReq := range req.Answers {
		qID, err := uuid.Parse(ansReq.QuestionID)
		if err != nil {
			continue
		}

		q, exists := questionMap[qID]
		if !exists {
			continue
		}

		isCorrect := false
		points := 0
		// Normalize: trim spaces and compare case-insensitively
		studentAnswer := strings.TrimSpace(ansReq.Answer)
		correctAnswer := strings.TrimSpace(q.CorrectAnswer)

		if strings.EqualFold(studentAnswer, correctAnswer) {
			isCorrect = true
			points = q.Points
			attempt.Score += points
		}

		answers = append(answers, model.QuizAnswer{
			QuestionID: qID,
			Answer:     ansReq.Answer,
			IsCorrect:  isCorrect,
			Points:     points,
		})
	}

	// Calculate percentage and check if passed
	percentage := 0
	if attempt.TotalPoints > 0 {
		percentage = (attempt.Score * 100) / attempt.TotalPoints
	}
	currentPassed := percentage >= quiz.PassingScore
	attempt.Score = percentage
	attempt.TotalPoints = 100
	attempt.Passed = currentPassed

	// Save everything in a single transaction
	tx := db.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
			panic(r)
		}
	}()
	var attemptID uuid.UUID
	if alreadyAttempted {
		if err := tx.Where("attempt_id = ?", existingAttempt.ID).Delete(&model.QuizAnswer{}).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		existingAttempt.Score = max(existingAttempt.Score, attempt.Score)
		existingAttempt.TotalPoints = 100
		existingAttempt.Passed = existingAttempt.Passed || currentPassed
		existingAttempt.CompletedAt = now
		if err := tx.Save(&existingAttempt).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		attemptID = existingAttempt.ID
	} else {
		if err := tx.Create(&attempt).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
		attemptID = attempt.ID
	}

	// Batch insert all answers in 1 query instead of N queries
	for i := range answers {
		answers[i].AttemptID = attemptID
	}
	if len(answers) > 0 {
		if err := tx.CreateInBatches(answers, len(answers)).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}
	attempt.Answers = answers
	if alreadyAttempted {
		existingAttempt.Answers = answers
	}

	if err := tx.Commit().Error; err != nil {
		return nil, err
	}

	// Recalculate learning progress.
	if currentPassed && !wasPassed {
		var progress model.LearningProgress
		if err := db.Where("student_id = ? AND course_id = ?", parsedStudentID, quiz.CourseID).First(&progress).Error; err != nil {
			return nil, err
		}
		previousProgress := progress.Progress
		if err := recalculateProgress(ctx, studentID, quiz.CourseID.String(), &progress); err != nil {
			return nil, err
		}
		if progress.Progress != previousProgress {
			if err := db.Save(&progress).Error; err != nil {
				return nil, err
			}
			AppCache.InvalidatePrefix("dashboard:")
		}
	}

	if alreadyAttempted {
		return &existingAttempt, nil
	}

	return &attempt, nil
}

func GetQuizAttempt(ctx context.Context, studentID string, quizID string) (*model.QuizAttempt, error) {
	var attempt model.QuizAttempt
	err := database.DB.WithContext(ctx).Preload("Answers").Where("student_id = ? AND quiz_id = ?", studentID, quizID).Order("completed_at desc").First(&attempt).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

// Assignments
func GetAssignmentsByCourse(ctx context.Context, courseID string) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := database.DB.WithContext(ctx).Joins("JOIN courses ON courses.id = assignments.course_id").
		Where("assignments.course_id = ? AND assignments.is_published = true AND courses.status = 'published' AND courses.deleted_at IS NULL", courseID).Find(&assignments).Error
	return assignments, err
}

func GetManagedAssignmentsByCourse(ctx context.Context, courseID string) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := database.DB.WithContext(ctx).Where("course_id = ?", courseID).Find(&assignments).Error
	return assignments, err
}

func CreateAssignment(ctx context.Context, courseID string, req dto.CreateAssignmentRequest) (*model.Assignment, error) {
	parsedCourseID, err := uuid.Parse(courseID)
	if err != nil {
		return nil, err
	}

	deadline, err := time.Parse(time.RFC3339, req.Deadline)
	if err != nil {
		deadline = time.Now().AddDate(0, 0, 7) // default 7 days
	}

	assignment := model.Assignment{
		CourseID:     parsedCourseID,
		Title:        req.Title,
		Description:  req.Description,
		Instructions: req.Instructions,
		Deadline:     deadline,
		MaxScore:     req.MaxScore,
		IsPublished:  req.IsPublished,
	}

	if err := database.DB.WithContext(ctx).Create(&assignment).Error; err != nil {
		return nil, err
	}

	return &assignment, nil
}

func UpdateAssignment(ctx context.Context, id string, req dto.UpdateAssignmentRequest) (*model.Assignment, error) {
	db := database.DB.WithContext(ctx)
	var assignment model.Assignment
	if err := db.First(&assignment, "id = ?", id).Error; err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Instructions != "" {
		updates["instructions"] = req.Instructions
	}
	if req.Deadline != "" {
		if deadline, err := time.Parse(time.RFC3339, req.Deadline); err == nil {
			updates["deadline"] = deadline
		}
	}
	if req.MaxScore != 0 {
		updates["max_score"] = req.MaxScore
	}
	if req.IsPublished != nil {
		updates["is_published"] = *req.IsPublished
	}

	if err := db.Model(&assignment).Updates(updates).Error; err != nil {
		return nil, err
	}
	if err := db.First(&assignment, "id = ?", id).Error; err != nil {
		return nil, err
	}

	return &assignment, nil
}

func DeleteAssignment(ctx context.Context, id string) error {
	db := database.DB.WithContext(ctx)
	var assignment model.Assignment
	if err := db.First(&assignment, "id = ?", id).Error; err != nil {
		return err
	}

	return db.Delete(&assignment).Error
}

// Questions
func GetQuestionsByQuiz(ctx context.Context, quizID string) ([]model.Question, error) {
	var questions []model.Question
	err := database.DB.WithContext(ctx).Where("quiz_id = ?", quizID).Order(`"order" ASC`).Find(&questions).Error
	return questions, err
}

func GetPublishedQuestionsByQuiz(ctx context.Context, quizID string) ([]model.Question, error) {
	var questions []model.Question
	err := database.DB.WithContext(ctx).Model(&model.Question{}).
		Joins("JOIN quizzes ON quizzes.id = questions.quiz_id").
		Joins("JOIN courses ON courses.id = quizzes.course_id").
		Where("questions.quiz_id = ? AND quizzes.is_published = true AND courses.status = 'published'", quizID).
		Order(`questions."order" ASC`).Find(&questions).Error
	return questions, err
}

func CreateQuestion(ctx context.Context, quizID string, req dto.CreateQuestionRequest) (*model.Question, error) {
	parsedQuizID, err := uuid.Parse(quizID)
	if err != nil {
		return nil, err
	}

	points := req.Points
	if points == 0 {
		points = 10
	}

	question := model.Question{
		QuizID:        parsedQuizID,
		Type:          req.Type,
		Text:          req.Text,
		Options:       model.StringArray(req.Options),
		CorrectAnswer: req.CorrectAnswer,
		Points:        points,
		Order:         req.Order,
	}

	if err := database.DB.WithContext(ctx).Create(&question).Error; err != nil {
		return nil, err
	}

	return &question, nil
}

func UpdateQuestion(ctx context.Context, id string, req dto.UpdateQuestionRequest) (*model.Question, error) {
	db := database.DB.WithContext(ctx)
	var question model.Question
	if err := db.First(&question, "id = ?", id).Error; err != nil {
		return nil, err
	}

	if req.Type != "" {
		question.Type = req.Type
	}
	if req.Text != "" {
		question.Text = req.Text
	}
	if req.Options != nil {
		question.Options = model.StringArray(req.Options)
	}
	if req.CorrectAnswer != "" {
		question.CorrectAnswer = req.CorrectAnswer
	}
	if req.Points != 0 {
		question.Points = req.Points
	}
	if req.Order != 0 {
		question.Order = req.Order
	}

	if err := db.Save(&question).Error; err != nil {
		return nil, err
	}

	return &question, nil
}

func DeleteQuestion(ctx context.Context, id string) error {
	db := database.DB.WithContext(ctx)
	var question model.Question
	if err := db.First(&question, "id = ?", id).Error; err != nil {
		return err
	}

	return db.Unscoped().Delete(&question).Error
}
