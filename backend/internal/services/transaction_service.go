package services

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	gofpdf "github.com/jung-kurt/gofpdf"
	"gorm.io/gorm"
)

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

type TxService struct {
	txRepo *repository.TransactionRepo
}

// NewTxService initializes and returns a TxService with its repository.
func NewTxService(db *gorm.DB) *TxService {
	return &TxService{
		txRepo: repository.NewTransactionRepo(db),
	}
}

type TxUpdateRequest struct {
	Description string `json:"description"`
}

// TxCreate creates a new transaction record for a user and saves it via the repository.
func (ts *TxService) TxCreate(user_id uuid.UUID, req TxCreateRequest) (*models.Transaction, error) {
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

	if err := ts.txRepo.CreateTransaction(tx); err != nil {
		return nil, err
	}

	// Update account balance
	var account models.Account
	if err := ts.txRepo.Db.First(&account, "id = ?", req.AccountID).Error; err != nil {
		return nil, err
	}

	if req.Type == "income" {
		account.Balance += req.Amount
	} else {
		account.Balance -= req.Amount
	}

	if err := ts.txRepo.Db.Save(&account).Error; err != nil {
		return nil, err
	}
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
	txs, err := ts.txRepo.ListTransactionsByUser(user_id)
	if err != nil {
		return nil, err
	}
	return txs, nil
}

// ExportTx exports transactions for the last 3 months for the user in either csv or pdf format.
// Returns the file bytes, a content-type string, and an error if any.
func (ts *TxService) ExportTx(user_id uuid.UUID, format string) ([]byte, string, error) {
	all, err := ts.txRepo.ListTransactionsByUser(user_id)
	if err != nil {
		return nil, "", err
	}

	cutoff := time.Now().AddDate(0, -3, 0)
	var txs []models.Transaction
	for _, t := range all {
		// If TransactionDate is zero, use CreatedAt as a fallback
		td := t.TransactionDate
		if td.IsZero() {
			dt := t.CreatedAt
			td = dt
		}
		if td.After(cutoff) || td.Equal(cutoff) {
			txs = append(txs, t)
		}
	}

	if len(txs) == 0 {
		return nil, "", utils.ErrNotFound
	}

	switch format {
	case "pdf":
		// generate pdf
		pdf := gofpdf.New("P", "mm", "A4", "")
		pdf.AddPage()
		pdf.SetFont("Arial", "B", 14)
		pdf.CellFormat(0, 10, "Transactions - Last 3 Months", "", 1, "C", false, 0, "")
		pdf.Ln(2)
		pdf.SetFont("Arial", "", 10)

		// header
		headers := []string{"ID", "Date", "Amount", "Type", "AccountID", "CategoryID", "Description", "Status"}
		colWidths := []float64{40, 30, 25, 20, 40, 40, 50, 20}
		for i, h := range headers {
			pdf.CellFormat(colWidths[i], 7, h, "1", 0, "C", false, 0, "")
		}
		pdf.Ln(-1)

		for _, t := range txs {
			date := t.TransactionDate
			if date.IsZero() {
				date = t.CreatedAt
			}
			row := []string{
				t.ID.String(),
				date.Format("2006-01-02"),
				fmt.Sprintf("%.2f", t.Amount),
				t.Type,
				t.AccountID.String(),
				"",
				t.Description,
				t.Status,
			}
			if t.CategoryID != nil {
				row[5] = t.CategoryID.String()
			}
			for i, txt := range row {
				// wrap text if too long
				pdf.CellFormat(colWidths[i], 6, txt, "1", 0, "L", false, 0, "")
			}
			pdf.Ln(-1)
		}

		var buf bytes.Buffer
		err := pdf.Output(&buf)
		if err != nil {
			return nil, "", err
		}
		return buf.Bytes(), "application/pdf", nil

	default:
		// csv
		var buf bytes.Buffer
		w := csv.NewWriter(&buf)
		header := []string{"id", "transaction_date", "amount", "type", "account_id", "category_id", "description", "payment_method", "reference_id", "status", "created_at"}
		if err := w.Write(header); err != nil {
			return nil, "", err
		}
		for _, t := range txs {
			date := t.TransactionDate
			if date.IsZero() {
				date = t.CreatedAt
			}
			rec := []string{
				t.ID.String(),
				date.Format(time.RFC3339),
				fmt.Sprintf("%.2f", t.Amount),
				t.Type,
				t.AccountID.String(),
				"",
				t.Description,
				t.PaymentMethod,
				t.ReferenceID,
				t.Status,
				t.CreatedAt.Format(time.RFC3339),
			}
			if t.CategoryID != nil {
				rec[5] = t.CategoryID.String()
			}
			if err := w.Write(rec); err != nil {
				return nil, "", err
			}
		}
		w.Flush()
		if err := w.Error(); err != nil {
			return nil, "", err
		}
		return buf.Bytes(), "text/csv", nil
	}
}
