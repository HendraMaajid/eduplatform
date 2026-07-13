package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"os"
	"strings"
	"time"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"google.golang.org/api/idtoken"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// Claims are the authorization claims signed into an EduPlatform access token.
type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func JWTIssuer() string {
	if value := strings.TrimSpace(os.Getenv("JWT_ISSUER")); value != "" {
		return value
	}
	return "eduplatform-api"
}

func JWTAudience() string {
	if value := strings.TrimSpace(os.Getenv("JWT_AUDIENCE")); value != "" {
		return value
	}
	return "eduplatform-web"
}

func normalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// RegisterUser creates a public student account using email and password.
func RegisterUser(ctx context.Context, req dto.RegisterRequest) (*model.User, error) {
	email := normalizeEmail(req.Email)
	var existingUser model.User
	err := database.DB.WithContext(ctx).Where("email = ?", email).First(&existingUser).Error
	if err == nil {
		return nil, errors.New("email already registered")
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, fmt.Errorf("check existing user: %w", err)
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	user := model.User{
		Name:         strings.TrimSpace(req.Name),
		Email:        email,
		PasswordHash: string(hashedPassword),
		Role:         "student",
	}

	err = database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&user).Error; err != nil {
			return fmt.Errorf("create user: %w", err)
		}
		preference := model.UserPreference{UserID: user.ID, Locale: "id", Theme: "system", NotifyCourseUpdates: true, NotifyAssignments: true, NotifyGrades: true}
		if err := tx.Create(&preference).Error; err != nil {
			return fmt.Errorf("create preferences: %w", err)
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	notifyAdminsOfRegistration(ctx, user)
	return &user, nil
}

// LoginUser authenticates an email/password account.
func LoginUser(ctx context.Context, req dto.LoginRequest) (string, string, *model.User, error) {
	var user model.User
	if err := database.DB.WithContext(ctx).Where("email = ?", normalizeEmail(req.Email)).First(&user).Error; err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}
	if user.PasswordHash == "" || bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)) != nil {
		return "", "", nil, errors.New("invalid email or password")
	}
	return issueTokens(ctx, user)
}

// LoginWithGoogle verifies a Google ID token and links or creates a student.
func LoginWithGoogle(ctx context.Context, rawIDToken string) (string, string, *model.User, error) {
	clientID := strings.TrimSpace(os.Getenv("GOOGLE_CLIENT_ID"))
	if clientID == "" {
		return "", "", nil, errors.New("google authentication is not configured")
	}
	payload, err := idtoken.Validate(ctx, rawIDToken, clientID)
	if err != nil {
		return "", "", nil, errors.New("invalid google identity token")
	}

	sub, _ := payload.Claims["sub"].(string)
	email, _ := payload.Claims["email"].(string)
	name, _ := payload.Claims["name"].(string)
	picture, _ := payload.Claims["picture"].(string)
	emailVerified, _ := payload.Claims["email_verified"].(bool)
	if sub == "" || email == "" || !emailVerified {
		return "", "", nil, errors.New("google account email is not verified")
	}
	email = normalizeEmail(email)

	db := database.DB.WithContext(ctx)
	var user model.User
	created := false
	lookupErr := db.Where("google_id = ?", sub).First(&user).Error
	if errors.Is(lookupErr, gorm.ErrRecordNotFound) {
		lookupErr = db.Where("email = ?", email).First(&user).Error
	}
	if lookupErr != nil && !errors.Is(lookupErr, gorm.ErrRecordNotFound) {
		return "", "", nil, fmt.Errorf("find google user: %w", lookupErr)
	}

	err = db.Transaction(func(tx *gorm.DB) error {
		if errors.Is(lookupErr, gorm.ErrRecordNotFound) {
			created = true
			user = model.User{Name: strings.TrimSpace(name), Email: email, Avatar: picture, GoogleID: sub, Role: "student"}
			if user.Name == "" {
				user.Name = strings.Split(email, "@")[0]
			}
			if err := tx.Create(&user).Error; err != nil {
				return fmt.Errorf("create google user: %w", err)
			}
			preference := model.UserPreference{UserID: user.ID, Locale: "id", Theme: "system", NotifyCourseUpdates: true, NotifyAssignments: true, NotifyGrades: true}
			if err := tx.Create(&preference).Error; err != nil {
				return fmt.Errorf("create google preferences: %w", err)
			}
			return nil
		}

		updates := map[string]any{"google_id": sub}
		if user.Avatar == "" && picture != "" {
			updates["avatar"] = picture
			user.Avatar = picture
		}
		if err := tx.Model(&user).Updates(updates).Error; err != nil {
			return fmt.Errorf("link google account: %w", err)
		}
		user.GoogleID = sub
		return nil
	})
	if err != nil {
		return "", "", nil, err
	}
	if created {
		notifyAdminsOfRegistration(ctx, user)
	}
	return issueTokens(ctx, user)
}

