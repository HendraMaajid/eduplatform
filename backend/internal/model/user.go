package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type User struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Name         string         `gorm:"size:255;not null" json:"name"`
	Email        string         `gorm:"size:255;uniqueIndex;not null" json:"email"`
	PasswordHash string         `gorm:"size:255" json:"-"`
	Avatar       string         `gorm:"size:500" json:"avatar"`
	Role         string         `gorm:"size:20;default:student" json:"role"`
	Bio          string         `gorm:"type:text" json:"bio,omitempty"`
	Phone        string         `gorm:"size:20" json:"phone,omitempty"`
	GoogleID     string         `gorm:"size:255" json:"-"`
	CreatedAt    time.Time      `json:"createdAt"`
	UpdatedAt    time.Time      `json:"-"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
