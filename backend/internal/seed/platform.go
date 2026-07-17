package seed

import (
	"fmt"

	"backend/internal/model"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func seedPlatformSettings(tx *gorm.DB) (*model.PlatformSettings, error) {
	defaults := model.PlatformSettings{
		ID:                    1,
		Name:                  "EduCourse",
		DescriptionID:         "Platform belajar teknologi gratis dengan materi terarah, latihan praktik, kuis, proyek, dan sertifikat.",
		DescriptionEN:         "A free technology learning platform with structured lessons, hands-on practice, quizzes, projects, and certificates.",
		SupportEmail:          DefaultSuperAdminEmail,
		LogoURL:               "",
		DefaultLocale:         "id",
		CertificateIssuer:     "EduCourse",
		NotifyNewRegistration: true,
		NotifyNewSubmission:   true,
		NotifyGradePublished:  true,
	}
	if err := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "id"}},
		DoNothing: true,
	}).Create(&defaults).Error; err != nil {
		return nil, fmt.Errorf("create platform settings: %w", err)
	}

	var settings model.PlatformSettings
	if err := tx.First(&settings, 1).Error; err != nil {
		return nil, fmt.Errorf("load platform settings: %w", err)
	}
	return &settings, nil
}
