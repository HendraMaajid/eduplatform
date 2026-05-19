// Package seed provides comprehensive database seeding for the EduCourse platform.
//
// Demo accounts (all password "password123" unless SEED_PASSWORD set):
//
//	admin@eduplatform.com              - super_admin
//	admin@admin.com                    - admin
//	budi@teacher.com                   - teacher
//	teacher01@educourse.com … teacher11@educourse.com - teacher
//	student@example.com                - student
//	student01@educourse.com … student54@educourse.com - student
package seed

import (
	"fmt"
	"log"
	mrand "math/rand"
	"os"
	"time"

	"backend/internal/model"
	"backend/pkg/database"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm/clause"
)

// ─── Config & Context ─────────────────────────────────────────────────────────

type seedConfig struct {
	TeacherCount int
	StudentCount int
	CourseCount  int
	PasswordHash string
	RNG          *mrand.Rand
}

type seededUsers struct {
	SuperAdmin model.User
	Admin      model.User
	Teachers   []model.User
	Students   []model.User
}

type seededCourses struct {
	Courses         []model.Course
	Modules         []model.Module
	ModulesByCourse map[uuid.UUID][]model.Module
}

type seededLearning struct {
	Quizzes             []model.Quiz
	Questions           []model.Question
	Assignments         []model.Assignment
	QuizzesByCourse     map[uuid.UUID][]model.Quiz
	QuestionsByQuiz     map[uuid.UUID][]model.Question
	AssignmentsByCourse map[uuid.UUID][]model.Assignment
}

type seededEnrollments struct {
	Enrollments  []model.Enrollment
	Certificates []model.Certificate
	CountByState map[string]int
}

type seedContext struct {
	Cfg         seedConfig
	Users       *seededUsers
	Courses     *seededCourses
	Learning    *seededLearning
	Enrollments *seededEnrollments
}

// ─── Main Orchestrator ────────────────────────────────────────────────────────

func SeedAll() {
	if os.Getenv("GIN_MODE") == "release" && os.Getenv("FORCE_SEED") != "true" {
		log.Println("Skipping seed in production mode (set FORCE_SEED=true to override)")
		return
	}

	start := time.Now()
	log.Println("[seed] Running database seeder (duplicates will be skipped)...")

	seedPassword := os.Getenv("SEED_PASSWORD")
	if seedPassword == "" {
		seedPassword = "password123"
	}
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(seedPassword), bcrypt.DefaultCost)

	ctx := &seedContext{
		Cfg: seedConfig{
			TeacherCount: 12,
			StudentCount: 55,
			CourseCount:  15,
			PasswordHash: string(hashedPassword),
			RNG:          newSeededRand(),
		},
	}

	steps := []struct {
		name string
		fn   func(*seedContext) error
	}{
		{"users", seedUsers},
		{"courses", seedCourses},
		{"learning", seedLearning},
		{"enrollments", seedEnrollments},
		{"ratings", seedRatings},
		{"notifications", seedNotifications},
	}

	for _, step := range steps {
		if err := step.fn(ctx); err != nil {
			log.Fatalf("[seed] FAILED at %s: %v", step.name, err)
		}
	}

	log.Printf("[seed] completed in %s", time.Since(start).Round(time.Millisecond))
}

// ─── Preserved Functions ──────────────────────────────────────────────────────

func SeedAdminIfMissing() {
	var admin model.User
	if err := database.DB.Where("role = ? AND email = ?", "admin", "admin@admin.com").First(&admin).Error; err != nil {
		log.Println("Admin user not found, creating...")
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
		admin = model.User{
			Name:         "Admin EduPlatform",
			Email:        "admin@admin.com",
			PasswordHash: string(hashedPassword),
			Role:         "admin",
		}
		database.DB.Create(&admin)
		log.Println("Admin user created successfully!")
	}
}

func SeedTestStudents(count int) error {
	if count <= 0 {
		return nil
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	students := make([]model.User, 0, count)
	for i := 1; i <= count; i++ {
		students = append(students, model.User{
			Name:         fmt.Sprintf("Load Test Student %04d", i),
			Email:        fmt.Sprintf("loadtest_student_%04d@example.com", i),
			PasswordHash: string(hashedPassword),
			Role:         "student",
		})
	}
	result := database.DB.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "email"}},
		DoNothing: true,
	}).CreateInBatches(students, 200)
	if result.Error != nil {
		return result.Error
	}
	log.Printf("Seeded %d load test students (duplicates ignored)", count)
	return nil
}
