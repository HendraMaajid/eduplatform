package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"backend/internal/dto"
	"backend/internal/middleware"
	"backend/internal/model"
	"backend/pkg/database"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func integrationRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.POST("/api/auth/login", Login)
	router.POST("/api/auth/refresh", RefreshToken)
	router.POST("/api/auth/logout", Logout)
	protected := router.Group("/api")
	protected.Use(middleware.RequireAuth())
	protected.POST("/learning/courses/:id/start", StartCourse)
	protected.POST("/learning/courses/:id/modules/:moduleId/complete", CompleteModule)
	protected.POST("/learning/courses/:id/certificates", GenerateCertificate)
	manage := protected.Group("/manage")
	manage.Use(middleware.RequireRole("teacher", "admin", "super_admin"))
	manage.PUT("/courses/:id", UpdateCourse)
	return router
}

func requestJSON(t *testing.T, router http.Handler, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()
	var payload bytes.Buffer
	if body != nil {
		if err := json.NewEncoder(&payload).Encode(body); err != nil {
			t.Fatal(err)
		}
	}
	request := httptest.NewRequest(method, path, &payload)
	request.Header.Set("Content-Type", "application/json")
	if token != "" {
		request.Header.Set("Authorization", "Bearer "+token)
	}
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, request)
	return recorder
}

func decodeResponse[T any](t *testing.T, recorder *httptest.ResponseRecorder) T {
	t.Helper()
	var value T
	if err := json.Unmarshal(recorder.Body.Bytes(), &value); err != nil {
		t.Fatalf("decode response %d %s: %v", recorder.Code, recorder.Body.String(), err)
	}
	return value
}

