package auth

// Drop-in replacement for jwt.go.
//
// HOW IT WORKS:
//
//   Access token  — short-lived (10 min). Sent with every API request.
//   Refresh token — long-lived (7 days). Used ONLY to get a new access token.
//                   Every time the frontend successfully calls POST /auth/refresh,
//                   BOTH tokens are reissued and the 7-day window resets.
//
// INACTIVITY LOGOUT:
//   The frontend tracks the last time the user did anything (click, keypress,
//   API call). If 10 minutes pass with no activity it does NOT call /auth/refresh
//   and the access token expires naturally → user is signed out.
//   As long as the user keeps using the app, /auth/refresh is called just before
//   the access token expires (e.g. at the 9-minute mark) and they stay logged in
//   indefinitely.
//
// TOKEN TYPES:
//   Claims.TokenType = "access"  → used for all protected endpoints
//   Claims.TokenType = "refresh" → used ONLY for POST /auth/refresh
//   The middleware rejects refresh tokens on protected endpoints and vice-versa.

import (
	"errors"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"

	accessTokenDuration  = 10 * time.Minute
	refreshTokenDuration = 7 * 24 * time.Hour // 7 days
)

type Claims struct {
	UserID    uuid.UUID `json:"user_id"`
	TokenType string    `json:"token_type"` // "access" | "refresh"
	jwt.RegisteredClaims
}

// TokenPair holds both tokens returned on login / refresh.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int    `json:"expires_in"` // access token TTL in seconds (600)
}

// GenerateTokenPair creates a fresh access + refresh token pair for the user.
// Call this on login, register, and every successful /auth/refresh request.
func GenerateTokenPair(userID uuid.UUID) (*TokenPair, error) {
	accessToken, err := generateToken(userID, TokenTypeAccess, accessTokenDuration)
	if err != nil {
		return nil, err
	}

	refreshToken, err := generateToken(userID, TokenTypeRefresh, refreshTokenDuration)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int(accessTokenDuration.Seconds()),
	}, nil
}

// GenerateToken is kept for backward-compat with any callers that only need
// an access token (e.g. tests). Returns a plain access token string.
func GenerateToken(userID uuid.UUID) (string, error) {
	return generateToken(userID, TokenTypeAccess, accessTokenDuration)
}

// ValidateToken parses any token and returns its claims.
// Use ValidateAccessToken / ValidateRefreshToken for type-safe validation.
func ValidateToken(tokenString string) (*Claims, error) {
	return parseToken(tokenString)
}

// ValidateAccessToken validates the token AND asserts it is an access token.
// Used by the AuthRequired middleware.
func ValidateAccessToken(tokenString string) (*Claims, error) {
	claims, err := parseToken(tokenString)
	if err != nil {
		return nil, err
	}
	if claims.TokenType != TokenTypeAccess {
		return nil, errors.New("not an access token")
	}
	return claims, nil
}

// ValidateRefreshToken validates the token AND asserts it is a refresh token.
// Used by the /auth/refresh handler.
func ValidateRefreshToken(tokenString string) (*Claims, error) {
	claims, err := parseToken(tokenString)
	if err != nil {
		return nil, err
	}
	if claims.TokenType != TokenTypeRefresh {
		return nil, errors.New("not a refresh token")
	}
	return claims, nil
}

// ── internal ──────────────────────────────────────────────────────────────────

func generateToken(userID uuid.UUID, tokenType string, duration time.Duration) (string, error) {
	claims := Claims{
		UserID:    userID,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(duration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.App.JWTSecret))
}

func parseToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (any, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(config.App.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
