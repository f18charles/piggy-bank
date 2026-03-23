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

type BudgetHandler struct {
	budgetService services.BudgetServices
}

func NewBudgetHandler(db *gorm.DB) *BudgetHandler {
	return &BudgetHandler{
		budgetService: *services.NewBudgetRepo(db),
	}
}

// Listbudgets returns all budgets for the authenticated user.
func (bh *BudgetHandler) Listbudgets(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	budgets, err := bh.budgetService.BudgetList(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "no budgets found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, budgets)
}

// CreateBudget creates a new budget for a category for the authenticated user.
func (bh *BudgetHandler) CreateBudget(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	var req services.BudgetCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	budget, err := bh.budgetService.BudgetCreate(id, req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	utils.SuccessResponse(c, http.StatusOK, budget)
}

// GetBudget retrieves a specific budget by ID for the authenticated user.
func (bh *BudgetHandler) GetBudget(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	param_id := c.Param("id")
	budget_id, err := uuid.Parse(param_id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid budget id")
		return
	}
	budget, err := bh.budgetService.BudgetGet(id, budget_id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusNotFound, "budget not found")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, budget)
}

// UpdateBudget updates an existing budget for the authenticated user.
func (bh *BudgetHandler) UpdateBudget(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	param_id := c.Param("id")
	budget_id, err := uuid.Parse(param_id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid budget id")
		return
	}
	var req services.BudgetUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, err.Error())
		return
	}
	budget, err := bh.budgetService.BudgetUpdate(budget_id, id, req)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to update budget")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, budget)
}

// DeleteBudget deletes a budget owned by the authenticated user.
func (bh *BudgetHandler) DeleteBudget(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	param_id := c.Param("id")
	budget_id, err := uuid.Parse(param_id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusBadRequest, "invalid goal id")
		return
	}
	err = bh.budgetService.BudgetDelete(budget_id, id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to delete budget")
		return
	}
	utils.SuccessResponse(c, http.StatusOK, gin.H{"message": "budget deleted successfully"})
}
