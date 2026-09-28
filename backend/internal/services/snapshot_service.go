package services

import (
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SnapshotService struct {
	db           *gorm.DB
	accountRepo  repository.AccountRepo
	snapshotRepo *repository.NetWorthSnapshotRepo
	userRepo     repository.UserRepository
}

func NewSnapshotService(db *gorm.DB) *SnapshotService {
	return &SnapshotService{
		db:           db,
		accountRepo:  *repository.NewAccountRepo(db),
		snapshotRepo: repository.NewNetWorthSnapshotRepo(db),
		userRepo:     *repository.NewUserRepository(db),
	}
}

// NetWorth sums the user's account balances. There is no liability account
// type yet, so every account counts as an asset.
func (ss *SnapshotService) NetWorth(userID uuid.UUID) (float64, error) {
	accounts, err := ss.accountRepo.ListAccountByUser(userID)
	if err != nil {
		return 0, err
	}
	total := 0.0
	for _, acc := range accounts {
		total += acc.Balance
	}
	return total, nil
}

// SnapshotUser records (or replaces) the user's snapshot for the given day.
func (ss *SnapshotService) SnapshotUser(userID uuid.UUID, asOf time.Time) error {
	total, err := ss.NetWorth(userID)
	if err != nil {
		return err
	}
	day := time.Date(asOf.Year(), asOf.Month(), asOf.Day(), 0, 0, 0, 0, time.UTC)
	return ss.snapshotRepo.Upsert(&models.NetWorthSnapshot{
		UserID:        userID,
		TotalNetWorth: total,
		SnapshotDate:  day,
	})
}

// SnapshotAll writes a snapshot for every user. Called by the scheduler.
func (ss *SnapshotService) SnapshotAll(asOf time.Time) (int, error) {
	users, err := ss.userRepo.ListUsers()
	if err != nil {
		return 0, err
	}
	count := 0
	for _, u := range users {
		if err := ss.SnapshotUser(u.ID, asOf); err != nil {
			return count, err
		}
		count++
	}
	return count, nil
}

// History returns up to limit snapshots, oldest first.
func (ss *SnapshotService) History(userID uuid.UUID, limit int) ([]models.NetWorthSnapshot, error) {
	if limit <= 0 {
		limit = 365
	}
	return ss.snapshotRepo.ListRecent(userID, limit)
}

// ChangeSince returns the percent change between the current net worth and
// the most recent snapshot strictly before `since`. Returns 0 when there is
// no historical baseline yet.
func (ss *SnapshotService) ChangeSince(userID uuid.UUID, since time.Time) (float64, error) {
	current, err := ss.NetWorth(userID)
	if err != nil {
		return 0, err
	}
	base, err := ss.snapshotRepo.LatestBefore(userID, since)
	if err != nil || base == nil || base.TotalNetWorth == 0 {
		return 0, nil
	}
	return ((current - base.TotalNetWorth) / base.TotalNetWorth) * 100, nil
}
