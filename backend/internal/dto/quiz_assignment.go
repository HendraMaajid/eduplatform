package dto

type CreateQuizRequest struct {
	Title        string `json:"title" binding:"required,min=2,max=255"`
	Description  string `json:"description" binding:"max=5000"`
	PassingScore int    `json:"passingScore" binding:"min=1,max=100"`
	TimeLimit    int    `json:"timeLimit" binding:"min=1,max=600"`
	IsPublished  bool   `json:"isPublished"`
}

type SubmitQuizRequest struct {
	Answers []SubmitAnswer `json:"answers" binding:"required,min=1,max=500,dive"`
}

type SubmitAnswer struct {
	QuestionID string `json:"questionId" binding:"required"`
	Answer     string `json:"answer" binding:"max=5000"`
}

type CreateAssignmentRequest struct {
	Title        string `json:"title" binding:"required,min=2,max=255"`
	Description  string `json:"description" binding:"max=5000"`
	Instructions string `json:"instructions" binding:"max=50000"`
	Deadline     string `json:"deadline" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	MaxScore     int    `json:"maxScore" binding:"min=1,max=100"`
	IsPublished  bool   `json:"isPublished"`
}

type SubmitAssignmentRequest struct {
	FileURL     string `json:"fileUrl" binding:"required,max=1000"`
	FileName    string `json:"fileName" binding:"required,max=255"`
	Description string `json:"description" binding:"max=5000"`
}

type UpdateQuizRequest struct {
	Title        string `json:"title" binding:"omitempty,min=2,max=255"`
	Description  string `json:"description" binding:"max=5000"`
	PassingScore int    `json:"passingScore" binding:"omitempty,min=1,max=100"`
	TimeLimit    int    `json:"timeLimit" binding:"omitempty,min=1,max=600"`
	IsPublished  *bool  `json:"isPublished"`
}

type UpdateAssignmentRequest struct {
	Title        string `json:"title" binding:"omitempty,min=2,max=255"`
	Description  string `json:"description" binding:"max=5000"`
	Instructions string `json:"instructions" binding:"max=50000"`
	Deadline     string `json:"deadline" binding:"omitempty,datetime=2006-01-02T15:04:05Z07:00"`
	MaxScore     int    `json:"maxScore" binding:"omitempty,min=1,max=100"`
	IsPublished  *bool  `json:"isPublished"`
}

type CreateQuestionRequest struct {
	Type          string   `json:"type" binding:"required,oneof=multiple_choice short_answer"`
	Text          string   `json:"text" binding:"required,max=5000"`
	Options       []string `json:"options" binding:"max=20,dive,max=500"`
	CorrectAnswer string   `json:"correctAnswer" binding:"required,max=500"`
	Points        int      `json:"points" binding:"min=1,max=1000"`
	Order         int      `json:"order" binding:"min=0,max=10000"`
}

type UpdateQuestionRequest struct {
	Type          string   `json:"type" binding:"omitempty,oneof=multiple_choice short_answer"`
	Text          string   `json:"text" binding:"omitempty,max=5000"`
	Options       []string `json:"options" binding:"max=20,dive,max=500"`
	CorrectAnswer string   `json:"correctAnswer" binding:"omitempty,max=500"`
	Points        int      `json:"points" binding:"omitempty,min=1,max=1000"`
	Order         int      `json:"order" binding:"min=0,max=10000"`
}
