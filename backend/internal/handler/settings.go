package handler

import (
	"net/http"

	"backend/internal/dto"
	"backend/internal/service"
	"github.com/gin-gonic/gin"
)

func GetPublicPlatformSettings(c *gin.Context) {
	settings, err := service.GetPlatformSettings(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load platform settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func GetAdminPlatformSettings(c *gin.Context) {
	GetPublicPlatformSettings(c)
}

func UpdateAdminPlatformSettings(c *gin.Context) {
	var req dto.UpdatePlatformSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	settings, err := service.UpdatePlatformSettings(c.Request.Context(), req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update platform settings"})
		return
	}
	c.JSON(http.StatusOK, settings)
}

func UpdateMe(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req dto.UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	user, err := service.UpdateMyProfile(c.Request.Context(), userID.(string), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, authUserResponse(user))
}

func ChangeMyPassword(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req dto.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := service.ChangeMyPassword(c.Request.Context(), userID.(string), req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.Status(http.StatusNoContent)
}

func GetMyPreferences(c *gin.Context) {
	userID, _ := c.Get("userID")
	preference, err := service.GetMyPreferences(c.Request.Context(), userID.(string))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to load preferences"})
		return
	}
	c.JSON(http.StatusOK, preference)
}

func UpdateMyPreferences(c *gin.Context) {
	userID, _ := c.Get("userID")
	var req dto.UpdatePreferencesRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	preference, err := service.UpdateMyPreferences(c.Request.Context(), userID.(string), req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, preference)
}
