package model

import (
	"time"

	"github.com/google/uuid"
)

type Rating struct {
	ID        uuid.UUID `gorm:"type:uuid;primaryKey;default:gen_random_uuid()" json:"id"`
	CourseID  uuid.UUID `gorm:"type:uuid;not null;index:idx_rating_course_student,unique" json:"courseId"`
	Course    *Course   `gorm:"foreignKey:CourseID" json:"course,omitempty"`
	StudentID uuid.UUID `gorm:"type:uuid;not null;index:idx_rating_course_student,unique" json:"studentId"`
	Student   *User     `gorm:"foreignKey:StudentID" json:"student,omitempty"`
	Score     int       `gorm:"not null;check:score >= 1 AND score <= 5" json:"score"`
	Review    string    `gorm:"type:text" json:"review"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}
