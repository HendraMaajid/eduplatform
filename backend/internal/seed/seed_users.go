package seed

import (
	"fmt"
	"log"

	"backend/internal/model"
	"backend/pkg/database"

	"gorm.io/gorm/clause"
)

func seedUsers(ctx *seedContext) error {
	pass := ctx.Cfg.PasswordHash
	rng := ctx.Cfg.RNG

	users := make([]model.User, 0, 69)

	// Legacy accounts
	superAdmin := model.User{Name: "Super Admin", Email: "admin@eduplatform.com", PasswordHash: pass, Role: "super_admin"}
	admin := model.User{Name: "Admin EduPlatform", Email: "admin@admin.com", PasswordHash: pass, Role: "admin"}
	users = append(users, superAdmin, admin)

	// Teachers
	teachers := make([]model.User, 0, ctx.Cfg.TeacherCount)
	for i := 0; i < ctx.Cfg.TeacherCount; i++ {
		var email, name string
		if i == 0 {
			email, name = "budi@teacher.com", "Budi Santoso"
		} else {
			email = fmt.Sprintf("teacher%02d@educourse.com", i)
			name = teacherNames[i]
		}
		t := model.User{
			Name:         name,
			Email:        email,
			PasswordHash: pass,
			Role:         "teacher",
			Bio:          "Pengajar berpengalaman di bidang pendidikan dan teknologi.",
			Phone:        fmt.Sprintf("081%08d", 20000000+rng.Intn(80000000)),
		}
		teachers = append(teachers, t)
	}
	users = append(users, teachers...)

	// Students
	students := make([]model.User, 0, ctx.Cfg.StudentCount)
	for i := 0; i < ctx.Cfg.StudentCount; i++ {
		var email, name string
		if i == 0 {
			email, name = "student@example.com", "John Doe"
		} else {
			email = fmt.Sprintf("student%02d@educourse.com", i)
			name = studentNames[i]
		}
		s := model.User{
			Name:         name,
			Email:        email,
			PasswordHash: pass,
			Role:         "student",
		}
		students = append(students, s)
	}
	users = append(users, students...)

	// Upsert: skip duplicates based on email
	tx := database.DB.Begin()
	if err := tx.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "email"}},
		DoNothing: true,
	}).CreateInBatches(&users, 100).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	// Re-fetch from DB to get all IDs (including pre-existing)
	var allTeachers, allStudents []model.User
	var sa, adm model.User
	database.DB.Where("email = ?", "admin@eduplatform.com").First(&sa)
	database.DB.Where("email = ?", "admin@admin.com").First(&adm)
	database.DB.Where("role = ?", "teacher").Order("email").Find(&allTeachers)
	database.DB.Where("role = ?", "student").Order("email").Find(&allStudents)

	ctx.Users = &seededUsers{
		SuperAdmin: sa,
		Admin:      adm,
		Teachers:   allTeachers,
		Students:   allStudents,
	}

	log.Printf("[seed] users: %d teachers, %d students (duplicates skipped)",
		len(allTeachers), len(allStudents))
	return nil
}
