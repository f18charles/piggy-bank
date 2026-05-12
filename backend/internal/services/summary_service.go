package services

import (
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/f18charles/piggy-bank/backend/pkg/summary"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SummaryService struct {
	db            *gorm.DB
	summaryRepo   *repository.SummaryRepo
	tx_repo       *repository.TransactionRepo
	budget_repo   *repository.BudgetRepo
	account_repo  *repository.AccountRepo
	category_repo *repository.CategoryRepo
}

func NewSummaryService(db *gorm.DB) *SummaryService {
	return &SummaryService{
		db:            db,
		summaryRepo:   repository.NewSummaryRepo(db),
		tx_repo:       repository.NewTransactionRepo(db),
		budget_repo:   repository.NewBudgetRepo(db),
		account_repo:  repository.NewAccountRepo(db),
		category_repo: repository.NewCategoryRepo(db),
	}
}

// GetMonthlySummary returns the summary for the given month and attaches the
// previous month's summary for comparison. It does NOT recurse further than
// one level back.
func (s *SummaryService) GetMonthlySummary(user_id uuid.UUID, year int, month time.Month) (*summary.MonthlySummary, error) {
	budgets, categories, err := s.loadLookups(user_id)
	if err != nil {
		return nil, err
	}

	mon_summary, err := s.buildMonthlySummary(user_id, year, month, budgets, categories)

	// Fetch the previous month once — no further recursion.
	prevMonth := month - 1
	prevYear := year
	if prevMonth == 0 {
		prevMonth = 12
		prevYear--
	}
	prevmon_Summary, _ := s.buildMonthlySummary(user_id, prevYear, prevMonth, budgets, categories)
	mon_summary.PreviousMonth = prevmon_Summary

	return mon_summary, nil
}

// buildMonthlySummary does the actual aggregation work for a single month
// without touching PreviousMonth. Call this internally to avoid recursion.
func (s *SummaryService) buildMonthlySummary(user_id uuid.UUID, year int, month time.Month, budget_map map[uuid.UUID]float64, category_map map[uuid.UUID]models.Category) (*summary.MonthlySummary, error) {
	startDate := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0)

	transactions, err := s.summaryRepo.GetTransactions(user_id, startDate, endDate)
	if err != nil {
		return nil, utils.ErrNotFound
	}

	mon_summary := &summary.MonthlySummary{
		UserID:     user_id,
		Year:       year,
		Month:      month,
		ByCategory: make(map[string]summary.CategorySpend),
	}

	categorySpends := make(map[uuid.UUID]float64)

	for _, tx := range transactions {
		if tx.Type == "income" {
			mon_summary.Income += tx.Amount
		} else {
			mon_summary.Expenses += tx.Amount
			if tx.CategoryID != nil {
				categorySpends[*tx.CategoryID] += tx.Amount
			}
		}
	}

	mon_summary.Savings = mon_summary.Income - mon_summary.Expenses
	if mon_summary.Income > 0 {
		mon_summary.SavingsRate = (mon_summary.Savings / mon_summary.Income) * 100
	}

	totalExpenses := mon_summary.Expenses
	for catID, spent := range categorySpends {
		category, ok := category_map[catID]
		if !ok {
			continue
		}
		percentage := 0.0
		if totalExpenses > 0 {
			percentage = (spent / totalExpenses) * 100
		}

		mon_summary.ByCategory[category.Name] = summary.CategorySpend{
			CategoryID:    catID,
			CategoryName:  category.Name,
			CategoryColor: category.Color,
			Spent:         spent,
			Budget:        budget_map[catID],
			Percentage:    percentage,
		}
	}

	return mon_summary, nil
}

// GetYearlySummary aggregates monthly summaries for a year.
func (s *SummaryService) GetYearlySummary(user_id uuid.UUID, year int) ([]summary.MonthlySummary, error) {
	budgets, categories, err := s.loadLookups(user_id)
	if err != nil {
		return nil, err
	}
	
	var summaries []summary.MonthlySummary
	for month := time.January; month <= time.December; month++ {
		summary, err := s.buildMonthlySummary(user_id, year, month, budgets, categories)
		if err != nil {
			continue
		}
		summaries = append(summaries, *summary)
	}

	return summaries, nil
}

func (s *SummaryService) loadLookups(user_id uuid.UUID) (map[uuid.UUID]float64, map[uuid.UUID]models.Category, error) {
	budgets, err := s.budget_repo.ListBudgetsByUser(user_id)
	if err != nil {
		return nil, nil, err
	}
	budget_map := make(map[uuid.UUID]float64, len(budgets))
	for _, b := range budgets {
		budget_map[b.CategoryID] = b.Amount
	}

	categories, err := s.category_repo.ListCategory(user_id)
	if err != nil {
		return nil, nil, utils.ErrNotFound
	}
	
	category_map := make(map[uuid.UUID]models.Category, len(categories))
	for _, c := range categories {
		category_map[c.ID] = c
	}

	return budget_map, category_map, nil
}