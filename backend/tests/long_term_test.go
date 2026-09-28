package tests

import (
	"testing"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func setBalance(t *testing.T, db *gorm.DB, accountID interface{}, balance float64) {
	t.Helper()
	require.NoError(t, db.Model(&models.Account{}).Where("id = ?", accountID).Update("balance", balance).Error)
}

func getBalance(t *testing.T, db *gorm.DB, accountID interface{}) float64 {
	t.Helper()
	var acc models.Account
	require.NoError(t, db.Where("id = ?", accountID).First(&acc).Error)
	return acc.Balance
}

func TestTransferCreateAndDelete(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "transfer@example.com")
	from := seedAccount(t, db, user.ID, "bank")
	to := seedAccount(t, db, user.ID, "cash")
	setBalance(t, db, from.ID, 1000)
	setBalance(t, db, to.ID, 0)
	svc := services.NewTxService(db)

	tx, err := svc.TxCreate(user.ID, services.TxCreateRequest{
		FromAccountID: &from.ID,
		ToAccountID:   &to.ID,
		Amount:        250,
		Type:          "transfer",
		Description:   "ATM withdrawal",
		PaymentMethod: "cash",
		Status:        "completed",
	})
	require.NoError(t, err)
	require.NotNil(t, tx.ToAccountID)
	assert.Equal(t, "transfer", tx.Type)
	assert.Equal(t, from.ID, tx.AccountID, "account_id mirrors the source for transfers")
	assert.Equal(t, 750.0, getBalance(t, db, from.ID))
	assert.Equal(t, 250.0, getBalance(t, db, to.ID))

	t.Run("same source and destination is rejected", func(t *testing.T) {
		_, err := svc.TxCreate(user.ID, services.TxCreateRequest{
			FromAccountID: &from.ID,
			ToAccountID:   &from.ID,
			Amount:        10,
			Type:          "transfer",
		})
		assert.ErrorIs(t, err, utils.ErrBadRequest)
	})

	t.Run("missing destination is rejected", func(t *testing.T) {
		_, err := svc.TxCreate(user.ID, services.TxCreateRequest{
			FromAccountID: &from.ID,
			Amount:        10,
			Type:          "transfer",
		})
		assert.ErrorIs(t, err, utils.ErrBadRequest)
	})

	t.Run("delete reverses both balances", func(t *testing.T) {
		require.NoError(t, svc.TxDelete(user.ID, tx.ID))
		assert.Equal(t, 1000.0, getBalance(t, db, from.ID))
		assert.Equal(t, 0.0, getBalance(t, db, to.ID))
	})
}

func TestTransferExcludedFromSummary(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "transfersum@example.com")
	from := seedAccount(t, db, user.ID, "bank")
	to := seedAccount(t, db, user.ID, "cash")
	svc := services.NewTxService(db)

	_, err := svc.TxCreate(user.ID, services.TxCreateRequest{
		FromAccountID: &from.ID,
		ToAccountID:   &to.ID,
		Amount:        500,
		Type:          "transfer",
		Description:   "Move to cash",
		PaymentMethod: "cash",
		Status:        "completed",
	})
	require.NoError(t, err)

	summarySvc := services.NewSummaryService(db)
	now := time.Now()
	summary, err := summarySvc.GetMonthlySummary(user.ID, now.Year(), now.Month())
	require.NoError(t, err)
	assert.Equal(t, 0.0, summary.Income, "transfers are not income")
	assert.Equal(t, 0.0, summary.Expenses, "transfers are not expenses")
}

func TestTransactionFullEditAdjustsBalances(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "fulledit@example.com")
	accA := seedAccount(t, db, user.ID, "bank")
	accB := seedAccount(t, db, user.ID, "cash")
	setBalance(t, db, accA.ID, 1000)
	setBalance(t, db, accB.ID, 1000)
	svc := services.NewTxService(db)

	tx, err := svc.TxCreate(user.ID, services.TxCreateRequest{
		AccountID:     accA.ID,
		Amount:        100,
		Type:          "expense",
		Description:   "Lunch",
		PaymentMethod: "cash",
		Status:        "completed",
	})
	require.NoError(t, err)
	require.Equal(t, 900.0, getBalance(t, db, accA.ID))

	newAmount := 300.0
	updated, err := svc.TxUpdate(user.ID, tx.ID, services.TxUpdateRequest{
		Amount:    &newAmount,
		AccountID: &accB.ID,
		Type:      "expense",
	})
	require.NoError(t, err)
	assert.Equal(t, 300.0, updated.Amount)
	assert.Equal(t, accB.ID, updated.AccountID)
	assert.Equal(t, 1000.0, getBalance(t, db, accA.ID), "old account is restored")
	assert.Equal(t, 700.0, getBalance(t, db, accB.ID), "new account is debited the new amount")
}

