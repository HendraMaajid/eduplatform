package handler

import (
	"errors"
	"log"
	"net/http"

	"backend/internal/dto"
	"backend/internal/service"
	"github.com/gin-gonic/gin"
)

// Quizzes
func GetQuizzes(c *gin.Context) {
	courseID := c.Param("id")
	quizzes, err := service.GetQuizzesByCourse(c.Request.Context(), courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, quizzes)
}

func CreateQuiz(c *gin.Context) {
	courseID := c.Param("id")
	var req dto.CreateQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	quiz, err := service.CreateQuiz(c.Request.Context(), courseID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, quiz)
}

func UpdateQuiz(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	quiz, err := service.UpdateQuiz(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, quiz)
}

func DeleteQuiz(c *gin.Context) {
	id := c.Param("id")
	if err := service.DeleteQuiz(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "quiz deleted successfully"})
}

// Assignments
func GetAssignments(c *gin.Context) {
	courseID := c.Param("id")
	assignments, err := service.GetAssignmentsByCourse(c.Request.Context(), courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, assignments)
}

func CreateAssignment(c *gin.Context) {
	courseID := c.Param("id")
	var req dto.CreateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment, err := service.CreateAssignment(c.Request.Context(), courseID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, assignment)
}

func UpdateAssignment(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	assignment, err := service.UpdateAssignment(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, assignment)
}

func DeleteAssignment(c *gin.Context) {
	id := c.Param("id")
	if err := service.DeleteAssignment(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "assignment deleted successfully"})
}

// Questions — Full view (teachers only, includes correctAnswer)
func GetQuestions(c *gin.Context) {
	quizID := c.Param("id")
	questions, err := service.GetQuestionsByQuiz(c.Request.Context(), quizID)
	if err != nil {
		log.Printf("GetQuestions error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load questions"})
		return
	}
	c.JSON(http.StatusOK, questions)
}

// GetQuestionsForStudent returns questions without correctAnswer (safe for students)
func GetQuestionsForStudent(c *gin.Context) {
	quizID := c.Param("id")
	questions, err := service.GetQuestionsByQuiz(c.Request.Context(), quizID)
	if err != nil {
		log.Printf("GetQuestionsForStudent error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load questions"})
		return
	}

	// Strip correct answers before sending to client
	type SafeQuestion struct {
		ID      string   `json:"id"`
		QuizID  string   `json:"quizId"`
		Type    string   `json:"type"`
		Text    string   `json:"text"`
		Options []string `json:"options,omitempty"`
		Points  int      `json:"points"`
		Order   int      `json:"order"`
	}

	safeQuestions := make([]SafeQuestion, len(questions))
	for i, q := range questions {
		safeQuestions[i] = SafeQuestion{
			ID:      q.ID.String(),
			QuizID:  q.QuizID.String(),
			Type:    q.Type,
			Text:    q.Text,
			Options: q.Options,
			Points:  q.Points,
			Order:   q.Order,
		}
	}

	c.JSON(http.StatusOK, safeQuestions)
}

func CreateQuestion(c *gin.Context) {
	quizID := c.Param("id")
	var req dto.CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	question, err := service.CreateQuestion(c.Request.Context(), quizID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, question)
}

func UpdateQuestion(c *gin.Context) {
	id := c.Param("id")
	var req dto.UpdateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	question, err := service.UpdateQuestion(c.Request.Context(), id, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, question)
}

func DeleteQuestion(c *gin.Context) {
	id := c.Param("id")
	if err := service.DeleteQuestion(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "question deleted successfully"})
}

func SubmitQuiz(c *gin.Context) {
	studentIDValue, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID, ok := studentIDValue.(string)
	if !ok || studentID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	quizID := c.Param("id")

	var req dto.SubmitQuizRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	attempt, err := service.SubmitQuiz(c.Request.Context(), studentID, quizID, req)
	if err != nil {
		if errors.Is(err, service.ErrNotEnrolled) {
			c.JSON(http.StatusForbidden, gin.H{"error": "Not enrolled in this course"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, attempt)
}

func GetQuizAttempt(c *gin.Context) {
	studentIDValue, ok := c.Get("userID")
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	studentID, ok := studentIDValue.(string)
	if !ok || studentID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}
	quizID := c.Param("id")

	attempt, err := service.GetQuizAttempt(c.Request.Context(), studentID, quizID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Attempt not found"})
		return
	}

	c.JSON(http.StatusOK, attempt)
}
