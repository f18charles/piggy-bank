package overview

import (
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/google/uuid"
)

type DashboardOverview struct {
	NetWorth      NetWorthBrief        `json:"net_worth"`
	MonthlyBurn   MonthlyBurnBrief     `json:"monthly_burn"`
	Accounts      []AccountBrief       `json:"accounts"`
	BudgetHealth  []BugdetBrief        `json:"budget_health"`
	GoalsProgress []GoalBrief          `json:"goals_progress"`
	RecentTx      []models.Transaction `json:"recent_transactions"`
	QuickInsights []string             `json:"quick_insights"`
}

type NetWorthBrief struct {
	NetWorth float64 `json:"net_worth"`
	Currency string  `json:"currency"`
	// TODO: computing a real month-over-month change needs a stored net
	// worth history/snapshot (planned as a future model hook). Stubbed at
	// 0 until that exists.
	ChangePercentage float64 `json:"change_percentage"`
	TotalAssets      float64 `json:"total_assets"`
	TotalLiabilities float64 `json:"total_liabilities"`
}

type MonthlyBurnBrief struct {
	Currency            string  `json:"currency"`
	BurnRate            float64 `json:"burn_rate"`
	AverageMonthlySpend float64 `json:"average_monthly_spend"`
	MonthlyIncome       float64 `json:"monthly_income"`
	ProjectedRunway     float64 `json:"projected_runway"`
}

type AccountBrief struct {
	ID       uuid.UUID `json:"id"`
	Name     string    `json:"name"`
	Type     string    `json:"type"`
	Balance  float64   `json:"balance"`
	Currency string    `json:"currency"`
}

type BugdetBrief struct {
	CategoryName string  `json:"category_name"`
	Spent        float64 `json:"spent"`
	Budget       float64 `json:"budget"`
	Percentage   float64 `json:"percentage"`
	Color        string  `json:"color"`
}

type GoalBrief struct {
	ID            uuid.UUID  `json:"id"`
	Name          string     `json:"name"`
	TargetAmount  float64    `json:"target_amount"`
	CurrentAmount float64    `json:"current_amount"`
	Percentage    float64    `json:"percentage"`
	Deadline      *time.Time `json:"deadline,omitempty"`
}
