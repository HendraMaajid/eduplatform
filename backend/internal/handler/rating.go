package handler

import (
	"net/http"

	"backend/internal/dto"
	"backend/internal/service"

	"github.com/gin-gonic/gin"
)

func CreateRating(c *gin.Context) {
	courseID := c.Param("id")
	studentID, _ := c.Get("userID")

	var req dto.CreateRatingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	rating, err := service.CreateOrUpdateRating(courseID, studentID.(string), req)
	if err != nil {
		if err.Error() == "you must be enrolled in this course to rate it" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit rating"})
		return
	}

	c.JSON(http.StatusOK, rating)
}

func GetCourseRatings(c *gin.Context) {
	courseID := c.Param("id")

	ratings, err := service.GetCourseRatings(courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load ratings"})
		return
	}

	c.JSON(http.StatusOK, ratings)
}

func GetMyRating(c *gin.Context) {
	courseID := c.Param("id")
	studentID, _ := c.Get("userID")

	rating, err := service.GetMyRating(courseID, studentID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Rating not found"})
		return
	}

	c.JSON(http.StatusOK, rating)
}
