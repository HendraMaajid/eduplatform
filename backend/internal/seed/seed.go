package seed

import (
	"fmt"
	"log"

	"backend/internal/model"
	"backend/pkg/database"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm/clause"
)

func SeedAll() {
	var count int64
	database.DB.Model(&model.User{}).Count(&count)

	if count > 0 {
		log.Println("Database already seeded, skipping...")
		return
	}

	log.Println("Starting database seeding...")

	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	passStr := string(hashedPassword)

	// 1. Seed Users
	superAdmin := model.User{
		Name:         "Super Admin",
		Email:        "admin@eduplatform.com",
		PasswordHash: passStr,
		Role:         "super_admin",
	}
	teacher := model.User{
		Name:         "Budi Santoso",
		Email:        "budi@teacher.com",
		PasswordHash: passStr,
		Role:         "teacher",
	}
	student := model.User{
		Name:         "John Doe",
		Email:        "student@example.com",
		PasswordHash: passStr,
		Role:         "student",
	}

	admin := model.User{
		Name:         "Admin EduPlatform",
		Email:        "admin@admin.com",
		PasswordHash: passStr,
		Role:         "admin",
	}

	database.DB.Create(&superAdmin)
	database.DB.Create(&admin)
	database.DB.Create(&teacher)
	database.DB.Create(&student)

	// 2. Seed Course
	course := model.Course{
		Title:            "Fullstack Web Developer dengan Go & Next.js",
		Slug:             "fullstack-go-nextjs",
		Description:      "Pelajari cara membangun aplikasi web modern menggunakan Golang untuk backend dan Next.js untuk frontend.",
		ShortDescription: "Membangun web modern dari nol.",
		Price:            1500000,
		Category:         "Pemrograman",
		Level:            "intermediate",
		Status:           "published",
		TeacherID:        teacher.ID,
		Duration:         "12 Minggu",
	}
	database.DB.Create(&course)

	// 3. Seed Modules
	mod1 := model.Module{
		CourseID:    course.ID,
		Title:       "Pengenalan Golang",
		Description: "Dasar-dasar bahasa pemrograman Go.",
		Content:     "Go adalah bahasa pemrograman yang dibuat oleh Google...",
		Order:       1,
		Duration:    "2 Jam",
		IsPublished: true,
	}
	mod2 := model.Module{
		CourseID:    course.ID,
		Title:       "Membuat REST API",
		Description: "Cara membuat REST API menggunakan framework Gin.",
		Content:     "Gin adalah framework web HTTP yang ditulis dalam bahasa Go...",
		Order:       2,
		Duration:    "3 Jam",
		IsPublished: true,
	}
	database.DB.Create(&mod1)
	database.DB.Create(&mod2)

	log.Println("Database seeding completed successfully!")
}

// SeedAdminIfMissing ensures a dedicated admin user exists, even if database was already seeded
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

// SeedTestStudents creates deterministic student accounts for load testing.
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
