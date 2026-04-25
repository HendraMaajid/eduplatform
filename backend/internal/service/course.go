package service

import (
	"strings"

	"github.com/google/uuid"
	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"
)

func GetAllCourses(teacherID string) ([]model.Course, error) {
	var courses []model.Course
	query := database.DB.Preload("Teacher")
	if teacherID != "" {
		query = query.Where("teacher_id = ?", teacherID)
	}
	err := query.Find(&courses).Error
	if err != nil {
		return nil, err
	}

	for i := range courses {
		var modulesCount int64
		database.DB.Model(&model.Module{}).Where("course_id = ?", courses[i].ID).Count(&modulesCount)
		courses[i].TotalModules = int(modulesCount)

		var quizzesCount int64
		database.DB.Model(&model.Quiz{}).Where("course_id = ?", courses[i].ID).Count(&quizzesCount)
		courses[i].TotalQuizzes = int(quizzesCount)

		var studentsCount int64
		database.DB.Model(&model.Enrollment{}).Where("course_id = ?", courses[i].ID).Count(&studentsCount)
		courses[i].EnrolledStudents = int(studentsCount)
	}

	return courses, nil
}

func GetCourseByID(id string) (*model.Course, error) {
	var course model.Course
	err := database.DB.Preload("Teacher").Where("id = ?", id).First(&course).Error
	if err != nil {
		return nil, err
	}
	
	// Count related items for computed fields
	var modulesCount int64
	database.DB.Model(&model.Module{}).Where("course_id = ?", course.ID).Count(&modulesCount)
	course.TotalModules = int(modulesCount)

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
		Status:           func() string { if req.Status != "" { return req.Status }; return "draft" }(),
	}

	if err := database.DB.Create(&course).Error; err != nil {
		return nil, err
	}

	return &course, nil
}

func UpdateCourse(id string, req dto.CreateCourseRequest) (*model.Course, error) {
	var course model.Course
	if err := database.DB.First(&course, "id = ?", id).Error; err != nil {
		return nil, err
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

	return &course, nil
}

func DeleteCourse(id string) error {
	var course model.Course
	if err := database.DB.First(&course, "id = ?", id).Error; err != nil {
		return err
	}

	return database.DB.Delete(&course).Error
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
		IsPublished: false,
	}

	if err := database.DB.Create(&module).Error; err != nil {
		return nil, err
	}

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

	return &module, nil
}

func DeleteModule(id string) error {
	var module model.Module
	if err := database.DB.First(&module, "id = ?", id).Error; err != nil {
		return err
	}

	return database.DB.Delete(&module).Error
}
