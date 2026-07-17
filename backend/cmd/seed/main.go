package main

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"backend/internal/seed"
	"backend/pkg/database"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	isProduction := strings.EqualFold(os.Getenv("APP_ENV"), "production") ||
		strings.EqualFold(os.Getenv("GIN_MODE"), "release")
	if isProduction && os.Getenv("FORCE_SEED") != "true" {
		log.Fatal("Refusing to seed production without FORCE_SEED=true")
	}

	config, err := seed.ConfigFromEnv()
	if err != nil {
		log.Fatalf("Invalid seed configuration: %v", err)
	}

	database.InitDB()
	ctx, cancel := context.WithTimeout(context.Background(), 90*time.Second)
	defer cancel()

	result, err := seed.Run(ctx, database.DB, config)
	if err != nil {
		log.Fatalf("Failed to seed default dataset: %v", err)
	}
	log.Printf(
		"Seed complete: platform=%q admin=%s course=%q modules=%d quizzes=%d questions=%d assignments=%d",
		result.PlatformName,
		result.SuperAdmin,
		result.CourseTitle,
		result.Modules,
		result.Quizzes,
		result.Questions,
		result.Assignments,
	)
}
