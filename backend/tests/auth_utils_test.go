package tests

import (
	"testing"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestRegisterUser(t *testing.T) {
	db := setupTestDB(t)

	authService := services.NewAuthService(db)

	t.Run("successful registration", func(t *testing.T) {
		req := services.RegisterRequest{
			Email:    "test@example.com",
			Password: "password123",
			FullName: "Test User",
		}
		user, token, err := authService.RegisterUser(req)
		require.NoError(t, err)
		assert.NotNil(t, user)
		assert.NotEmpty(t, token)
		assert.Equal(t, req.Email, user.Email)
		assert.Equal(t, req.FullName, user.FullName)
		assert.Equal(t, "KES", user.Currency)
		assert.Empty(t, user.PasswordHash)                  // should be hidden via json:"-"
		assert.NotEqual(t, req.Password, user.PasswordHash) // never stored as plaintext
	})

	t.Run("duplicate email returns ErrAlreadyExists", func(t *testing.T) {
		req := services.RegisterRequest{
			Email:    "duplicate@example.com",
			Password: "password123",
			FullName: "First User",
		}
		_, _, err := authService.RegisterUser(req)
		require.NoError(t, err)

		// register same email again
		_, _, err = authService.RegisterUser(req)
		assert.ErrorIs(t, err, utils.ErrAlreadyExists)
	})

	t.Run("different emails register independently", func(t *testing.T) {
		req1 := services.RegisterRequest{Email: "a@example.com", Password: "pass1234", FullName: "User A"}
		req2 := services.RegisterRequest{Email: "b@example.com", Password: "pass1234", FullName: "User B"}

		user1, _, err := authService.RegisterUser(req1)
		require.NoError(t, err)

		user2, _, err := authService.RegisterUser(req2)
		require.NoError(t, err)

		assert.NotEqual(t, user1.ID, user2.ID)
	})
}

func TestLoginUser(t *testing.T) {
	db := setupTestDB(t)
	authService := services.NewAuthService(db)

	// seed a user
	req := services.RegisterRequest{
		Email:    "login@example.com",
		Password: "securepass",
		FullName: "Login User",
	}
	_, _, err := authService.RegisterUser(req)
	require.NoError(t, err)

	t.Run("correct credentials returns user and token", func(t *testing.T) {
		user, token, err := authService.LoginUser(services.LoginRequest{
			Email:    "login@example.com",
			Password: "securepass",
		})
		require.NoError(t, err)
		assert.NotNil(t, user)
		assert.NotEmpty(t, token)
		assert.Equal(t, "login@example.com", user.Email)
	})

	t.Run("wrong password returns ErrUnauthorized", func(t *testing.T) {
		_, _, err := authService.LoginUser(services.LoginRequest{
			Email:    "login@example.com",
			Password: "wrongpassword",
		})
		assert.ErrorIs(t, err, utils.ErrUnauthorized)
	})

	t.Run("non-existent email returns ErrUnauthorized", func(t *testing.T) {
		_, _, err := authService.LoginUser(services.LoginRequest{
			Email:    "ghost@example.com",
			Password: "doesntmatter",
		})
		assert.ErrorIs(t, err, utils.ErrUnauthorized)
	})
}

func TestGetAuthedUser(t *testing.T) {
	db := setupTestDB(t)
	authService := services.NewAuthService(db)

	req := services.RegisterRequest{
		Email:    "profile@example.com",
		Password: "pass1234",
		FullName: "Profile User",
	}
	created, _, err := authService.RegisterUser(req)
	require.NoError(t, err)

	t.Run("existing user is returned", func(t *testing.T) {
		user, err := authService.GetAuthedUser(created.ID)
		require.NoError(t, err)
		assert.Equal(t, created.ID, user.ID)
		assert.Equal(t, created.Email, user.Email)
	})

	t.Run("non-existent ID returns error", func(t *testing.T) {
		_, err := authService.GetAuthedUser(nonExistentUUID())
		assert.Error(t, err)
	})
}

// seedUser is a helper that registers and returns a user for use in other tests.
func seedUser(t *testing.T, db *gorm.DB, email string) *models.User {
	t.Helper()
	svc := services.NewAuthService(db)
	user, _, err := svc.RegisterUser(services.RegisterRequest{
		Email:    email,
		Password: "testpassword",
		FullName: "Test User",
	})
	require.NoError(t, err)
	return user
}
