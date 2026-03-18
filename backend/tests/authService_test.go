package tests

import (
	"testing"

	"github.com/f18charles/piggy-bank/backend/internal/auth"
	"github.com/f18charles/piggy-bank/backend/internal/config"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestHashAndCheckPassword(t *testing.T) {
	t.Run("hash differs from plaintext", func(t *testing.T) {
		hash, err := auth.HashPassword("mypassword")
		require.NoError(t, err)
		assert.NotEqual(t, "mypassword", hash)
		assert.NotEmpty(t, hash)
	})

	t.Run("correct password matches hash", func(t *testing.T) {
		hash, _ := auth.HashPassword("correcthorse")
		assert.True(t, auth.CheckPassword("correcthorse", hash))
	})

	t.Run("wrong password does not match", func(t *testing.T) {
		hash, _ := auth.HashPassword("correcthorse")
		assert.False(t, auth.CheckPassword("wrongpassword", hash))
	})

	t.Run("same password produces different hashes each time (bcrypt salting)", func(t *testing.T) {
		hash1, _ := auth.HashPassword("samepassword")
		hash2, _ := auth.HashPassword("samepassword")
		assert.NotEqual(t, hash1, hash2)
		// but both verify correctly
		assert.True(t, auth.CheckPassword("samepassword", hash1))
		assert.True(t, auth.CheckPassword("samepassword", hash2))
	})

	t.Run("empty password hashes without error", func(t *testing.T) {
		hash, err := auth.HashPassword("")
		require.NoError(t, err)
		assert.True(t, auth.CheckPassword("", hash))
	})
}

func TestGenerateAndValidateToken(t *testing.T) {
	// ensure config is loaded for tests
	config.App.JWTSecret = "test-secret-key"
	config.App.JWTExpiryMinutes = 60

	userID := uuid.New()

	t.Run("generated token is non-empty", func(t *testing.T) {
		token, err := auth.GenerateToken(userID)
		require.NoError(t, err)
		assert.NotEmpty(t, token)
	})

	t.Run("valid token returns correct user_id", func(t *testing.T) {
		token, _ := auth.GenerateToken(userID)
		claims, err := auth.ValidateToken(token)
		require.NoError(t, err)
		assert.Equal(t, userID, claims.UserID)
	})

	t.Run("tampered token is rejected", func(t *testing.T) {
		token, _ := auth.GenerateToken(userID)
		tampered := token + "tampered"
		_, err := auth.ValidateToken(tampered)
		assert.Error(t, err)
	})

	t.Run("token signed with wrong secret is rejected", func(t *testing.T) {
		token, _ := auth.GenerateToken(userID)
		// temporarily change secret
		config.App.JWTSecret = "different-secret"
		_, err := auth.ValidateToken(token)
		assert.Error(t, err)
		// restore
		config.App.JWTSecret = "test-secret-key"
	})

	t.Run("different users produce different tokens", func(t *testing.T) {
		id1 := uuid.New()
		id2 := uuid.New()
		t1, _ := auth.GenerateToken(id1)
		t2, _ := auth.GenerateToken(id2)
		assert.NotEqual(t, t1, t2)
	})
}
