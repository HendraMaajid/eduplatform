package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
	"golang.org/x/crypto/bcrypt"
)

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func RegisterUser(req dto.RegisterRequest) (*model.User, error) {
	var existingUser model.User
	if err := database.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, errors.New("email already registered")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	user := model.User{
		Name:         req.Name,
		Email:        req.Email,
		PasswordHash: string(hashedPassword),
		Role:         "student",
	}

	if err := database.DB.Create(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

func LoginUser(req dto.LoginRequest) (string, string, *model.User, error) {
	var user model.User
	if err := database.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return "", "", nil, errors.New("invalid email or password")
	}

	accessToken, err := GenerateAccessToken(user)
	if err != nil {
		return "", "", nil, err
	}

	refreshToken, err := GenerateRefreshToken(user)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, refreshToken, &user, nil
}

func GenerateAccessToken(user model.User) (string, error) {
	expirationTime := time.Now().Add(15 * time.Minute)
	claims := &Claims{
		UserID: user.ID.String(),
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(os.Getenv("JWT_SECRET")))
}

func GenerateRefreshToken(user model.User) (string, error) {
	// Generate random token
	bytes := make([]byte, 32)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	token := hex.EncodeToString(bytes)

	// Delete old refresh tokens for this user (max 5 sessions)
	database.DB.Where("user_id = ? AND expires_at < ?", user.ID, time.Now()).Delete(&model.RefreshToken{})

	// Save to DB
	rt := model.RefreshToken{
		UserID:    user.ID,
		Token:     token,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
	}
	if err := database.DB.Create(&rt).Error; err != nil {
		return "", err
	}

	return token, nil
}

func RefreshAccessToken(refreshTokenStr string) (string, string, *model.User, error) {
	var rt model.RefreshToken
	if err := database.DB.Where("token = ? AND expires_at > ?", refreshTokenStr, time.Now()).First(&rt).Error; err != nil {
		return "", "", nil, errors.New("invalid or expired refresh token")
	}

	var user model.User
	if err := database.DB.First(&user, "id = ?", rt.UserID).Error; err != nil {
		return "", "", nil, errors.New("user not found")
	}

	// Rotate refresh token (delete old, create new)
	database.DB.Delete(&rt)

	accessToken, err := GenerateAccessToken(user)
	if err != nil {
		return "", "", nil, err
	}

	newRefreshToken, err := GenerateRefreshToken(user)
	if err != nil {
		return "", "", nil, err
	}

	return accessToken, newRefreshToken, &user, nil
}

func RevokeRefreshToken(refreshTokenStr string) error {
	return database.DB.Where("token = ?", refreshTokenStr).Delete(&model.RefreshToken{}).Error
}

// GenerateJWT is kept for backward compatibility
func GenerateJWT(user model.User) (string, error) {
	return GenerateAccessToken(user)
}
