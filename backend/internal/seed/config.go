package seed

import (
	"errors"
	"os"
	"strings"
)

const (
	// DefaultSuperAdminEmail is the only account created by the default seeder.
	DefaultSuperAdminEmail = "hendralatiefulm@gmail.com"
	defaultSuperAdminName  = "Hendra Latief Ulum"
)

// Config contains the credentials required by the explicit development seeder.
// Password is intentionally supplied through the environment and is never
// committed to source control.
type Config struct {
	SuperAdminName     string
	SuperAdminEmail    string
	SuperAdminPassword string
}

// ConfigFromEnv builds and validates seed configuration from environment variables.
func ConfigFromEnv() (Config, error) {
	config := Config{
		SuperAdminName:     strings.TrimSpace(os.Getenv("SEED_SUPER_ADMIN_NAME")),
		SuperAdminEmail:    DefaultSuperAdminEmail,
		SuperAdminPassword: os.Getenv("SEED_SUPER_ADMIN_PASSWORD"),
	}
	if config.SuperAdminName == "" {
		config.SuperAdminName = defaultSuperAdminName
	}
	if err := config.validate(); err != nil {
		return Config{}, err
	}
	return config, nil
}

func (config Config) validate() error {
	if strings.TrimSpace(config.SuperAdminName) == "" {
		return errors.New("super admin name is required")
	}
	if strings.ToLower(strings.TrimSpace(config.SuperAdminEmail)) != DefaultSuperAdminEmail {
		return errors.New("super admin email must be " + DefaultSuperAdminEmail)
	}
	if len(config.SuperAdminPassword) < 8 || len(config.SuperAdminPassword) > 72 {
		return errors.New("SEED_SUPER_ADMIN_PASSWORD must contain 8 to 72 characters")
	}
	return nil
}
