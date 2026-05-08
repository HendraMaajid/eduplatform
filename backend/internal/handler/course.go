package handler

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"backend/internal/dto"
	"backend/internal/service"
)

func GetCourses(c *gin.Context) {
	teacherID := c.Query("teacherId")
	search := c.Query("search")
	category := c.Query("category")
	level := c.Query("level")
	status := c.Query("status")
	
	page := 1
	limit := 10
	if pageStr := c.Query("page"); pageStr != "" {
		fmt.Sscanf(pageStr, "%d", &page)
	}
	if limitStr := c.Query("limit"); limitStr != "" {
		fmt.Sscanf(limitStr, "%d", &limit)
	}

	response, err := service.GetAllCourses(teacherID, page, limit, search, category, level, status)
	if err != nil {
		log.Printf("GetCourses error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load courses"})
		return
	}
	c.JSON(http.StatusOK, response)
}

func GetCourseByID(c *gin.Context) {
	id := c.Param("id")
	course, err := service.GetCourseByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Course not found"})
		return
	}
	c.JSON(http.StatusOK, course)
}

func CreateCourse(c *gin.Context) {
	teacherID, _ := c.Get("userID")

	var req dto.CreateCourseRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	course, err := service.CreateCourse(req, teacherID.(string))
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

	var req dto.CreateCourseRequest
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
	if err := service.DeleteModule(id); err != nil {
		log.Printf("DeleteModule error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete module"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "module deleted successfully"})
}
