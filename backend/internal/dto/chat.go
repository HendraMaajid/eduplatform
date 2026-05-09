package dto

// ChatRequest is the request body for the AI chat endpoint.
type ChatRequest struct {
	Message  string        `json:"message" binding:"required,max=2000"`
	CourseID string        `json:"courseId" binding:"required,uuid"`
	History  []ChatMessage `json:"history" binding:"max=20"`
}

// ChatMessage represents a single message in chat history.
type ChatMessage struct {
	Role    string `json:"role" binding:"required,oneof=user assistant"`
	Content string `json:"content" binding:"required,max=4000"`
}
