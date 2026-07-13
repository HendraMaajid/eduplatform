package model

import (
	"time"

	"github.com/google/uuid"
)

// LearningProgress stores a student's learning state without gating access to
// a published course. A row is created the first time a student opens a course.
type LearningProgress struct {
	ID               uuid.UUID   `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CourseID         uuid.UUID   `gorm:"type:uuid;not null;index;uniqueIndex:idx_learning_progress_student_course,priority:2" json:"courseId"`
	Course           *Course     `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	StudentID        uuid.UUID   `gorm:"type:uuid;not null;index;uniqueIndex:idx_learning_progress_student_course,priority:1;index:idx_learning_progress_student_access,priority:1" json:"studentId"`
	Student          *User       `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	CompletedModules StringArray `gorm:"type:jsonb;not null;default:'[]'" json:"completedModules"`
	Progress         int         `gorm:"not null;default:0;check:learning_progress_percent,progress >= 0 AND progress <= 100" json:"progress"`
	Status           string      `gorm:"size:20;not null;default:in_progress;check:learning_progress_status,status IN ('in_progress','completed','certified')" json:"status"`
	LastModuleID     *uuid.UUID  `gorm:"type:uuid;index" json:"lastModuleId,omitempty"`
	LastModule       *Module     `gorm:"foreignKey:LastModuleID" json:"lastModule,omitempty"`
	StartedAt        time.Time   `gorm:"not null" json:"startedAt"`
	LastAccessedAt   time.Time   `gorm:"not null;index:idx_learning_progress_student_access,priority:2,sort:desc" json:"lastAccessedAt"`
	CreatedAt        time.Time   `json:"createdAt"`
	UpdatedAt        time.Time   `json:"updatedAt"`
}

// Certificate is issued after all published learning requirements are met.
type Certificate struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	StudentID         uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_certificate_student_course,priority:1" json:"studentId"`
	Student           *User     `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	CourseID          uuid.UUID `gorm:"type:uuid;not null;index;uniqueIndex:idx_certificate_student_course,priority:2" json:"courseId"`
	Course            *Course   `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	CertificateNumber string    `gorm:"size:255;uniqueIndex;not null" json:"certificateNumber"`
	Issuer            string    `gorm:"size:120;not null;default:EduPlatform" json:"issuer"`
	IssuedAt          time.Time `json:"issuedAt"`
}

// Notification is an in-app notification for a user.
type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index:idx_notification_user_read" json:"userId"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	Type      string    `gorm:"size:20;default:info" json:"type"`
	IsRead    bool      `gorm:"default:false;index:idx_notification_user_read" json:"isRead"`
	Link      string    `gorm:"size:500" json:"link,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}
