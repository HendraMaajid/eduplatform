package dto

// GradeSubmissionRequest contains the teacher's score and feedback.
type GradeSubmissionRequest struct {
	Score    int    `json:"score" binding:"min=0,max=100"`
	Feedback string `json:"feedback"`
}

// CompleteModuleRequest optionally records the currently viewed module.
type CompleteModuleRequest struct {
	ModuleID string `json:"moduleId" binding:"omitempty,uuid"`
}

// UpdateProfileRequest contains fields a user may edit without email
// verification or role-management privileges.
type UpdateProfileRequest struct {
	Name   string `json:"name" binding:"omitempty,min=2,max=255"`
	Bio    string `json:"bio" binding:"omitempty,max=2000"`
	Phone  string `json:"phone" binding:"omitempty,max=20"`
	Avatar string `json:"avatar" binding:"omitempty,max=500"`
}

// ChangePasswordRequest changes an existing password or creates one for a
// Google-only account. CurrentPassword is required when a password exists.
type ChangePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword" binding:"required,min=8,max=72"`
}

// UpdatePreferencesRequest stores cross-device UI preferences.
type UpdatePreferencesRequest struct {
	Locale              string `json:"locale" binding:"required,oneof=id en"`
	Theme               string `json:"theme" binding:"required,oneof=light dark system"`
	NotifyCourseUpdates bool   `json:"notifyCourseUpdates"`
	NotifyAssignments   bool   `json:"notifyAssignments"`
	NotifyGrades        bool   `json:"notifyGrades"`
}

// UpdatePlatformSettingsRequest is editable by admins and super admins.
type UpdatePlatformSettingsRequest struct {
	Name                  string `json:"name" binding:"required,min=2,max=80"`
	DescriptionID         string `json:"descriptionId" binding:"required,max=2000"`
	DescriptionEN         string `json:"descriptionEn" binding:"required,max=2000"`
	SupportEmail          string `json:"supportEmail" binding:"required,email,max=255"`
	LogoURL               string `json:"logoUrl" binding:"omitempty,max=500"`
	DefaultLocale         string `json:"defaultLocale" binding:"required,oneof=id en"`
	CertificateIssuer     string `json:"certificateIssuer" binding:"required,min=2,max=120"`
	NotifyNewRegistration bool   `json:"notifyNewRegistration"`
	NotifyNewSubmission   bool   `json:"notifyNewSubmission"`
	NotifyGradePublished  bool   `json:"notifyGradePublished"`
}
