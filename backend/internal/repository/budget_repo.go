package repository

import (
	"errors"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type BudgetRepo struct {
	db *gorm.DB
}

func NewBudgetRepo(db *gorm.DB) *BudgetRepo {
	return &BudgetRepo{
		db: db,
	}
}

func (br *BudgetRepo) CreateBudget(budget *models.Budget) error {
	return br.db.Create(budget).Error
}

func (br *BudgetRepo) GetBudgetByID(budget_id uuid.UUID) (*models.Budget, error) {
	var budget models.Budget
	result := br.db.Where("id = ?", budget_id).Preload("Category").First(&budget)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, utils.ErrNotFound
		}
		return nil, result.Error
	}
	return &budget, nil
}

func (br *BudgetRepo) UpdateBudget(budget *models.Budget) error {
	return br.db.Save(budget).Error
}

func (br *BudgetRepo) ListBudgetsByUser(user_id uuid.UUID) ([]models.Budget, error) {
	budgets := []models.Budget{}
	result := br.db.Where("user_id = ?", user_id).Preload("Category").Find(&budgets)
	if result.Error != nil {
		return nil, result.Error
	}
	return budgets, nil
}

func (br *BudgetRepo) DeleteBudget(budget_id uuid.UUID) error {
	result := br.db.Delete(&models.Budget{}, "id = ?", budget_id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
