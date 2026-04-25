package service

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
)

// Quizzes
func GetQuizzesByCourse(courseID string) ([]model.Quiz, error) {
	var quizzes []model.Quiz
	err := database.DB.Preload("Questions").Where("course_id = ?", courseID).Find(&quizzes).Error
	return quizzes, err
}

func CreateQuiz(courseID string, req dto.CreateQuizRequest) (*model.Quiz, error) {
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
		IsPublished:  false,
	}

	if err := database.DB.Create(&quiz).Error; err != nil {
		return nil, err
	}

	return &quiz, nil
}

func UpdateQuiz(id string, req dto.UpdateQuizRequest) (*model.Quiz, error) {
	var quiz model.Quiz
	if err := database.DB.First(&quiz, "id = ?", id).Error; err != nil {
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

	if err := database.DB.Model(&quiz).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &quiz, nil
}

func DeleteQuiz(id string) error {
	var quiz model.Quiz
	if err := database.DB.First(&quiz, "id = ?", id).Error; err != nil {
		return err
	}

	return database.DB.Delete(&quiz).Error
}

// Assignments
func SubmitQuiz(studentID string, quizID string, req dto.SubmitQuizRequest) (*model.QuizAttempt, error) {
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, err
	}
	parsedQuizID, err := uuid.Parse(quizID)
	if err != nil {
		return nil, err
	}

	// Fetch quiz and its questions
	var quiz model.Quiz
	if err := database.DB.Preload("Questions").Where("id = ?", quizID).First(&quiz).Error; err != nil {
		return nil, err
	}

	attempt := model.QuizAttempt{
		QuizID:      parsedQuizID,
		StudentID:   parsedStudentID,
		CompletedAt: time.Now(),
		Score:       0,
		TotalPoints: 0,
	}

	// Map questions for quick lookup
	questionMap := make(map[uuid.UUID]model.Question)
	for _, q := range quiz.Questions {
		questionMap[q.ID] = q
		attempt.TotalPoints += q.Points
	}

	// Calculate score
	var answers []model.QuizAnswer
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
	attempt.Passed = percentage >= quiz.PassingScore

	// Save everything in a single transaction
	tx := database.DB.Begin()
	if err := tx.Create(&attempt).Error; err != nil {
		tx.Rollback()
		return nil, err
	}

	// Batch insert all answers in 1 query instead of N queries
	for i := range answers {
		answers[i].AttemptID = attempt.ID
	}
	if len(answers) > 0 {
		if err := tx.CreateInBatches(answers, len(answers)).Error; err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	tx.Commit()

	// Recalculate enrollment progress
	var enrollment model.Enrollment
	if err := database.DB.Where("student_id = ? AND course_id = ?", studentID, quiz.CourseID.String()).First(&enrollment).Error; err == nil {
		recalculateProgress(studentID, quiz.CourseID.String(), &enrollment)
		database.DB.Save(&enrollment)
	}

	return &attempt, nil
}

func GetQuizAttempt(studentID string, quizID string) (*model.QuizAttempt, error) {
	var attempt model.QuizAttempt
	err := database.DB.Preload("Answers").Where("student_id = ? AND quiz_id = ?", studentID, quizID).Order("completed_at desc").First(&attempt).Error
	if err != nil {
		return nil, err
	}
	return &attempt, nil
}

// Assignments
func GetAssignmentsByCourse(courseID string) ([]model.Assignment, error) {
	var assignments []model.Assignment
	err := database.DB.Where("course_id = ?", courseID).Find(&assignments).Error
	return assignments, err
}

func CreateAssignment(courseID string, req dto.CreateAssignmentRequest) (*model.Assignment, error) {
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
		IsPublished:  false,
	}

	if err := database.DB.Create(&assignment).Error; err != nil {
		return nil, err
	}

	return &assignment, nil
}

func UpdateAssignment(id string, req dto.UpdateAssignmentRequest) (*model.Assignment, error) {
	var assignment model.Assignment
	if err := database.DB.First(&assignment, "id = ?", id).Error; err != nil {
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

	if err := database.DB.Model(&assignment).Updates(updates).Error; err != nil {
		return nil, err
	}

	return &assignment, nil
}

func DeleteAssignment(id string) error {
	var assignment model.Assignment
	if err := database.DB.First(&assignment, "id = ?", id).Error; err != nil {
		return err
	}

	return database.DB.Delete(&assignment).Error
}

// Questions
func GetQuestionsByQuiz(quizID string) ([]model.Question, error) {
	var questions []model.Question
	err := database.DB.Where("quiz_id = ?", quizID).Order(`"order" ASC`).Find(&questions).Error
	return questions, err
}

func CreateQuestion(quizID string, req dto.CreateQuestionRequest) (*model.Question, error) {
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

	if err := database.DB.Create(&question).Error; err != nil {
		return nil, err
	}

	return &question, nil
}

func UpdateQuestion(id string, req dto.UpdateQuestionRequest) (*model.Question, error) {
	var question model.Question
	if err := database.DB.First(&question, "id = ?", id).Error; err != nil {
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

	if err := database.DB.Save(&question).Error; err != nil {
		return nil, err
	}

	return &question, nil
}

func DeleteQuestion(id string) error {
	var question model.Question
	if err := database.DB.First(&question, "id = ?", id).Error; err != nil {
		return err
	}

	return database.DB.Unscoped().Delete(&question).Error
}
