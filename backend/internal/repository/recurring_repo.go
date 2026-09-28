package repository

import (
	"errors"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RecurringRepo struct {
	db *gorm.DB
}

func NewRecurringRepo(db *gorm.DB) *RecurringRepo {
	return &RecurringRepo{db: db}
}

func (r *RecurringRepo) Create(item *models.RecurringTransaction) error {
	return r.db.Create(item).Error
}

func (r *RecurringRepo) GetByID(id uuid.UUID) (*models.RecurringTransaction, error) {
	var item models.RecurringTransaction
	result := r.db.Where("id = ?", id).Preload("Account").Preload("ToAccount").Preload("Category").First(&item)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, utils.ErrNotFound
		}
		return nil, result.Error
	}
	return &item, nil
}

func (r *RecurringRepo) Update(item *models.RecurringTransaction) error {
	return r.db.Save(item).Error
}

func (r *RecurringRepo) Delete(id uuid.UUID) error {
	return r.db.Delete(&models.RecurringTransaction{}, "id = ?", id).Error
}

func (r *RecurringRepo) ListByUser(userID uuid.UUID) ([]models.RecurringTransaction, error) {
	items := []models.RecurringTransaction{}
	result := r.db.Where("user_id = ?", userID).
		Preload("Account").Preload("ToAccount").Preload("Category").
		Order("next_due_date ASC").Find(&items)
	if result.Error != nil {
		return nil, result.Error
	}
	return items, nil
}

// ListDue returns every active recurring transaction whose next_due_date has
// arrived, across all users. Only the scheduler should call this.
func (r *RecurringRepo) ListDue(asOf time.Time) ([]models.RecurringTransaction, error) {
	items := []models.RecurringTransaction{}
	result := r.db.Where("is_active = ? AND next_due_date <= ?", true, asOf).
		Order("next_due_date ASC").Find(&items)
	if result.Error != nil {
		return nil, result.Error
	}
	return items, nil
}
