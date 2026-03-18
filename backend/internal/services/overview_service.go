package services

import (
	"strconv"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/f18charles/piggy-bank/backend/pkg/overview"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OverviewService struct {
	db           *gorm.DB
	overviewRepo repository.OverviewRepo
	accountsRepo repository.AccountRepo
	budgetsRepo  repository.BudgetRepo
	goalsRepo    repository.GoalRepo
}

func NewOverviewService(db *gorm.DB) *OverviewService {
	return &OverviewService{
		db:           db,
		overviewRepo: *repository.NewOverviewRepo(db),
		accountsRepo: *repository.NewAccountRepo(db),
		budgetsRepo:  *repository.NewBudgetRepo(db),
		goalsRepo:    *repository.NewGoalRepo(db),
	}
}

func (os *OverviewService) GetDashboardOverview(user_id uuid.UUID) (*overview.DashboardOverview, error) {
	over_view := &overview.DashboardOverview{
		QuickInsights: []string{},
	}

	// get all accounts and networth
	accounts, err := os.accountsRepo.ListAccountByUser(user_id)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	for _, acc := range accounts {
		over_view.NetWorth += acc.Balance
		over_view.Accounts = append(over_view.Accounts, overview.AccountBrief{
			ID:       acc.ID,
			Name:     acc.Name,
			Type:     acc.Type,
			Balance:  acc.Balance,
			Currency: acc.Currency,
		})
	}

	// calculate monthly burn
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	monthly_expenses, err := os.overviewRepo.GetMonthlyExpenses(user_id, startOfMonth)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	over_view.MonthlyBurn = monthly_expenses

	// get budget health
	budgets, err := os.budgetsRepo.ListBudgetsByUser(user_id)
	if err != nil {
		return nil, err
	}

	for _, b := range budgets {
		if b.CategoryID != uuid.Nil {
			percentage := (b.Spent / b.Amount) * 100
			over_view.BudgetHealth = append(over_view.BudgetHealth, overview.BugdetBrief{
				CategoryName: b.Category.Name,
				Spent:        b.Spent,
				Budget:       b.Amount,
				Percentage:   percentage,
				Color:        b.Category.Color,
			})

			// insights
			if percentage > 90 {
				over_view.QuickInsights = append(over_view.QuickInsights, "⚠️ You're close to your "+b.Category.Name+" budget limit")
			}
		}
	}

	// get goals progress
	goals, err := os.goalsRepo.ListGoalsByUser(user_id)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	for _, g := range goals {
		percentage := (g.CurrentAmount / g.TargetAmount) * 100
		over_view.GoalsProgress = append(over_view.GoalsProgress, overview.GoalBrief{
			ID:            g.ID,
			Name:          g.Name,
			TargetAmount:  g.TargetAmount,
			CurrentAmount: g.CurrentAmount,
			Percentage:    percentage,
			Deadline:      g.Deadline,
		})
	}

	if err := os.overviewRepo.GetLatestTransactions(user_id, over_view); err != nil {
		return nil, err
	}

	// more insights
	if len(goals) > 0 {
		closestGoal := goals[0]
		for _, g := range goals {
			if g.Deadline != nil && (closestGoal.Deadline == nil || g.Deadline.Before(*closestGoal.Deadline)) {
				closestGoal = g
			}
		}
		if closestGoal.Deadline != nil {
			days_left := int(time.Until(*closestGoal.Deadline).Hours() / 24)
			over_view.QuickInsights = append(over_view.QuickInsights, "🎯 You have "+strconv.Itoa(days_left)+" days left for '"+closestGoal.Name+"'")
		}
	}
	return over_view, nil
}
