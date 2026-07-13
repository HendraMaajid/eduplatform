package handler

import (
	"net/http"
	"testing"

	"github.com/gin-gonic/gin"
)

func TestUpdateAdminPlatformSettingsRequiresLocalizedDescriptions(t *testing.T) {
	gin.SetMode(gin.TestMode)
	valid := map[string]any{
		"name":                  "EduCourse",
		"descriptionId":         "Belajar teknologi gratis.",
		"descriptionEn":         "Learn technology for free.",
		"supportEmail":          "support@example.com",
		"logoUrl":               "",
		"defaultLocale":         "id",
		"certificateIssuer":     "EduCourse",
		"notifyNewRegistration": true,
		"notifyNewSubmission":   true,
		"notifyGradePublished":  true,
	}

	tests := []struct {
		name  string
		field string
		value any
	}{
		{name: "missing Indonesian description", field: "descriptionId", value: ""},
		{name: "missing English description", field: "descriptionEn", value: ""},
		{name: "invalid support email", field: "supportEmail", value: "not-an-email"},
		{name: "unsupported default locale", field: "defaultLocale", value: "fr"},
	}

	for _, test := range tests {
		test := test
		t.Run(test.name, func(t *testing.T) {
			body := make(map[string]any, len(valid))
			for key, value := range valid {
				body[key] = value
			}
			body[test.field] = test.value

			router := gin.New()
			router.PUT("/api/admin/settings", UpdateAdminPlatformSettings)
			response := requestJSON(t, router, http.MethodPut, "/api/admin/settings", "", body)
			if response.Code != http.StatusBadRequest {
				t.Fatalf("status=%d body=%s, want 400", response.Code, response.Body.String())
			}
		})
	}
}
