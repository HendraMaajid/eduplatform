package handler

import (
	"log"
	"net/http"

	"backend/internal/dto"
	"backend/internal/model"
	"backend/internal/service"
	"github.com/gin-gonic/gin"
)

func publicCourseResponse(course model.Course) dto.PublicCourseResponse {
	response := dto.PublicCourseResponse{
		ID: course.ID.String(), Title: course.Title, Slug: course.Slug, Description: course.Description,
		ShortDescription: course.ShortDescription, Thumbnail: course.Thumbnail, Category: course.Category,
		Level: course.Level, Status: course.Status, TeacherID: course.TeacherID.String(), Duration: course.Duration,
		Rating: course.Rating, TotalReviews: course.TotalReviews, TotalModules: course.TotalModules,
		TotalQuizzes: course.TotalQuizzes, TotalAssignments: course.TotalAssignments,
		EnrolledStudents: course.EnrolledStudents, CreatedAt: course.CreatedAt,
	}
	if course.Teacher != nil {
		response.Teacher = &dto.PublicTeacherResponse{ID: course.Teacher.ID.String(), Name: course.Teacher.Name, Avatar: course.Teacher.Avatar, Bio: course.Teacher.Bio}
	}
	return response
}

func GetCourses(c *gin.Context) {
	teacherID := c.Query("teacherId")
	search := c.Query("search")
	category := c.Query("category")
	level := c.Query("level")
	status := "published"

	page := parsePositiveInt(c.Query("page"), 1)
	limit := parsePositiveInt(c.Query("limit"), 10)

	response, err := service.GetAllCourses(teacherID, page, limit, search, category, level, status, true)
	if err != nil {
		log.Printf("GetCourses error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load courses"})
		return
	}
	courses, _ := response.Data.([]model.Course)
	publicCourses := make([]dto.PublicCourseResponse, 0, len(courses))
	for _, course := range courses {
		publicCourses = append(publicCourses, publicCourseResponse(course))
	}
	c.JSON(http.StatusOK, dto.PaginatedResponse{Data: publicCourses, Meta: response.Meta})
}

func GetCourseCategories(c *gin.Context) {
	categories, err := service.GetCourseCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load course categories"})
		return
	}
	c.JSON(http.StatusOK, categories)
}

func GetManagedCourses(c *gin.Context) {
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	teacherID := c.Query("teacherId")
	if role == "teacher" {
		teacherID = userID.(string)
	}
	page := parsePositiveInt(c.Query("page"), 1)
	limit := parsePositiveInt(c.Query("limit"), 10)
	response, err := service.GetAllCourses(teacherID, page, limit, c.Query("search"), c.Query("category"), c.Query("level"), c.Query("status"), false)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load managed courses"})
		return
	}
	c.JSON(http.StatusOK, response)
}

func GetManagedCourseByID(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeCourseManagement(c.Request.Context(), id, userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	course, err := service.GetManagedCourseByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}
	c.JSON(http.StatusOK, course)
}

func GetCourseByID(c *gin.Context) {
	id := c.Param("id")
	course, err := service.GetCourseByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}
	c.JSON(http.StatusOK, publicCourseResponse(*course))
}

func CreateCourse(c *gin.Context) {
	teacherID, _ := c.Get("userID")
	role, _ := c.Get("role")

	var req dto.CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	course, err := service.CreateCourse(req, teacherID.(string), role.(string))
	if err != nil {
		log.Printf("CreateCourse error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create course"})
		return
	}

	c.JSON(http.StatusCreated, course)
}

func UpdateCourse(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")

	var req dto.UpdateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	course, err := service.UpdateCourse(id, req, userID.(string), role.(string))
	if err != nil {
		if err.Error() == "forbidden: you don't own this course" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		log.Printf("UpdateCourse error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update course"})
		return
	}

	c.JSON(http.StatusOK, course)
}

func DeleteCourse(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")

	if err := service.DeleteCourse(id, userID.(string), role.(string)); err != nil {
		if err.Error() == "forbidden: you don't own this course" {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		log.Printf("DeleteCourse error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete course"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "course deleted successfully"})
}

func GetModules(c *gin.Context) {
	courseID := c.Param("id")
	modules, err := service.GetModulesByCourse(courseID)
	if err != nil {
		log.Printf("GetModules error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load modules"})
		return
	}
	c.JSON(http.StatusOK, modules)
}

func CreateModule(c *gin.Context) {
	courseID := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeCourseManagement(c.Request.Context(), courseID, userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	var req dto.CreateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	module, err := service.CreateModule(courseID, req)
	if err != nil {
		log.Printf("CreateModule error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create module"})
		return
	}

	c.JSON(http.StatusCreated, module)
}

func UpdateModule(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeModuleManagement(c.Request.Context(), id, userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	var req dto.UpdateModuleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	module, err := service.UpdateModule(id, req)
	if err != nil {
		log.Printf("UpdateModule error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update module"})
		return
	}

	c.JSON(http.StatusOK, module)
}

func DeleteModule(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeModuleManagement(c.Request.Context(), id, userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	if err := service.DeleteModule(id); err != nil {
		log.Printf("DeleteModule error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete module"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "module deleted successfully"})
}

func CreateAttachment(c *gin.Context) {
	moduleID := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeModuleManagement(c.Request.Context(), moduleID, userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	var req dto.CreateAttachmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	attachment, err := service.CreateAttachment(c.Request.Context(), moduleID, req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, attachment)
}

func DeleteAttachment(c *gin.Context) {
	id := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeAttachmentManagement(c.Request.Context(), id, userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	if err := service.DeleteAttachment(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete attachment"})
		return
	}
	c.Status(http.StatusNoContent)
}

func ReorderModules(c *gin.Context) {
	courseID := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeCourseManagement(c.Request.Context(), courseID, userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	var req dto.ReorderModulesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := service.ReorderModules(c.Request.Context(), courseID, req.ModuleIDs); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func GetManagedModules(c *gin.Context) {
	courseID := c.Param("id")
	userID, _ := c.Get("userID")
	role, _ := c.Get("role")
	if err := service.AuthorizeCourseManagement(c.Request.Context(), courseID, userID.(string), role.(string)); err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
		return
	}
	modules, err := service.GetManagedModulesByCourse(courseID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load modules"})
		return
	}
	c.JSON(http.StatusOK, modules)
}
