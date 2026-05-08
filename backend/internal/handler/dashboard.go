package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"backend/internal/service"
)

func GetAdminDashboard(c *gin.Context) {
	stats, err := service.GetAdminStats()
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
