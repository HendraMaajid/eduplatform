package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// allowedExtensions is the set of permitted file extensions for upload.
var allowedExtensions = map[string]bool{
	".jpg": true, ".jpeg": true, ".png": true, ".webp": true, ".gif": true,
}

// allowedMIMETypes is the set of permitted MIME types based on file content inspection.
var allowedMIMETypes = map[string]bool{
	"image/jpeg": true, "image/png": true, "image/webp": true, "image/gif": true,
}

// maxUploadSize is the maximum allowed upload file size (5MB).
const maxUploadSize = 5 << 20 // 5MB

// UploadFile handles multipart file uploads with security validation.
func UploadFile(c *gin.Context) {
	// Limit request body size to prevent memory exhaustion
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadSize)

	// Retrieve the file from the form data
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No file provided or file too large (max 5MB)"})
		return
	}

	// Validate file size
	if file.Size > maxUploadSize {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large (max 5MB)"})
		return
	}

	// Validate file extension
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if !allowedExtensions[ext] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed"})
		return
	}

	// Validate actual file content (magic bytes) — prevents extension spoofing
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to read file"})
		return
	}

	buf := make([]byte, 512)
	n, readErr := src.Read(buf)
	closeErr := src.Close()
	if readErr != nil || n == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read file content"})
		return
	}
	if closeErr != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to finish reading file"})
		return
	}

	contentType := http.DetectContentType(buf[:n])
	if !allowedMIMETypes[contentType] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid file content. File does not appear to be a valid image"})
		return
	}

	// Create uploads directory if it doesn't exist
	uploadDir := "./public/uploads"
	if err := os.MkdirAll(uploadDir, 0o750); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate a unique filename to prevent overwriting (no user-supplied filename used)
	fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, fileName)

	// Save the file
	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Return the accessible URL for the file
	fileURL := fmt.Sprintf("/uploads/%s", fileName)

	c.JSON(http.StatusOK, gin.H{
		"url":     fileURL,
		"message": "File uploaded successfully",
	})
}
