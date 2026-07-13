package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/cache"
	"backend/pkg/database"

	"github.com/google/uuid"
	"github.com/lib/pq"
	"gorm.io/gorm"
)

// AppCache is a shared in-memory cache for read-heavy endpoints.
// TTL of 10 seconds — data is fresh enough for dashboard use but
// eliminates redundant DB calls from rapid page loads / React StrictMode.
var AppCache = cache.New(10 * time.Second)

var (
	courseDurationPattern = regexp.MustCompile(`^[1-9][0-9]{0,2} Minggu$`)
	moduleDurationPattern = regexp.MustCompile(`^[1-9][0-9]{0,2} Jam$`)
)

func validateCourseDuration(value string) error {
	if !courseDurationPattern.MatchString(value) {
		return errors.New("course duration must be a positive number followed by Minggu")
	}
	return nil
}

func validateModuleDuration(value string) error {
	if !moduleDurationPattern.MatchString(value) {
		return errors.New("module duration must be a positive number followed by Jam")
	}
	return nil
}

type CourseCategory struct {
	Name  string `json:"name"`
	Count int64  `json:"count"`
}

func uniqueCourseSlug(title string) string {
	base := strings.ToLower(strings.Join(strings.Fields(strings.TrimSpace(title)), "-"))
	if base == "" {
		base = "course"
	}
	return fmt.Sprintf("%s-%s", base, uuid.NewString()[:8])
}

func GetCourseCategories() ([]CourseCategory, error) {
	var categories []CourseCategory
	err := database.DB.Model(&model.Course{}).
		Select("COALESCE(NULLIF(category, ''), 'General') AS name, count(*) AS count").
		Where("status = ?", "published").Group("COALESCE(NULLIF(category, ''), 'General')").
		Order("count DESC, name ASC").Scan(&categories).Error
	return categories, err
}

func GetAllCourses(teacherID string, page int, limit int, search string, category string, level string, status string, publishedCountsOnly bool) (*dto.PaginatedResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit

	// Cache key includes all filter parameters
	cacheKey := fmt.Sprintf("courses:all:%s:p%d:l%d:s%s:c%s:lvl%s:st%s:pc%t", teacherID, page, limit, search, category, level, status, publishedCountsOnly)
	if cached, ok := AppCache.Get(cacheKey); ok {
		return cached.(*dto.PaginatedResponse), nil
	}

	var courses []model.Course
	var total int64

	// Base query
	query := database.DB.Model(&model.Course{})

	if teacherID != "" {
		query = query.Where("teacher_id = ?", teacherID)
	}
	if search != "" {
		query = query.Where("title ILIKE ?", "%"+search+"%")
	}
	if category != "" && category != "all" && category != "General" {
		query = query.Where("category = ?", category)
	} else if category == "General" {
		query = query.Where("category IS NULL OR category = '' OR category = 'General'")
	}
	if level != "" && level != "all" {
		query = query.Where("level = ?", level)
	}
	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	// Count total records for pagination
	if err := query.Count(&total).Error; err != nil {
		return nil, err
	}

	// Query data with subqueries for counts (2 round-trips instead of 5)
	countsProjection := `courses.*,
		(SELECT count(*) FROM modules WHERE modules.course_id = courses.id AND modules.deleted_at IS NULL) as total_modules,
		(SELECT count(*) FROM quizzes WHERE quizzes.course_id = courses.id AND quizzes.deleted_at IS NULL) as total_quizzes,
		(SELECT count(*) FROM assignments WHERE assignments.course_id = courses.id AND assignments.deleted_at IS NULL) as total_assignments,
		(SELECT count(*) FROM learning_progresses WHERE learning_progresses.course_id = courses.id) as enrolled_students`
	if publishedCountsOnly {
		countsProjection = `courses.*,
			(SELECT count(*) FROM modules WHERE modules.course_id = courses.id AND modules.is_published = true AND modules.deleted_at IS NULL) as total_modules,
			(SELECT count(*) FROM quizzes WHERE quizzes.course_id = courses.id AND quizzes.is_published = true AND quizzes.deleted_at IS NULL) as total_quizzes,
			(SELECT count(*) FROM assignments WHERE assignments.course_id = courses.id AND assignments.is_published = true AND assignments.deleted_at IS NULL) as total_assignments,
			(SELECT count(*) FROM learning_progresses WHERE learning_progresses.course_id = courses.id) as enrolled_students`
	}
	dataQuery := database.DB.Select(countsProjection).Preload("Teacher")

	// Apply same filters to dataQuery
	if teacherID != "" {
		dataQuery = dataQuery.Where("courses.teacher_id = ?", teacherID)
	}
	if search != "" {
		dataQuery = dataQuery.Where("courses.title ILIKE ?", "%"+search+"%")
	}
	if category != "" && category != "all" && category != "General" {
		dataQuery = dataQuery.Where("courses.category = ?", category)
	} else if category == "General" {
		dataQuery = dataQuery.Where("courses.category IS NULL OR courses.category = '' OR courses.category = 'General'")
	}
	if level != "" && level != "all" {
		dataQuery = dataQuery.Where("courses.level = ?", level)
	}
	if status != "" && status != "all" {
		dataQuery = dataQuery.Where("courses.status = ?", status)
	}

	err := dataQuery.Offset(offset).Limit(limit).Order("courses.created_at DESC").Find(&courses).Error
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))

	response := &dto.PaginatedResponse{
		Data: courses,
		Meta: dto.PaginationMeta{
			Total:      total,
			Page:       page,
			Limit:      limit,
			TotalPages: totalPages,
		},
	}

	AppCache.Set(cacheKey, response)
	return response, nil
}

