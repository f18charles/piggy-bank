package tests

import (
	"testing"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func TestCategoryCreate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "cat@example.com")
	svc := services.NewCategoryService(db)

	t.Run("creates expense category", func(t *testing.T) {
		req := services.CategoryCreateRequest{
			Name:  "Groceries",
			Type:  "expense",
			Color: "#FF5733",
			Icon:  "cart",
		}
		cat, err := svc.CategoryCreate(user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, "Groceries", cat.Name)
		assert.Equal(t, "expense", cat.Type)
		assert.Equal(t, user.ID, cat.UserID)
		assert.False(t, cat.IsDefault)
	})

	t.Run("creates income category", func(t *testing.T) {
		req := services.CategoryCreateRequest{
			Name:  "Freelance",
			Type:  "income",
			Color: "#00FF00",
			Icon:  "briefcase",
		}
		cat, err := svc.CategoryCreate(user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, "income", cat.Type)
	})
}

func TestCategoryGet(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "catget@example.com")
	other := seedUser(t, db, "catget2@example.com")
	svc := services.NewCategoryService(db)

	cat := seedCategory(t, db, user.ID, "Transport", "expense")

	t.Run("owner can retrieve category", func(t *testing.T) {
		result, err := svc.CategoryGet(user.ID, cat.ID)
		require.NoError(t, err)
		assert.Equal(t, cat.ID, result.ID)
	})

	t.Run("other user gets ErrForbidden", func(t *testing.T) {
		_, err := svc.CategoryGet(other.ID, cat.ID)
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})
}

func TestCategoryUpdate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "catupdate@example.com")
	other := seedUser(t, db, "catupdate2@example.com")
	svc := services.NewCategoryService(db)

	cat := seedCategory(t, db, user.ID, "OldName", "expense")

	t.Run("owner can update name", func(t *testing.T) {
		updated, err := svc.CategoryUpdate(user.ID, cat.ID, services.CategoryUpdateRequest{Name: "NewName"})
		require.NoError(t, err)
		assert.Equal(t, "NewName", updated.Name)
	})

	t.Run("owner can update color and icon", func(t *testing.T) {
		updated, err := svc.CategoryUpdate(user.ID, cat.ID, services.CategoryUpdateRequest{Color: "#000000", Icon: "star"})
		require.NoError(t, err)
		assert.Equal(t, "#000000", updated.Color)
		assert.Equal(t, "star", updated.Icon)
	})

	t.Run("other user cannot update", func(t *testing.T) {
		_, err := svc.CategoryUpdate(other.ID, cat.ID, services.CategoryUpdateRequest{Name: "Hacked"})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})
}

func TestCategoryList(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "catlist@example.com")
	svc := services.NewCategoryService(db)

	// seed a system default category (user_id = nil)
	db.Exec(
		"INSERT INTO categories (id, user_id, name, type, color, icon, is_default, created_at) VALUES (?, NULL, ?, ?, ?, ?, ?, datetime('now'))",
		uuid.New().String(), "System Default", "expense", "", "", true,
	)

	seedCategory(t, db, user.ID, "Personal", "expense")

	t.Run("list includes system defaults and user's own categories", func(t *testing.T) {
		cats, err := svc.CategoryList(user.ID)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(cats), 2) // at least 1 default + 1 user

		hasDefault := false
		hasPersonal := false
		for _, c := range cats {
			if c.IsDefault {
				hasDefault = true
			}
			if c.Name == "Personal" {
				hasPersonal = true
			}
		}
		assert.True(t, hasDefault, "system default categories should be included")
		assert.True(t, hasPersonal, "user's own categories should be included")
	})

	t.Run("does not include other user's categories", func(t *testing.T) {
		other := seedUser(t, db, "catlistother@example.com")
		seedCategory(t, db, other.ID, "OtherPrivate", "expense")

		cats, err := svc.CategoryList(user.ID)
		require.NoError(t, err)
		for _, c := range cats {
			assert.NotEqual(t, "OtherPrivate", c.Name)
		}
	})
}

func TestCategoryDelete(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "catdel@example.com")
	other := seedUser(t, db, "catdel2@example.com")
	svc := services.NewCategoryService(db)

	cat := seedCategory(t, db, user.ID, "ToDelete", "expense")

	t.Run("other user cannot delete", func(t *testing.T) {
		err := svc.CategoryDelete(other.ID, cat.ID)
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("owner can delete", func(t *testing.T) {
		err := svc.CategoryDelete(user.ID, cat.ID)
		require.NoError(t, err)

		_, err = svc.CategoryGet(user.ID, cat.ID)
		assert.Error(t, err)
	})
}

// seedCategory creates a category for use in tests.
func seedCategory(t *testing.T, db *gorm.DB, userID uuid.UUID, name, catType string) *models.Category {
	t.Helper()
	svc := services.NewCategoryService(db)
	cat, err := svc.CategoryCreate(userID, services.CategoryCreateRequest{
		Name:  name,
		Type:  catType,
		Color: "#CCCCCC",
		Icon:  "tag",
	})
	require.NoError(t, err)
	return cat
}
