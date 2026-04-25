package dto

type EnrollCourseRequest struct {
	PaymentAmount int `json:"paymentAmount"`
}

type GradeSubmissionRequest struct {
	Score    int    `json:"score" binding:"required"`
	Feedback string `json:"feedback"`
}

type CompleteModuleRequest struct {
	ModuleID string `json:"moduleId" binding:"required"`
}