func GetCourseByID(id string) (*model.Course, error) {
	// Check cache
	cacheKey := fmt.Sprintf("courses:id:%s", id)
	if cached, ok := AppCache.Get(cacheKey); ok {
		course := cached.(model.Course)
		return &course, nil
	}

	var course model.Course
	err := database.DB.Select(`courses.*,
		(SELECT count(*) FROM modules WHERE modules.course_id = courses.id AND modules.is_published = true AND modules.deleted_at IS NULL) as total_modules,
		(SELECT count(*) FROM quizzes WHERE quizzes.course_id = courses.id AND quizzes.is_published = true AND quizzes.deleted_at IS NULL) as total_quizzes,
		(SELECT count(*) FROM assignments WHERE assignments.course_id = courses.id AND assignments.is_published = true AND assignments.deleted_at IS NULL) as total_assignments,
		(SELECT count(*) FROM learning_progresses WHERE learning_progresses.course_id = courses.id) as enrolled_students`).
		Preload("Teacher").Where("courses.id = ? AND courses.status = ?", id, "published").First(&course).Error
	if err != nil {
		return nil, err
	}

	AppCache.Set(cacheKey, course)
	return &course, nil
}

// GetManagedCourseByID returns draft or published course metadata after the
// handler has authorized the requesting teacher or admin.
func GetManagedCourseByID(id string) (*model.Course, error) {
	var course model.Course
	err := database.DB.Preload("Teacher").Where("id = ?", id).First(&course).Error
	return &course, err
}

func CreateCourse(req dto.CreateCourseRequest, contextTeacherID, role string) (*model.Course, error) {
	if err := validateCourseDuration(req.Duration); err != nil {
		return nil, err
	}
	if !isSafeResourceURL(req.Thumbnail) {
		return nil, errors.New("thumbnail must be an http(s) URL or an /uploads path")
	}
	teacherIDStr := contextTeacherID
	if req.TeacherID != "" && (role == "admin" || role == "super_admin") {
		teacherIDStr = req.TeacherID
	}

	parsedTeacherID, err := uuid.Parse(teacherIDStr)
	if err != nil {
		return nil, err
	}

	slug := uniqueCourseSlug(req.Title)

	course := model.Course{
		Title:            req.Title,
		Slug:             slug,
		Description:      req.Description,
		ShortDescription: req.ShortDescription,
		Category:         req.Category,
		Level:            req.Level,
		Thumbnail:        req.Thumbnail,
		Duration:         req.Duration,
		TeacherID:        parsedTeacherID,
		Status: func() string {
			if req.Status != "" {
				return req.Status
			}
			return "draft"
		}(),
	}

	if err := database.DB.Create(&course).Error; err != nil {
		return nil, err
	}

	// Invalidate courses cache
	AppCache.InvalidatePrefix("courses:")
	AppCache.InvalidatePrefix("dashboard:")
	return &course, nil
}

