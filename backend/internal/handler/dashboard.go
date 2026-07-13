package handler

import (
	"log"
	"net/http"

	"backend/internal/service"
	"github.com/gin-gonic/gin"
)

func GetAdminDashboard(c *gin.Context) {
	stats, err := service.GetAdminStats(c.Request.Context())
	if err != nil {
		log.Printf("GetAdminDashboard error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load dashboard"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func GetTeacherDashboard(c *gin.Context) {
	teacherID, _ := c.Get("userID")

	stats, err := service.GetTeacherStats(teacherID.(string))
	if err != nil {
		log.Printf("GetTeacherDashboard error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load dashboard"})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func GetStudentDashboard(c *gin.Context) {
	studentID, _ := c.Get("userID")

	stats, err := service.GetStudentStats(studentID.(string))
	if err != nil {
		log.Printf("GetStudentDashboard error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load dashboard"})
		return
	}
	c.JSON(http.StatusOK, stats)
}
