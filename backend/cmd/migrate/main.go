// Command migrate applies versioned PostgreSQL migrations.
package main

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"os"
	"strconv"

	"backend/migrations"
	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()
	databaseURL := os.Getenv("MIGRATION_DATABASE_URL")
	if databaseURL == "" && os.Getenv("APP_ENV") != "production" && os.Getenv("GIN_MODE") != "release" {
		databaseURL = os.Getenv("DATABASE_URL")
	}
	if databaseURL == "" {
		log.Fatal("MIGRATION_DATABASE_URL is required (DATABASE_URL fallback is development-only)")
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		log.Fatalf("open PostgreSQL: %v", err)
	}
	defer func() {
		if err := db.Close(); err != nil {
			log.Printf("close PostgreSQL: %v", err)
		}
	}()

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		log.Fatalf("create PostgreSQL migration driver: %v", err)
	}
	source, err := iofs.New(migrations.Files, ".")
	if err != nil {
		log.Fatalf("load embedded migrations: %v", err)
	}
	m, err := migrate.NewWithInstance("iofs", source, "postgres", driver)
	if err != nil {
		log.Fatalf("initialize migrations: %v", err)
	}
	defer func() {
		sourceErr, databaseErr := m.Close()
		if sourceErr != nil || databaseErr != nil {
			log.Printf("close migration: source=%v database=%v", sourceErr, databaseErr)
		}
	}()

	command := "up"
	if len(os.Args) > 1 {
		command = os.Args[1]
	}
	if err := run(m, command, os.Args[2:]); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		log.Fatal(err)
	}
}

func run(m *migrate.Migrate, command string, args []string) error {
	switch command {
	case "up":
		return m.Up()
	case "down":
		if len(args) == 0 {
			return m.Down()
		}
		if len(args) != 1 {
			return errors.New("usage: migrate down [steps]")
		}
		steps, err := strconv.Atoi(args[0])
		if err != nil || steps < 1 {
			return errors.New("down steps must be a positive integer")
		}
		return m.Steps(-steps)
	case "version":
		version, dirty, err := m.Version()
		if err != nil {
			return err
		}
		fmt.Printf("version=%d dirty=%t\n", version, dirty)
		return nil
	case "force":
		if len(args) != 1 {
			return errors.New("usage: migrate force <version>")
		}
		version, err := strconv.Atoi(args[0])
		if err != nil {
			return fmt.Errorf("invalid version: %w", err)
		}
		return m.Force(version)
	default:
		return fmt.Errorf("unknown command %q; use up, down [steps], version, or force", command)
	}
}
