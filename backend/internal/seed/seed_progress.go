package seed

import (
	"log"
	"time"

	"backend/internal/model"
	"backend/pkg/database"
	"gorm.io/gorm/clause"
)

func seedProgress(ctx *seedContext) error {
	var existing []model.LearningProgress
	if err := database.DB.Find(&existing).Error; err != nil {
		return err
	}
	if len(existing) > 0 {
		ctx.Progress = &seededProgress{Progresses: existing, CountByState: map[string]int{}}
		log.Printf("[seed] learning progress: skipped (already %d exist)", len(existing))
		return nil
	}

	progresses := make([]model.LearningProgress, 0)
	now := time.Now()
	for studentIndex, student := range ctx.Users.Students {
		if len(ctx.Courses.Courses) == 0 {
			break
		}
		courseCount := 1 + studentIndex%3
		for i := 0; i < courseCount && i < len(ctx.Courses.Courses); i++ {
			course := ctx.Courses.Courses[(studentIndex+i)%len(ctx.Courses.Courses)]
			if course.Status != "published" {
				continue
			}
			modules := ctx.Courses.ModulesByCourse[course.ID]
			completedCount := 0
			if len(modules) > 0 {
				completedCount = (studentIndex + i) % (len(modules) + 1)
			}
			completed := make(model.StringArray, 0, completedCount)
			for _, module := range modules[:completedCount] {
				if module.IsPublished {
					completed = append(completed, module.ID.String())
				}
			}
			progressValue := 0
			if len(modules) > 0 {
				progressValue = min(len(completed)*50/len(modules), 50)
			}
			progresses = append(progresses, model.LearningProgress{
				StudentID: student.ID, CourseID: course.ID, CompletedModules: completed,
				Progress: progressValue, Status: "in_progress", StartedAt: now.AddDate(0, 0, -(studentIndex%30 + 1)),
				LastAccessedAt: now.Add(-time.Duration(studentIndex%72) * time.Hour),
			})
		}
	}
	if len(progresses) > 0 {
		if err := database.DB.Clauses(clause.OnConflict{Columns: []clause.Column{{Name: "student_id"}, {Name: "course_id"}}, DoNothing: true}).CreateInBatches(&progresses, 100).Error; err != nil {
			return err
		}
	}
	ctx.Progress = &seededProgress{
		Progresses:   progresses,
		CountByState: map[string]int{"in_progress": len(progresses)},
	}
	log.Printf("[seed] learning progress: %d", len(progresses))
	return nil
}
