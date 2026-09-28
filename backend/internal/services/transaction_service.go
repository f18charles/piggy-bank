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
	"expense":  true,
	"transfer": true,
}

type TxCreateRequest struct {
	CategoryID *uuid.UUID `json:"category_id"`
	// AccountID is the touched account for income/expense. For transfers it
	// is optional: when omitted, FromAccountID is used as the source.
	AccountID       uuid.UUID  `json:"account_id"`
	FromAccountID   *uuid.UUID `json:"from_account_id"`
	ToAccountID     *uuid.UUID `json:"to_account_id"`
	Amount          float64    `json:"amount" binding:"required"`
	Type            string     `json:"type" binding:"required"`
	Description     string     `json:"description"`
	PaymentMethod   string     `json:"payment_method"`
	ReferenceID     string     `json:"reference_id"`
	Status          string     `json:"status"`
	TransactionDate *time.Time `json:"transaction_date"`
}

// TxUpdateRequest updates mutable fields on a transaction. Pointer fields
// distinguish "leave unchanged" (nil) from an explicit new value; string
// fields follow the codebase convention where "" means no change.
type TxUpdateRequest struct {
	CategoryID      *uuid.UUID `json:"category_id"`
	AccountID       *uuid.UUID `json:"account_id"`
	FromAccountID   *uuid.UUID `json:"from_account_id"`
	ToAccountID     *uuid.UUID `json:"to_account_id"`
	Amount          *float64   `json:"amount"`
	Type            string     `json:"type"`
	Description     string     `json:"description"`
	PaymentMethod   string     `json:"payment_method"`
	ReferenceID     string     `json:"reference_id"`
	Status          string     `json:"status"`
	TransactionDate *time.Time `json:"transaction_date"`
}

// buildTransaction validates a create request and returns the transaction
// row to persist. It does not touch account balances.
func buildTransaction(userID uuid.UUID, req TxCreateRequest) (*models.Transaction, error) {
	if !validTxTypes[req.Type] {
		return nil, utils.ErrBadRequest
	}
	if req.Amount <= 0 {
		return nil, utils.ErrBadRequest
	}

	tx := &models.Transaction{
		UserID:        userID,
		CategoryID:    req.CategoryID,
		Amount:        req.Amount,
		Type:          req.Type,
		Description:   req.Description,
		PaymentMethod: req.PaymentMethod,
		ReferenceID:   req.ReferenceID,
		Status:        req.Status,
	}
	if tx.PaymentMethod == "" {
		tx.PaymentMethod = "cash"
	}
	if tx.Status == "" {
		tx.Status = "completed"
	}
	if req.TransactionDate != nil {
		tx.TransactionDate = *req.TransactionDate
	} else {
		tx.TransactionDate = time.Now()
	}

	switch req.Type {
	case "transfer":
		from := req.FromAccountID
		if from == nil && req.AccountID != uuid.Nil {
			from = &req.AccountID
		}
		if from == nil || req.ToAccountID == nil {
			return nil, utils.ErrBadRequest
		}
		if *from == *req.ToAccountID {
			return nil, utils.ErrBadRequest
		}
		tx.FromAccountID = from
		tx.ToAccountID = req.ToAccountID
		tx.AccountID = *from
	default:
		if req.AccountID == uuid.Nil {
			return nil, utils.ErrBadRequest
		}
		tx.AccountID = req.AccountID
	}
	return tx, nil
}

// TxCreate creates a new transaction record for a user and applies its
// effect on the affected account balance(s) in the same DB transaction.
func (ts *TxService) TxCreate(user_id uuid.UUID, req TxCreateRequest) (*models.Transaction, error) {
	tx, err := buildTransaction(user_id, req)
	if err != nil {
		return nil, err
	}

	err = ts.txRepo.Db.Transaction(func(dbTx *gorm.DB) error {
		if err := dbTx.Create(tx).Error; err != nil {
			slog.Error("tx create: insert failed", "user_id", user_id, "error", err)
			return err
		}
		return applyBalanceEffect(dbTx, user_id, tx, 1)
	})
	if err != nil {
		slog.Error("transaction creation failed", "user_id", user_id, "error", err)
		return nil, err
	}

	slog.Info("transaction created", "tx_id", tx.ID, "user_id", user_id, "amount", req.Amount, "type", req.Type)

	return ts.txRepo.GetTransactionByID(tx.ID)
}

