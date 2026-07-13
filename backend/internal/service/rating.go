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

	// A student may rate a course after starting it.
	var progress model.LearningProgress
	if err := database.DB.Where("course_id = ? AND student_id = ?", parsedCourseID, parsedStudentID).First(&progress).Error; err != nil {
		return nil, errors.New("start this course before rating it")
	}

	// Upsert rating
	var rating model.Rating
	err = database.DB.Where("course_id = ? AND student_id = ?", parsedCourseID, parsedStudentID).First(&rating).Error

	switch err {
	case gorm.ErrRecordNotFound:
		rating = model.Rating{
			CourseID:  parsedCourseID,
			StudentID: parsedStudentID,
			Score:     req.Score,
			Review:    req.Review,
		}
		if err := database.DB.Create(&rating).Error; err != nil {
			return nil, err
		}
	case nil:
		rating.Score = req.Score
		rating.Review = req.Review
		if err := database.DB.Save(&rating).Error; err != nil {
			return nil, err
		}
	default:
		return nil, err
	}

	// Update course average rating
	if err := updateCourseRating(parsedCourseID); err != nil {
		return nil, err
	}

	AppCache.InvalidatePrefix("courses:")
	return &rating, nil
}

func GetCourseRatings(courseID string) ([]model.Rating, error) {
	var published int64
	if err := database.DB.Model(&model.Course{}).Where("id = ? AND status = 'published'", courseID).Count(&published).Error; err != nil {
		return nil, err
	}
	if published == 0 {
		return nil, errors.New("published course not found")
	}
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

func updateCourseRating(courseID uuid.UUID) error {
	var result struct {
		Avg   float64
		Count int64
	}
	if err := database.DB.Model(&model.Rating{}).
		Select("COALESCE(AVG(score), 0) as avg, COUNT(*) as count").
		Where("course_id = ?", courseID).
		Scan(&result).Error; err != nil {
		return err
	}

	if err := database.DB.Model(&model.Course{}).Where("id = ?", courseID).
		Updates(map[string]interface{}{
			"rating":        result.Avg,
			"total_reviews": result.Count,
		}).Error; err != nil {
		return err
	}
	return nil
}
