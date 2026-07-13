package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"backend/internal/model"
	"backend/pkg/database"
	"github.com/joho/godotenv"
	"gorm.io/gorm/clause"
)

func main() {
	_ = godotenv.Load()

	courseID := os.Getenv("COURSE_ID")
	courseSlug := os.Getenv("COURSE_SLUG")
	if courseID == "" && courseSlug == "" {
		log.Fatal("COURSE_ID or COURSE_SLUG is required")
	}

	studentCount := envInt("STUDENT_COUNT", 1000)
	if studentCount <= 0 {
		log.Fatal("STUDENT_COUNT must be greater than 0")
	}

	prefix := envString("EMAIL_PREFIX", "loadtest_student_")
	domain := envString("EMAIL_DOMAIN", "example.com")

	database.InitDB()

	var course model.Course
	var err error
	if courseID != "" {
		err = database.DB.First(&course, "id = ?", courseID).Error
	} else {
		err = database.DB.First(&course, "slug = ?", courseSlug).Error
	}
	if err != nil {
		log.Fatalf("Course not found: %v", err)
	}

	emails := make([]string, 0, studentCount)
	for i := 1; i <= studentCount; i++ {
		emails = append(emails, fmt.Sprintf("%s%04d@%s", prefix, i, domain))
	}

	var students []model.User
	if err := database.DB.Select("id", "email").Where("email IN ?", emails).Find(&students).Error; err != nil {
		log.Fatalf("Failed to load students: %v", err)
	}
	if len(students) == 0 {
		log.Fatal("No students found for the provided email range")
	}

	now := time.Now()
	progresses := make([]model.LearningProgress, 0, len(students))
	for _, student := range students {
		progresses = append(progresses, model.LearningProgress{
			StudentID:        student.ID,
			CourseID:         course.ID,
			Progress:         0,
			CompletedModules: model.StringArray{},
			Status:           "in_progress",
			StartedAt:        now,
			LastAccessedAt:   now,
		})
	}

	result := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "student_id"}, {Name: "course_id"}},
		DoNothing: true,
	}).CreateInBatches(progresses, 200)
	if result.Error != nil {
		log.Fatalf("Failed to create learning progress: %v", result.Error)
	}

	log.Printf("Learning progress rows created: %d (duplicates ignored)", result.RowsAffected)
}

func envString(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func envInt(key string, fallback int) int {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return parsed
}
