package handlers

// Drop-in replacement for handlers/auth.go.
// Changes:
//   - Register and Login now return { access_token, refresh_token, expires_in, user }
//   - POST /auth/refresh added: accepts { refresh_token } and returns a new pair

import (
	"errors"
	"net/http"

	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthHandler struct {
	authService services.AuthService
}

func NewAuthHandler(db *gorm.DB) *AuthHandler {
	return &AuthHandler{authService: *services.NewAuthService(db)}
}

// AuthResponse is the shape returned on login, register, and refresh.
type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"` // seconds until access token expires (600)
	User         any    `json:"user,omitempty"`
}

// Register handles POST /auth/register
func (ah *AuthHandler) Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, pair, err := ah.authService.RegisterUser(req)
	if err != nil {
		if errors.Is(err, utils.ErrAlreadyExists) {
			utils.ErrorResponse(c, http.StatusConflict, "email already in use")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create account")
		return
	}

	utils.SuccessResponse(c, http.StatusCreated, AuthResponse{
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
		User:         user,
	})
}

// Login handles POST /auth/login
func (ah *AuthHandler) Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, pair, err := ah.authService.LoginUser(req)
	if err != nil {
		if errors.Is(err, utils.ErrUnauthorized) {
			utils.ErrorResponse(c, http.StatusUnauthorized, "invalid credentials")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to login")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, AuthResponse{
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
		User:         user,
	})
}

// Refresh handles POST /auth/refresh
// Body: { "refresh_token": "..." }
// Returns a new token pair. The frontend should call this proactively at the
// 9-minute mark while the user is active (before the access token expires).
// If the user has been idle for >10 min, the access token is already expired
// and no refresh call will have been made — the user is naturally signed out.
func (ah *AuthHandler) Refresh(c *gin.Context) {
	var body struct {
		RefreshToken string `json:"refresh_token" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "refresh_token required")
		return
	}

	pair, err := ah.authService.RefreshTokens(body.RefreshToken)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, "invalid or expired refresh token")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, AuthResponse{
		AccessToken:  pair.AccessToken,
		RefreshToken: pair.RefreshToken,
		ExpiresIn:    pair.ExpiresIn,
	})
}

// Logout handles POST /auth/logout — client just discards both tokens.
func (ah *AuthHandler) Logout(c *gin.Context) {
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "logged out successfully"})
}

// Profile handles GET /auth/profile
func (ah *AuthHandler) Profile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		utils.ErrorResponse(c, http.StatusUnauthorized, "unauthorized")
		return
	}
	id, ok := userID.(uuid.UUID)
	if !ok {
		utils.ErrorResponse(c, http.StatusInternalServerError, "invalid user id in context")
		return
	}
	user, err := ah.authService.GetAuthedUser(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "user not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, user)
}
