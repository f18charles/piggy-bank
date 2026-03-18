package api

import (
	"net/http"

	"github.com/f18charles/piggy-bank/backend/internal/api/handlers"
	"github.com/f18charles/piggy-bank/backend/internal/api/middleware"
	"github.com/f18charles/piggy-bank/backend/internal/database"
	"github.com/gin-gonic/gin"
)

// SetupRouter constructs and returns the Gin engine with all routes and
// middleware registered. Use this to start the HTTP server in main.
func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.Use(middleware.CORS())

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API v1
	v1 := r.Group("api/v1")

	db := database.DB

	authHandler := handlers.NewAuthHandler(db)
	accountHandler := handlers.NewAccHandler(db)
	txHandler := handlers.NewTxHandler(db)
	goalHandler := handlers.NewGoalHandler(db)
	budgetHandler := handlers.NewBudgetHandler(db)
	categoryHandler := handlers.NewCategoryHandler(db)
	summaryHandler := handlers.NewSummaryHandler(db)
	overviewHandler := handlers.NewOverviewHandler(db)
	spendingInsightsHandler := handlers.NewSpendingInsightsHandler(db)

	// public routes
	auth := v1.Group("/auth")
	{
		auth.POST("/register", authHandler.Register)
		auth.POST("/login", authHandler.Login)
	}

	// auth required
	protected := v1.Group("")
	protected.Use(middleware.AuthRequired())
	{
		// auth
		protected.POST("/auth/logout", authHandler.Logout)
		protected.GET("/auth/profile", authHandler.Profile)

		// Accounts
		protected.GET("/accounts", accountHandler.ListAccounts)
		protected.POST("/accounts", accountHandler.CreateAccount)
		protected.GET("/accounts/:id", accountHandler.GetAccount)
		protected.PUT("/accounts/:id", accountHandler.UpdateAccount)
		protected.DELETE("/accounts/:id", accountHandler.DeleteAccount)

		// Transactions
		protected.GET("/transactions", txHandler.ListTransactions)
		protected.POST("/transactions", txHandler.CreateTransactions)
		protected.GET("/transactions/:id", txHandler.GetTransaction)
		protected.PUT("/transactions/:id", txHandler.UpdateTransaction)
		protected.GET("/transactions/export", txHandler.ExportTransactions)

		// Categories
		protected.GET("/categories", categoryHandler.ListCategories)
		protected.POST("/categories", categoryHandler.CreateCategory)
		protected.PUT("/categories/:id", categoryHandler.UpdateCategory)
		protected.DELETE("/categories/:id", categoryHandler.DeleteCategory)

		// Budgets
		protected.GET("/budgets", budgetHandler.Listbudgets)
		protected.POST("/budgets", budgetHandler.CreateBudget)
		protected.GET("/budgets/:id", budgetHandler.GetBudget)
		protected.PUT("/budgets/:id", budgetHandler.UpdateBudget)
		protected.DELETE("/budgets/:id", budgetHandler.DeleteBudget)

		//	Goals
		protected.GET("/goals", goalHandler.ListGoals)
		protected.POST("/goals", goalHandler.CreateGoal)
		protected.GET("/goals/:id", goalHandler.GetGoal)
		protected.PUT("/goals/:id", goalHandler.UpdateGoal)
		protected.DELETE("/goals/:id", goalHandler.DeleteGoal)

		// Summary & Insights
		protected.GET("/insights/summary/monthly", summaryHandler.MonthlySummary)
		protected.GET("/insights/summary/yearly", summaryHandler.MonthlySummary)
		protected.GET("/insights/overview", overviewHandler.Overview)
		protected.GET("/insights/spending", spendingInsightsHandler.SpendingInsights)
	}

	return r
}
