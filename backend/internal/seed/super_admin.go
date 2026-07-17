package seed

import (
	"errors"
	"fmt"
	"strings"

	"backend/internal/model"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func seedSuperAdmin(tx *gorm.DB, config Config) (*model.User, error) {
	passwordHash, err := bcrypt.GenerateFromPassword(
		[]byte(config.SuperAdminPassword),
		bcrypt.DefaultCost,
	)
	if err != nil {
		return nil, fmt.Errorf("hash super admin password: %w", err)
	}

	email := strings.ToLower(strings.TrimSpace(config.SuperAdminEmail))
	var admin model.User
	err = tx.Unscoped().Where("LOWER(email) = ?", email).First(&admin).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		admin = model.User{
			ID:           uuid.New(),
			Name:         strings.TrimSpace(config.SuperAdminName),
			Email:        email,
			PasswordHash: string(passwordHash),
			Role:         "super_admin",
			Bio:          "Super administrator dan pengelola utama EduCourse.",
		}
		if err := tx.Create(&admin).Error; err != nil {
			return nil, fmt.Errorf("create super admin: %w", err)
		}
		return &admin, nil
	}
	if err != nil {
		return nil, fmt.Errorf("find super admin: %w", err)
	}

	updates := map[string]any{
		"name":          strings.TrimSpace(config.SuperAdminName),
		"email":         email,
		"password_hash": string(passwordHash),
		"role":          "super_admin",
		"deleted_at":    nil,
	}
	if err := tx.Unscoped().Model(&admin).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update super admin: %w", err)
	}
	if err := tx.First(&admin, "id = ?", admin.ID).Error; err != nil {
		return nil, fmt.Errorf("reload super admin: %w", err)
	}
	return &admin, nil
}
