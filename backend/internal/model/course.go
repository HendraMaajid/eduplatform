package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Course struct {
	ID               uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	Title            string         `gorm:"size:255;not null" json:"title"`
	Slug             string         `gorm:"size:255;uniqueIndex;not null" json:"slug"`
	Description      string         `gorm:"type:text" json:"description"`
	ShortDescription string         `gorm:"size:500" json:"shortDescription"`
	Thumbnail        string         `gorm:"size:500" json:"thumbnail"`
	Price            int            `gorm:"default:0" json:"price"`
	Category         string         `gorm:"size:100" json:"category"`
	Level            string         `gorm:"size:20;default:beginner" json:"level"`
	Status           string         `gorm:"size:20;default:draft" json:"status"`
	TeacherID        uuid.UUID      `gorm:"type:uuid" json:"teacherId"`
	Teacher          *User          `gorm:"foreignKey:TeacherID" json:"teacher,omitempty"`
	Duration         string         `gorm:"size:50" json:"duration"`
	Rating           float64        `gorm:"type:decimal(3,2);default:0" json:"rating"`
	TotalReviews     int            `gorm:"default:0" json:"totalReviews"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"-"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	// Computed fields (not in DB)
	TotalModules     int `gorm:"-" json:"totalModules"`
	TotalQuizzes     int `gorm:"-" json:"totalQuizzes"`
	TotalAssignments int `gorm:"-" json:"totalAssignments"`
	EnrolledStudents int `gorm:"-" json:"enrolledStudents"`
}
