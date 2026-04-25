package database

import (
	"fmt"
	"log"
	"os"
	"time"

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

	// Use silent/warn logger in production, info in development
	logLevel := logger.Warn
	if os.Getenv("GIN_MODE") != "release" {
		logLevel = logger.Info
	}

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		// Disable default transaction for read queries (faster)
		SkipDefaultTransaction: true,
		// Cache prepared statements
		PrepareStmt: true,
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Configure connection pool for remote database (Supabase)
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get underlying sql.DB:", err)
	}

	sqlDB.SetMaxOpenConns(10)                  // Max open connections
	sqlDB.SetMaxIdleConns(5)                   // Keep 5 idle connections ready
	sqlDB.SetConnMaxLifetime(30 * time.Minute) // Recycle connections every 30 min
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)  // Close idle connections after 5 min

	fmt.Println("Connected to database successfully")

	// Auto Migrate — only run in development or when explicitly enabled
	if os.Getenv("SKIP_MIGRATION") != "true" {
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
	} else {
		fmt.Println("Skipping database migration (SKIP_MIGRATION=true)")
	}
}
