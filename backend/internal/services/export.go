package services

// Replacement for ExportTx in transaction_service.go.
// Fixes: UUIDs replaced with human-readable names in both CSV and PDF exports.
// Also fixes: transaction ID column removed from export (not useful to end users),
//             currency added, columns reordered to be reader-friendly.
//
// CSV columns: Date, Description, Type, Amount (KES), Account, Category, Payment Method, Reference, Status
// PDF columns: Date, Description, Type, Amount, Account, Category, Status

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	gofpdf "github.com/jung-kurt/gofpdf"
)

// ExportTx exports the user's last-3-months transactions as CSV or PDF.
// Since ListTransactionsByUser now preloads Account and Category, all names
// are available directly from the transaction struct — no extra queries needed.
func (ts *TxService) ExportTx(user_id uuid.UUID, format string) ([]byte, string, error) {
	all, err := ts.txRepo.ListTransactionsByUser(user_id)
	if err != nil {
		return nil, "", err
	}

	cutoff := time.Now().AddDate(0, -3, 0)
	var txs []models.Transaction
	for _, t := range all {
		td := t.TransactionDate
		if td.IsZero() {
			td = t.CreatedAt
		}
		if !td.Before(cutoff) {
			txs = append(txs, t)
		}
	}

	if len(txs) == 0 {
		return nil, "", utils.ErrNotFound
	}

	switch format {
	case "pdf":
		return exportPDF(txs)
	default:
		return exportCSV(txs)
	}
}

// ── helpers ───────────────────────────────────────────────────────────────────

func categoryName(t models.Transaction) string {
	if t.Category != nil && t.Category.Name != "" {
		return t.Category.Name
	}
	return "Uncategorized"
}

func accountName(t models.Transaction) string {
	if t.Account.Name != "" {
		return t.Account.Name
	}
	return "Unknown Account"
}

func txDate(t models.Transaction) time.Time {
	if !t.TransactionDate.IsZero() {
		return t.TransactionDate
	}
	return t.CreatedAt
}

// ── CSV ───────────────────────────────────────────────────────────────────────

func exportCSV(txs []models.Transaction) ([]byte, string, error) {
	var buf bytes.Buffer
	w := csv.NewWriter(&buf)

	header := []string{
		"Date",
		"Description",
		"Type",
		"Amount (KES)",
		"Account",
		"Category",
		"Payment Method",
		"Reference",
		"Status",
	}
	if err := w.Write(header); err != nil {
		return nil, "", err
	}

	for _, t := range txs {
		rec := []string{
			txDate(t).Format("2006-01-02"),
			t.Description,
			t.Type,
			fmt.Sprintf("%.2f", t.Amount),
			accountName(t),
			categoryName(t),
			t.PaymentMethod,
			t.ReferenceID,
			t.Status,
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

// ── PDF ───────────────────────────────────────────────────────────────────────

func exportPDF(txs []models.Transaction) ([]byte, string, error) {
	pdf := gofpdf.New("L", "mm", "A4", "") // Landscape for more columns
	pdf.SetMargins(10, 15, 10)
	pdf.AddPage()

	// Title
	pdf.SetFont("Arial", "B", 14)
	pdf.CellFormat(0, 10, "Piggy Bank — Transaction History (Last 3 Months)", "", 1, "C", false, 0, "")
	pdf.SetFont("Arial", "I", 9)
	pdf.CellFormat(0, 6, fmt.Sprintf("Generated: %s", time.Now().Format("02 Jan 2006 15:04")), "", 1, "C", false, 0, "")
	pdf.Ln(4)

	// Table header
	headers := []string{"Date", "Description", "Type", "Amount (KES)", "Account", "Category", "Status"}
	colWidths := []float64{28, 72, 22, 32, 40, 38, 24}

	pdf.SetFont("Arial", "B", 9)
	pdf.SetFillColor(22, 101, 52) // green-900
	pdf.SetTextColor(255, 255, 255)
	for i, h := range headers {
		pdf.CellFormat(colWidths[i], 8, h, "1", 0, "C", true, 0, "")
	}
	pdf.Ln(-1)

	// Rows
	pdf.SetFont("Arial", "", 8)
	pdf.SetTextColor(0, 0, 0)

	for idx, t := range txs {
		// Alternate row background
		if idx%2 == 0 {
			pdf.SetFillColor(240, 253, 244) // green-50
		} else {
			pdf.SetFillColor(255, 255, 255)
		}

		// Color-code amount by type
		amount := fmt.Sprintf("%.2f", t.Amount)
		if t.Type == "income" {
			pdf.SetTextColor(22, 163, 74) // green
		} else {
			pdf.SetTextColor(220, 38, 38) // red
		}

		row := []string{
			txDate(t).Format("02 Jan 2006"),
			truncate(t.Description, 45),
			t.Type,
			amount,
			accountName(t),
			categoryName(t),
			t.Status,
		}

		for i, txt := range row {
			align := "L"
			if i == 3 { // amount — right align
				align = "R"
			}
			pdf.CellFormat(colWidths[i], 6, txt, "1", 0, align, true, 0, "")
		}
		pdf.SetTextColor(0, 0, 0)
		pdf.Ln(-1)
	}

	// Footer summary
	pdf.Ln(4)
	pdf.SetFont("Arial", "B", 9)
	var totalIncome, totalExpense float64
	for _, t := range txs {
		if t.Type == "income" {
			totalIncome += t.Amount
		} else {
			totalExpense += t.Amount
		}
	}
	pdf.SetTextColor(22, 163, 74)
	pdf.CellFormat(60, 7, fmt.Sprintf("Total Income:  KES %.2f", totalIncome), "", 0, "L", false, 0, "")
	pdf.SetTextColor(220, 38, 38)
	pdf.CellFormat(60, 7, fmt.Sprintf("Total Expenses: KES %.2f", totalExpense), "", 0, "L", false, 0, "")
	pdf.SetTextColor(0, 0, 0)
	pdf.CellFormat(60, 7, fmt.Sprintf("Net: KES %.2f", totalIncome-totalExpense), "", 1, "L", false, 0, "")

	var buf bytes.Buffer
	if err := pdf.Output(&buf); err != nil {
		return nil, "", err
	}
	return buf.Bytes(), "application/pdf", nil
}

// truncate shortens a string to max chars, adding "…" if cut.
func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-1] + "…"
}
