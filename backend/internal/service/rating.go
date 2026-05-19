package service

import (
	"errors"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/pkg/database"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

func CreateOrUpdateRating(courseID string, studentID string, req dto.CreateRatingRequest) (*model.Rating, error) {
	parsedCourseID, err := uuid.Parse(courseID)
	if err != nil {
		return nil, errors.New("invalid course ID")
	}
	parsedStudentID, err := uuid.Parse(studentID)
	if err != nil {
		return nil, errors.New("invalid student ID")
	}

	// Check enrollment
	var enrollment model.Enrollment
	if err := database.DB.Where("course_id = ? AND student_id = ?", parsedCourseID, parsedStudentID).First(&enrollment).Error; err != nil {
		return nil, errors.New("you must be enrolled in this course to rate it")
	}

	// Upsert rating
	var rating model.Rating
	err = database.DB.Where("course_id = ? AND student_id = ?", parsedCourseID, parsedStudentID).First(&rating).Error

	if err == gorm.ErrRecordNotFound {
		rating = model.Rating{
			CourseID:  parsedCourseID,
			StudentID: parsedStudentID,
			Score:     req.Score,
			Review:    req.Review,
		}
		if err := database.DB.Create(&rating).Error; err != nil {
			return nil, err
		}
	} else if err == nil {
		rating.Score = req.Score
		rating.Review = req.Review
		if err := database.DB.Save(&rating).Error; err != nil {
			return nil, err
		}
	} else {
		return nil, err
	}

	// Update course average rating
	updateCourseRating(parsedCourseID)

	AppCache.InvalidatePrefix("courses:")
	return &rating, nil
}

func GetCourseRatings(courseID string) ([]model.Rating, error) {
	var ratings []model.Rating
	err := database.DB.Preload("Student").Where("course_id = ?", courseID).Order("created_at DESC").Find(&ratings).Error
	return ratings, err
}

func GetMyRating(courseID string, studentID string) (*model.Rating, error) {
	var rating model.Rating
	err := database.DB.Where("course_id = ? AND student_id = ?", courseID, studentID).First(&rating).Error
	if err != nil {
		return nil, err
	}
	return &rating, nil
}

func updateCourseRating(courseID uuid.UUID) {
	var result struct {
		Avg   float64
		Count int64
	}
	database.DB.Model(&model.Rating{}).
		Select("COALESCE(AVG(score), 0) as avg, COUNT(*) as count").
		Where("course_id = ?", courseID).
		Scan(&result)

	database.DB.Model(&model.Course{}).Where("id = ?", courseID).
		Updates(map[string]interface{}{
			"rating":        result.Avg,
			"total_reviews": result.Count,
		})
}
