package main

import (
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"

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

	// Seed fixtures only when development explicitly opts in. Missing
	// configuration must never recreate demo accounts after a cleanup.
	isProduction := gin.Mode() == gin.ReleaseMode || os.Getenv("APP_ENV") == "production"
	shouldSeed := os.Getenv("SKIP_SEED") == "false" && (!isProduction || os.Getenv("FORCE_SEED") == "true")
	if shouldSeed {
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
	trustedProxies := strings.TrimSpace(os.Getenv("TRUSTED_PROXIES"))
	if trustedProxies == "" {
		if err := r.SetTrustedProxies(nil); err != nil {
			log.Fatalf("disable trusted proxies: %v", err)
		}
	} else if err := r.SetTrustedProxies(strings.Split(trustedProxies, ",")); err != nil {
		log.Fatalf("configure trusted proxies: %v", err)
	}

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
			auth.POST("/google", middleware.RateLimit("10-M"), handler.GoogleAuth)
			auth.POST("/refresh", middleware.RateLimit("30-M"), handler.RefreshToken)
			auth.POST("/logout", middleware.RateLimit("30-M"), handler.Logout)
		}

		// Public catalog exposes published course metadata only.
		api.GET("/platform", handler.GetPublicPlatformSettings)
		api.GET("/courses", handler.GetCourses)
		api.GET("/courses/:id", handler.GetCourseByID)
		api.GET("/course-categories", handler.GetCourseCategories)
		api.GET("/courses/:id/ratings", handler.GetCourseRatings)

		// Protected Routes
		protected := api.Group("/")
		protected.Use(middleware.RequireAuth())
		{
			// Users
			protected.GET("/users/me", handler.GetMe)
			protected.PATCH("/users/me", handler.UpdateMe)
			protected.PUT("/users/me/password", handler.ChangeMyPassword)
			protected.GET("/users/me/preferences", handler.GetMyPreferences)
			protected.PUT("/users/me/preferences", handler.UpdateMyPreferences)

			// Notifications
			protected.GET("/notifications", handler.GetNotifications)
			protected.PUT("/notifications/:id/read", handler.MarkNotificationAsRead)
			protected.PUT("/notifications/read-all", handler.MarkAllNotificationsAsRead)

			// Student learning routes. Opening any published course is free.
			protected.GET("/dashboard/student", handler.GetStudentDashboard)
			protected.GET("/dashboard/teacher", middleware.RequireRole("super_admin", "admin", "teacher"), handler.GetTeacherDashboard)
			protected.POST("/learning/courses/:id/start", handler.StartCourse)
			protected.GET("/learning/progress", handler.GetMyLearningProgress)
			protected.GET("/learning/submissions", handler.GetMySubmissions)
			protected.GET("/learning/certificates", handler.GetMyCertificates)
			protected.GET("/learning/courses/:id/modules", handler.GetModules)
			protected.GET("/learning/courses/:id/quizzes", handler.GetQuizzes)
			protected.GET("/learning/courses/:id/assignments", handler.GetAssignments)
			protected.POST("/learning/courses/:id/modules/:moduleId/complete", handler.CompleteModule)
			protected.POST("/learning/courses/:id/certificates", handler.GenerateCertificate)
			protected.POST("/learning/courses/:id/ratings", handler.CreateRating)
			protected.GET("/learning/courses/:id/ratings/me", handler.GetMyRating)
			protected.POST("/learning/assignments/:id/submit", handler.SubmitAssignment)
			protected.POST("/learning/quizzes/:id/submit", handler.SubmitQuiz)
			protected.GET("/learning/quizzes/:id/attempt", handler.GetQuizAttempt)
			protected.GET("/learning/quizzes/:id/questions", handler.GetQuestionsForStudent)

			// AI Chat (RAG-based study companion)
			protected.POST("/chat", middleware.RateLimit("20-M"), handler.HandleChat)

			// Admin/Teacher Routes
			teacherOnly := protected.Group("/manage")
			teacherOnly.Use(middleware.RequireRole("super_admin", "admin", "teacher"))
			{
				teacherOnly.POST("/upload", handler.UploadFile)
				teacherOnly.GET("/courses", handler.GetManagedCourses)
				teacherOnly.GET("/courses/:id", handler.GetManagedCourseByID)
				teacherOnly.POST("/courses", handler.CreateCourse)
				teacherOnly.PUT("/courses/:id", handler.UpdateCourse)
				teacherOnly.DELETE("/courses/:id", handler.DeleteCourse)
				teacherOnly.GET("/courses/:id/modules", handler.GetManagedModules)
				teacherOnly.POST("/courses/:id/modules", handler.CreateModule)
				teacherOnly.PUT("/courses/:id/modules/order", handler.ReorderModules)
				teacherOnly.PUT("/modules/:id", handler.UpdateModule)
				teacherOnly.DELETE("/modules/:id", handler.DeleteModule)
				teacherOnly.POST("/modules/:id/attachments", handler.CreateAttachment)
				teacherOnly.DELETE("/attachments/:id", handler.DeleteAttachment)
				teacherOnly.GET("/courses/:id/quizzes", handler.GetManagedQuizzes)
				teacherOnly.POST("/courses/:id/quizzes", handler.CreateQuiz)
				teacherOnly.PUT("/quizzes/:id", handler.UpdateQuiz)
				teacherOnly.DELETE("/quizzes/:id", handler.DeleteQuiz)
				teacherOnly.GET("/courses/:id/assignments", handler.GetManagedAssignments)
				teacherOnly.POST("/courses/:id/assignments", handler.CreateAssignment)
				teacherOnly.PUT("/assignments/:id", handler.UpdateAssignment)
				teacherOnly.DELETE("/assignments/:id", handler.DeleteAssignment)
				teacherOnly.POST("/submissions/:id/grade", handler.GradeSubmission)
				teacherOnly.GET("/courses/:id/learners", handler.GetCourseLearners)
				teacherOnly.GET("/submissions", handler.GetTeacherSubmissions)
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
				adminOnly.GET("/learning/recent", handler.GetRecentLearningProgress)
				adminOnly.GET("/admin/learning-progress", handler.GetAllLearningProgress)
				adminOnly.GET("/admin/settings", handler.GetAdminPlatformSettings)
				adminOnly.PUT("/admin/settings", handler.UpdateAdminPlatformSettings)
				adminOnly.GET("/users", handler.GetAllUsers)
				adminOnly.POST("/users", handler.CreateUser)
				adminOnly.PUT("/users/:id", handler.UpdateUser)
				adminOnly.DELETE("/users/:id", handler.DeleteUser)
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
