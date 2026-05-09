package handler

import (
	"log"
	"net/http"

	"backend/internal/dto"
	"backend/internal/service"
	"backend/pkg/database"

	"github.com/gin-gonic/gin"
)

// HandleChat handles the AI chat endpoint with RAG.
// POST /api/chat
func HandleChat(c *gin.Context) {
	var req dto.ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request: " + err.Error()})
		return
	}

	// Verify user is authenticated
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	// Verify user is enrolled in the course
	var enrollmentCount int64
	database.DB.Table("enrollments").
		Where("student_id = ? AND course_id = ? AND deleted_at IS NULL", userID, req.CourseID).
		Count(&enrollmentCount)

	if enrollmentCount == 0 {
		c.JSON(http.StatusForbidden, gin.H{"error": "Anda harus terdaftar di kursus ini untuk menggunakan AI Chat"})
		return
	}

	// Sanitize user message
	req.Message = service.StripHTML(req.Message)
	if len(req.Message) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message cannot be empty"})
		return
	}

	// Sanitize chat history
	for i := range req.History {
		req.History[i].Content = service.StripHTML(req.History[i].Content)
	}

	// Run RAG pipeline with SSE streaming
	if err := service.RunRAGPipeline(c.Request.Context(), req, c.Writer); err != nil {
		log.Printf("Chat error for user %v: %v", userID, err)
		// If headers haven't been sent yet, return JSON error
		if !c.Writer.Written() {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memproses chat: " + err.Error()})
		}
		return
	}
}
