package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/auth"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SummaryHandler struct {
	summaryService *services.SummaryService
}

func NewSummaryHandler(db *gorm.DB) *SummaryHandler {
	return &SummaryHandler{
		summaryService: services.NewSummaryService(db),
	}
}

type OverviewHandler struct {
	overviewService *services.OverviewService
}

func NewOverviewHandler(db *gorm.DB) *OverviewHandler {
	return &OverviewHandler{
		overviewService: services.NewOverviewService(db),
	}
}

type SpendingInsightsHandler struct {
	spendingInsightsService *services.InsightsService
}

func NewSpendingInsightsHandler(db *gorm.DB) *SpendingInsightsHandler {
	return &SpendingInsightsHandler{
		spendingInsightsService: services.NewInsightsService(db),
	}
}

// MonthlySummary returns aggregated monthly summary data for the user.
func (sh *SummaryHandler) MonthlySummary(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	year := time.Now().Year()
	month := time.Now().Month()

	if year_par := c.Query("year"); year_par != "" {
		if y, err := strconv.Atoi(year_par); err == nil {
			year = y
		}
	}

	if month_par := c.Query("month"); month_par != "" {
		if m, err := strconv.Atoi(month_par); err == nil && m >= 1 && m <= 12 {
			month = time.Month(m)
		}
	}

	monthly_summary, err := sh.summaryService.GetMonthlySummary(id, year, month)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to generate summary")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, monthly_summary)
}

func (sh *SummaryHandler) YearlySummary(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	year := time.Now().Year()

	if year_par := c.Query("year"); year_par != "" {
		if y, err := strconv.Atoi(year_par); err == nil {
			year = y
		}
	}

	yearly_summary, err := sh.summaryService.GetYearlySummary(id, year)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to generate summary")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, yearly_summary)
}

// Overview returns a high-level overview/dashboard for the user.
func (oh *OverviewHandler) Overview(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}
	overview, err := oh.overviewService.GetDashboardOverview(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to create overview")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, overview)
}

// SpendingInsights returns insights and breakdowns for spending patterns.
func (sih *SpendingInsightsHandler) SpendingInsights(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	days_param := c.Query("days")
	days, _ := strconv.Atoi(days_param) //defaults to 0; service treats 0 as 90-day window

	spending_insights, err := sih.spendingInsightsService.GetSpendingInsights(id, days)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to load spending insights")
		return
	}

	utils.SuccessResponse(c, http.StatusOK, spending_insights)
}
