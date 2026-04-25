package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Module struct {
	ID          uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CourseID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"courseId"`
	Title       string         `gorm:"size:255;not null" json:"title"`
	Description string         `gorm:"type:text" json:"description"`
	Content     string         `gorm:"type:text" json:"content"`
	Order       int            `gorm:"default:0" json:"order"`
	Duration    string         `gorm:"size:50" json:"duration"`
	IsPublished bool           `gorm:"default:false" json:"isPublished"`
	CreatedAt   time.Time      `json:"createdAt"`
	UpdatedAt   time.Time      `json:"-"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`

	Attachments []Attachment `gorm:"foreignKey:ModuleID" json:"attachments"`
}

type Attachment struct {
	ID       uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	ModuleID uuid.UUID `gorm:"type:uuid;not null;index" json:"moduleId"`
	Name     string    `gorm:"size:255" json:"name"`
	URL      string    `gorm:"size:500" json:"url"`
	Size     int64     `gorm:"default:0" json:"size"`
	Type     string    `gorm:"size:100" json:"type"`
}
