package service

import (
	"os"
	"testing"

	"backend/internal/model"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

func TestNormalizeEmail(t *testing.T) {
	t.Parallel()
	tests := []struct{ input, want string }{
		{" Student@Example.COM ", "student@example.com"},
		{"TEACHER@EXAMPLE.ID", "teacher@example.id"},
		{"already@normalized.id", "already@normalized.id"},
	}
	for _, test := range tests {
		test := test
		t.Run(test.input, func(t *testing.T) {
			t.Parallel()
			if got := normalizeEmail(test.input); got != test.want {
				t.Fatalf("normalizeEmail() = %q, want %q", got, test.want)
			}
		})
	}
}

func TestGenerateAccessTokenPreservesRole(t *testing.T) {
	t.Setenv("JWT_SECRET", "unit-test-secret")
	user := model.User{ID: uuid.New(), Role: "teacher"}
	raw, err := GenerateAccessToken(user)
	if err != nil {
		t.Fatal(err)
	}
	parsed, err := jwt.ParseWithClaims(raw, &Claims{}, func(token *jwt.Token) (any, error) { return []byte(os.Getenv("JWT_SECRET")), nil })
	if err != nil || !parsed.Valid {
		t.Fatalf("invalid generated token: %v", err)
	}
	claims := parsed.Claims.(*Claims)
	if claims.UserID != user.ID.String() || claims.Role != "teacher" {
		t.Fatalf("unexpected claims: %+v", claims)
	}
	if claims.Issuer != JWTIssuer() || len(claims.Audience) != 1 || claims.Audience[0] != JWTAudience() {
		t.Fatalf("unexpected issuer/audience: %+v", claims.RegisteredClaims)
	}
}

func TestHashRefreshToken(t *testing.T) {
	t.Parallel()
	raw := "refresh-token-that-must-not-be-stored"
	first := hashRefreshToken(raw)
	second := hashRefreshToken(raw)
	if first == raw || first != second || len(first) != 64 {
		t.Fatalf("unexpected refresh token hash: %q", first)
	}
}
