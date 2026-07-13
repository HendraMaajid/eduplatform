package dto

import "time"

type PublicTeacherResponse struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
	Bio    string `json:"bio,omitempty"`
}

type PublicCourseResponse struct {
	ID               string                 `json:"id"`
	Title            string                 `json:"title"`
	Slug             string                 `json:"slug"`
	Description      string                 `json:"description"`
	ShortDescription string                 `json:"shortDescription"`
	Thumbnail        string                 `json:"thumbnail"`
	Category         string                 `json:"category"`
	Level            string                 `json:"level"`
	Status           string                 `json:"status"`
	TeacherID        string                 `json:"teacherId"`
	Teacher          *PublicTeacherResponse `json:"teacher,omitempty"`
	Duration         string                 `json:"duration"`
	Rating           float64                `json:"rating"`
	TotalReviews     int                    `json:"totalReviews"`
	TotalModules     int                    `json:"totalModules"`
	TotalQuizzes     int                    `json:"totalQuizzes"`
	TotalAssignments int                    `json:"totalAssignments"`
	EnrolledStudents int                    `json:"enrolledStudents"`
	CreatedAt        time.Time              `json:"createdAt"`
}

type CreateCourseRequest struct {
	Title            string `json:"title" binding:"required,min=2,max=255"`
	Description      string `json:"description" binding:"required,max=50000"`
	ShortDescription string `json:"shortDescription" binding:"required,min=2,max=500"`
	Category         string `json:"category" binding:"required,min=2,max=100"`
	Level            string `json:"level" binding:"required,oneof=beginner intermediate advanced"`
	Thumbnail        string `json:"thumbnail" binding:"required,max=500"`
	Duration         string `json:"duration" binding:"required,max=50"`
	TeacherID        string `json:"teacherId" binding:"omitempty,uuid"`
	Status           string `json:"status" binding:"required,oneof=draft published archived"`
}

type UpdateCourseRequest struct {
	Title            *string `json:"title" binding:"omitempty,min=2,max=255"`
	Description      *string `json:"description" binding:"omitempty,max=50000"`
	ShortDescription *string `json:"shortDescription" binding:"omitempty,min=2,max=500"`
	Category         *string `json:"category" binding:"omitempty,min=2,max=100"`
	Level            *string `json:"level" binding:"omitempty,oneof=beginner intermediate advanced"`
	Thumbnail        *string `json:"thumbnail" binding:"omitempty,max=500"`
	Duration         *string `json:"duration" binding:"omitempty,max=50"`
	TeacherID        *string `json:"teacherId" binding:"omitempty,uuid"`
	Status           *string `json:"status" binding:"omitempty,oneof=draft published archived"`
}

type CreateModuleRequest struct {
	Title       string `json:"title" binding:"required,min=2,max=255"`
	Description string `json:"description" binding:"required,max=5000"`
	Content     string `json:"content" binding:"required,max=500000"`
	Duration    string `json:"duration" binding:"required,max=50"`
	Order       int    `json:"order" binding:"min=0,max=10000"`
	IsPublished bool   `json:"isPublished"`
}

type UpdateModuleRequest struct {
	Title       *string `json:"title" binding:"omitempty,min=2,max=255"`
	Description *string `json:"description" binding:"omitempty,max=5000"`
	Content     *string `json:"content" binding:"omitempty,max=500000"`
	Duration    *string `json:"duration" binding:"omitempty,max=50"`
	Order       *int    `json:"order" binding:"omitempty,min=0,max=10000"`
	IsPublished *bool   `json:"isPublished"`
}

type CreateAttachmentRequest struct {
	Name string `json:"name" binding:"required,min=1,max=255"`
	URL  string `json:"url" binding:"required,max=1000"`
	Size int64  `json:"size" binding:"min=0,max=1073741824"`
	Type string `json:"type" binding:"max=100"`
}

type ReorderModulesRequest struct {
	ModuleIDs []string `json:"moduleIds" binding:"required,min=1,max=1000,dive,uuid"`
}
