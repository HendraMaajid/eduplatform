package middleware

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"

	"backend/internal/service"
	"backend/pkg/database"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type userRoleLookup func(context.Context, string) (string, error)

func loadCurrentUserRole(ctx context.Context, userID string) (string, error) {
	var result struct {
		Role string
	}
	if err := database.DB.WithContext(ctx).
		Table("users").
		Select("role").
		Where("id = ? AND deleted_at IS NULL", userID).
		Take(&result).Error; err != nil {
		return "", err
	}
	return result.Role, nil
}

func RequireAuth() gin.HandlerFunc {
	return requireAuthWithUserLookup(loadCurrentUserRole)
}

func requireAuthWithUserLookup(lookup userRoleLookup) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid authorization format"})
			return
		}

		tokenString := parts[1]
		claims := &service.Claims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method to prevent algorithm confusion attacks
			if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			secret := os.Getenv("JWT_SECRET")
			if secret == "" {
				return nil, fmt.Errorf("JWT_SECRET not configured")
			}
			return []byte(secret), nil
		}, jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}), jwt.WithIssuer(service.JWTIssuer()), jwt.WithAudience(service.JWTAudience()))

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			return
		}

		// Re-check the user on every protected request so deleted accounts and
		// role changes take effect immediately instead of waiting for JWT expiry.
		currentRole, err := lookup(c.Request.Context(), claims.UserID)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Account is no longer active"})
			return
		}

		// Set current database identity rather than trusting a potentially stale role claim.
		c.Set("userID", claims.UserID)
		c.Set("role", currentRole)
		c.Next()
	}
}

func RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		userRole, exists := c.Get("role")
		if !exists {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			return
		}

		roleStr, ok := userRole.(string)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid role format"})
			return
		}

		// Check if user role matches any allowed role
		allowed := false
		for _, r := range roles {
			if roleStr == r {
				allowed = true
				break
			}
		}

		// Super admin can access everything
		if roleStr == "super_admin" {
			allowed = true
		}

		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "Forbidden: insufficient permissions"})
			return
		}

		c.Next()
	}
}
