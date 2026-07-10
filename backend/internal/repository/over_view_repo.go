package repository

import (
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/pkg/overview"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OverviewRepo struct {
	db *gorm.DB
}

func NewOverviewRepo(db *gorm.DB) *OverviewRepo {
	return &OverviewRepo{
		db: db,
	}
}

func (or *OverviewRepo) GetMonthlyExpenses(user_id uuid.UUID, startOfMonth time.Time) (float64, error) {
	var monthly_expenses float64
	if err := or.db.Model(&models.Transaction{}).Where("user_id = ? and type = ? and transaction_date >= ?", user_id, "expense", startOfMonth).Select("COALESCE(SUM(amount), 0)").Scan(&monthly_expenses).Error; err != nil {
		return 0, err
	}
	return monthly_expenses, nil
}

func (or *OverviewRepo) GetMonthlyIncome(user_id uuid.UUID, startOfMonth time.Time) (float64, error) {
	var monthly_income float64
	if err := or.db.Model(&models.Transaction{}).Where("user_id = ? and type = ? and transaction_date >= ?", user_id, "income", startOfMonth).Select("COALESCE(SUM(amount), 0)").Scan(&monthly_income).Error; err != nil {
		return 0, err
	}
	return monthly_income, nil
}

func (or *OverviewRepo) GetLatestTransactions(user_id uuid.UUID, dash_overview *overview.DashboardOverview) error {
	return or.db.Where("user_id = ?", user_id).
		Order("transaction_date DESC").
		Limit(5).Preload("Account").
		Preload("Category").
		Find(&dash_overview.RecentTx).
		Error
}