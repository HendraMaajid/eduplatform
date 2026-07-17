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

	// Configure the PostgreSQL application connection pool.
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get underlying sql.DB:", err)
	}

	sqlDB.SetMaxOpenConns(25)                  // Max open connections
	sqlDB.SetMaxIdleConns(15)                  // Keep 5 idle connections ready
	sqlDB.SetConnMaxLifetime(30 * time.Minute) // Recycle connections every 30 min
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)  // Close idle connections after 5 min

	fmt.Println("Connected to database successfully")

	// AutoMigrate is additive-only and intended for development. Production
	// schema changes are applied by cmd/migrate before the API starts.
	isProduction := os.Getenv("APP_ENV") == "production" || os.Getenv("GIN_MODE") == "release"
	shouldAutoMigrate := !isProduction && os.Getenv("AUTO_MIGRATE") == "true"
	if shouldAutoMigrate {
		// Enable pgvector extension for AI RAG feature
		if execErr := DB.Exec("CREATE EXTENSION IF NOT EXISTS vector").Error; execErr != nil {
			log.Printf("Warning: could not enable pgvector extension: %v", execErr)
			log.Println("AI Chat RAG vector search will fall back to keyword search")
		}

		// Clean duplicate submissions before creating the unique index.
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
			&model.LearningProgress{},
			&model.Certificate{},
			&model.Notification{},
			&model.ModuleEmbedding{},
			&model.RefreshToken{},
			&model.Rating{},
			&model.PlatformSettings{},
			&model.UserPreference{},
		)

		if err != nil {
			log.Fatal("Failed to auto migrate database:", err)
		}

		settings := model.PlatformSettings{
			ID: 1, Name: "EduCourse",
			DescriptionID: "Platform belajar teknologi gratis dengan materi terarah, latihan praktik, kuis, proyek, dan sertifikat.",
			DescriptionEN: "A free technology learning platform with structured lessons, hands-on practice, quizzes, projects, and certificates.",
			SupportEmail:  "hendralatiefulm@gmail.com", DefaultLocale: "id", CertificateIssuer: "EduCourse",
			NotifyNewRegistration: true, NotifyNewSubmission: true, NotifyGradePublished: true,
		}
		if err := DB.FirstOrCreate(&settings, model.PlatformSettings{ID: 1}).Error; err != nil {
			log.Printf("Warning: could not initialize platform settings: %v", err)
		}

		fmt.Println("Database migration completed")
	} else {
		fmt.Println("Skipping AutoMigrate; run cmd/migrate for versioned schema changes")
	}
}