func issueTokens(ctx context.Context, user model.User) (string, string, *model.User, error) {
	accessToken, err := GenerateAccessToken(user)
	if err != nil {
		return "", "", nil, err
	}
	refreshToken, err := GenerateRefreshToken(ctx, user)
	if err != nil {
		return "", "", nil, err
	}
	return accessToken, refreshToken, &user, nil
}

// GenerateAccessToken signs a short-lived platform token.
func GenerateAccessToken(user model.User) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", errors.New("JWT_SECRET is not configured")
	}
	claims := &Claims{
		UserID: user.ID.String(),
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			Issuer:    JWTIssuer(),
			Audience:  jwt.ClaimStrings{JWTAudience()},
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

func hashRefreshToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

func newRefreshTokenValue() (string, error) {
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", fmt.Errorf("generate refresh token: %w", err)
	}
	return hex.EncodeToString(bytes), nil
}

// GenerateRefreshToken stores a cryptographically random refresh token.
func GenerateRefreshToken(ctx context.Context, user model.User) (string, error) {
	token, err := newRefreshTokenValue()
	if err != nil {
		return "", err
	}
	db := database.DB.WithContext(ctx)
	if err := db.Where("user_id = ? AND expires_at < ?", user.ID, time.Now()).Delete(&model.RefreshToken{}).Error; err != nil {
		return "", fmt.Errorf("remove expired refresh tokens: %w", err)
	}
	rt := model.RefreshToken{UserID: user.ID, Token: hashRefreshToken(token), ExpiresAt: time.Now().Add(7 * 24 * time.Hour)}
	if err := db.Create(&rt).Error; err != nil {
		return "", fmt.Errorf("store refresh token: %w", err)
	}
	return token, nil
}

// RefreshAccessToken rotates a valid refresh token.
func RefreshAccessToken(ctx context.Context, refreshToken string) (string, string, *model.User, error) {
	db := database.DB.WithContext(ctx)
	var rt model.RefreshToken
	var user model.User
	newToken, err := newRefreshTokenValue()
	if err != nil {
		return "", "", nil, err
	}
	err = db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("token IN ? AND expires_at > ?", []string{hashRefreshToken(refreshToken), refreshToken}, time.Now()).First(&rt).Error; err != nil {
			return errors.New("invalid or expired refresh token")
		}
		if err := tx.First(&user, "id = ?", rt.UserID).Error; err != nil {
			return errors.New("user not found")
		}
		if err := tx.Delete(&rt).Error; err != nil {
			return fmt.Errorf("rotate refresh token: %w", err)
		}
		rotated := model.RefreshToken{UserID: user.ID, Token: hashRefreshToken(newToken), ExpiresAt: time.Now().Add(7 * 24 * time.Hour)}
		return tx.Create(&rotated).Error
	})
	if err != nil {
		return "", "", nil, err
	}
	accessToken, err := GenerateAccessToken(user)
	if err != nil {
		return "", "", nil, err
	}
	return accessToken, newToken, &user, nil
}

// RevokeRefreshToken invalidates a refresh token on logout.
func RevokeRefreshToken(ctx context.Context, refreshToken string) error {
	if err := database.DB.WithContext(ctx).Where("token IN ?", []string{hashRefreshToken(refreshToken), refreshToken}).Delete(&model.RefreshToken{}).Error; err != nil {
		return fmt.Errorf("revoke refresh token: %w", err)
	}
	return nil
}

func notifyAdminsOfRegistration(ctx context.Context, user model.User) {
	var settings model.PlatformSettings
	if err := database.DB.WithContext(ctx).First(&settings, 1).Error; err == nil && !settings.NotifyNewRegistration {
		return
	}
	var admins []model.User
	if err := database.DB.WithContext(ctx).Where("role IN ?", []string{"admin", "super_admin"}).Find(&admins).Error; err != nil {
		return
	}
	for _, admin := range admins {
		_ = CreateNotification(admin.ID.String(), "Siswa Baru", fmt.Sprintf("%s bergabung sebagai siswa", user.Name), "info", "/dashboard/admin/users")
	}
}

// GenerateJWT is retained for seed compatibility.
func GenerateJWT(user model.User) (string, error) {
	return GenerateAccessToken(user)
}
