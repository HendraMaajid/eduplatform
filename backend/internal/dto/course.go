package dto

type CreateCourseRequest struct {
	Title            string `json:"title" binding:"required"`
	Description      string `json:"description"`
	ShortDescription string `json:"shortDescription"`
	Price            int    `json:"price"`
	Category         string `json:"category"`
	Level            string `json:"level"`
	Thumbnail        string `json:"thumbnail"`
	TeacherID        string `json:"teacherId"`
	Status           string `json:"status"`
}

type CreateModuleRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Content     string `json:"content"`
	Duration    string `json:"duration"`
	Order       int    `json:"order"`
}

type UpdateModuleRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Content     string `json:"content"`
	Duration    string `json:"duration"`
	Order       int    `json:"order"`
	IsPublished *bool  `json:"isPublished"`
}
