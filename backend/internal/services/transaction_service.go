package services

import (
	"errors"
	"log/slog"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TxService struct {
	txRepo *repository.TransactionRepo
}

// NewTxService initializes and returns a TxService with its repository.
func NewTxService(db *gorm.DB) *TxService {
	return &TxService{
		txRepo: repository.NewTransactionRepo(db),
	}
}

var validTxTypes = map[string]bool{
	"income":   true,
	"expendse": true,
}

type TxCreateRequest struct {
	CategoryID      *uuid.UUID `json:"category_id"`
	AccountID       uuid.UUID  `json:"account_id" binding:"required"`
	Amount          float64    `json:"amount" binding:"required"`
	Type            string     `json:"type" binding:"required"`
	Description     string     `json:"description" binding:"required"`
	PaymentMethod   string     `json:"payment_method" binding:"required"`
	ReferenceID     string     `json:"reference_id"`
	Status          string     `json:"status" binding:"required"`
	TransactionDate *time.Time `json:"transaction_date"`
}

type TxUpdateRequest struct {
	Description string `json:"description"`
}

// TxCreate creates a new transaction record for a user and saves it via the repository.
func (ts *TxService) TxCreate(user_id uuid.UUID, req TxCreateRequest) (*models.Transaction, error) {
	if !validTxTypes[req.Type] {
		return nil, errors.New("Type can only be income or exepense")
	}

	tx := &models.Transaction{
		UserID:          user_id,
		CategoryID:      req.CategoryID,
		AccountID:       req.AccountID,
		Amount:          req.Amount,
		Type:            req.Type,
		Description:     req.Description,
		PaymentMethod:   req.PaymentMethod,
		ReferenceID:     req.ReferenceID,
		Status:          req.Status,
		TransactionDate: time.Now(),
	}

	if req.TransactionDate != nil {
		tx.TransactionDate = *req.TransactionDate
	} else {
		tx.TransactionDate = time.Now()
	}

	err := ts.txRepo.Db.Transaction(func(dbTx *gorm.DB) error {
		if err := dbTx.Create(tx).Error; err != nil {
			slog.Error("tx create: insert failed", "user_id", user_id, "error", err)
			return err
		}

		// Update account balance
		var account models.Account
		if err := ts.txRepo.Db.First(&account, "id = ?", req.AccountID).Error; err != nil {
			slog.Error("tx create: account lookup failed", "account_id", req.AccountID, "error", err)
			return err
		}
		if req.Type == "income" {
			account.Balance += req.Amount
		} else {
			account.Balance -= req.Amount
		}
		if err := dbTx.Save(&account).Error; err != nil {
			slog.Error("tx create: account update failed", "account_id", req.AccountID, "error", err)
			return err
		}

		if req.Type == "expense" && req.CategoryID != nil {
			dbTx.Model(&models.Budget{}).Where("user_id = ? AND category_id = ?", user_id, *req.CategoryID).UpdateColumn("spent", gorm.Expr("spent + ?", req.Amount))
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	slog.Info("transaction created", "tx_id", tx.ID, "user_id", user_id, "amount", req.Amount, "type", req.Type)

	return ts.txRepo.GetTransactionByID(tx.ID)
}

// TxGet retrieves a transaction by ID and ensures the requesting user owns it.
func (ts *TxService) TxGet(user_id, txID uuid.UUID) (*models.Transaction, error) {
	tx, err := ts.txRepo.GetTransactionByID(txID)
	if err != nil {
		return nil, err
	}
	if tx.UserID != user_id {
		return nil, utils.ErrForbidden
	}
	return tx, nil
}

// TxUpdate updates mutable fields on a transaction after ownership verification.
func (ts *TxService) TxUpdate(user_id, txID uuid.UUID, req TxUpdateRequest) (*models.Transaction, error) {
	tx, err := ts.txRepo.GetTransactionByID(txID)
	if err != nil {
		return nil, err
	}
	if tx.UserID != user_id {
		return nil, utils.ErrForbidden
	}
	if req.Description != "" {
		tx.Description = req.Description
	}
	if err := ts.txRepo.UpdateTransaction(tx); err != nil {
		return nil, err
	}
	return tx, nil
}

// TxList returns all transactions for the specified user.
func (ts *TxService) TxList(user_id uuid.UUID) ([]models.Transaction, error) {
	return ts.txRepo.ListTransactionsByUser(user_id)
}
