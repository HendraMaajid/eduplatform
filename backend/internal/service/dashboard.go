package service

import (
	"context"
	"fmt"
	"sort"
	"time"

	"backend/internal/model"
	"backend/pkg/database"
)

type AdminDashboardStats struct {
	TotalStudents      int64                    `json:"totalStudents"`
	TotalTeachers      int64                    `json:"totalTeachers"`
	TotalCourses       int64                    `json:"totalCourses"`
	ActiveLearners     int64                    `json:"activeLearners"`
	CompletedLearnings int64                    `json:"completedLearnings"`
	CertificatesIssued int64                    `json:"certificatesIssued"`
	WeeklyActivity     []WeeklyLearningActivity `gorm:"-" json:"weeklyActivity"`
	ProgressBreakdown  []ProgressBreakdown      `gorm:"-" json:"progressBreakdown"`
}

// WeeklyLearningActivity contains real platform activity grouped by calendar week.
type WeeklyLearningActivity struct {
	Week             string `json:"week"`
	ActiveLearners   int64  `json:"activeLearners"`
	CompletedModules int64  `json:"completedModules"`
}

// ProgressBreakdown contains the number of learning records in each status.
type ProgressBreakdown struct {
	Status string `json:"status"`
	Total  int64  `json:"total"`
}

type TeacherDashboardStats struct {
	TotalCourses       int64   `json:"totalCourses"`
	TotalStudents      int64   `json:"totalStudents"`
	PendingSubmissions int64   `json:"pendingSubmissions"`
	AverageRating      float64 `json:"averageRating"`
}

type Activity struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Type      string    `json:"type"` // "quiz", "assignment", "course"
	CreatedAt time.Time `json:"createdAt"`
}

type StudentDashboardStats struct {
	StartedCourses    int64              `json:"startedCourses"`
	CompletedCourses  int64              `json:"completedCourses"`
	Certificates      int64              `json:"certificates"`
	UpcomingDeadlines []model.Assignment `gorm:"-" json:"upcomingDeadlines"`
	RecentActivities  []Activity         `gorm:"-" json:"recentActivities"`
}

func GetAdminStats(ctx context.Context) (*AdminDashboardStats, error) {
	// Check cache
	if cached, ok := AppCache.Get("dashboard:admin"); ok {
		stats := cached.(AdminDashboardStats)
		return &stats, nil
	}

	var stats AdminDashboardStats

	// Single query to get all platform learning counts.
	if err := database.DB.WithContext(ctx).Raw(`
		SELECT 
			(SELECT count(*) FROM users WHERE role = 'student' AND deleted_at IS NULL) as total_students,
			(SELECT count(*) FROM users WHERE role = 'teacher' AND deleted_at IS NULL) as total_teachers,
			(SELECT count(*) FROM courses WHERE deleted_at IS NULL) as total_courses,
			(SELECT count(DISTINCT student_id) FROM learning_progresses WHERE last_accessed_at >= now() - interval '30 days') as active_learners,
			(SELECT count(*) FROM learning_progresses WHERE status IN ('completed', 'certified')) as completed_learnings,
			(SELECT count(*) FROM certificates) as certificates_issued
	`).Scan(&stats).Error; err != nil {
		return nil, fmt.Errorf("load admin dashboard: %w", err)
	}

	if err := database.DB.WithContext(ctx).Raw(`
		WITH weeks AS (
			SELECT generate_series(
				date_trunc('week', now()) - interval '11 weeks',
				date_trunc('week', now()),
				interval '1 week'
			) AS week_start
		)
		SELECT
			to_char(weeks.week_start, 'DD Mon') AS week,
			count(DISTINCT learning.student_id) AS active_learners,
			COALESCE(sum(jsonb_array_length(learning.completed_modules)), 0) AS completed_modules
		FROM weeks
		LEFT JOIN learning_progresses AS learning
			ON learning.last_accessed_at >= weeks.week_start
			AND learning.last_accessed_at < weeks.week_start + interval '1 week'
		GROUP BY weeks.week_start
		ORDER BY weeks.week_start
	`).Scan(&stats.WeeklyActivity).Error; err != nil {
		return nil, fmt.Errorf("load weekly learning activity: %w", err)
	}

	if err := database.DB.WithContext(ctx).Raw(`
		SELECT status, count(*) AS total
		FROM learning_progresses
		GROUP BY status
		ORDER BY status
	`).Scan(&stats.ProgressBreakdown).Error; err != nil {
		return nil, fmt.Errorf("load learning progress breakdown: %w", err)
	}

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
	if err := database.DB.Raw(`
		SELECT 
			(SELECT count(*) FROM courses WHERE teacher_id = ? AND status = 'published' AND deleted_at IS NULL) as total_courses,
			(SELECT count(DISTINCT lp.student_id) FROM learning_progresses lp JOIN courses c ON c.id = lp.course_id WHERE c.teacher_id = ? AND c.deleted_at IS NULL) as total_students,
			(SELECT count(*) FROM submissions s JOIN assignments a ON a.id = s.assignment_id JOIN courses c ON c.id = a.course_id WHERE c.teacher_id = ? AND s.status = 'submitted' AND s.deleted_at IS NULL AND a.deleted_at IS NULL AND c.deleted_at IS NULL) as pending_submissions,
			(SELECT COALESCE(avg(r.score), 0) FROM ratings r JOIN courses c ON c.id = r.course_id WHERE c.teacher_id = ? AND c.deleted_at IS NULL) as average_rating
	`, teacherID, teacherID, teacherID, teacherID).Scan(&stats).Error; err != nil {
		return nil, fmt.Errorf("load teacher dashboard: %w", err)
	}

	AppCache.Set(cacheKey, stats)
	return &stats, nil
}

func GetStudentStats(studentID string) (*StudentDashboardStats, error) {
	var stats StudentDashboardStats

	// Single query for all student counts (1 round-trip instead of 3)
	if err := database.DB.Raw(`
		SELECT 
			(SELECT count(*) FROM learning_progresses WHERE student_id = ?) as started_courses,
			(SELECT count(*) FROM learning_progresses WHERE student_id = ? AND status IN ('completed', 'certified')) as completed_courses,
			(SELECT count(*) FROM certificates WHERE student_id = ?) as certificates
	`, studentID, studentID, studentID).Scan(&stats).Error; err != nil {
		return nil, fmt.Errorf("load student dashboard: %w", err)
	}

	var deadlines []model.Assignment
	if err := database.DB.
		Joins("JOIN learning_progresses ON learning_progresses.course_id = assignments.course_id").
		Where("learning_progresses.student_id = ? AND assignments.is_published = true AND assignments.deadline > ?", studentID, time.Now()).
		Order("assignments.deadline ASC").
		Limit(3).
		Find(&deadlines).Error; err != nil {
		return nil, fmt.Errorf("load student deadlines: %w", err)
	}
	stats.UpcomingDeadlines = deadlines

	var recentSubmissions []model.Submission
	if err := database.DB.Preload("Assignment").Where("student_id = ?", studentID).Order("submitted_at DESC").Limit(5).Find(&recentSubmissions).Error; err != nil {
		return nil, fmt.Errorf("load recent submissions: %w", err)
	}

	var recentQuizzes []model.QuizAttempt
	if err := database.DB.Preload("Quiz").Where("student_id = ?", studentID).Order("completed_at DESC").Limit(5).Find(&recentQuizzes).Error; err != nil {
		return nil, fmt.Errorf("load recent quizzes: %w", err)
	}

	activities := make([]Activity, 0, len(recentSubmissions)+len(recentQuizzes))
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
