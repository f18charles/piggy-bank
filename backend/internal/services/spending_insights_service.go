package services

import (
	"fmt"
	"strconv"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/pkg/insights"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type InsightsService struct {
	db                   *gorm.DB
	spendingInsightsRepo repository.SpendingInsightsRepo
}

func NewInsightsService(db *gorm.DB) *InsightsService {
	return &InsightsService{
		db:                   db,
		spendingInsightsRepo: *repository.NewSpendingInsightsRepo(db),
	}
}

func (is *InsightsService) GetSpendingInsights(user_id uuid.UUID, days int) (*insights.SpendingInsights, error) {
	if days == 0 {
		days = 90
	}

	end_date := time.Now()
	start_date := end_date.AddDate(0, 0, -days)

	the_insights := &insights.SpendingInsights{
		SpendingPatterns: insights.SpendingPatterns{
			ByDayOfWeek: make(map[string]float64),
			ByHour:      map[int]float64{},
		},
	}

	// get all expense txs in the period
	results, err := is.spendingInsightsRepo.GetPeriodExpenses(user_id, start_date, end_date)
	if err != nil {
		return nil, err
	}

	if len(results) == 0 {
		return the_insights, nil
	}

	// category trends
	category_map := make(map[string]*insights.CategoryTrend)
	days_spend := make(map[string]float64)
	hours_spend := make(map[int]float64)
	hours_count := make(map[int]int)

	for _, r := range results {
		// category aggregation
		cat_name := r.CategoryName
		if cat_name == "" {
			cat_name = "uncategorized"
		}
		if _, exists := category_map[cat_name]; !exists {
			category_map[cat_name] = &insights.CategoryTrend{
				CategoryName: cat_name,
			}
		}
		category_map[cat_name].TotalSpent += r.Amount
		category_map[cat_name].TransactionCount++

		// days of week
		day_name := r.TransactionDate.Weekday().String()
		days_spend[day_name] += r.Amount

		// hour of day
		hour := r.TransactionDate.Hour()
		hours_spend[hour] += r.Amount
		hours_count[hour]++
	}

	// Calculate percentages and averages
	totalSpent := 0.0
	for _, cat := range category_map {
		totalSpent += cat.TotalSpent
		cat.AvgPerTx = cat.TotalSpent / float64(cat.TransactionCount)
	}

	for _, cat := range category_map {
		cat.Percentage = (cat.TotalSpent / totalSpent) * 100
		if cat.TotalSpent > totalSpent*0.05 { // Only include categories > 5% of spending
			the_insights.TopCategories = append(the_insights.TopCategories, *cat)
		}
	}

	// Find peak spending day
	maxDaySpend := 0.0
	peakDay := ""
	for day, amount := range days_spend {
		the_insights.SpendingPatterns.ByDayOfWeek[day] = amount
		if amount > maxDaySpend {
			maxDaySpend = amount
			peakDay = day
		}
	}
	the_insights.SpendingPatterns.MostActiveDay = peakDay

	// Calculate weekday vs weekend
	weekdaySpend := 0.0
	weekendSpend := 0.0
	weekdayCount := 0
	weekendCount := 0

	for _, r := range results {
		weekday := r.TransactionDate.Weekday()
		if weekday >= time.Monday && weekday <= time.Friday {
			weekdaySpend += r.Amount
			weekdayCount++
		} else {
			weekendSpend += r.Amount
			weekendCount++
		}
	}

	if weekdayCount > 0 {
		the_insights.SpendingPatterns.AvgWeekdaySpend = weekdaySpend / float64(weekdayCount)
	}
	if weekendCount > 0 {
		the_insights.SpendingPatterns.AvgWeekendSpend = weekendSpend / float64(weekendCount)
	}

	// Find peak hour
	maxHourSpend := 0.0
	peakHour := 0
	for hour, amount := range hours_spend {
		the_insights.SpendingPatterns.ByHour[hour] = amount
		if amount > maxHourSpend {
			maxHourSpend = amount
			peakHour = hour
		}
	}
	the_insights.SpendingPatterns.PeakHour = peakHour

	// 3. Detect anomalies (transactions > 3x average for their category)
	for _, r := range results {
		catName := r.CategoryName
		if catName == "" {
			catName = "Uncategorized"
		}

		cat := category_map[catName]
		if cat.AvgPerTx > 0 && r.Amount > cat.AvgPerTx*3 {
			the_insights.Anomalies = append(the_insights.Anomalies, insights.TransactionAnomaly{
				TransactionID:  r.ID,
				Date:           r.TransactionDate,
				Description:    r.Description,
				Amount:         r.Amount,
				Category:       catName,
				ExpectedAmount: cat.AvgPerTx,
				Deviation:      r.Amount / cat.AvgPerTx,
			})
		}
	}

	// 4. Generate recommendations
	if len(the_insights.TopCategories) > 0 {
		biggestCat := the_insights.TopCategories[0]
		the_insights.Recommendations = append(the_insights.Recommendations,
			"Your biggest expense is "+biggestCat.CategoryName+
				" (KES "+formatFloat(biggestCat.TotalSpent)+"). "+
				"Can you reduce it by 10%?")
	}

	if the_insights.SpendingPatterns.AvgWeekendSpend > the_insights.SpendingPatterns.AvgWeekdaySpend*1.5 {
		the_insights.Recommendations = append(the_insights.Recommendations,
			"You spend "+
				formatFloat(the_insights.SpendingPatterns.AvgWeekendSpend/the_insights.SpendingPatterns.AvgWeekdaySpend)+
				"x more on weekends. Consider meal prepping on Sundays.")
	}

	if len(the_insights.Anomalies) > 0 {
		the_insights.Recommendations = append(the_insights.Recommendations,
			"Found "+strconv.Itoa(len(the_insights.Anomalies))+
				" unusual transactions. Review them to ensure they're correct.")
	}

	return the_insights, nil
}

func formatFloat(f float64) string {
	return fmt.Sprintf("KES %v", f) // Use your currency formatter
}

//TODO: Later i will have this AI powered so that it can give better and more personalized feedback based on the users' spending habits
