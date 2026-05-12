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

	sqlDB.SetMaxOpenConns(25)                  // Max open connections
	sqlDB.SetMaxIdleConns(15)                   // Keep 5 idle connections ready
	sqlDB.SetConnMaxLifetime(30 * time.Minute) // Recycle connections every 30 min
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)  // Close idle connections after 5 min

	fmt.Println("Connected to database successfully")

	// Auto Migrate — only run in development or when explicitly enabled
	if os.Getenv("SKIP_MIGRATION") != "true" {
		// Enable pgvector extension for AI RAG feature
		if execErr := DB.Exec("CREATE EXTENSION IF NOT EXISTS vector").Error; execErr != nil {
			log.Printf("Warning: could not enable pgvector extension: %v", execErr)
			log.Println("AI Chat RAG vector search will fall back to keyword search")
		}

		// Clean duplicates before migrate to prevent unique index creation failures
		DB.Exec(`DELETE FROM payments a USING payments b WHERE a.ctid > b.ctid AND a.course_id = b.course_id AND a.student_id = b.student_id`)
		DB.Exec(`DELETE FROM submissions a USING submissions b WHERE a.ctid > b.ctid AND a.assignment_id = b.assignment_id AND a.student_id = b.student_id`)

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
			&model.ModuleEmbedding{},
			&model.RefreshToken{},
		)

		if err != nil {
			log.Fatal("Failed to auto migrate database:", err)
		}

		fmt.Println("Database migration completed")
	} else {
		fmt.Println("Skipping database migration (SKIP_MIGRATION=true)")
	}
}
