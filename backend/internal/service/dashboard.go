package service

import (
	"sort"
	"time"

	"backend/internal/model"
	"backend/pkg/database"
)

type AdminDashboardStats struct {
	TotalStudents int64 `json:"totalStudents"`
	TotalTeachers int64 `json:"totalTeachers"`
	TotalCourses  int64 `json:"totalCourses"`
	TotalRevenue  int64 `json:"totalRevenue"`
}

type TeacherDashboardStats struct {
	TotalCourses       int64 `json:"totalCourses"`
	TotalStudents      int64 `json:"totalStudents"`
	PendingSubmissions int64 `json:"pendingSubmissions"`
}

type Activity struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Type      string    `json:"type"` // "quiz", "assignment", "course"
	CreatedAt time.Time `json:"createdAt"`
}

type StudentDashboardStats struct {
	EnrolledCourses   int64              `json:"enrolledCourses"`
	CompletedCourses  int64              `json:"completedCourses"`
	Certificates      int64              `json:"certificates"`
	UpcomingDeadlines []model.Assignment `json:"upcomingDeadlines"`
	RecentActivities  []Activity         `json:"recentActivities"`
}

func GetAdminStats() (*AdminDashboardStats, error) {
	var stats AdminDashboardStats

	database.DB.Model(&model.User{}).Where("role = ?", "student").Count(&stats.TotalStudents)
	database.DB.Model(&model.User{}).Where("role = ?", "teacher").Count(&stats.TotalTeachers)
	database.DB.Model(&model.Course{}).Count(&stats.TotalCourses)

	// Calculate total revenue from all payments
	var totalRevenue struct {
		Total int64
	}
	database.DB.Model(&model.Payment{}).Select("sum(amount) as total").Scan(&totalRevenue)
	stats.TotalRevenue = totalRevenue.Total

	return &stats, nil
}

func GetTeacherStats(teacherID string) (*TeacherDashboardStats, error) {
	var stats TeacherDashboardStats

	database.DB.Model(&model.Course{}).Where("teacher_id = ?", teacherID).Count(&stats.TotalCourses)

	// Calculate total students enrolled in this teacher's courses
	var enrolledStudents int64
	database.DB.Model(&model.Enrollment{}).
		Joins("JOIN courses ON courses.id = enrollments.course_id").
		Where("courses.teacher_id = ?", teacherID).
		Count(&enrolledStudents)
	stats.TotalStudents = enrolledStudents

	// Pending submissions
	var pendingSubmissions int64
	database.DB.Model(&model.Submission{}).
		Joins("JOIN assignments ON assignments.id = submissions.assignment_id").
		Joins("JOIN courses ON courses.id = assignments.course_id").
		Where("courses.teacher_id = ? AND submissions.status = ?", teacherID, "submitted").
		Count(&pendingSubmissions)
	stats.PendingSubmissions = pendingSubmissions

	return &stats, nil
}

func GetStudentStats(studentID string) (*StudentDashboardStats, error) {
	var stats StudentDashboardStats

	database.DB.Model(&model.Enrollment{}).Where("student_id = ?", studentID).Count(&stats.EnrolledCourses)
	database.DB.Model(&model.Enrollment{}).Where("student_id = ? AND status = ?", studentID, "completed").Count(&stats.CompletedCourses)
	database.DB.Model(&model.Certificate{}).Where("student_id = ?", studentID).Count(&stats.Certificates)

	var deadlines []model.Assignment
	database.DB.
		Joins("JOIN enrollments ON enrollments.course_id = assignments.course_id").
		Where("enrollments.student_id = ? AND assignments.deadline > ?", studentID, time.Now()).
		Order("assignments.deadline ASC").
		Limit(3).
		Find(&deadlines)
	stats.UpcomingDeadlines = deadlines

	var recentSubmissions []model.Submission
	database.DB.Preload("Assignment").Where("student_id = ?", studentID).Order("submitted_at DESC").Limit(5).Find(&recentSubmissions)

	var recentQuizzes []model.QuizAttempt
	database.DB.Preload("Quiz").Where("student_id = ?", studentID).Order("completed_at DESC").Limit(5).Find(&recentQuizzes)

	var activities []Activity
	for _, s := range recentSubmissions {
		title := "Tugas Tanpa Judul"
		if s.Assignment != nil {
			title = s.Assignment.Title
		}
		activities = append(activities, Activity{
			ID:        s.ID.String(),
			Title:     "Mengumpulkan tugas \"" + title + "\"",
			Type:      "assignment",
			CreatedAt: s.SubmittedAt,
		})
	}
	for _, q := range recentQuizzes {
		title := "Kuis Tanpa Judul"
		if q.Quiz != nil {
			title = q.Quiz.Title
		}
		activities = append(activities, Activity{
			ID:        q.ID.String(),
			Title:     "Menyelesaikan kuis \"" + title + "\"",
			Type:      "quiz",
			CreatedAt: q.CompletedAt,
		})
	}

	// Sort activities by CreatedAt desc
	sort.Slice(activities, func(i, j int) bool {
		return activities[i].CreatedAt.After(activities[j].CreatedAt)
	})

	if len(activities) > 5 {
		activities = activities[:5]
	}
	stats.RecentActivities = activities

	return &stats, nil
}
