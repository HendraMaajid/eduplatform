package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"backend/internal/service"
)

func GetNotifications(c *gin.Context) {
	userID, _ := c.Get("userID")

	notifications, err := service.GetNotifications(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func MarkNotificationAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	notificationID := c.Param("id")

	err := service.MarkNotificationAsRead(notificationID, userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

func MarkAllNotificationsAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")

	err := service.MarkAllNotificationsAsRead(userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}
