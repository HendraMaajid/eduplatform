package main

import (
	"log"
	"net/http"
	"os"
	"strconv"

	"backend/internal/handler"
	"backend/internal/middleware"
	"backend/internal/seed"
	"backend/pkg/database"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load .env file if exists
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, relying on environment variables")
	}

	// Set Gin to release mode in production (less logging, faster)
	if os.Getenv("GIN_MODE") == "" {
		// Default to release mode when deployed (no GIN_MODE set means production)
		// In development, set GIN_MODE=debug in .env
		if os.Getenv("RAILWAY_ENVIRONMENT") != "" || os.Getenv("RENDER") != "" {
			gin.SetMode(gin.ReleaseMode)
		}
	}

	// Initialize Database
	database.InitDB()

	// Seed dummy data (skips if data already exists)
	// ⚠️ In production, set SKIP_SEED=true to disable seeding
	if os.Getenv("SKIP_SEED") != "true" {
		seed.SeedAll()
		seed.SeedAdminIfMissing()
	}

	if countStr := os.Getenv("SEED_TEST_STUDENTS"); countStr != "" {
		count, err := strconv.Atoi(countStr)
		if err != nil {
			log.Printf("Invalid SEED_TEST_STUDENTS value: %s", countStr)
		} else if err := seed.SeedTestStudents(count); err != nil {
			log.Printf("Failed to seed test students: %v", err)
		}
	}

	// Initialize Gin router
	r := gin.Default()

	// ── Global Middleware ──────────────────────────────────────────────
	r.Use(middleware.CORS())
	r.Use(middleware.SecurityHeaders())

	// Global request body size limit (10MB) to prevent memory exhaustion
	r.Use(func(c *gin.Context) {
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, 10<<20)
		c.Next()
	})

	// Basic health check endpoint
	r.GET("/api/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Course API is running",
		})
	})

	// Public Routes
	// Serve static files from public/uploads
	r.Static("/uploads", "./public/uploads")

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			// Rate-limited auth endpoints to prevent brute-force
			auth.POST("/register", middleware.RateLimit("3-M"), handler.Register)
			auth.POST("/login", middleware.RateLimit("10-M"), handler.Login)
		}

		// Public courses (read-only, no sensitive data)
		api.GET("/courses", handler.GetCourses)
		api.GET("/courses/:id", handler.GetCourseByID)
		api.GET("/courses/:id/modules", handler.GetModules)

		// Protected Routes
		protected := api.Group("/")
		protected.Use(middleware.RequireAuth())
		{
			// Users
			protected.GET("/users/me", handler.GetMe)

			// Notifications
			protected.GET("/notifications", handler.GetNotifications)
			protected.PUT("/notifications/:id/read", handler.MarkNotificationAsRead)
			protected.PUT("/notifications/read-all", handler.MarkAllNotificationsAsRead)

			// Student Dashboard Routes
			protected.GET("/dashboard/student", handler.GetStudentDashboard)
			protected.GET("/enrollments", handler.GetMyEnrollments)
			protected.GET("/submissions", handler.GetMySubmissions)
			protected.GET("/certificates", handler.GetMyCertificates)

			// Course actions
			protected.POST("/courses/:id/enroll", handler.EnrollCourse)
			protected.POST("/courses/:id/modules/:moduleId/complete", handler.CompleteModule)
			protected.POST("/courses/:id/certificates", handler.GenerateCertificate)
			protected.POST("/assignments/:id/submit", handler.SubmitAssignment)
			protected.POST("/quizzes/:id/submit", handler.SubmitQuiz)
			protected.GET("/quizzes/:id/attempt", handler.GetQuizAttempt)

			// Quizzes, Assignments, Questions — moved from public to protected
			// Students need to be authenticated to view these
			protected.GET("/courses/:id/quizzes", handler.GetQuizzes)
			protected.GET("/courses/:id/assignments", handler.GetAssignments)
			protected.GET("/quizzes/:id/questions", handler.GetQuestionsForStudent)

			// AI Chat (RAG-based study companion)
			protected.POST("/chat", middleware.RateLimit("20-M"), handler.HandleChat)

			// Admin/Teacher Routes
			teacherOnly := protected.Group("/")
			teacherOnly.Use(middleware.RequireRole("super_admin", "admin", "teacher"))
			{
				teacherOnly.GET("/dashboard/teacher", handler.GetTeacherDashboard)
				teacherOnly.POST("/upload", handler.UploadFile)
				teacherOnly.POST("/courses", handler.CreateCourse)
				teacherOnly.POST("/courses/:id/modules", handler.CreateModule)
				teacherOnly.PUT("/modules/:id", handler.UpdateModule)
				teacherOnly.DELETE("/modules/:id", handler.DeleteModule)
				teacherOnly.POST("/courses/:id/quizzes", handler.CreateQuiz)
				teacherOnly.PUT("/quizzes/:id", handler.UpdateQuiz)
				teacherOnly.DELETE("/quizzes/:id", handler.DeleteQuiz)
				teacherOnly.POST("/courses/:id/assignments", handler.CreateAssignment)
				teacherOnly.PUT("/assignments/:id", handler.UpdateAssignment)
				teacherOnly.DELETE("/assignments/:id", handler.DeleteAssignment)
				teacherOnly.POST("/submissions/:id/grade", handler.GradeSubmission)
				teacherOnly.GET("/courses/:id/enrollments", handler.GetCourseEnrollments)
				teacherOnly.GET("/submissions/teacher", handler.GetTeacherSubmissions)
				teacherOnly.POST("/quizzes/:id/questions", handler.CreateQuestion)
				teacherOnly.PUT("/questions/:id", handler.UpdateQuestion)
				teacherOnly.DELETE("/questions/:id", handler.DeleteQuestion)
				// Teachers can see full questions with correct answers
				teacherOnly.GET("/quizzes/:id/questions/full", handler.GetQuestions)
			}

			adminOnly := protected.Group("/")
			adminOnly.Use(middleware.RequireRole("super_admin", "admin"))
			{
				adminOnly.GET("/dashboard/admin", handler.GetAdminDashboard)
				adminOnly.GET("/enrollments/recent", handler.GetRecentEnrollments)
				adminOnly.GET("/users", handler.GetAllUsers)
				adminOnly.POST("/users", handler.CreateUser)
				adminOnly.PUT("/users/:id", handler.UpdateUser)
				adminOnly.DELETE("/users/:id", handler.DeleteUser)

				adminOnly.PUT("/courses/:id", handler.UpdateCourse)
				adminOnly.DELETE("/courses/:id", handler.DeleteCourse)
			}
		}
	}

	// Setup port
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Start server
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server: ", err)
	}
}
