package model

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Assignment struct {
	ID               uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CourseID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"courseId"`
	Course           *Course        `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	Title            string         `gorm:"size:255;not null" json:"title"`
	Description      string         `gorm:"type:text" json:"description"`
	Instructions     string         `gorm:"type:text" json:"instructions"`
	Deadline         time.Time      `gorm:"index" json:"deadline"`
	MaxScore         int            `gorm:"default:100" json:"maxScore"`
	IsPublished      bool           `gorm:"default:false" json:"isPublished"`
	CreatedAt        time.Time      `json:"createdAt"`
	UpdatedAt        time.Time      `json:"-"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	TotalSubmissions int `gorm:"-" json:"totalSubmissions"`
}

type Submission struct {
	ID           uuid.UUID      `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	AssignmentID uuid.UUID      `gorm:"type:uuid;not null;index;index:idx_submission_student_assignment" json:"assignmentId"`
	Assignment   *Assignment    `gorm:"foreignKey:AssignmentID" json:"assignment,omitempty"`
	StudentID    uuid.UUID      `gorm:"type:uuid;not null;index;index:idx_submission_student_assignment" json:"studentId"`
	Student      *User          `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	FileURL      string         `gorm:"size:500" json:"fileUrl"`
	FileName     string         `gorm:"size:255" json:"fileName"`
	Description  string         `gorm:"type:text" json:"description"`
	Score        int            `json:"score,omitempty"`
	Feedback     string         `gorm:"type:text" json:"feedback,omitempty"`
	Status       string         `gorm:"size:20;default:submitted" json:"status"`
	SubmittedAt  time.Time      `json:"submittedAt"`
	UpdatedAt    time.Time      `json:"-"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
}
