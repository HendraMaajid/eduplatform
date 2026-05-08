package middleware

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	limiter "github.com/ulule/limiter/v3"
	"github.com/ulule/limiter/v3/drivers/store/memory"
)

// RateLimit creates a rate-limiting middleware.
// The rate string format is "<count>-<period>" where period is:
//   - S = per second
//   - M = per minute
//   - H = per hour
//
// Examples: "5-M" = 5 per minute, "100-H" = 100 per hour
func RateLimit(rate string) gin.HandlerFunc {
	r, err := limiter.NewRateFromFormatted(rate)
	if err != nil {
		log.Fatalf("Invalid rate limit format: %s — %v", rate, err)
	}

	store := memory.NewStore()
	instance := limiter.New(store, r)

	return func(c *gin.Context) {
		// Use client IP as the rate limit key
		ip := c.ClientIP()
		context, err := instance.Get(c.Request.Context(), ip)
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{"error": "Rate limiter error"})
			return
		}

		if context.Reached {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error": "Too many requests. Please try again later.",
			})
			return
		}

		c.Next()
	}
}
