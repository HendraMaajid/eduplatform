package handler

import (
	"log"
	"net/http"
	"strings"

	"backend/internal/dto"
	"backend/internal/service"
	"github.com/gin-gonic/gin"
)

func GetMe(c *gin.Context) {
	userID, _ := c.Get("userID")

	user, preferences, err := service.GetMyAccount(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"user": authUserResponse(user), "preferences": preferences})
}

func GetAllUsers(c *gin.Context) {
	role := c.Query("role")
	search := c.Query("search")

	page := parsePositiveInt(c.Query("page"), 1)
	limit := parsePositiveInt(c.Query("limit"), 10)

	response, err := service.GetAllUsers(role, page, limit, search, c.Query("joined"))
	if err != nil {
		log.Printf("GetAllUsers error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load users"})
		return
	}
	c.JSON(http.StatusOK, response)
}

func CreateUser(c *gin.Context) {
	actorRole, _ := c.Get("role")
	var req dto.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := service.CreateUser(req, actorRole.(string))
	if err != nil {
		if strings.HasPrefix(err.Error(), "forbidden:") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		log.Printf("CreateUser error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, user)
}

func UpdateUser(c *gin.Context) {
	id := c.Param("id")
	actorID, _ := c.Get("userID")
	actorRole, _ := c.Get("role")
	var req dto.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := service.UpdateUser(id, req, actorID.(string), actorRole.(string))
	if err != nil {
		if strings.HasPrefix(err.Error(), "forbidden:") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		log.Printf("UpdateUser error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, user)
}

func DeleteUser(c *gin.Context) {
	id := c.Param("id")
	actorID, _ := c.Get("userID")
	actorRole, _ := c.Get("role")
	if err := service.DeleteUser(id, actorID.(string), actorRole.(string)); err != nil {
		if strings.HasPrefix(err.Error(), "forbidden:") {
			c.JSON(http.StatusForbidden, gin.H{"error": err.Error()})
			return
		}
		log.Printf("DeleteUser error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "user deleted successfully"})
}
