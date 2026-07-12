package services

import (
	"math"
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
	userRepo     repository.UserRepository
}

func NewOverviewService(db *gorm.DB) *OverviewService {
	return &OverviewService{
		db:           db,
		overviewRepo: *repository.NewOverviewRepo(db),
		accountsRepo: *repository.NewAccountRepo(db),
		budgetsRepo:  *repository.NewBudgetRepo(db),
		goalsRepo:    *repository.NewGoalRepo(db),
		userRepo:     *repository.NewUserRepository(db),
	}
}

func (os *OverviewService) GetDashboardOverview(user_id uuid.UUID) (*overview.DashboardOverview, error) {
	over_view := &overview.DashboardOverview{
		QuickInsights: []string{},
	}

	// user's currency preference -- used to label both net worth and
	// monthly burn figures. Single-currency assumption for now: if a user
	// has accounts in multiple currencies, this doesn't convert between
	// them, it just labels everything with the user's preferred currency.
	user, err := os.userRepo.GetUserByID(user_id)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	// get all accounts and net worth
	accounts, err := os.accountsRepo.ListAccountByUser(user_id)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	var totalAssets, totalLiabilities float64
	// NOTE: "credit" accounts are treated as liabilities, everything else
	// (checking/savings/investment) as assets. This is a simplification --
	// a proper AccountType classification (is this account a liability?)
	// is a good candidate for the model hooks planned later.
	for _, acc := range accounts {
		if acc.Type == "credit" {
			totalLiabilities += math.Abs(acc.Balance)
		} else {
			totalAssets += acc.Balance
		}

		over_view.Accounts = append(over_view.Accounts, overview.AccountBrief{
			ID:       acc.ID,
			Name:     acc.Name,
			Type:     acc.Type,
			Balance:  acc.Balance,
			Currency: acc.Currency,
		})
	}

	over_view.NetWorth = overview.NetWorthBrief{
		NetWorth:         totalAssets - totalLiabilities,
		Currency:         user.Currency,
		ChangePercentage: 0, // TODO: needs a stored net worth history, see NetWorthBrief comment
		TotalAssets:      totalAssets,
		TotalLiabilities: totalLiabilities,
	}

	// calculate monthly burn
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	monthly_expenses, err := os.overviewRepo.GetMonthlyExpenses(user_id, startOfMonth)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	monthly_income, err := os.overviewRepo.GetMonthlyIncome(user_id, startOfMonth)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	var burnRate float64
	if monthly_income > 0 {
		burnRate = (monthly_expenses / monthly_income) * 100
	}

	var projectedRunway float64
	if monthly_expenses > 0 {
		projectedRunway = totalAssets / monthly_expenses
	}

	over_view.MonthlyBurn = overview.MonthlyBurnBrief{
		Currency:            user.Currency,
		BurnRate:            burnRate,
		AverageMonthlySpend: monthly_expenses,
		MonthlyIncome:       monthly_income,
		ProjectedRunway:     projectedRunway,
	}

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
