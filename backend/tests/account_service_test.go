package tests

import (
	"testing"

	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestAccountCreate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "accounts@example.com")
	svc := services.NewAccService(db)

	t.Run("creates account successfully", func(t *testing.T) {
		req := services.AccCreateRequest{
			Name:    "NCBA Main",
			Type:    "bank",
			Balance: 5000.00,
		}
		acc, err := svc.AccountCreate(user.ID, req)
		require.NoError(t, err)
		assert.NotNil(t, acc)
		assert.Equal(t, "NCBA Main", acc.Name)
		assert.Equal(t, "bank", acc.Type)
		assert.Equal(t, 5000.00, acc.Balance)
		assert.Equal(t, user.ID, acc.UserID)
	})

	t.Run("creates mpesa account with zero balance", func(t *testing.T) {
		req := services.AccCreateRequest{
			Name: "M-Pesa",
			Type: "mpesa",
		}
		acc, err := svc.AccountCreate(user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, 0.0, acc.Balance)
		assert.Equal(t, "mpesa", acc.Type)
	})

	t.Run("two users can have accounts with same name", func(t *testing.T) {
		user2 := seedUser(t, db, "accounts2@example.com")
		req := services.AccCreateRequest{Name: "Cash", Type: "cash"}

		acc1, err := svc.AccountCreate(user.ID, req)
		require.NoError(t, err)

		acc2, err := svc.AccountCreate(user2.ID, req)
		require.NoError(t, err)

		assert.NotEqual(t, acc1.ID, acc2.ID)
	})
}

func TestAccountGet(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "accget@example.com")
	other := seedUser(t, db, "accget2@example.com")
	svc := services.NewAccService(db)

	acc, err := svc.AccountCreate(user.ID, services.AccCreateRequest{Name: "Savings", Type: "bank", Balance: 1000})
	require.NoError(t, err)

	t.Run("owner can retrieve their account", func(t *testing.T) {
		result, err := svc.GetAccount(user.ID, acc.ID)
		require.NoError(t, err)
		assert.Equal(t, acc.ID, result.ID)
	})

	t.Run("other user gets ErrForbidden", func(t *testing.T) {
		_, err := svc.GetAccount(other.ID, acc.ID)
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("non-existent account returns error", func(t *testing.T) {
		_, err := svc.GetAccount(user.ID, nonExistentUUID())
		assert.Error(t, err)
	})
}

func TestAccountUpdate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "accupdate@example.com")
	other := seedUser(t, db, "accupdate2@example.com")
	svc := services.NewAccService(db)

	acc, _ := svc.AccountCreate(user.ID, services.AccCreateRequest{Name: "Old Name", Type: "cash", Balance: 100})

	t.Run("owner can update name", func(t *testing.T) {
		updated, err := svc.AccountUpdate(user.ID, acc.ID, services.AccUpdateRequest{Name: "New Name"})
		require.NoError(t, err)
		assert.Equal(t, "New Name", updated.Name)
	})

	t.Run("owner can update balance", func(t *testing.T) {
		updated, err := svc.AccountUpdate(user.ID, acc.ID, services.AccUpdateRequest{Balance: 9999.99})
		require.NoError(t, err)
		assert.Equal(t, 9999.99, updated.Balance)
	})

	t.Run("other user cannot update", func(t *testing.T) {
		_, err := svc.AccountUpdate(other.ID, acc.ID, services.AccUpdateRequest{Name: "Hacked"})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})
}

func TestAccountList(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "acclist@example.com")
	svc := services.NewAccService(db)

	t.Run("empty list for new user", func(t *testing.T) {
		accounts, err := svc.AccountList(user.ID)
		require.NoError(t, err)
		assert.Len(t, accounts, 0)
	})

	t.Run("lists only user's accounts", func(t *testing.T) {
		other := seedUser(t, db, "acclist2@example.com")
		svc.AccountCreate(user.ID, services.AccCreateRequest{Name: "A1", Type: "cash"})
		svc.AccountCreate(user.ID, services.AccCreateRequest{Name: "A2", Type: "bank"})
		svc.AccountCreate(other.ID, services.AccCreateRequest{Name: "Other", Type: "mpesa"})

		accounts, err := svc.AccountList(user.ID)
		require.NoError(t, err)
		assert.Len(t, accounts, 2)
		for _, a := range accounts {
			assert.Equal(t, user.ID, a.UserID)
		}
	})
}

func TestAccountDelete(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "accdel@example.com")
	other := seedUser(t, db, "accdel2@example.com")
	svc := services.NewAccService(db)

	acc, _ := svc.AccountCreate(user.ID, services.AccCreateRequest{Name: "ToDelete", Type: "cash"})

	t.Run("other user cannot delete", func(t *testing.T) {
		err := svc.AccountDelete(other.ID, acc.ID)
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("owner can delete", func(t *testing.T) {
		err := svc.AccountDelete(user.ID, acc.ID)
		require.NoError(t, err)

		// confirm it's gone
		_, err = svc.GetAccount(user.ID, acc.ID)
		assert.Error(t, err)
	})
}