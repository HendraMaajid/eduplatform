package seed

import (
	"log"
	"math"

	"backend/internal/model"
	"backend/internal/service"
	"backend/pkg/database"

	"github.com/google/uuid"
	"gorm.io/gorm/clause"
)

func seedCourses(ctx *seedContext) error {
	rng := ctx.Cfg.RNG
	teachers := ctx.Users.Teachers

	// Early return: if courses already seeded, just load existing data
	var courseCount int64
	database.DB.Model(&model.Course{}).Count(&courseCount)
	if courseCount >= int64(len(courseTemplates)) {
		log.Printf("[seed] courses: skipped (already %d courses exist)", courseCount)
		var courses []model.Course
		database.DB.Order("created_at").Find(&courses)
		var allModules []model.Module
		database.DB.Find(&allModules)
		modulesByCourse := make(map[uuid.UUID][]model.Module)
		for i := range allModules {
			modulesByCourse[allModules[i].CourseID] = append(modulesByCourse[allModules[i].CourseID], allModules[i])
		}
		ctx.Courses = &seededCourses{Courses: courses, Modules: allModules, ModulesByCourse: modulesByCourse}
		return nil
	}

	// Build courses
	courses := make([]model.Course, 0, len(courseTemplates))
	for i, ct := range courseTemplates {
		c := model.Course{
			Title:            ct.Title,
			Slug:             ct.Slug,
			Description:      ct.Description,
			ShortDescription: ct.ShortDescription,
			Category:         ct.Category,
			Level:            ct.Level,
			Status:           ct.Status,
			TeacherID:        teachers[i%len(teachers)].ID,
			Duration:         ct.Duration,
			Rating:           math.Round((3.5+rng.Float64()*1.5)*100) / 100,
			TotalReviews:     randomInRange(rng, 5, 200),
		}
		courses = append(courses, c)
	}

	tx := database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "slug"}}, DoNothing: true}).CreateInBatches(&courses, 20).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	// Re-fetch courses from DB to get IDs
	database.DB.Order("created_at").Find(&courses)

	// Build modules
	durations := []string{"1 Jam", "2 Jam", "3 Jam", "90 Menit"}
	modulesByCourse := make(map[uuid.UUID][]model.Module)
	allModules := make([]model.Module, 0, len(courses)*5)

	for _, c := range courses {
		templates := moduleTemplatesByCategory[c.Category]
		if len(templates) == 0 {
			continue
		}
		picked := pickN(rng, templates, 5)
		for order, mt := range picked {
			m := model.Module{
				CourseID:    c.ID,
				Title:       mt.Title,
				Description: mt.Description,
				Content:     mt.Content,
				Order:       order + 1,
				Duration:    durations[rng.Intn(len(durations))],
				IsPublished: c.Status == "published" || order < 3,
			}
			allModules = append(allModules, m)
		}
	}

	tx = database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&allModules, 100).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	// Re-fetch modules to get IDs (including pre-existing)
	allModules = nil
	database.DB.Find(&allModules)
	for i := range allModules {
		modulesByCourse[allModules[i].CourseID] = append(modulesByCourse[allModules[i].CourseID], allModules[i])
	}

	// Attachments
	allAttachments := make([]model.Attachment, 0, len(allModules)*3)
	for _, m := range allModules {
		n := randomInRange(rng, 2, 3)
		picked := pickN(rng, attachmentSamples, n)
		for _, at := range picked {
			allAttachments = append(allAttachments, model.Attachment{
				ModuleID: m.ID,
				Name:     at.Name,
				URL:      at.URL,
				Type:     at.Type,
				Size:     at.Size,
			})
		}
	}

	tx = database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&allAttachments, 200).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	// Module embeddings
	embeddings := make([]model.ModuleEmbedding, 0, len(allModules))
	for _, m := range allModules {
		plainText := service.StripHTML(m.Title + " " + m.Description + " " + m.Content)
		emb := model.ModuleEmbedding{
			ModuleID:  m.ID,
			CourseID:  m.CourseID,
			Content:   plainText,
			Embedding: service.GenerateEmbedding(plainText),
		}
		embeddings = append(embeddings, emb)
	}

	tx = database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{DoNothing: true}).CreateInBatches(&embeddings, 50).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	ctx.Courses = &seededCourses{
		Courses:         courses,
		Modules:         allModules,
		ModulesByCourse: modulesByCourse,
	}

	log.Printf("[seed] courses: %d, modules: %d, attachments: %d, embeddings: %d",
		len(courses), len(allModules), len(allAttachments), len(embeddings))
	return nil
}
