package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// CORS returns a middleware that sets appropriate CORS headers.
// It prevents wildcard Access-Control-Allow-Origin when credentials are enabled.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqOrigin := c.GetHeader("Origin")
		allowedOrigin, allowCredentials := resolveAllowedOrigin(reqOrigin)

		if allowedOrigin != "" {
			c.Header("Access-Control-Allow-Origin", allowedOrigin)
		}
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization, X-Requested-With")
		
		if allowCredentials {
			c.Header("Access-Control-Allow-Credentials", "true")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func resolveAllowedOrigin(requestOrigin string) (string, bool) {
	envOrigin := os.Getenv("ALLOWED_ORIGIN")
	if envOrigin == "" {
		if requestOrigin != "" {
			return requestOrigin, true
		}
		return "http://localhost:5173", true
	}

	if envOrigin == "*" {
		if requestOrigin != "" {
			return requestOrigin, true
		}
		return "*", false
	}

	origins := strings.Split(envOrigin, ",")
	for _, o := range origins {
		trimmed := strings.TrimSpace(o)
		if trimmed == requestOrigin {
			return requestOrigin, true
		}
	}

	if requestOrigin == "" && len(origins) > 0 {
		return strings.TrimSpace(origins[0]), true
	}

	return strings.TrimSpace(origins[0]), true
}
