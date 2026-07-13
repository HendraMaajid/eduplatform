package dto

type CreateRatingRequest struct {
	Score  int    `json:"score" binding:"required,min=1,max=5"`
	Review string `json:"review" binding:"max=2000"`
}
