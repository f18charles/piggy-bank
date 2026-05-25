package handlers

import (
	"fmt"
	"log/slog"
	"net/http"

	"github.com/f18charles/piggy-bank/backend/internal/auth"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TransactionHandler struct {
	transactionService services.TxService
}

func NewTxHandler(db *gorm.DB) *TransactionHandler {
	return &TransactionHandler{
		transactionService: *services.NewTxService(db),
	}
}

// ListTransactions returns a paginated list of transactions for the user.
func (th *TransactionHandler) ListTransactions(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	txs, err := th.transactionService.TxList(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "no transaction found")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, txs)
}

// CreateTransactions records a new transaction for the authenticated user.
func (th *TransactionHandler) CreateTransactions(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	var txreq services.TxCreateRequest
	if err := c.ShouldBindJSON(&txreq); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	tx, err := th.transactionService.TxCreate(id, txreq)
	if err != nil {
		slog.Error("CreateTransactions failed",
            "user_id", id,
            "account_id", txreq.AccountID,
            "amount", txreq.Amount,
            "type", txreq.Type,
            "error", err.Error(),
        )
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create transaction")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, tx)
}

// GetTransaction retrieves a single transaction by ID for the authenticated user.
func (th *TransactionHandler) GetTransaction(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	paramID := c.Param("id")
	txID, err := uuid.Parse(paramID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid account id")
		return
	}
	tx, err := th.transactionService.TxGet(id, txID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "transactions not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, tx)
}

// UpdateTransaction updates an existing transaction owned by the user.
func (th *TransactionHandler) UpdateTransaction(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	paramID := c.Param("id")
	txID, err := uuid.Parse(paramID)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid account id")
		return
	}

	var req services.TxUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	tx, err := th.transactionService.TxUpdate(id, txID, req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to update")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, tx)
}

// ExportTransactions exports transactions (CSV/other) for the user.
func (th *TransactionHandler) ExportTransactions(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	format := c.DefaultQuery("format", "csv")
	data, contentType, err := th.transactionService.ExportTx(id, format)
	if err != nil {
		if err == utils.ErrNotFound {
			utils.ErrorResponse(c, http.StatusNotFound, "no transactions found for the specified period")
			return
		}
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to export transactions")
		return
	}

	ext := "csv"
	if format == "pdf" {
		ext = "pdf"
	}
	filename := fmt.Sprintf("transactions_last_3_months.%s", ext)
	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.Data(http.StatusOK, contentType, data)
}
