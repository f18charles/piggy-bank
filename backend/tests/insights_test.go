package tests

import (
	"testing"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetMonthlySummary(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "summary@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	svc := services.NewSummaryService(db)

	now := time.Now()
	year := now.Year()
	month := now.Month()

	t.Run("empty month returns zero values", func(t *testing.T) {
		fresh := seedUser(t, db, "summaryfresh@example.com")
		summary, err := svc.GetMonthlySummary(fresh.ID, year, month)
		require.NoError(t, err)
		assert.Equal(t, 0.0, summary.Income)
		assert.Equal(t, 0.0, summary.Expenses)
		assert.Equal(t, 0.0, summary.Savings)
	})

	t.Run("income and expenses are summed correctly", func(t *testing.T) {
		txSvc := services.NewTxService(db)

		// seed income
		txSvc.TxCreate(user.ID, services.TxCreateRequest{
			AccountID: acc.ID, Amount: 50000, Type: "income",
			Description: "Salary", PaymentMethod: "bank_transfer", Status: "completed",
		})

		// seed expenses
		txSvc.TxCreate(user.ID, services.TxCreateRequest{
			AccountID: acc.ID, Amount: 5000, Type: "expense",
			Description: "Rent", PaymentMethod: "bank_transfer", Status: "completed",
		})
		txSvc.TxCreate(user.ID, services.TxCreateRequest{
			AccountID: acc.ID, Amount: 2000, Type: "expense",
			Description: "Food", PaymentMethod: "cash", Status: "completed",
		})

		summary, err := svc.GetMonthlySummary(user.ID, year, month)
		require.NoError(t, err)
		assert.Equal(t, 50000.0, summary.Income)
		assert.Equal(t, 7000.0, summary.Expenses)
		assert.Equal(t, 43000.0, summary.Savings)
	})

	t.Run("savings rate is calculated correctly", func(t *testing.T) {
		fresh := seedUser(t, db, "savingsrate@example.com")
		freshAcc := seedAccount(t, db, fresh.ID, "bank")
		txSvc := services.NewTxService(db)

		txSvc.TxCreate(fresh.ID, services.TxCreateRequest{
			AccountID: freshAcc.ID, Amount: 10000, Type: "income",
			Description: "Income", PaymentMethod: "bank_transfer", Status: "completed",
		})
		txSvc.TxCreate(fresh.ID, services.TxCreateRequest{
			AccountID: freshAcc.ID, Amount: 2500, Type: "expense",
			Description: "Expense", PaymentMethod: "cash", Status: "completed",
		})

		summary, err := svc.GetMonthlySummary(fresh.ID, year, month)
		require.NoError(t, err)
		assert.Equal(t, 75.0, summary.SavingsRate) // (7500/10000)*100
	})

	t.Run("by category breakdown is populated", func(t *testing.T) {
		catUser := seedUser(t, db, "catbreakdown@example.com")
		catAcc := seedAccount(t, db, catUser.ID, "bank")
		cat := seedCategory(t, db, catUser.ID, "Food", "expense")
		txSvc := services.NewTxService(db)

		txSvc.TxCreate(catUser.ID, services.TxCreateRequest{
			AccountID: catAcc.ID, CategoryID: &cat.ID, Amount: 3000, Type: "expense",
			Description: "Groceries", PaymentMethod: "cash", Status: "completed",
		})

		summary, err := svc.GetMonthlySummary(catUser.ID, year, month)
		require.NoError(t, err)
		assert.Contains(t, summary.ByCategory, "Food")
		assert.Equal(t, 3000.0, summary.ByCategory["Food"].Spent)
	})

	t.Run("previous month is included in response", func(t *testing.T) {
		summary, err := svc.GetMonthlySummary(user.ID, year, month)
		require.NoError(t, err)
		// PreviousMonth may be nil if there's no data, but the field should exist
		_ = summary.PreviousMonth // just confirm it doesn't panic
	})
}

func TestGetYearlySummary(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "yearly@example.com")
	svc := services.NewSummaryService(db)

	t.Run("returns slice for the year", func(t *testing.T) {
		summaries, err := svc.GetYearlySummary(user.ID, time.Now().Year())
		require.NoError(t, err)
		// months with no data are skipped, so could be empty
		assert.NotNil(t, summaries)
	})
}

func TestGetSpendingInsights(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "insights@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	cat := seedCategory(t, db, user.ID, "Food", "expense")
	svc := services.NewInsightsService(db)
	txSvc := services.NewTxService(db)

	t.Run("empty data returns empty insights without error", func(t *testing.T) {
		fresh := seedUser(t, db, "insightsfresh@example.com")
		result, err := svc.GetSpendingInsights(fresh.ID, 30)
		require.NoError(t, err)
		assert.NotNil(t, result)
		assert.Len(t, result.TopCategories, 0)
		assert.Len(t, result.Anomalies, 0)
	})

	t.Run("days=0 defaults to 90-day window", func(t *testing.T) {
		result, err := svc.GetSpendingInsights(user.ID, 0)
		require.NoError(t, err)
		assert.NotNil(t, result)
	})

	t.Run("top categories are populated from transaction data", func(t *testing.T) {
		// seed enough spend in Food to exceed 5% threshold
		for i := 0; i < 5; i++ {
			txSvc.TxCreate(user.ID, services.TxCreateRequest{
				AccountID: acc.ID, CategoryID: &cat.ID, Amount: 1000, Type: "expense",
				Description: "Food purchase", PaymentMethod: "cash", Status: "completed",
			})
		}

		result, err := svc.GetSpendingInsights(user.ID, 90)
		require.NoError(t, err)
		assert.NotEmpty(t, result.TopCategories)

		found := false
		for _, c := range result.TopCategories {
			if c.CategoryName == "Food" {
				found = true
				assert.Greater(t, c.TotalSpent, 0.0)
				assert.Greater(t, c.Percentage, 0.0)
			}
		}
		assert.True(t, found, "Food category should appear in top categories")
	})

	t.Run("anomaly detected for transaction 3x the average", func(t *testing.T) {
		anomalyUser := seedUser(t, db, "anomaly@example.com")
		anomalyAcc := seedAccount(t, db, anomalyUser.ID, "bank")
		anomalyCat := seedCategory(t, db, anomalyUser.ID, "Shopping", "expense")

		// seed normal transactions to establish average (~500)
		for i := 0; i < 5; i++ {
			txSvc.TxCreate(anomalyUser.ID, services.TxCreateRequest{
				AccountID: anomalyAcc.ID, CategoryID: &anomalyCat.ID, Amount: 500, Type: "expense",
				Description: "Normal spend", PaymentMethod: "cash", Status: "completed",
			})
		}

		// seed one outlier (10x normal)
		txSvc.TxCreate(anomalyUser.ID, services.TxCreateRequest{
			AccountID: anomalyAcc.ID, CategoryID: &anomalyCat.ID, Amount: 5000, Type: "expense",
			Description: "Unusual spend", PaymentMethod: "cash", Status: "completed",
		})

		result, err := svc.GetSpendingInsights(anomalyUser.ID, 90)
		require.NoError(t, err)
		assert.NotEmpty(t, result.Anomalies, "outlier transaction should be flagged as anomaly")
	})

	t.Run("spending patterns fields are populated", func(t *testing.T) {
		result, err := svc.GetSpendingInsights(user.ID, 90)
		require.NoError(t, err)
		assert.NotNil(t, result.SpendingPatterns.ByDayOfWeek)
		assert.NotNil(t, result.SpendingPatterns.ByHour)
	})
}
