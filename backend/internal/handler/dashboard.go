package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend/internal/service"
)

func GetAdminDashboard(c *gin.Context) {
	stats, err := service.GetAdminStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func GetTeacherDashboard(c *gin.Context) {
	teacherID, _ := c.Get("userID")

	stats, err := service.GetTeacherStats(teacherID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}

func GetStudentDashboard(c *gin.Context) {
	studentID, _ := c.Get("userID")

	stats, err := service.GetStudentStats(studentID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, stats)
}