// BulkCreateResult summarizes a bulk ingestion request.
type BulkCreateResult struct {
	Created []models.Transaction `json:"created"`
	Skipped int                  `json:"skipped"`
	Failed  int                  `json:"failed"`
}

// TxCreateBulk ingests multiple transactions (e.g. parsed SMS alerts). Items
// whose reference_id was already stored for the user, or that repeat within
// the same request, are skipped so retried deliveries cannot double-post.
func (ts *TxService) TxCreateBulk(user_id uuid.UUID, reqs []TxCreateRequest) (*BulkCreateResult, error) {
	if len(reqs) == 0 || len(reqs) > 500 {
		return nil, utils.ErrBadRequest
	}

	result := &BulkCreateResult{Created: []models.Transaction{}}
	seen := map[string]bool{}
	for _, req := range reqs {
		if req.ReferenceID != "" {
			if seen[req.ReferenceID] {
				result.Skipped++
				continue
			}
			exists, err := ts.txRepo.ExistsByReferenceID(user_id, req.ReferenceID)
			if err != nil {
				return nil, err
			}
			if exists {
				result.Skipped++
				continue
			}
			seen[req.ReferenceID] = true
		}
		tx, err := ts.TxCreate(user_id, req)
		if err != nil {
			result.Failed++
			continue
		}
		result.Created = append(result.Created, *tx)
	}
	return result, nil
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

// TxUpdate fully updates a transaction after ownership verification. It
// reverses the old balance effect, applies the new fields, then applies the
// new balance effect inside a single DB transaction so edits can never leave
// account balances out of sync.
func (ts *TxService) TxUpdate(user_id, txID uuid.UUID, req TxUpdateRequest) (*models.Transaction, error) {
	tx, err := ts.txRepo.GetTransactionByID(txID)
	if err != nil {
		return nil, err
	}
	if tx.UserID != user_id {
		return nil, utils.ErrForbidden
	}

	err = ts.txRepo.Db.Transaction(func(dbTx *gorm.DB) error {
		// Reverse the original effect before rewriting the row.
		if err := applyBalanceEffect(dbTx, user_id, tx, -1); err != nil {
			return err
		}
		if err := applyTxUpdates(tx, req); err != nil {
			return err
		}
		// Drop the preloaded associations before Save: GORM would otherwise
		// derive account_id from the stale associated Account and undo an
		// account reassignment.
		tx.User = models.User{}
		tx.Account = models.Account{}
		tx.Category = nil
		tx.Goal = nil
		tx.FromAccount = nil
		tx.ToAccount = nil
		if err := dbTx.Save(tx).Error; err != nil {
			return err
		}
		// Apply the new effect. Ownership of any newly referenced account is
		// checked here; a failure rolls back the whole edit.
		return applyBalanceEffect(dbTx, user_id, tx, 1)
	})
	if err != nil {
		slog.Error("transaction update failed", "user_id", user_id, "tx_id", txID, "error", err)
		return nil, err
	}
	return ts.txRepo.GetTransactionByID(txID)
}

// applyTxUpdates mutates tx in place from the request's set fields.
func applyTxUpdates(tx *models.Transaction, req TxUpdateRequest) error {
	if req.Type != "" {
		if !validTxTypes[req.Type] {
			return utils.ErrBadRequest
		}
		tx.Type = req.Type
	}
	if req.Amount != nil {
		if *req.Amount <= 0 {
			return utils.ErrBadRequest
		}
		tx.Amount = *req.Amount
	}
	if req.CategoryID != nil {
		tx.CategoryID = req.CategoryID
	}
	if req.Description != "" {
		tx.Description = req.Description
	}
	if req.PaymentMethod != "" {
		tx.PaymentMethod = req.PaymentMethod
	}
	if req.ReferenceID != "" {
		tx.ReferenceID = req.ReferenceID
	}
	if req.Status != "" {
		tx.Status = req.Status
	}
	if req.TransactionDate != nil {
		tx.TransactionDate = *req.TransactionDate
	}

	switch tx.Type {
	case "transfer":
		if req.FromAccountID != nil {
			tx.FromAccountID = req.FromAccountID
		}
		if req.ToAccountID != nil {
			tx.ToAccountID = req.ToAccountID
		}
		if req.AccountID != nil {
			tx.FromAccountID = req.AccountID
		}
		if tx.FromAccountID == nil || tx.ToAccountID == nil {
			return utils.ErrBadRequest
		}
		if *tx.FromAccountID == *tx.ToAccountID {
			return utils.ErrBadRequest
		}
		tx.AccountID = *tx.FromAccountID
		tx.CategoryID = nil
	default:
		if req.AccountID != nil {
			tx.AccountID = *req.AccountID
		}
		tx.FromAccountID = nil
		tx.ToAccountID = nil
	}
	return nil
}

// TxList returns all transactions for the specified user.
func (ts *TxService) TxList(user_id uuid.UUID) ([]models.Transaction, error) {
	return ts.txRepo.ListTransactionsByUser(user_id)
}

// TxDelete removes a transaction after verifying ownership and reversing its
// effect on the affected account balance(s), all in one DB transaction.
func (ts *TxService) TxDelete(user_id, txID uuid.UUID) error {
	tx, err := ts.txRepo.GetTransactionByID(txID)
	if err != nil {
		return err
	}
	if tx.UserID != user_id {
		return utils.ErrForbidden
	}

	return ts.txRepo.Db.Transaction(func(dbTx *gorm.DB) error {
		if err := applyBalanceEffect(dbTx, user_id, tx, -1); err != nil {
			return err
		}
		if err := dbTx.Delete(&models.Transaction{}, "id = ?", txID).Error; err != nil {
			slog.Error("tx delete: delete failed", "tx_id", txID, "error", err)
			return err
		}
		return nil
	})
}

// applyBalanceEffect applies (direction=+1) or reverses (direction=-1) the
// balance impact of a transaction. For transfers it debits the source and
// credits the destination; a missing or foreign-owned account aborts the
// enclosing transaction.
func applyBalanceEffect(dbTx *gorm.DB, userID uuid.UUID, tx *models.Transaction, direction float64) error {
	switch tx.Type {
	case "income":
		return adjustAccountBalance(dbTx, userID, tx.AccountID, tx.Amount*direction)
	case "expense":
		return adjustAccountBalance(dbTx, userID, tx.AccountID, -tx.Amount*direction)
	case "transfer":
		if tx.FromAccountID == nil || tx.ToAccountID == nil {
			return utils.ErrBadRequest
		}
		if err := adjustAccountBalance(dbTx, userID, *tx.FromAccountID, -tx.Amount*direction); err != nil {
			return err
		}
		return adjustAccountBalance(dbTx, userID, *tx.ToAccountID, tx.Amount*direction)
	default:
		return utils.ErrBadRequest
	}
}

// adjustAccountBalance loads the account, verifies ownership and persists a
// balance delta. Transfers call it twice inside the same DB transaction.
func adjustAccountBalance(dbTx *gorm.DB, userID, accountID uuid.UUID, delta float64) error {
	var account models.Account
	if err := dbTx.First(&account, "id = ?", accountID).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return utils.ErrNotFound
		}
		return err
	}
	if account.UserID != userID {
		return utils.ErrForbidden
	}
	account.Balance += delta
	if err := dbTx.Save(&account).Error; err != nil {
		slog.Error("balance update failed", "account_id", accountID, "new_balance", account.Balance, "error", err)
		return err
	}
	return nil
}
