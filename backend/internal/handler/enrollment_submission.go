package handler

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"backend/internal/dto"
	"backend/internal/service"
)

// Enrollments
func EnrollCourse(c *gin.Context) {
	studentID, _ := c.Get("userID")
	courseID := c.Param("id")

	var req dto.EnrollCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	enrollment, err := service.EnrollCourse(studentID.(string), courseID, req)
	if err != nil {
		// Return user-facing messages for expected errors
		if err.Error() == "student already enrolled in this course" {
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
			return
		}
		log.Printf("EnrollCourse error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to enroll in course"})
		return
	}

	c.JSON(http.StatusCreated, enrollment)
}

func GetMyEnrollments(c *gin.Context) {
	studentID, _ := c.Get("userID")
	
	enrollments, err := service.GetMyEnrollments(studentID.(string))
	if err != nil {
		log.Printf("GetMyEnrollments error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load enrollments"})
		return
	}
	
	c.JSON(http.StatusOK, enrollments)
}

func GetRecentEnrollments(c *gin.Context) {
	enrollments, err := service.GetRecentEnrollments(10)
	if err != nil {
		log.Printf("GetRecentEnrollments error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load enrollments"})
		return
	}
	c.JSON(http.StatusOK, enrollments)
}

func GetCourseEnrollments(c *gin.Context) {
	courseID := c.Param("id")
	enrollments, err := service.GetCourseEnrollments(courseID)
	if err != nil {
		log.Printf("GetCourseEnrollments error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load enrollments"})
		return
	}
	c.JSON(http.StatusOK, enrollments)
}

func CompleteModule(c *gin.Context) {
	studentID, _ := c.Get("userID")
	courseID := c.Param("id")
	moduleID := c.Param("moduleId")

	enrollment, err := service.CompleteModule(studentID.(string), courseID, moduleID)
	if err != nil {
		log.Printf("CompleteModule error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to complete module"})
		return
	}

	c.JSON(http.StatusOK, enrollment)
}

// Submissions
func SubmitAssignment(c *gin.Context) {
	studentID, _ := c.Get("userID")
	assignmentID := c.Param("id")

	var req dto.SubmitAssignmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	submission, err := service.SubmitAssignment(studentID.(string), assignmentID, req)
	if err != nil {
		log.Printf("SubmitAssignment error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit assignment"})
		return
	}

	c.JSON(http.StatusCreated, submission)
}

func GradeSubmission(c *gin.Context) {
	submissionID := c.Param("id")

	var req dto.GradeSubmissionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	submission, err := service.GradeSubmission(submissionID, req)
	if err != nil {
		log.Printf("GradeSubmission error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to grade submission"})
		return
	}

	c.JSON(http.StatusOK, submission)
}

func GetMySubmissions(c *gin.Context) {
	studentID, _ := c.Get("userID")
	
	submissions, err := service.GetMySubmissions(studentID.(string))
	if err != nil {
		log.Printf("GetMySubmissions error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load submissions"})
		return
	}
	
	c.JSON(http.StatusOK, submissions)
}

func GetTeacherSubmissions(c *gin.Context) {
	teacherID, _ := c.Get("userID")
	
	submissions, err := service.GetTeacherSubmissions(teacherID.(string))
	if err != nil {
		log.Printf("GetTeacherSubmissions error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load submissions"})
		return
	}
	
	c.JSON(http.StatusOK, submissions)
}

// Certificates
func GenerateCertificate(c *gin.Context) {
	studentID, _ := c.Get("userID")
	courseID := c.Param("id")

	certificate, err := service.GenerateCertificate(studentID.(string), courseID)
	if err != nil {
		// User-facing validation errors are fine to expose
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, certificate)
}

func GetMyCertificates(c *gin.Context) {
	studentID, _ := c.Get("userID")
	
	certificates, err := service.GetMyCertificates(studentID.(string))
	if err != nil {
		log.Printf("GetMyCertificates error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load certificates"})
		return
	}
	
	c.JSON(http.StatusOK, certificates)
}
