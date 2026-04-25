package database

import (
	"fmt"
	"log"
	"os"

	"backend/internal/model"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Connected to database successfully")

	// Auto Migrate
	err = DB.AutoMigrate(
		&model.User{},
		&model.Course{},
		&model.Module{},
		&model.Attachment{},
		&model.Quiz{},
		&model.Question{},
		&model.QuizAttempt{},
		&model.QuizAnswer{},
		&model.Assignment{},
		&model.Submission{},
		&model.Enrollment{},
		&model.Payment{},
		&model.Certificate{},
		&model.Notification{},
	)

	if err != nil {
		log.Fatal("Failed to auto migrate database:", err)
	}

	fmt.Println("Database migration completed")
}
