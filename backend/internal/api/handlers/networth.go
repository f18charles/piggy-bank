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

type NetWorthHandler struct {
	snapshotService *services.SnapshotService
}

func NewNetWorthHandler(db *gorm.DB) *NetWorthHandler {
	return &NetWorthHandler{
		snapshotService: services.NewSnapshotService(db),
	}
}

// NetWorthHistory returns the current net worth, its month-over-month change
// and the recent snapshot history used for the trend chart.
func (nh *NetWorthHandler) NetWorthHistory(c *gin.Context) {
	id, err := auth.ConfirmAuthedUser(c)
	if err != nil {
		utils.ErrorResponse(c, http.StatusUnauthorized, err.Error())
		return
	}

	months := 12
	if m := c.Query("months"); m != "" {
		if parsed, err := strconv.Atoi(m); err == nil && parsed > 0 && parsed <= 60 {
			months = parsed
		}
	}

	history, err := nh.snapshotService.History(id, months*31)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to load net worth history")
		return
	}
	current, err := nh.snapshotService.NetWorth(id)
	if err != nil {
		utils.ErrorResponse(c, http.StatusInternalServerError, "failed to compute net worth")
		return
	}
	change, _ := nh.snapshotService.ChangeSince(id, time.Now().AddDate(0, -1, 0))

	utils.SuccessResponse(c, http.StatusOK, gin.H{
		"current_net_worth": current,
		"change_percentage": change,
		"history":           history,
	})
}
