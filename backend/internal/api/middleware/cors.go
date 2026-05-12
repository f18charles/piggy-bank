package middleware

import (
	"net/http"
	"os"

	// "github.com/f18charles/piggy-bank/backend/internal/config"
	"github.com/gin-gonic/gin"
)

// CORS returns a middleware that sets permissive CORS headers suitable for
// the frontend dev environment. It short-circuits OPTIONS requests with 204.
func CORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := getAllowedOrigin(c.GetHeader("Origin"))

		c.Header("Access-Control-Allow-Origin", origin)
		c.Header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-type, Authorization")
		c.Header("Access-Control-Allow-Credentials", "true")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}

func getAllowedOrigin(requestOrigin string) string {
	if envOrigin := os.Getenv("ALLOWED_ORIGIN"); envOrigin != "" {
		return envOrigin
	}
	if requestOrigin != "" {
		return requestOrigin
	}
	return "*"
}