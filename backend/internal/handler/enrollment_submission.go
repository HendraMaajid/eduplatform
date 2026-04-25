package handler

import (
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, enrollment)
}

func GetMyEnrollments(c *gin.Context) {
	studentID, _ := c.Get("userID")
	
	enrollments, err := service.GetMyEnrollments(studentID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, enrollments)
}

func GetRecentEnrollments(c *gin.Context) {
	enrollments, err := service.GetRecentEnrollments(10)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, enrollments)
}

func GetCourseEnrollments(c *gin.Context) {
	courseID := c.Param("id")
	enrollments, err := service.GetCourseEnrollments(courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, submission)
}

func GetMySubmissions(c *gin.Context) {
	studentID, _ := c.Get("userID")
	
	submissions, err := service.GetMySubmissions(studentID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, submissions)
}

func GetTeacherSubmissions(c *gin.Context) {
	teacherID, _ := c.Get("userID")
	
	submissions, err := service.GetTeacherSubmissions(teacherID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, certificate)
}

func GetMyCertificates(c *gin.Context) {
	studentID, _ := c.Get("userID")
	
	certificates, err := service.GetMyCertificates(studentID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, certificates)
}
