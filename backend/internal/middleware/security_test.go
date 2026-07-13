package middleware

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"backend/internal/model"
	"backend/internal/service"
	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestSecurityHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	context, engine := gin.CreateTestContext(recorder)
	context.Request = httptest.NewRequest(http.MethodGet, "/api/health", nil)
	engine.Use(SecurityHeaders())
	engine.GET("/api/health", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	engine.ServeHTTP(recorder, context.Request)
	for header, want := range map[string]string{
		"X-Content-Type-Options":  "nosniff",
		"X-Frame-Options":         "DENY",
		"Referrer-Policy":         "strict-origin-when-cross-origin",
		"Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
	} {
		if got := recorder.Header().Get(header); got != want {
			t.Fatalf("%s = %q, want %q", header, got, want)
		}
	}
}

func TestRequireAuthRejectsUnexpectedHMACAlgorithm(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("JWT_SECRET", "middleware-test-secret")
	userID := uuid.NewString()
	claims := service.Claims{UserID: userID, Role: "student", RegisteredClaims: jwt.RegisteredClaims{
		Issuer: service.JWTIssuer(), Audience: jwt.ClaimStrings{service.JWTAudience()},
	}}
	raw, err := jwt.NewWithClaims(jwt.SigningMethodHS512, claims).SignedString([]byte("middleware-test-secret"))
	if err != nil {
		t.Fatal(err)
	}
	recorder := httptest.NewRecorder()
	engine := gin.New()
	engine.Use(requireAuthWithUserLookup(func(context.Context, string) (string, error) {
		return "teacher", nil
	}))
	engine.GET("/protected", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer "+raw)
	engine.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusUnauthorized)
	}
}

func TestRequireAuthRejectsDeletedAccount(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("JWT_SECRET", "middleware-test-secret")
	user := model.User{ID: uuid.New(), Role: "teacher"}
	raw, err := service.GenerateAccessToken(user)
	if err != nil {
		t.Fatal(err)
	}

	recorder := httptest.NewRecorder()
	engine := gin.New()
	engine.Use(requireAuthWithUserLookup(func(context.Context, string) (string, error) {
		return "", errors.New("not found")
	}))
	engine.GET("/protected", func(c *gin.Context) { c.Status(http.StatusNoContent) })
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer "+raw)
	engine.ServeHTTP(recorder, request)

	if recorder.Code != http.StatusUnauthorized {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusUnauthorized)
	}
}

func TestRequireAuthAcceptsPlatformToken(t *testing.T) {
	gin.SetMode(gin.TestMode)
	t.Setenv("JWT_SECRET", "middleware-test-secret")
	user := model.User{ID: uuid.New(), Role: "student"}
	raw, err := service.GenerateAccessToken(user)
	if err != nil {
		t.Fatal(err)
	}
	recorder := httptest.NewRecorder()
	engine := gin.New()
	engine.Use(requireAuthWithUserLookup(func(context.Context, string) (string, error) {
		return "teacher", nil
	}))
	engine.GET("/protected", func(c *gin.Context) {
		if c.GetString("userID") != user.ID.String() || c.GetString("role") != "teacher" {
			c.Status(http.StatusInternalServerError)
			return
		}
		c.Status(http.StatusNoContent)
	})
	request := httptest.NewRequest(http.MethodGet, "/protected", nil)
	request.Header.Set("Authorization", "Bearer "+raw)
	engine.ServeHTTP(recorder, request)
	if recorder.Code != http.StatusNoContent {
		t.Fatalf("status = %d, want %d", recorder.Code, http.StatusNoContent)
	}
}
