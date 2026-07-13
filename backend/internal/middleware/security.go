package middleware

import (
	"os"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders adds security-related HTTP headers to all responses.
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Prevent MIME type sniffing
		c.Writer.Header().Set("X-Content-Type-Options", "nosniff")

		// Prevent clickjacking
		c.Writer.Header().Set("X-Frame-Options", "DENY")

		// XSS protection (legacy browsers)
		c.Writer.Header().Set("X-XSS-Protection", "1; mode=block")

		// Control referrer information
		c.Writer.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")

		// Restrict browser features
		c.Writer.Header().Set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
		c.Writer.Header().Set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'")
		c.Writer.Header().Set("Cross-Origin-Resource-Policy", "cross-origin")

		// HSTS in production
		if os.Getenv("GIN_MODE") == "release" {
			c.Writer.Header().Set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		c.Next()
	}
}
