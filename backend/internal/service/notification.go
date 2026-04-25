package service

import (
	"github.com/google/uuid"
	"backend/internal/model"
	"backend/pkg/database"
)

func CreateNotification(userID string, title string, message string, notifType string, link string) error {
	parsedUUID, _ := uuid.Parse(userID)
	notification := model.Notification{
		UserID:  parsedUUID,
		Title:   title,
		Message: message,
		Type:    notifType,
		Link:    link,
	}
	
	result := database.DB.Create(&notification)
	return result.Error
}

func GetNotifications(userID string) ([]model.Notification, error) {
	var notifications []model.Notification
	result := database.DB.Where("user_id = ?", userID).Order("created_at desc").Limit(50).Find(&notifications)
	return notifications, result.Error
}

func MarkNotificationAsRead(notificationID string, userID string) error {
	result := database.DB.Model(&model.Notification{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true)
	return result.Error
}

func MarkAllNotificationsAsRead(userID string) error {
	result := database.DB.Model(&model.Notification{}).
		Where("user_id = ?", userID).
		Update("is_read", true)
	return result.Error
}
