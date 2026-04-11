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
	Spent      float64    `json:"spent"`
	Period     string     `json:"period" binding:"required"`
	StartDate  *time.Time `json:"start_date"`
	EndDate    *time.Time `json:"end_date"`
}

type BudgetUpdateRequest struct {
	CategoryID *uuid.UUID `json:"category_id"`
	Amount     float64    `json:"amount"`
	Spent      float64    `json:"spent"`
	Period     string     `json:"period"`
	StartDate  *time.Time `json:"start_date"`
	EndDate    *time.Time `json:"end_date"`
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
		Spent:      req.Spent,
		Period:     req.Period,
		StartDate:  start_date,
		EndDate:    end_date,
	}
	if err := bs.budgetRepo.CreateBudget(budget); err != nil {
		return nil, err
	}
	return bs.budgetRepo.GetBudgetByID(budget.ID)
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
	return budget, nil
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
	if req.Spent != 0 {
		budget.Spent = req.Spent
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
	return bs.budgetRepo.GetBudgetByID(budget.ID)
}

// BudgetList returns all budgets that belong to the specified user.
func (bs *BudgetServices) BudgetList(user_id uuid.UUID) ([]models.Budget, error) {
	budgets, err := bs.budgetRepo.ListBudgetsByUser(user_id)
	if err != nil {
		return nil, err
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