func TestRecurringRunDue(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "recurring@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	setBalance(t, db, acc.ID, 1000)
	cat := seedCategory(t, db, user.ID, "Rent", "expense")
	svc := services.NewRecurringService(db)

	due := time.Now()
	item, err := svc.RecurringCreate(user.ID, services.RecurringCreateRequest{
		AccountID:     acc.ID,
		CategoryID:    &cat.ID,
		Amount:        400,
		Type:          "expense",
		Description:   "Monthly rent",
		PaymentMethod: "bank_transfer",
		Frequency:     "monthly",
		NextDueDate:   &due,
	})
	require.NoError(t, err)
	require.NotNil(t, item)

	created, err := svc.RunDue(time.Now())
	require.NoError(t, err)
	assert.Equal(t, 1, created)
	assert.Equal(t, 600.0, getBalance(t, db, acc.ID))

	updated, err := svc.RecurringGet(user.ID, item.ID)
	require.NoError(t, err)
	assert.True(t, updated.NextDueDate.After(time.Now()), "due date should advance into the future")
	require.NotNil(t, updated.LastRunAt)

	// Running again immediately must not double-post.
	createdAgain, err := svc.RunDue(time.Now())
	require.NoError(t, err)
	assert.Equal(t, 0, createdAgain)
	assert.Equal(t, 600.0, getBalance(t, db, acc.ID))
}

func TestBulkIngestDedupe(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "bulk@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	svc := services.NewTxService(db)

	reqs := []services.TxCreateRequest{
		{AccountID: acc.ID, Amount: 100, Type: "expense", Description: "SMS 1", PaymentMethod: "mpesa", Status: "completed", ReferenceID: "MPESA-1"},
		{AccountID: acc.ID, Amount: 100, Type: "expense", Description: "SMS 1 dup", PaymentMethod: "mpesa", Status: "completed", ReferenceID: "MPESA-1"},
		{AccountID: acc.ID, Amount: 200, Type: "income", Description: "SMS 2", PaymentMethod: "mpesa", Status: "completed", ReferenceID: "MPESA-2"},
	}
	result, err := svc.TxCreateBulk(user.ID, reqs)
	require.NoError(t, err)
	assert.Len(t, result.Created, 2)
	assert.Equal(t, 1, result.Skipped)

	// A second delivery of the same batch is fully skipped.
	result2, err := svc.TxCreateBulk(user.ID, reqs)
	require.NoError(t, err)
	assert.Len(t, result2.Created, 0)
	assert.Equal(t, 3, result2.Skipped)
}

func TestNetWorthSnapshot(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "snapshot@example.com")
	accA := seedAccount(t, db, user.ID, "bank")
	accB := seedAccount(t, db, user.ID, "cash")
	setBalance(t, db, accA.ID, 1500)
	setBalance(t, db, accB.ID, 500)
	svc := services.NewSnapshotService(db)

	require.NoError(t, svc.SnapshotUser(user.ID, time.Now()))
	// Running twice on the same day upserts, not duplicates.
	require.NoError(t, svc.SnapshotUser(user.ID, time.Now()))

	history, err := svc.History(user.ID, 10)
	require.NoError(t, err)
	require.Len(t, history, 1)
	assert.Equal(t, 2000.0, history[0].TotalNetWorth)

	change, err := svc.ChangeSince(user.ID, time.Now().AddDate(0, -1, 0))
	require.NoError(t, err)
	assert.Equal(t, 0.0, change, "no baseline before this month yet")
}

func TestDynamicBudgetSpent(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "dynbudget@example.com")
	cat := seedCategory(t, db, user.ID, "Food", "expense")
	otherCat := seedCategory(t, db, user.ID, "Rent", "expense")
	acc := seedAccount(t, db, user.ID, "bank")
	otherAcc := seedAccount(t, db, user.ID, "cash")
	txSvc := services.NewTxService(db)
	budgetSvc := services.NewBudgetService(db)

	now := time.Now()
	start := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	end := start.AddDate(0, 1, 0)
	budget, err := budgetSvc.BudgetCreate(user.ID, services.BudgetCreateRequest{
		CategoryID: &cat.ID,
		Amount:     5000,
		Period:     "monthly",
		StartDate:  &start,
		EndDate:    &end,
	})
	require.NoError(t, err)
	assert.Equal(t, 0.0, budget.Spent)

	_, err = txSvc.TxCreate(user.ID, services.TxCreateRequest{
		AccountID:     acc.ID,
		CategoryID:    &cat.ID,
		Amount:        1200,
		Type:          "expense",
		Description:   "Groceries",
		PaymentMethod: "mpesa",
		Status:        "completed",
	})
	require.NoError(t, err)
	_, err = txSvc.TxCreate(user.ID, services.TxCreateRequest{
		AccountID:     acc.ID,
		CategoryID:    &otherCat.ID,
		Amount:        900,
		Type:          "expense",
		Description:   "Rent",
		PaymentMethod: "bank_transfer",
		Status:        "completed",
	})
	require.NoError(t, err)
	// a transfer must never count toward budget spending
	_, err = txSvc.TxCreate(user.ID, services.TxCreateRequest{
		FromAccountID: &acc.ID,
		ToAccountID:   &otherAcc.ID,
		Amount:        300,
		Type:          "transfer",
		Description:   "Move",
		PaymentMethod: "cash",
		Status:        "completed",
	})
	require.NoError(t, err)

	list, err := budgetSvc.BudgetList(user.ID)
	require.NoError(t, err)
	require.Len(t, list, 1)
	assert.Equal(t, 1200.0, list[0].Spent, "only the matching-category expense counts")

	got, err := budgetSvc.BudgetGet(user.ID, budget.ID)
	require.NoError(t, err)
	assert.Equal(t, 1200.0, got.Spent)
}
