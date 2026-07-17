package model

import (
	"time"

	"github.com/google/uuid"
)

// PlatformSettings contains the singleton public identity and platform-wide
// learning preferences. The application always uses row ID 1.
type PlatformSettings struct {
	ID                    uint      `gorm:"primaryKey;autoIncrement:false" json:"id"`
	Name                  string    `gorm:"size:80;not null;default:EduCourse" json:"name"`
	DescriptionID         string    `gorm:"column:description;type:text;not null" json:"descriptionId"`
	DescriptionEN         string    `gorm:"column:description_en;type:text;not null" json:"descriptionEn"`
	SupportEmail          string    `gorm:"size:255;not null" json:"supportEmail"`
	LogoURL               string    `gorm:"size:500" json:"logoUrl"`
	DefaultLocale         string    `gorm:"size:5;not null;default:id;check:platform_default_locale,default_locale IN ('id','en')" json:"defaultLocale"`
	CertificateIssuer     string    `gorm:"size:120;not null;default:EduCourse" json:"certificateIssuer"`
	NotifyNewRegistration bool      `gorm:"not null;default:true" json:"notifyNewRegistration"`
	NotifyNewSubmission   bool      `gorm:"not null;default:true" json:"notifyNewSubmission"`
	NotifyGradePublished  bool      `gorm:"not null;default:true" json:"notifyGradePublished"`
	CreatedAt             time.Time `json:"createdAt"`
	UpdatedAt             time.Time `json:"updatedAt"`
}

// UserPreference stores cross-device UI and in-app notification preferences.
type UserPreference struct {
	UserID              uuid.UUID `gorm:"type:uuid;primaryKey" json:"userId"`
	User                *User     `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	Locale              string    `gorm:"size:5;not null;default:id;check:user_preference_locale,locale IN ('id','en')" json:"locale"`
	Theme               string    `gorm:"size:10;not null;default:system;check:user_preference_theme,theme IN ('light','dark','system')" json:"theme"`
	NotifyCourseUpdates bool      `gorm:"not null;default:true" json:"notifyCourseUpdates"`
	NotifyAssignments   bool      `gorm:"not null;default:true" json:"notifyAssignments"`
	NotifyGrades        bool      `gorm:"not null;default:true" json:"notifyGrades"`
	CreatedAt           time.Time `json:"createdAt"`
	UpdatedAt           time.Time `json:"updatedAt"`
}
