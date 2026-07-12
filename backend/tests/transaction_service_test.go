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

func TestTransactionCreate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "tx@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	svc := services.NewTxService(db)

	t.Run("creates expense transaction with all fields", func(t *testing.T) {
		req := services.TxCreateRequest{
			AccountID:     acc.ID,
			Amount:        250.00,
			Type:          "expense",
			Description:   "Lunch",
			PaymentMethod: "mpesa",
			ReferenceID:   "REF001",
			Status:        "completed",
		}
		tx, err := svc.TxCreate(user.ID, req)
		require.NoError(t, err)
		assert.NotNil(t, tx)
		assert.Equal(t, user.ID, tx.UserID)
		assert.Equal(t, acc.ID, tx.AccountID)
		assert.Equal(t, 250.00, tx.Amount)
		assert.Equal(t, "expense", tx.Type)
		assert.Equal(t, "mpesa", tx.PaymentMethod)
	})

	t.Run("creates income transaction", func(t *testing.T) {
		incomeCat := seedCategory(t, db, user.ID, "Salary", "income")
		req := services.TxCreateRequest{
			AccountID:     acc.ID,
			CategoryID:    &incomeCat.ID,
			Amount:        50000.00,
			Type:          "income",
			Description:   "Monthly salary",
			PaymentMethod: "bank_transfer",
			ReferenceID:   "SAL001",
			Status:        "completed",
		}
		tx, err := svc.TxCreate(user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, "income", tx.Type)
		assert.Equal(t, 50000.00, tx.Amount)
	})

	t.Run("creates transaction without category", func(t *testing.T) {
		req := services.TxCreateRequest{
			AccountID:     acc.ID,
			CategoryID:    nil,
			Amount:        100.00,
			Type:          "expense",
			Description:   "Miscellaneous",
			PaymentMethod: "cash",
			ReferenceID:   "",
			Status:        "completed",
		}
		tx, err := svc.TxCreate(user.ID, req)
		require.NoError(t, err)
		assert.Nil(t, tx.CategoryID)
	})

	t.Run("user_id is set on the transaction", func(t *testing.T) {
		req := services.TxCreateRequest{
			AccountID:     acc.ID,
			Amount:        50.00,
			Type:          "expense",
			Description:   "Test",
			PaymentMethod: "cash",
			Status:        "completed",
		}
		tx, err := svc.TxCreate(user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, user.ID, tx.UserID, "UserID must be set on created transaction")
	})
}

func TestTransactionGet(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "txget@example.com")
	other := seedUser(t, db, "txget2@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	svc := services.NewTxService(db)

	tx := seedTransaction(t, db, user.ID, acc.ID, 100.00, "expense")

	t.Run("owner can retrieve transaction", func(t *testing.T) {
		result, err := svc.TxGet(user.ID, tx.ID)
		require.NoError(t, err)
		assert.Equal(t, tx.ID, result.ID)
	})

	t.Run("other user gets ErrForbidden", func(t *testing.T) {
		_, err := svc.TxGet(other.ID, tx.ID)
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("non-existent id returns error", func(t *testing.T) {
		_, err := svc.TxGet(user.ID, nonExistentUUID())
		assert.Error(t, err)
	})
}

func TestTransactionUpdate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "txupdate@example.com")
	other := seedUser(t, db, "txupdate2@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	svc := services.NewTxService(db)

	tx := seedTransaction(t, db, user.ID, acc.ID, 200.00, "expense")

	t.Run("owner can update description", func(t *testing.T) {
		updated, err := svc.TxUpdate(user.ID, tx.ID, services.TxUpdateRequest{Description: "Updated desc"})
		require.NoError(t, err)
		assert.Equal(t, "Updated desc", updated.Description)
	})

	t.Run("other user cannot update", func(t *testing.T) {
		_, err := svc.TxUpdate(other.ID, tx.ID, services.TxUpdateRequest{Description: "Hacked"})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})
}

func TestTransactionList(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "txlist@example.com")
	other := seedUser(t, db, "txlist2@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	otherAcc := seedAccount(t, db, other.ID, "bank")
	svc := services.NewTxService(db)

	t.Run("empty list for new user", func(t *testing.T) {
		fresh := seedUser(t, db, "txfresh@example.com")
		txs, err := svc.TxList(fresh.ID)
		require.NoError(t, err)
		assert.Len(t, txs, 0)
	})

	t.Run("lists only user's transactions", func(t *testing.T) {
		seedTransaction(t, db, user.ID, acc.ID, 100, "expense")
		seedTransaction(t, db, user.ID, acc.ID, 200, "expense")
		seedTransaction(t, db, other.ID, otherAcc.ID, 300, "expense")

		txs, err := svc.TxList(user.ID)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(txs), 2)
		for _, tx := range txs {
			assert.Equal(t, user.ID, tx.UserID)
		}
	})
}

func TestExportTransactions(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "txexport@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	svc := services.NewTxService(db)

	// seed recent transactions
	seedTransaction(t, db, user.ID, acc.ID, 100, "expense")
	seedTransaction(t, db, user.ID, acc.ID, 200, "income")

	t.Run("csv export returns data", func(t *testing.T) {
		data, contentType, err := svc.ExportTx(user.ID, "csv")
		require.NoError(t, err)
		assert.Equal(t, "text/csv", contentType)
		assert.NotEmpty(t, data)
	})

	t.Run("pdf export returns data", func(t *testing.T) {
		data, contentType, err := svc.ExportTx(user.ID, "pdf")
		require.NoError(t, err)
		assert.Equal(t, "application/pdf", contentType)
		assert.NotEmpty(t, data)
	})

	t.Run("user with no transactions returns ErrNotFound", func(t *testing.T) {
		empty := seedUser(t, db, "txempty@example.com")
		_, _, err := svc.ExportTx(empty.ID, "csv")
		assert.ErrorIs(t, err, utils.ErrNotFound)
	})
}

// seedTransaction creates a transaction for use in tests.
func seedTransaction(t *testing.T, db *gorm.DB, userID, accountID uuid.UUID, amount float64, txType string) *models.Transaction {
	t.Helper()
	svc := services.NewTxService(db)
	tx, err := svc.TxCreate(userID, services.TxCreateRequest{
		AccountID:     accountID,
		Amount:        amount,
		Type:          txType,
		Description:   "seed transaction",
		PaymentMethod: "cash",
		Status:        "completed",
	})
	require.NoError(t, err)
	return tx

}
