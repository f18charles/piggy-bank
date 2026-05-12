package repository

import (
	"errors"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionRepo struct {
	Db *gorm.DB
}

func NewTransactionRepo(db *gorm.DB) *TransactionRepo {
	return &TransactionRepo{
		Db: db,
	}
}

func (tr *TransactionRepo) CreateTransaction(tx *models.Transaction) error {
	result := tr.Db.Create(tx)
	return result.Error
}

func (tr *TransactionRepo) GetTransactionByID(txID uuid.UUID) (*models.Transaction, error) {
	var tx models.Transaction
	result := tr.Db.Where("id = ?", txID).Preload("Account").Preload("Category").First(&tx)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, utils.ErrNotFound
		}
		return nil, result.Error
	}
	return &tx, nil
}

func (tr *TransactionRepo) UpdateTransaction(tx *models.Transaction) error {
	result := tr.Db.Save(tx)
	return result.Error
}

func (tr *TransactionRepo) ListTransactionsByUser(userID uuid.UUID) ([]models.Transaction, error) {
	txs := []models.Transaction{}
	result := tr.Db.Where("user_id = ?", userID).Preload("Account").Preload("Category").Find(&txs)
	if result.Error != nil {
		return nil, result.Error
	}
	return txs, nil
}

func (tr *TransactionRepo) ListTransactionsByUserSince(user_id uuid.UUID, since_date time.Time) ([]models.Transaction, error) {
	var txs []models.Transaction
	result := tr.Db.Where("user_id = ? AND COALESCE(transaction_date, created_at) >= ?", user_id, since_date).Preload("Account").Preload("Category").Order("transaction_date DESC").Find(&txs)

	if result.Error != nil {
		return nil, result.Error
	}
	return txs, nil
}

func (tr *TransactionRepo) DeleteTransaction(id uuid.UUID) error {
	result := tr.Db.Delete(&models.Transaction{}, "id = ?", id)
	if result.Error != nil {
		return result.Error
	}
	return nil
}
