package service

import (
	"fmt"
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
	// Check cache
	if cached, ok := AppCache.Get("dashboard:admin"); ok {
		stats := cached.(AdminDashboardStats)
		return &stats, nil
	}

	var stats AdminDashboardStats

	// Single query to get all counts (1 round-trip instead of 4)
	database.DB.Raw(`
		SELECT 
			(SELECT count(*) FROM users WHERE role = 'student' AND deleted_at IS NULL) as total_students,
			(SELECT count(*) FROM users WHERE role = 'teacher' AND deleted_at IS NULL) as total_teachers,
			(SELECT count(*) FROM courses WHERE deleted_at IS NULL) as total_courses,
			(SELECT COALESCE(sum(amount), 0) FROM payments) as total_revenue
	`).Scan(&stats)

	AppCache.Set("dashboard:admin", stats)
	return &stats, nil
}

func GetTeacherStats(teacherID string) (*TeacherDashboardStats, error) {
	// Check cache
	cacheKey := fmt.Sprintf("dashboard:teacher:%s", teacherID)
	if cached, ok := AppCache.Get(cacheKey); ok {
		stats := cached.(TeacherDashboardStats)
		return &stats, nil
	}

	var stats TeacherDashboardStats

	// Single query for all teacher stats (1 round-trip instead of 3)
	database.DB.Raw(`
		SELECT 
			(SELECT count(*) FROM courses WHERE teacher_id = ? AND deleted_at IS NULL) as total_courses,
			(SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE c.teacher_id = ? AND e.deleted_at IS NULL AND c.deleted_at IS NULL) as total_students,
			(SELECT count(*) FROM submissions s JOIN assignments a ON a.id = s.assignment_id JOIN courses c ON c.id = a.course_id WHERE c.teacher_id = ? AND s.status = 'submitted' AND s.deleted_at IS NULL AND a.deleted_at IS NULL AND c.deleted_at IS NULL) as pending_submissions
	`, teacherID, teacherID, teacherID).Scan(&stats)

	AppCache.Set(cacheKey, stats)
	return &stats, nil
}

func GetStudentStats(studentID string) (*StudentDashboardStats, error) {
	var stats StudentDashboardStats

	// Single query for all student counts (1 round-trip instead of 3)
	database.DB.Raw(`
		SELECT 
			(SELECT count(*) FROM enrollments WHERE student_id = ? AND deleted_at IS NULL) as enrolled_courses,
			(SELECT count(*) FROM enrollments WHERE student_id = ? AND status = 'completed' AND deleted_at IS NULL) as completed_courses,
			(SELECT count(*) FROM certificates WHERE student_id = ?) as certificates
	`, studentID, studentID, studentID).Scan(&stats)

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
