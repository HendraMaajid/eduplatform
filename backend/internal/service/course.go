package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/cache"
	"backend/pkg/database"

	"github.com/google/uuid"
)

// AppCache is a shared in-memory cache for read-heavy endpoints.
// TTL of 10 seconds — data is fresh enough for dashboard use but
// eliminates redundant DB calls from rapid page loads / React StrictMode.
var AppCache = cache.New(10 * time.Second)

func GetAllCourses(teacherID string, page int, limit int, search string, category string, level string, status string) (*dto.PaginatedResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	// Cache key includes all filter parameters
	cacheKey := fmt.Sprintf("courses:all:%s:p%d:l%d:s%s:c%s:lvl%s:st%s", teacherID, page, limit, search, category, level, status)
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
	dataQuery := database.DB.
		Select(`courses.*,
			(SELECT count(*) FROM modules WHERE modules.course_id = courses.id AND modules.deleted_at IS NULL) as total_modules,
			(SELECT count(*) FROM quizzes WHERE quizzes.course_id = courses.id AND quizzes.deleted_at IS NULL) as total_quizzes,
			(SELECT count(*) FROM assignments WHERE assignments.course_id = courses.id AND assignments.deleted_at IS NULL) as total_assignments,
			(SELECT count(*) FROM enrollments WHERE enrollments.course_id = courses.id AND enrollments.deleted_at IS NULL) as enrolled_students`).
		Preload("Teacher")

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
	err := database.DB.Preload("Teacher").Where("id = ?", id).First(&course).Error
	if err != nil {
		return nil, err
	}

	// Count related items for computed fields
	var modulesCount int64
	database.DB.Model(&model.Module{}).Where("course_id = ?", course.ID).Count(&modulesCount)
	course.TotalModules = int(modulesCount)

	AppCache.Set(cacheKey, course)
	return &course, nil
}

func CreateCourse(req dto.CreateCourseRequest, contextTeacherID string) (*model.Course, error) {
	teacherIDStr := contextTeacherID
	if req.TeacherID != "" {
		teacherIDStr = req.TeacherID
	}

	parsedTeacherID, err := uuid.Parse(teacherIDStr)
	if err != nil {
		return nil, err
	}

	slug := strings.ToLower(strings.ReplaceAll(req.Title, " ", "-"))

	course := model.Course{
		Title:            req.Title,
		Slug:             slug,
		Description:      req.Description,
		ShortDescription: req.ShortDescription,
		Price:            req.Price,
		Category:         req.Category,
		Level:            req.Level,
		Thumbnail:        req.Thumbnail,
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
	return &course, nil
}

func UpdateCourse(id string, req dto.CreateCourseRequest, requestingUserID string, requestingRole string) (*model.Course, error) {
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
	if req.Title != "" {
		updates["title"] = req.Title
		updates["slug"] = strings.ToLower(strings.ReplaceAll(req.Title, " ", "-"))
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.ShortDescription != "" {
		updates["short_description"] = req.ShortDescription
	}
	if req.Price != 0 {
		updates["price"] = req.Price
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}
	if req.Level != "" {
		updates["level"] = req.Level
	}
	if req.Thumbnail != "" {
		updates["thumbnail"] = req.Thumbnail
	}
	if req.TeacherID != "" {
		if parsed, err := uuid.Parse(req.TeacherID); err == nil {
			updates["teacher_id"] = parsed
		}
	}
	if req.Status != "" {
		updates["status"] = req.Status
	}

	if err := database.DB.Model(&course).Updates(updates).Error; err != nil {
		return nil, err
	}

	// Invalidate courses cache
	AppCache.InvalidatePrefix("courses:")
	return &course, nil
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
	}
	return err
}

// Modules Service Methods
func GetModulesByCourse(courseID string) ([]model.Module, error) {
	var modules []model.Module
	err := database.DB.Where("course_id = ?", courseID).Order("\"order\" asc").Find(&modules).Error
	return modules, err
}

func CreateModule(courseID string, req dto.CreateModuleRequest) (*model.Module, error) {
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
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Description != "" {
		updates["description"] = req.Description
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.Duration != "" {
		updates["duration"] = req.Duration
	}
	if req.Order != 0 {
		updates["order"] = req.Order
	}
	if req.IsPublished != nil {
		updates["is_published"] = *req.IsPublished
	}

	if err := database.DB.Model(&module).Updates(updates).Error; err != nil {
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
