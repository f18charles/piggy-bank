package handlers

import (
	"net/http"

	"github.com/f18charles/piggy-bank/backend/internal/auth"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RecurringHandler struct {
	recurringService services.RecurringService
}

func NewRecurringHandler(db *gorm.DB) *RecurringHandler {
	return &RecurringHandler{
		recurringService: *services.NewRecurringService(db),
	}
}

func (rh *RecurringHandler) ListRecurring(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	items, err := rh.recurringService.RecurringList(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to load recurring transactions")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, items)
}

func (rh *RecurringHandler) CreateRecurring(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	var req services.RecurringCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	item, err := rh.recurringService.RecurringCreate(id, req)
	if err != nil {
		writeRecurringError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusCreated, item)
}

func (rh *RecurringHandler) GetRecurring(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid recurring id")
		return
	}
	item, err := rh.recurringService.RecurringGet(id, itemID)
	if err != nil {
		writeRecurringError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusOK, item)
}

func (rh *RecurringHandler) UpdateRecurring(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid recurring id")
		return
	}
	var req services.RecurringUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	item, err := rh.recurringService.RecurringUpdate(id, itemID, req)
	if err != nil {
		writeRecurringError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusOK, item)
}

func (rh *RecurringHandler) DeleteRecurring(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	itemID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid recurring id")
		return
	}
	if err := rh.recurringService.RecurringDelete(id, itemID); err != nil {
		writeRecurringError(c, err)
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "recurring transaction deleted"})
}

func writeRecurringError(c *gin.Context, err error) {
	switch err {
	case utils.ErrBadRequest:
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid recurring transaction payload")
	case utils.ErrForbidden:
		utils.ErrorResponse(c, http.StatusForbidden, "not allowed to use this recurring transaction or account")
	case utils.ErrNotFound:
		utils.ErrorResponse(c, http.StatusNotFound, "recurring transaction or account not found")
	default:
		utils.ErrorResponse(c, http.StatusInternalServerError, "recurring transaction request failed")
	}
}
