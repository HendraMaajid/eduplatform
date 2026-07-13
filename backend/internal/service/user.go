package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func GetAllUsers(roleFilter string, page int, limit int, search string, joined string) (*dto.PaginatedResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit
	var users []model.User
	var total int64
	query := database.DB.Model(&model.User{})
	if roleFilter != "" && roleFilter != "all" {
		query = query.Where("role = ?", roleFilter)
	}
	if search = strings.TrimSpace(search); search != "" {
		query = query.Where("name ILIKE ? OR email ILIKE ?", "%"+search+"%", "%"+search+"%")
	}
	switch joined {
	case "7d":
		query = query.Where("created_at >= ?", time.Now().AddDate(0, 0, -7))
	case "30d":
		query = query.Where("created_at >= ?", time.Now().AddDate(0, 0, -30))
	}
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}
	if err := query.Offset(offset).Limit(limit).Order("created_at DESC").Find(&users).Error; err != nil {
		return nil, err
	}
	return &dto.PaginatedResponse{Data: users, Meta: dto.PaginationMeta{Total: total, Page: page, Limit: limit, TotalPages: int((total + int64(limit) - 1) / int64(limit))}}, nil
}

func canAssignRole(actorRole, requestedRole string) bool {
	if actorRole == "super_admin" {
		return true
	}
	return actorRole == "admin" && (requestedRole == "teacher" || requestedRole == "student")
}

func CreateUser(req dto.CreateUserRequest, actorRole string) (*model.User, error) {
	if !canAssignRole(actorRole, req.Role) {
		return nil, errors.New("forbidden: cannot assign requested role")
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}
	user := model.User{Name: strings.TrimSpace(req.Name), Email: normalizeEmail(req.Email), PasswordHash: string(hashedPassword), Role: req.Role}
	err = database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return err
		}
		preference := model.UserPreference{UserID: user.ID, Locale: "id", Theme: "system", NotifyCourseUpdates: true, NotifyAssignments: true, NotifyGrades: true}
		return tx.Create(&preference).Error
	})
	if err != nil {
		return nil, fmt.Errorf("create user: %w", err)
	}
	AppCache.InvalidatePrefix("dashboard:")
	return &user, nil
}

func UpdateUser(id string, req dto.UpdateUserRequest, actorID, actorRole string) (*model.User, error) {
	var user model.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		return nil, errors.New("user not found")
	}
	if actorRole != "super_admin" && (user.Role == "admin" || user.Role == "super_admin") {
		return nil, errors.New("forbidden: cannot manage an administrator")
	}
	if req.Role != "" && !canAssignRole(actorRole, req.Role) {
		return nil, errors.New("forbidden: cannot assign requested role")
	}
	if actorID == id && req.Role != "" && req.Role != user.Role {
		return nil, errors.New("forbidden: cannot change your own role")
	}
	updates := map[string]any{}
	if req.Name != "" {
		updates["name"] = strings.TrimSpace(req.Name)
	}
	if req.Email != "" {
		updates["email"] = normalizeEmail(req.Email)
	}
	if req.Role != "" {
		updates["role"] = req.Role
	}
	if len(updates) > 0 {
		if err := database.DB.Model(&user).Updates(updates).Error; err != nil {
			return nil, fmt.Errorf("update user: %w", err)
		}
	}
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		return nil, err
	}
	AppCache.InvalidatePrefix("dashboard:")
	return &user, nil
}

func DeleteUser(id, actorID, actorRole string) error {
	if id == actorID {
		return errors.New("forbidden: cannot delete your own account")
	}
	var user model.User
	if err := database.DB.First(&user, "id = ?", id).Error; err != nil {
		return errors.New("user not found")
	}
	if actorRole != "super_admin" && (user.Role == "admin" || user.Role == "super_admin") {
		return errors.New("forbidden: cannot delete an administrator")
	}
	err := database.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("user_id = ?", user.ID).Delete(&model.RefreshToken{}).Error; err != nil {
			return err
		}
		return tx.Delete(&user).Error
	})
	if err == nil {
		AppCache.InvalidatePrefix("dashboard:")
	}
	return err
}
