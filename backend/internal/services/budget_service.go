package services

import (
	"errors"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetServices struct {
	budgetRepo *repository.BudgetRepo
}

// NewBudgetRepo creates and returns a BudgetServices instance with an initialized repository.
func NewBudgetService(db *gorm.DB) *BudgetServices {
	return &BudgetServices{
		budgetRepo: repository.NewBudgetRepo(db),
	}
}

type BudgetCreateRequest struct {
	CategoryID *uuid.UUID `json:"category_id" binding:"required"`
	Amount     float64    `json:"amount"`
	Period     string     `json:"period" binding:"required"`
	StartDate  *time.Time `json:"start_date"`
	EndDate    *time.Time `json:"end_date"`
}

// BudgetUpdateRequest deliberately has no Spent field: spending is derived
// from transactions and must not be overwritable through the API.
type BudgetUpdateRequest struct {
	CategoryID *uuid.UUID `json:"category_id"`
	Amount     float64    `json:"amount"`
	Period     string     `json:"period"`
	StartDate  *time.Time `json:"start_date"`
	EndDate    *time.Time `json:"end_date"`
}

// periodWindow returns the half-open window [start, end) that spending is
// summed over for a period, anchored to ref. Monthly/weekly/quarterly/yearly
// roll over automatically with the calendar; "custom" uses the budget's own
// stored dates.
func periodWindow(period string, ref time.Time) (time.Time, time.Time) {
	day := time.Date(ref.Year(), ref.Month(), ref.Day(), 0, 0, 0, 0, time.UTC)
	switch period {
	case "weekly":
		daysSinceMonday := (int(ref.Weekday()) + 6) % 7
		start := day.AddDate(0, 0, -daysSinceMonday)
		return start, start.AddDate(0, 0, 7)
	case "quarterly":
		q := (int(ref.Month()) - 1) / 3
		start := time.Date(ref.Year(), time.Month(q*3+1), 1, 0, 0, 0, 0, time.UTC)
		return start, start.AddDate(0, 3, 0)
	case "yearly":
		start := time.Date(ref.Year(), time.January, 1, 0, 0, 0, 0, time.UTC)
		return start, start.AddDate(1, 0, 0)
	default: // monthly
		start := time.Date(ref.Year(), ref.Month(), 1, 0, 0, 0, 0, time.UTC)
		return start, start.AddDate(0, 1, 0)
	}
}

// budgetWindow resolves the window to sum spending over for a budget.
func budgetWindow(b *models.Budget, ref time.Time) (time.Time, time.Time) {
	if b.Period == "custom" && !b.StartDate.IsZero() && !b.EndDate.IsZero() {
		return b.StartDate, b.EndDate.AddDate(0, 0, 1)
	}
	return periodWindow(b.Period, ref)
}

// computeSpent fills b.Spent from the transactions in the budget's window.
func (bs *BudgetServices) computeSpent(b *models.Budget) error {
	start, end := budgetWindow(b, time.Now())
	spent, err := bs.budgetRepo.SumCategoryExpenses(b.UserID, b.CategoryID, start, end)
	if err != nil {
		return err
	}
	b.Spent = spent
	return nil
}

// BudgetCreate creates a new budget for the given user based on the request and saves it via the repository.
func (bs *BudgetServices) BudgetCreate(user_id uuid.UUID, req BudgetCreateRequest) (*models.Budget, error) {
	if req.CategoryID == nil {
		return nil, errors.New("Category id required")
	}

	var start_date time.Time
	if req.StartDate != nil {
		start_date = *req.StartDate
	}

	var end_date time.Time
	if req.EndDate != nil {
		end_date = *req.EndDate
	}

	budget := &models.Budget{
		UserID:     user_id,
		CategoryID: *req.CategoryID,
		Amount:     req.Amount,
		Period:     req.Period,
		StartDate:  start_date,
		EndDate:    end_date,
	}
	if err := bs.budgetRepo.CreateBudget(budget); err != nil {
		return nil, err
	}
	created, err := bs.budgetRepo.GetBudgetByID(budget.ID)
	if err != nil {
		return nil, err
	}
	return bs.withSpent(created)
}

// BudgetGet retrieves a budget by ID and ensures the requesting user owns it.
func (bs *BudgetServices) BudgetGet(user_id, budget_id uuid.UUID) (*models.Budget, error) {
	budget, err := bs.budgetRepo.GetBudgetByID(budget_id)
	if err != nil {
		return nil, err
	}
	if budget.UserID != user_id {
		return nil, utils.ErrForbidden
	}
	return bs.withSpent(budget)
}

// BudgetUpdate updates allowed fields on a budget after verifying ownership.
func (bs *BudgetServices) BudgetUpdate(budget_id, user_id uuid.UUID, req BudgetUpdateRequest) (*models.Budget, error) {
	budget, err := bs.budgetRepo.GetBudgetByID(budget_id)
	if err != nil {
		return nil, err
	}
	if budget.UserID != user_id {
		return nil, utils.ErrForbidden
	}
	if req.CategoryID != nil {
		budget.CategoryID = *req.CategoryID
	}
	if req.Amount != 0 {
		budget.Amount = req.Amount
	}
	if req.Period != "" {
		budget.Period = req.Period
	}
	if req.StartDate != nil {
		budget.StartDate = *req.StartDate
	}
	if req.EndDate != nil {
		budget.EndDate = *req.EndDate
	}
	if err := bs.budgetRepo.UpdateBudget(budget); err != nil {
		return nil, err
	}
	return bs.withSpent(budget)
}

// BudgetList returns all budgets that belong to the specified user, each with
// spending computed for its active period.
func (bs *BudgetServices) BudgetList(user_id uuid.UUID) ([]models.Budget, error) {
	budgets, err := bs.budgetRepo.ListBudgetsByUser(user_id)
	if err != nil {
		return nil, err
	}
	for i := range budgets {
		if err := bs.computeSpent(&budgets[i]); err != nil {
			return nil, err
		}
	}
	return budgets, nil
}

// BudgetDelete removes a budget by ID using the repository.
func (bs *BudgetServices) BudgetDelete(budget_id, user_id uuid.UUID) error {
	budget, err := bs.budgetRepo.GetBudgetByID(budget_id)
	if err != nil {
		return err
	}
	if budget.UserID != user_id {
		return utils.ErrForbidden
	}
	if err := bs.budgetRepo.DeleteBudget(budget_id); err != nil {
		return err
	}
	return nil
}

func (bs *BudgetServices) withSpent(b *models.Budget) (*models.Budget, error) {
	if err := bs.computeSpent(b); err != nil {
		return nil, err
	}
	return b, nil
}