func UpdateCourse(id string, req dto.UpdateCourseRequest, requestingUserID string, requestingRole string) (*model.Course, error) {
	if req.Thumbnail != nil && !isSafeResourceURL(*req.Thumbnail) {
		return nil, errors.New("thumbnail must be an http(s) URL or an /uploads path")
	}
	var course model.Course
	if err := database.DB.First(&course, "id = ?", id).Error; err != nil {
		return nil, err
	}

	// Ownership check — only owner or admin can edit
	if requestingRole != "super_admin" && requestingRole != "admin" {
		if course.TeacherID.String() != requestingUserID {
			return nil, errors.New("forbidden: you don't own this course")
		}
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
		updates["slug"] = uniqueCourseSlug(*req.Title)
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.ShortDescription != nil {
		updates["short_description"] = *req.ShortDescription
	}
	if req.Category != nil {
		updates["category"] = *req.Category
	}
	if req.Level != nil {
		updates["level"] = *req.Level
	}
	if req.Thumbnail != nil {
		updates["thumbnail"] = *req.Thumbnail
	}
	if req.Duration != nil {
		if err := validateCourseDuration(*req.Duration); err != nil {
			return nil, err
		}
		updates["duration"] = *req.Duration
	}
	if req.TeacherID != nil && (requestingRole == "admin" || requestingRole == "super_admin") {
		if parsed, err := uuid.Parse(*req.TeacherID); err == nil {
			updates["teacher_id"] = parsed
		}
	}
	if req.Status != nil {
		updates["status"] = *req.Status
	}

	if err := database.DB.Model(&course).Updates(updates).Error; err != nil {
		return nil, err
	}
	if err := database.DB.Preload("Teacher").First(&course, "id = ?", id).Error; err != nil {
		return nil, err
	}

	// Invalidate courses cache
	AppCache.InvalidatePrefix("courses:")
	AppCache.InvalidatePrefix("dashboard:")
	return &course, nil
}

// AuthorizeCourseManagement allows admins or the owning teacher to mutate a course.
func AuthorizeCourseManagement(ctx context.Context, courseID, userID, role string) error {
	if role == "admin" || role == "super_admin" {
		return nil
	}
	if role != "teacher" {
		return errors.New("forbidden: insufficient role")
	}
	var count int64
	if err := database.DB.WithContext(ctx).Model(&model.Course{}).Where("id = ? AND teacher_id = ?", courseID, userID).Count(&count).Error; err != nil {
		return fmt.Errorf("authorize course: %w", err)
	}
	if count == 0 {
		return errors.New("forbidden: you don't own this course")
	}
	return nil
}

// AuthorizeModuleManagement resolves a module's course and verifies ownership.
func AuthorizeModuleManagement(ctx context.Context, moduleID, userID, role string) error {
	var module model.Module
	if err := database.DB.WithContext(ctx).Select("course_id").First(&module, "id = ?", moduleID).Error; err != nil {
		return fmt.Errorf("find module: %w", err)
	}
	return AuthorizeCourseManagement(ctx, module.CourseID.String(), userID, role)
}

func AuthorizeAttachmentManagement(ctx context.Context, attachmentID, userID, role string) error {
	var attachment model.Attachment
	if err := database.DB.WithContext(ctx).Select("module_id").First(&attachment, "id = ?", attachmentID).Error; err != nil {
		return fmt.Errorf("find attachment: %w", err)
	}
	return AuthorizeModuleManagement(ctx, attachment.ModuleID.String(), userID, role)
}

func DeleteCourse(id string, requestingUserID string, requestingRole string) error {
	var course model.Course
	if err := database.DB.First(&course, "id = ?", id).Error; err != nil {
		return err
	}

	// Ownership check — only owner or admin can delete
	if requestingRole != "super_admin" && requestingRole != "admin" {
		if course.TeacherID.String() != requestingUserID {
			return errors.New("forbidden: you don't own this course")
		}
	}

	err := database.DB.Delete(&course).Error
	if err == nil {
		AppCache.InvalidatePrefix("courses:")
		AppCache.InvalidatePrefix("dashboard:")
	}
	return err
}

// Modules Service Methods
func GetModulesByCourse(courseID string) ([]model.Module, error) {
	var modules []model.Module
	err := database.DB.Preload("Attachments").
		Joins("JOIN courses ON courses.id = modules.course_id").
		Where("modules.course_id = ? AND modules.is_published = true AND courses.status = 'published' AND courses.deleted_at IS NULL", courseID).
		Order("modules.\"order\" asc").Find(&modules).Error
	return modules, err
}

func GetManagedModulesByCourse(courseID string) ([]model.Module, error) {
	var modules []model.Module
	err := database.DB.Preload("Attachments").Where("course_id = ?", courseID).Order("\"order\" asc").Find(&modules).Error
	return modules, err
}

func CreateModule(courseID string, req dto.CreateModuleRequest) (*model.Module, error) {
	if err := validateModuleDuration(req.Duration); err != nil {
		return nil, err
	}
	parsedCourseID, err := uuid.Parse(courseID)
	if err != nil {
		return nil, err
	}

	module := model.Module{
		CourseID:    parsedCourseID,
		Title:       req.Title,
		Description: req.Description,
		Content:     req.Content,
		Duration:    req.Duration,
		Order:       req.Order,
		IsPublished: req.IsPublished,
	}

	if err := database.DB.Create(&module).Error; err != nil {
		return nil, err
	}

	AppCache.InvalidatePrefix("courses:")
	return &module, nil
}

func UpdateModule(id string, req dto.UpdateModuleRequest) (*model.Module, error) {
	var module model.Module
	if err := database.DB.First(&module, "id = ?", id).Error; err != nil {
		return nil, err
	}

	updates := map[string]interface{}{}
	if req.Title != nil {
		updates["title"] = *req.Title
	}
	if req.Description != nil {
		updates["description"] = *req.Description
	}
	if req.Content != nil {
		updates["content"] = *req.Content
	}
	if req.Duration != nil {
		if err := validateModuleDuration(*req.Duration); err != nil {
			return nil, err
		}
		updates["duration"] = *req.Duration
	}
	if req.Order != nil {
		updates["order"] = *req.Order
	}
	if req.IsPublished != nil {
		updates["is_published"] = *req.IsPublished
	}

	if err := database.DB.Model(&module).Updates(updates).Error; err != nil {
		return nil, err
	}
	if err := database.DB.Preload("Attachments").First(&module, "id = ?", id).Error; err != nil {
		return nil, err
	}

	AppCache.InvalidatePrefix("courses:")
	return &module, nil
}

func DeleteModule(id string) error {
	var module model.Module
	if err := database.DB.First(&module, "id = ?", id).Error; err != nil {
		return err
	}

	err := database.DB.Delete(&module).Error
	if err == nil {
		AppCache.InvalidatePrefix("courses:")
	}
	return err
}

func ReorderModules(ctx context.Context, courseID string, moduleIDs []string) error {
	return database.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		result := tx.Exec(`
			UPDATE modules AS module
			SET "order" = ordered.position
			FROM unnest(?::uuid[]) WITH ORDINALITY AS ordered(id, position)
			WHERE module.id = ordered.id AND module.course_id = ? AND module.deleted_at IS NULL
		`, pq.Array(moduleIDs), courseID)
		if result.Error != nil {
			return fmt.Errorf("reorder modules: %w", result.Error)
		}
		if result.RowsAffected != int64(len(moduleIDs)) {
			return errors.New("one or more modules do not belong to this course")
		}
		return nil
	})
}

func CreateAttachment(ctx context.Context, moduleID string, req dto.CreateAttachmentRequest) (*model.Attachment, error) {
	if !isSafeResourceURL(req.URL) {
		return nil, errors.New("attachment must be an http(s) URL or an /uploads path")
	}
	parsedModuleID, err := uuid.Parse(moduleID)
	if err != nil {
		return nil, err
	}
	attachment := model.Attachment{ModuleID: parsedModuleID, Name: strings.TrimSpace(req.Name), URL: req.URL, Size: req.Size, Type: req.Type}
	if err := database.DB.WithContext(ctx).Create(&attachment).Error; err != nil {
		return nil, fmt.Errorf("create attachment: %w", err)
	}
	return &attachment, nil
}

func DeleteAttachment(ctx context.Context, id string) error {
	return database.DB.WithContext(ctx).Delete(&model.Attachment{}, "id = ?", id).Error
}
