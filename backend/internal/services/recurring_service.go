package services

import (
	"log/slog"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RecurringService struct {
	repo        *repository.RecurringRepo
	accountRepo *repository.AccountRepo
	txService   *TxService
}

func NewRecurringService(db *gorm.DB) *RecurringService {
	return &RecurringService{
		repo:        repository.NewRecurringRepo(db),
		accountRepo: repository.NewAccountRepo(db),
		txService:   NewTxService(db),
	}
}

var validFrequencies = map[string]bool{
	"daily": true, "weekly": true, "monthly": true, "yearly": true,
}

type RecurringCreateRequest struct {
	AccountID     uuid.UUID  `json:"account_id" binding:"required"`
	ToAccountID   *uuid.UUID `json:"to_account_id"`
	CategoryID    *uuid.UUID `json:"category_id"`
	Amount        float64    `json:"amount" binding:"required"`
	Type          string     `json:"type" binding:"required"`
	Description   string     `json:"description"`
	PaymentMethod string     `json:"payment_method"`
	Frequency     string     `json:"frequency" binding:"required"`
	NextDueDate   *time.Time `json:"next_due_date"`
	IsActive      *bool      `json:"is_active"`
}

type RecurringUpdateRequest struct {
	AccountID     *uuid.UUID `json:"account_id"`
	ToAccountID   *uuid.UUID `json:"to_account_id"`
	CategoryID    *uuid.UUID `json:"category_id"`
	Amount        *float64   `json:"amount"`
	Type          string     `json:"type"`
	Description   string     `json:"description"`
	PaymentMethod string     `json:"payment_method"`
	Frequency     string     `json:"frequency"`
	NextDueDate   *time.Time `json:"next_due_date"`
	IsActive      *bool      `json:"is_active"`
}

func (rs *RecurringService) validate(userID uuid.UUID, accountID uuid.UUID, typ string, amount float64, frequency string) error {
	if !validTxTypes[typ] || amount <= 0 || !validFrequencies[frequency] {
		return utils.ErrBadRequest
	}
	acc, err := rs.accountRepo.GetAccountByID(accountID)
	if err != nil {
		return err
	}
	if acc.UserID != userID {
		return utils.ErrForbidden
	}
	return nil
}

func (rs *RecurringService) RecurringCreate(userID uuid.UUID, req RecurringCreateRequest) (*models.RecurringTransaction, error) {
	if err := rs.validate(userID, req.AccountID, req.Type, req.Amount, req.Frequency); err != nil {
		return nil, err
	}
	if req.Type == "transfer" {
		if req.ToAccountID == nil || *req.ToAccountID == req.AccountID {
			return nil, utils.ErrBadRequest
		}
		to, err := rs.accountRepo.GetAccountByID(*req.ToAccountID)
		if err != nil {
			return nil, err
		}
		if to.UserID != userID {
			return nil, utils.ErrForbidden
		}
	}

	due := time.Now()
	if req.NextDueDate != nil {
		due = *req.NextDueDate
	}
	active := true
	if req.IsActive != nil {
		active = *req.IsActive
	}
	payment := req.PaymentMethod
	if payment == "" {
		payment = "cash"
	}

	item := &models.RecurringTransaction{
		UserID:        userID,
		AccountID:     req.AccountID,
		ToAccountID:   req.ToAccountID,
		CategoryID:    req.CategoryID,
		Amount:        req.Amount,
		Type:          req.Type,
		Description:   req.Description,
		PaymentMethod: payment,
		Frequency:     req.Frequency,
		NextDueDate:   due,
		IsActive:      active,
	}
	if err := rs.repo.Create(item); err != nil {
		return nil, err
	}
	return rs.repo.GetByID(item.ID)
}

func (rs *RecurringService) RecurringGet(userID, id uuid.UUID) (*models.RecurringTransaction, error) {
	item, err := rs.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if item.UserID != userID {
		return nil, utils.ErrForbidden
	}
	return item, nil
}

func (rs *RecurringService) RecurringList(userID uuid.UUID) ([]models.RecurringTransaction, error) {
	return rs.repo.ListByUser(userID)
}

func (rs *RecurringService) RecurringUpdate(userID, id uuid.UUID, req RecurringUpdateRequest) (*models.RecurringTransaction, error) {
	item, err := rs.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if item.UserID != userID {
		return nil, utils.ErrForbidden
	}

	if req.AccountID != nil {
		if err := rs.validate(userID, *req.AccountID, item.Type, item.Amount, item.Frequency); err != nil {
			return nil, err
		}
		item.AccountID = *req.AccountID
	}
	if req.Type != "" {
		if !validTxTypes[req.Type] {
			return nil, utils.ErrBadRequest
		}
		item.Type = req.Type
	}
	if req.Amount != nil {
		if *req.Amount <= 0 {
			return nil, utils.ErrBadRequest
		}
		item.Amount = *req.Amount
	}
	if req.Frequency != "" {
		if !validFrequencies[req.Frequency] {
			return nil, utils.ErrBadRequest
		}
		item.Frequency = req.Frequency
	}
	if req.ToAccountID != nil {
		item.ToAccountID = req.ToAccountID
	}
	if req.CategoryID != nil {
		item.CategoryID = req.CategoryID
	}
	if req.Description != "" {
		item.Description = req.Description
	}
	if req.PaymentMethod != "" {
		item.PaymentMethod = req.PaymentMethod
	}
	if req.NextDueDate != nil {
		item.NextDueDate = *req.NextDueDate
	}
	if req.IsActive != nil {
		item.IsActive = *req.IsActive
	}

	if item.Type == "transfer" {
		if item.ToAccountID == nil || *item.ToAccountID == item.AccountID {
			return nil, utils.ErrBadRequest
		}
	}

	// Clear associations before Save so GORM can't rewrite FKs from stale
	// preloaded rows (same hazard as transaction updates).
	item.Account = models.Account{}
	item.ToAccount = nil
	item.Category = nil
	if err := rs.repo.Update(item); err != nil {
		return nil, err
	}
	return rs.repo.GetByID(id)
}

func (rs *RecurringService) RecurringDelete(userID, id uuid.UUID) error {
	item, err := rs.repo.GetByID(id)
	if err != nil {
		return err
	}
	if item.UserID != userID {
		return utils.ErrForbidden
	}
	return rs.repo.Delete(id)
}

// advanceDue moves a due date forward by one frequency interval.
func advanceDue(due time.Time, frequency string) time.Time {
	switch frequency {
	case "daily":
		return due.AddDate(0, 0, 1)
	case "weekly":
		return due.AddDate(0, 0, 7)
	case "yearly":
		return due.AddDate(1, 0, 0)
	default: // monthly
		return due.AddDate(0, 1, 0)
	}
}

// RunDue materializes every active recurring template whose due date has
// arrived. Each generated transaction goes through TxService so balances move
// atomically. Catch-up is capped to avoid unbounded generation after a long
// outage.
func (rs *RecurringService) RunDue(asOf time.Time) (int, error) {
	items, err := rs.repo.ListDue(asOf)
	if err != nil {
		return 0, err
	}

	created := 0
	for i := range items {
		item := items[i]
		guard := 0
		for !item.NextDueDate.After(asOf) && guard < 120 {
			due := item.NextDueDate
			req := TxCreateRequest{
				AccountID:       item.AccountID,
				CategoryID:      item.CategoryID,
				Amount:          item.Amount,
				Type:            item.Type,
				Description:     item.Description,
				PaymentMethod:   item.PaymentMethod,
				Status:          "completed",
				TransactionDate: &due,
			}
			if item.Type == "transfer" {
				req.AccountID = uuid.Nil
				req.FromAccountID = &item.AccountID
				req.ToAccountID = item.ToAccountID
			}

			if _, err := rs.txService.TxCreate(item.UserID, req); err != nil {
				slog.Error("recurring run failed", "recurring_id", item.ID, "user_id", item.UserID, "error", err)
				break
			}

			item.NextDueDate = advanceDue(due, item.Frequency)
			now := time.Now()
			item.LastRunAt = &now
			item.Account = models.Account{}
			item.ToAccount = nil
			item.Category = nil
			if err := rs.repo.Update(&item); err != nil {
				return created, err
			}
			created++
			guard++
		}
	}
	return created, nil
}
