package services

// Drop-in replacement for auth_service.go.
// Changes:
//   - RegisterUser and LoginUser now return *auth.TokenPair instead of string
//   - RefreshTokens added: validates a refresh token and issues a new pair

import (
	"log/slog"

	"github.com/f18charles/piggy-bank/backend/internal/auth"
	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AuthService struct {
	userRepo *repository.UserRepository
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{userRepo: repository.NewUserRepository(db)}
}

type RegisterRequest struct {
	Email    string `json:"email"     binding:"required,email"`
	Password string `json:"password"  binding:"required,min=6"`
	FullName string `json:"full_name" binding:"required"`
}

type LoginRequest struct {
	Email    string `json:"email"    binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RegisterUser creates a new user account and returns the user + token pair.
func (as *AuthService) RegisterUser(req RegisterRequest) (*models.User, *auth.TokenPair, error) {
	existing, _ := as.userRepo.GetUserByEmail(req.Email)
	if existing != nil {
		return nil, nil, utils.ErrAlreadyExists
	}

	hashed, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, nil, err
	}

	user := &models.User{
		Email:        req.Email,
		PasswordHash: hashed,
		FullName:     req.FullName,
	}
	if err := as.userRepo.CreateUser(user); err != nil {
		return nil, nil, err
	}

	slog.Info("user registered", "user_id", user.ID)

	pair, err := auth.GenerateTokenPair(user.ID)
	if err != nil {
		return nil, nil, err
	}
	return user, pair, nil
}

// LoginUser validates credentials and returns the user + token pair.
func (as *AuthService) LoginUser(req LoginRequest) (*models.User, *auth.TokenPair, error) {
	user, err := as.userRepo.GetUserByEmail(req.Email)
	if err != nil || user == nil {
		slog.Warn("Login failed: user not found", "email", req.Email)
		return nil, nil, utils.ErrUnauthorized
	}
	if !auth.CheckPassword(req.Password, user.PasswordHash) {
		slog.Warn("Login failed: invalid password", "email", req.Email)
		return nil, nil, utils.ErrUnauthorized
	}
	slog.Info("user logged in", "user_id", user.ID)

	pair, err := auth.GenerateTokenPair(user.ID)
	if err != nil {
		return nil, nil, err
	}
	return user, pair, nil
}

// RefreshTokens validates a refresh token and issues a fresh token pair.
// The old refresh token is implicitly invalidated because the frontend
// replaces it with the new one.
func (as *AuthService) RefreshTokens(refreshToken string) (*auth.TokenPair, error) {
	claims, err := auth.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, utils.ErrUnauthorized
	}
	return auth.GenerateTokenPair(claims.UserID)
}

// GetAuthedUser returns the user profile for the given ID.
func (as *AuthService) GetAuthedUser(userID uuid.UUID) (*models.User, error) {
	return as.userRepo.GetUserByID(userID)
}
