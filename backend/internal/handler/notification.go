package handler

import (
	"log"
	"net/http"

	"backend/internal/service"
	"github.com/gin-gonic/gin"
)

func GetNotifications(c *gin.Context) {
	userID, _ := c.Get("userID")

	notifications, err := service.GetNotifications(userID.(string))
	if err != nil {
		log.Printf("GetNotifications error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load notifications"})
		return
	}

	c.JSON(http.StatusOK, notifications)
}

func MarkNotificationAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")
	notificationID := c.Param("id")

	err := service.MarkNotificationAsRead(notificationID, userID.(string))
	if err != nil {
		log.Printf("MarkNotificationAsRead error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notification"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Notification marked as read"})
}

func MarkAllNotificationsAsRead(c *gin.Context) {
	userID, _ := c.Get("userID")

	err := service.MarkAllNotificationsAsRead(userID.(string))
	if err != nil {
		log.Printf("MarkAllNotificationsAsRead error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update notifications"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "All notifications marked as read"})
}
