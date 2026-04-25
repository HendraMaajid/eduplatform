package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Enrollment struct {
	ID               uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CourseID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"courseId"`
	Course           *Course        `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	StudentID        uuid.UUID      `gorm:"type:uuid;not null;index" json:"studentId"`
	Student          *User          `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	PaymentAmount    int            `gorm:"default:0" json:"paymentAmount"`
	Progress         int            `gorm:"default:0" json:"progress"`
	CompletedModules StringArray    `gorm:"type:jsonb" json:"completedModules"`
	Status           string         `gorm:"size:20;default:active" json:"status"`
	EnrolledAt       time.Time      `json:"enrolledAt"`
	UpdatedAt        time.Time      `json:"-"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
}

type Payment struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CourseID  uuid.UUID `gorm:"type:uuid;not null;index" json:"courseId"`
	Course    *Course   `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	StudentID uuid.UUID `gorm:"type:uuid;not null;index" json:"studentId"`
	Amount    int       `gorm:"default:0" json:"amount"`
	PaidAt    time.Time `json:"paidAt"`
}

type Certificate struct {
	ID                uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	StudentID         uuid.UUID `gorm:"type:uuid;not null;index" json:"studentId"`
	Student           *User     `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	CourseID          uuid.UUID `gorm:"type:uuid;not null;index" json:"courseId"`
	Course            *Course   `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	CertificateNumber string    `gorm:"size:255;uniqueIndex;not null" json:"certificateNumber"`
	IssuedAt          time.Time `json:"issuedAt"`
}

type Notification struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	UserID    uuid.UUID `gorm:"type:uuid;not null;index" json:"userId"`
	Title     string    `gorm:"size:255;not null" json:"title"`
	Message   string    `gorm:"type:text;not null" json:"message"`
	Type      string    `gorm:"size:20;default:info" json:"type"`
	IsRead    bool      `gorm:"default:false" json:"isRead"`
	Link      string    `gorm:"size:500" json:"link,omitempty"`
	CreatedAt time.Time `json:"createdAt"`
}
