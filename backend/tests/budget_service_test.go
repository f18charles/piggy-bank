package tests

import (
	"testing"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestBudgetCreate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "budget@example.com")
	cat := seedCategory(t, db, user.ID, "Food", "expense")
	svc := services.NewBudgetRepo(db)

	start := time.Now()
	end := start.AddDate(0, 1, 0)

	t.Run("creates budget successfully", func(t *testing.T) {
		req := services.BudgetCreateRequest{
			CategoryID: &cat.ID,
			Amount:     5000.00,
			Period:     "monthly",
			StartDate:  &start,
			EndDate:    &end,
		}
		budget, err := svc.BudgetCreate(user.ID, req)
		require.NoError(t, err)
		assert.NotNil(t, budget)
		assert.Equal(t, 5000.00, budget.Amount)
		assert.Equal(t, user.ID, budget.UserID)
		assert.Equal(t, cat.ID, budget.CategoryID)
	})

	t.Run("spent starts at zero, not at amount", func(t *testing.T) {
		req := services.BudgetCreateRequest{
			CategoryID: &cat.ID,
			Amount:     3000.00,
			Period:     "monthly",
			StartDate:  &start,
			EndDate:    &end,
		}
		budget, err := svc.BudgetCreate(user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, 0.0, budget.Spent, "Spent must start at 0, not copied from Amount")
	})

	t.Run("handles nil dates safely", func(t *testing.T) {
		req := services.BudgetCreateRequest{
			CategoryID: &cat.ID,
			Amount:     2000.00,
			Period:     "monthly",
			StartDate:  nil,
			EndDate:    nil,
		}

		budget, err := svc.BudgetCreate(user.ID, req)
		require.NoError(t, err)

		assert.NotNil(t, budget)
		assert.True(t, budget.StartDate.IsZero())
		assert.True(t, budget.EndDate.IsZero())
	})

	t.Run("fails when category_id is nil", func(t *testing.T) {
		req := services.BudgetCreateRequest{
			CategoryID: nil,
			Amount:     2000.00,
			Period:     "monthly",
		}

		budget, err := svc.BudgetCreate(user.ID, req)
		require.Error(t, err)
		assert.Nil(t, budget)
	})
}

func TestBudgetGet(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "budgetget@example.com")
	other := seedUser(t, db, "budgetget2@example.com")
	cat := seedCategory(t, db, user.ID, "Transport", "expense")
	svc := services.NewBudgetRepo(db)

	start := time.Now()
	end := start.AddDate(0, 1, 0)
	budget, _ := svc.BudgetCreate(user.ID, services.BudgetCreateRequest{
		CategoryID: &cat.ID,
		Amount:     2000,
		Period:     "monthly",
		StartDate:  &start,
		EndDate:    &end,
	})

	t.Run("owner can retrieve budget", func(t *testing.T) {
		result, err := svc.BudgetGet(user.ID, budget.ID)
		require.NoError(t, err)
		assert.Equal(t, budget.ID, result.ID)
	})

	t.Run("other user gets ErrForbidden", func(t *testing.T) {
		_, err := svc.BudgetGet(other.ID, budget.ID)
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("non-existent budget returns error", func(t *testing.T) {
		_, err := svc.BudgetGet(user.ID, nonExistentUUID())
		assert.Error(t, err)
	})
}

func TestBudgetUpdate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "budgetupdate@example.com")
	other := seedUser(t, db, "budgetupdate2@example.com")
	cat := seedCategory(t, db, user.ID, "Entertainment", "expense")
	svc := services.NewBudgetRepo(db)

	start := time.Now()
	end := start.AddDate(0, 1, 0)
	budget, _ := svc.BudgetCreate(user.ID, services.BudgetCreateRequest{
		CategoryID: &cat.ID,
		Amount:     1000,
		Period:     "monthly",
		StartDate:  &start,
		EndDate:    &end,
	})

	t.Run("owner can update amount", func(t *testing.T) {
		updated, err := svc.BudgetUpdate(budget.ID, user.ID, services.BudgetUpdateRequest{Amount: 1500})
		require.NoError(t, err)
		assert.Equal(t, 1500.0, updated.Amount)
	})

	t.Run("update is persisted to the database", func(t *testing.T) {
		_, err := svc.BudgetUpdate(budget.ID, user.ID, services.BudgetUpdateRequest{Amount: 2000})
		require.NoError(t, err)

		// re-fetch and confirm the change was saved
		fetched, err := svc.BudgetGet(user.ID, budget.ID)
		require.NoError(t, err)
		assert.Equal(t, 2000.0, fetched.Amount, "BudgetUpdate must persist changes to the DB")
	})

	t.Run("other user cannot update", func(t *testing.T) {
		_, err := svc.BudgetUpdate(budget.ID, other.ID, services.BudgetUpdateRequest{Amount: 9999})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})
}

func TestBudgetList(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "budgetlist@example.com")
	cat1 := seedCategory(t, db, user.ID, "Food", "expense")
	cat2 := seedCategory(t, db, user.ID, "Rent", "expense")
	svc := services.NewBudgetRepo(db)

	start := time.Now()
	end := start.AddDate(0, 1, 0)

	t.Run("empty list for new user", func(t *testing.T) {
		fresh := seedUser(t, db, "budgetfresh@example.com")
		budgets, err := svc.BudgetList(fresh.ID)
		require.NoError(t, err)
		assert.Len(t, budgets, 0)
	})

	t.Run("lists only user's budgets", func(t *testing.T) {
		other := seedUser(t, db, "budgetother@example.com")
		otherCat := seedCategory(t, db, other.ID, "Other", "expense")

		svc.BudgetCreate(user.ID, services.BudgetCreateRequest{CategoryID: &cat1.ID, Amount: 1000, Period: "monthly", StartDate: &start, EndDate: &end})
		svc.BudgetCreate(user.ID, services.BudgetCreateRequest{CategoryID: &cat2.ID, Amount: 2000, Period: "monthly", StartDate: &start, EndDate: &end})
		svc.BudgetCreate(other.ID, services.BudgetCreateRequest{CategoryID: &otherCat.ID, Amount: 500, Period: "monthly", StartDate: &start, EndDate: &end})

		budgets, err := svc.BudgetList(user.ID)
		require.NoError(t, err)
		assert.Len(t, budgets, 2)
		for _, b := range budgets {
			assert.Equal(t, user.ID, b.UserID)
		}
	})
}

func TestBudgetDelete(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "budgetdel@example.com")
	cat := seedCategory(t, db, user.ID, "Shopping", "expense")
	svc := services.NewBudgetRepo(db)

	start := time.Now()
	end := start.AddDate(0, 1, 0)
	budget, _ := svc.BudgetCreate(user.ID, services.BudgetCreateRequest{
		CategoryID: &cat.ID,
		Amount:     500,
		Period:     "monthly",
		StartDate:  &start,
		EndDate:    &end,
	})

	t.Run("deletes budget successfully", func(t *testing.T) {
		err := svc.BudgetDelete(budget.ID, user.ID)
		require.NoError(t, err)

		_, err = svc.BudgetGet(user.ID, budget.ID)
		assert.Error(t, err)
	})
}