func TestAuthLearningCertificateAndOwnershipIntegration(t *testing.T) {
	dsn := os.Getenv("TEST_DATABASE_URL")
	if dsn == "" {
		t.Skip("TEST_DATABASE_URL is not configured")
	}
	t.Setenv("JWT_SECRET", "integration-test-secret")
	t.Setenv("JWT_ISSUER", "eduplatform-api-test")
	t.Setenv("JWT_AUDIENCE", "eduplatform-web-test")

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		t.Fatal(err)
	}
	models := []any{
		&model.User{}, &model.Course{}, &model.Module{}, &model.Attachment{}, &model.Quiz{}, &model.Question{},
		&model.QuizAttempt{}, &model.QuizAnswer{}, &model.Assignment{}, &model.Submission{}, &model.LearningProgress{},
		&model.Certificate{}, &model.Notification{}, &model.RefreshToken{}, &model.Rating{}, &model.PlatformSettings{}, &model.UserPreference{},
	}
	if err := db.AutoMigrate(models...); err != nil {
		t.Fatal(err)
	}

	tx := db.Begin()
	if tx.Error != nil {
		t.Fatal(tx.Error)
	}
	previousDB := database.DB
	database.DB = tx
	t.Cleanup(func() { _ = tx.Rollback().Error; database.DB = previousDB })

	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.MinCost)
	if err != nil {
		t.Fatal(err)
	}
	owner := model.User{ID: uuid.New(), Name: "Owner", Email: "owner@test.local", PasswordHash: string(hash), Role: "teacher"}
	otherTeacher := model.User{ID: uuid.New(), Name: "Other", Email: "other@test.local", PasswordHash: string(hash), Role: "teacher"}
	student := model.User{ID: uuid.New(), Name: "Student", Email: "student@test.local", PasswordHash: string(hash), Role: "student"}
	if err := tx.Create([]*model.User{&owner, &otherTeacher, &student}).Error; err != nil {
		t.Fatal(err)
	}
	course := model.Course{ID: uuid.New(), TeacherID: owner.ID, Title: "Free Go", Slug: "free-go-test", Status: "published", Level: "beginner"}
	if err := tx.Create(&course).Error; err != nil {
		t.Fatal(err)
	}
	module := model.Module{ID: uuid.New(), CourseID: course.ID, Title: "Intro", Order: 1, IsPublished: true}
	if err := tx.Create(&module).Error; err != nil {
		t.Fatal(err)
	}
	settings := model.PlatformSettings{ID: 1, Name: "EduPlatform", DescriptionID: "Gratis", DescriptionEN: "Free", SupportEmail: "support@test.local", DefaultLocale: "id", CertificateIssuer: "EduPlatform", NotifyNewRegistration: true, NotifyNewSubmission: true, NotifyGradePublished: true}
	if err := tx.Create(&settings).Error; err != nil {
		t.Fatal(err)
	}

	router := integrationRouter()
	login := requestJSON(t, router, http.MethodPost, "/api/auth/login", "", map[string]string{"email": " STUDENT@test.local ", "password": "password123"})
	if login.Code != http.StatusOK {
		t.Fatalf("login status=%d body=%s", login.Code, login.Body.String())
	}
	auth := decodeResponse[dto.AuthResponse](t, login)

	start := requestJSON(t, router, http.MethodPost, "/api/learning/courses/"+course.ID.String()+"/start", auth.Token, nil)
	if start.Code != http.StatusOK {
		t.Fatalf("start status=%d body=%s", start.Code, start.Body.String())
	}
	progress := decodeResponse[model.LearningProgress](t, start)
	if progress.Progress != 0 {
		t.Fatalf("initial progress=%d, want 0", progress.Progress)
	}

	complete := requestJSON(t, router, http.MethodPost, "/api/learning/courses/"+course.ID.String()+"/modules/"+module.ID.String()+"/complete", auth.Token, map[string]string{})
	if complete.Code != http.StatusOK {
		t.Fatalf("complete status=%d body=%s", complete.Code, complete.Body.String())
	}
	progress = decodeResponse[model.LearningProgress](t, complete)
	if progress.Progress != 100 || progress.Status != "completed" {
		t.Fatalf("completed progress=%d status=%s", progress.Progress, progress.Status)
	}

	issued := requestJSON(t, router, http.MethodPost, "/api/learning/courses/"+course.ID.String()+"/certificates", auth.Token, nil)
	if issued.Code != http.StatusCreated {
		t.Fatalf("certificate status=%d body=%s", issued.Code, issued.Body.String())
	}
	certificate := decodeResponse[model.Certificate](t, issued)
	if certificate.Issuer != settings.CertificateIssuer {
		t.Fatalf("certificate issuer=%q, want %q", certificate.Issuer, settings.CertificateIssuer)
	}
	issuedAgain := requestJSON(t, router, http.MethodPost, "/api/learning/courses/"+course.ID.String()+"/certificates", auth.Token, nil)
	duplicate := decodeResponse[model.Certificate](t, issuedAgain)
	if duplicate.ID != certificate.ID {
		t.Fatalf("certificate is not idempotent: %s != %s", duplicate.ID, certificate.ID)
	}

	otherLogin := requestJSON(t, router, http.MethodPost, "/api/auth/login", "", map[string]string{"email": otherTeacher.Email, "password": "password123"})
	otherAuth := decodeResponse[dto.AuthResponse](t, otherLogin)
	forbidden := requestJSON(t, router, http.MethodPut, "/api/manage/courses/"+course.ID.String(), otherAuth.Token, map[string]any{"title": "Hijacked", "status": "published"})
	if forbidden.Code != http.StatusForbidden {
		t.Fatalf("ownership status=%d body=%s", forbidden.Code, forbidden.Body.String())
	}

	refresh := requestJSON(t, router, http.MethodPost, "/api/auth/refresh", "", map[string]string{"refresh_token": auth.RefreshToken})
	if refresh.Code != http.StatusOK {
		t.Fatalf("refresh status=%d body=%s", refresh.Code, refresh.Body.String())
	}
	rotated := decodeResponse[dto.AuthResponse](t, refresh)
	oldRefresh := requestJSON(t, router, http.MethodPost, "/api/auth/refresh", "", map[string]string{"refresh_token": auth.RefreshToken})
	if oldRefresh.Code != http.StatusUnauthorized {
		t.Fatalf("old refresh token status=%d, want 401", oldRefresh.Code)
	}
	logout := requestJSON(t, router, http.MethodPost, "/api/auth/logout", "", map[string]string{"refresh_token": rotated.RefreshToken})
	if logout.Code != http.StatusNoContent {
		t.Fatalf("logout status=%d body=%s", logout.Code, logout.Body.String())
	}
	loggedOutRefresh := requestJSON(t, router, http.MethodPost, "/api/auth/refresh", "", map[string]string{"refresh_token": rotated.RefreshToken})
	if loggedOutRefresh.Code != http.StatusUnauthorized {
		t.Fatalf("revoked refresh token status=%d, want 401", loggedOutRefresh.Code)
	}

	var storedTokens int64
	if err := tx.Model(&model.RefreshToken{}).Where("expires_at > ?", time.Now()).Count(&storedTokens).Error; err != nil {
		t.Fatal(err)
	}
	if storedTokens != 1 { // the second teacher login remains active
		t.Fatalf("stored active refresh tokens=%d, want 1", storedTokens)
	}
}
