package handler

import (
	"log"
	"net/http"

	"backend/internal/dto"
	"backend/internal/service"
	"github.com/gin-gonic/gin"
)

func StartCourse(c *gin.Context) {
	studentID, _ := c.Get("userID")
	progress, err := service.StartCourse(c.Request.Context(), studentID.(string), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, progress)
}

func GetMyLearningProgress(c *gin.Context) {
	studentID, _ := c.Get("userID")
	progress, err := service.GetMyLearningProgress(c.Request.Context(), studentID.(string))
	if err != nil {
		log.Printf("GetMyLearningProgress error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load learning progress"})
		return
	}
	c.JSON(http.StatusOK, progress)
}

func GetRecentLearningProgress(c *gin.Context) {
	progress, err := service.GetRecentLearningProgress(c.Request.Context(), 10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load recent learning activity"})
		return
	}
	c.JSON(http.StatusOK, progress)
}

func GetAllLearningProgress(c *gin.Context) {
	page := parsePositiveInt(c.Query("page"), 1)
	limit := parsePositiveInt(c.Query("limit"), 20)

	progress, err := service.GetAllLearningProgress(
		c.Request.Context(),
		page,
		limit,
		c.Query("search"),
		c.Query("status"),
	)
	if err != nil {
		log.Printf("GetAllLearningProgress error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load learning progress"})
		return
	}
	c.JSON(http.StatusOK, progress)
}

func GetCourseLearners(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeCourseManagement(c.Request.Context(), c.Param("id"), userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	progress, err := service.GetCourseLearners(c.Request.Context(), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load course learners"})
		return
	}
	c.JSON(http.StatusOK, progress)
}

func CompleteModule(c *gin.Context) {
	studentID, _ := c.Get("userID")
	progress, err := service.CompleteModule(c.Request.Context(), studentID.(string), c.Param("id"), c.Param("moduleId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, progress)
}

func SubmitAssignment(c *gin.Context) {
	studentID, _ := c.Get("userID")
	var req dto.SubmitAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	submission, err := service.SubmitAssignment(c.Request.Context(), studentID.(string), c.Param("id"), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, submission)
}

func GradeSubmission(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	var req dto.GradeSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	submission, err := service.GradeSubmission(c.Request.Context(), c.Param("id"), req, userID.(string), role.(string))
	if err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, submission)
}

func GetMySubmissions(c *gin.Context) {
	studentID, _ := c.Get("userID")
	submissions, err := service.GetMySubmissions(c.Request.Context(), studentID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load submissions"})
		return
	}
	c.JSON(http.StatusOK, submissions)
}

func GetTeacherSubmissions(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	submissions, err := service.GetTeacherSubmissions(c.Request.Context(), userID.(string), role.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load submissions"})
		return
	}
	c.JSON(http.StatusOK, submissions)
}

func GenerateCertificate(c *gin.Context) {
	studentID, _ := c.Get("userID")
	certificate, err := service.GenerateCertificate(c.Request.Context(), studentID.(string), c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, certificate)
}

func GetMyCertificates(c *gin.Context) {
	studentID, _ := c.Get("userID")
	certificates, err := service.GetMyCertificates(c.Request.Context(), studentID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load certificates"})
		return
	}
	c.JSON(http.StatusOK, certificates)
}
