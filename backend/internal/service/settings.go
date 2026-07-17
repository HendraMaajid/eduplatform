package service

import (
	"context"
	"errors"
	"fmt"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func defaultPlatformSettings() model.PlatformSettings {
	return model.PlatformSettings{
		ID: 1, Name: "EduCourse",
		DescriptionID: "Platform belajar teknologi gratis dengan materi terarah, latihan praktik, kuis, proyek, dan sertifikat.",
		DescriptionEN: "A free technology learning platform with structured lessons, hands-on practice, quizzes, projects, and certificates.",
		SupportEmail:  "hendralatiefulm@gmail.com", DefaultLocale: "id", CertificateIssuer: "EduCourse",
		NotifyNewRegistration: true, NotifyNewSubmission: true, NotifyGradePublished: true,
	}
}

// EnsurePlatformSettings creates the singleton settings row when absent.
func EnsurePlatformSettings(ctx context.Context) error {
	settings := defaultPlatformSettings()
	if err := database.DB.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&settings).Error; err != nil {
		return fmt.Errorf("ensure platform settings: %w", err)
	}
	return nil
}

func GetPlatformSettings(ctx context.Context) (*model.PlatformSettings, error) {
	if err := EnsurePlatformSettings(ctx); err != nil {
		return nil, err
	}
	var settings model.PlatformSettings
	if err := database.DB.WithContext(ctx).First(&settings, 1).Error; err != nil {
		return nil, fmt.Errorf("load platform settings: %w", err)
	}
	return &settings, nil
}

func UpdatePlatformSettings(ctx context.Context, req dto.UpdatePlatformSettingsRequest) (*model.PlatformSettings, error) {
	if !isSafeResourceURL(req.LogoURL) {
		return nil, errors.New("logo must be an http(s) URL or an /uploads path")
	}
	if err := EnsurePlatformSettings(ctx); err != nil {
		return nil, err
	}
	settings := model.PlatformSettings{
		ID: 1, Name: req.Name, DescriptionID: req.DescriptionID, DescriptionEN: req.DescriptionEN,
		SupportEmail: req.SupportEmail,
		LogoURL:      req.LogoURL, DefaultLocale: req.DefaultLocale, CertificateIssuer: req.CertificateIssuer,
		NotifyNewRegistration: req.NotifyNewRegistration, NotifyNewSubmission: req.NotifyNewSubmission,
		NotifyGradePublished: req.NotifyGradePublished,
	}
	if err := database.DB.WithContext(ctx).Model(&model.PlatformSettings{ID: 1}).Updates(map[string]any{
		"name": settings.Name, "description": settings.DescriptionID, "description_en": settings.DescriptionEN,
		"support_email": settings.SupportEmail,
		"logo_url":      settings.LogoURL, "default_locale": settings.DefaultLocale, "certificate_issuer": settings.CertificateIssuer,
		"notify_new_registration": settings.NotifyNewRegistration, "notify_new_submission": settings.NotifyNewSubmission,
		"notify_grade_published": settings.NotifyGradePublished,
	}).Error; err != nil {
		return nil, fmt.Errorf("update platform settings: %w", err)
	}
	return GetPlatformSettings(ctx)
}

func UpdateMyProfile(ctx context.Context, userID string, req dto.UpdateProfileRequest) (*model.User, error) {
	if !isSafeResourceURL(req.Avatar) {
		return nil, errors.New("avatar must be an http(s) URL or an /uploads path")
	}
	updates := map[string]any{"bio": req.Bio, "phone": req.Phone, "avatar": req.Avatar}
	if req.Name != "" {
		updates["name"] = req.Name
	}
	var user model.User
	if err := database.DB.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		return nil, errors.New("user not found")
	}
	if err := database.DB.WithContext(ctx).Model(&user).Updates(updates).Error; err != nil {
		return nil, fmt.Errorf("update profile: %w", err)
	}
	if err := database.DB.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		return nil, fmt.Errorf("reload profile: %w", err)
	}
	return &user, nil
}

func ChangeMyPassword(ctx context.Context, userID string, req dto.ChangePasswordRequest) error {
	var user model.User
	if err := database.DB.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		return errors.New("user not found")
	}
	if user.PasswordHash != "" {
		if req.CurrentPassword == "" || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.CurrentPassword)) != nil {
			return errors.New("current password is incorrect")
		}
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("hash new password: %w", err)
	}
	return database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&user).Update("password_hash", string(hash)).Error; err != nil {
			return fmt.Errorf("save new password: %w", err)
		}
		if err := tx.Where("user_id = ?", user.ID).Delete(&model.RefreshToken{}).Error; err != nil {
			return fmt.Errorf("revoke existing sessions: %w", err)
		}
		return nil
	})
}

func GetMyPreferences(ctx context.Context, userID string) (*model.UserPreference, error) {
	parsedID, err := uuid.Parse(userID)
	if err != nil {
		return nil, fmt.Errorf("parse user id: %w", err)
	}
	preference := model.UserPreference{UserID: parsedID, Locale: "id", Theme: "system", NotifyCourseUpdates: true, NotifyAssignments: true, NotifyGrades: true}
	if err := database.DB.WithContext(ctx).Clauses(clause.OnConflict{DoNothing: true}).Create(&preference).Error; err != nil {
		return nil, fmt.Errorf("ensure preferences: %w", err)
	}
	if err := database.DB.WithContext(ctx).First(&preference, "user_id = ?", parsedID).Error; err != nil {
		return nil, fmt.Errorf("load preferences: %w", err)
	}
	return &preference, nil
}

func UpdateMyPreferences(ctx context.Context, userID string, req dto.UpdatePreferencesRequest) (*model.UserPreference, error) {
	preference, err := GetMyPreferences(ctx, userID)
	if err != nil {
		return nil, err
	}
	preference.Locale = req.Locale
	preference.Theme = req.Theme
	preference.NotifyCourseUpdates = req.NotifyCourseUpdates
	preference.NotifyAssignments = req.NotifyAssignments
	preference.NotifyGrades = req.NotifyGrades
	if err := database.DB.WithContext(ctx).Save(preference).Error; err != nil {
		return nil, fmt.Errorf("save preferences: %w", err)
	}
	return preference, nil
}

func GetMyAccount(ctx context.Context, userID string) (*model.User, *model.UserPreference, error) {
	var user model.User
	if err := database.DB.WithContext(ctx).First(&user, "id = ?", userID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil, errors.New("user not found")
		}
		return nil, nil, fmt.Errorf("load user: %w", err)
	}
	preferences, err := GetMyPreferences(ctx, userID)
	return &user, preferences, err
}
