package dto

type CreateQuizRequest struct {
	Title        string `json:"title" binding:"required"`
	Description  string `json:"description"`
	PassingScore int    `json:"passingScore"`
	TimeLimit    int    `json:"timeLimit"`
}

type SubmitQuizRequest struct {
	Answers []SubmitAnswer `json:"answers"`
}

type SubmitAnswer struct {
	QuestionID string `json:"questionId" binding:"required"`
	Answer     string `json:"answer"`
}

type CreateAssignmentRequest struct {
	Title        string `json:"title" binding:"required"`
	Description  string `json:"description"`
	Instructions string `json:"instructions"`
	Deadline     string `json:"deadline"`
	MaxScore     int    `json:"maxScore"`
}

type SubmitAssignmentRequest struct {
	FileURL     string `json:"fileUrl"`
	FileName    string `json:"fileName"`
	Description string `json:"description"`
}

type UpdateQuizRequest struct {
	Title        string `json:"title"`
	Description  string `json:"description"`
	PassingScore int    `json:"passingScore"`
	TimeLimit    int    `json:"timeLimit"`
}

type UpdateAssignmentRequest struct {
	Title        string `json:"title"`
	Description  string `json:"description"`
	Instructions string `json:"instructions"`
	Deadline     string `json:"deadline"`
	MaxScore     int    `json:"maxScore"`
}

type CreateQuestionRequest struct {
	Type          string   `json:"type" binding:"required"`
	Text          string   `json:"text" binding:"required"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correctAnswer" binding:"required"`
	Points        int      `json:"points"`
	Order         int      `json:"order"`
}

type UpdateQuestionRequest struct {
	Type          string   `json:"type"`
	Text          string   `json:"text"`
	Options       []string `json:"options"`
	CorrectAnswer string   `json:"correctAnswer"`
	Points        int      `json:"points"`
	Order         int      `json:"order"`
}
