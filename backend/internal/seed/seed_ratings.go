package seed

import (
	"log"
	"math"

	"backend/internal/model"
	"backend/pkg/database"

	"gorm.io/gorm/clause"
)

var reviewTemplates = []string{
	"Kursus yang sangat bagus, materinya lengkap dan mudah dipahami.",
	"Instruktur menjelaskan dengan baik. Recommended!",
	"Materi cukup baik, tapi bisa lebih detail lagi.",
	"Sangat membantu untuk pemula. Terima kasih!",
	"Kualitas materi bagus, project-based learning yang efektif.",
	"",
	"",
	"",
}

func seedRatings(ctx *seedContext) error {
	// Early return if ratings already seeded
	var ratingCount int64
	database.DB.Model(&model.Rating{}).Count(&ratingCount)
	if ratingCount > 20 {
		log.Printf("[seed] ratings: skipped (already %d exist)", ratingCount)
		return nil
	}

	rng := ctx.Cfg.RNG
	progresses := ctx.Progress.Progresses

	// Only rate sufficiently active or completed learners.
	var eligible []model.LearningProgress
	for _, e := range progresses {
		if e.Status == "certified" || e.Progress >= 25 {
			eligible = append(eligible, e)
		}
	}

	// Limit to ~60% of eligible to keep it realistic
	numRatings := int(float64(len(eligible)) * 0.6)
	if numRatings > len(eligible) {
		numRatings = len(eligible)
	}
	picked := pickN(rng, eligible, numRatings)

	ratings := make([]model.Rating, 0, len(picked))
	for _, e := range picked {
		score := randomInRange(rng, 3, 5) // bias toward positive ratings
		review := reviewTemplates[rng.Intn(len(reviewTemplates))]
		ratings = append(ratings, model.Rating{
			CourseID:  e.CourseID,
			StudentID: e.StudentID,
			Score:     score,
			Review:    review,
		})
	}

	if len(ratings) == 0 {
		log.Println("[seed] ratings: 0 (no eligible learning progress)")
		return nil
	}

	tx := database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "course_id"}, {Name: "student_id"}},
		DoNothing: true,
	}).CreateInBatches(&ratings, 100).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	// Update course average ratings
	type avgResult struct {
		CourseID string
		Avg      float64
		Count    int64
	}
	var results []avgResult
	database.DB.Model(&model.Rating{}).
		Select("course_id, AVG(score) as avg, COUNT(*) as count").
		Group("course_id").
		Scan(&results)

	for _, r := range results {
		database.DB.Model(&model.Course{}).Where("id = ?", r.CourseID).
			Updates(map[string]interface{}{
				"rating":        math.Round(r.Avg*100) / 100,
				"total_reviews": r.Count,
			})
	}

	log.Printf("[seed] ratings: %d", len(ratings))
	return nil
}
