// Package seed creates the minimal default dataset required by EduCourse:
// platform settings, one super administrator, and one complete Java course.
package seed

import (
	"context"
	"errors"
	"fmt"

	"backend/internal/service"

	"gorm.io/gorm"
)

// Result summarizes the records synchronized by Run.
type Result struct {
	PlatformName string
	SuperAdmin   string
	CourseID     string
	CourseTitle  string
	Modules      int
	Quizzes      int
	Questions    int
	Assignments  int
}

// Run synchronizes the minimal default dataset in one transaction. Re-running
// it updates the configured super admin and Java curriculum without touching
// unrelated users or courses.
func Run(ctx context.Context, db *gorm.DB, config Config) (Result, error) {
	if db == nil {
		return Result{}, errors.New("seed database is required")
	}
	if err := config.validate(); err != nil {
		return Result{}, err
	}

	result := Result{}
	err := db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		settings, err := seedPlatformSettings(tx)
		if err != nil {
			return err
		}
		admin, err := seedSuperAdmin(tx, config)
		if err != nil {
			return err
		}
		courseResult, err := seedJavaCourse(tx, admin)
		if err != nil {
			return err
		}

		result = Result{
			PlatformName: settings.Name,
			SuperAdmin:   admin.Email,
			CourseID:     courseResult.CourseID.String(),
			CourseTitle:  courseResult.Title,
			Modules:      courseResult.Modules,
			Quizzes:      courseResult.Quizzes,
			Questions:    courseResult.Questions,
			Assignments:  courseResult.Assignments,
		}
		return nil
	})
	if err != nil {
		return Result{}, fmt.Errorf("seed default dataset: %w", err)
	}
	service.AppCache.InvalidatePrefix("courses:")
	service.AppCache.InvalidatePrefix("dashboard:")
	service.AppCache.InvalidatePrefix("learning:")
	return result, nil
}
