package repository

import (
	"errors"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type NetWorthSnapshotRepo struct {
	db *gorm.DB
}

func NewNetWorthSnapshotRepo(db *gorm.DB) *NetWorthSnapshotRepo {
	return &NetWorthSnapshotRepo{db: db}
}

// Upsert writes a snapshot for (user_id, snapshot_date), replacing any
// existing row for the same day so re-running the scheduler is idempotent.
func (r *NetWorthSnapshotRepo) Upsert(snap *models.NetWorthSnapshot) error {
	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "user_id"}, {Name: "snapshot_date"}},
		DoUpdates: clause.AssignmentColumns([]string{"total_net_worth", "created_at"}),
	}).Create(snap).Error
}

// ListRecent returns up to limit snapshots ordered oldest-first, suitable for
// charting a trend.
func (r *NetWorthSnapshotRepo) ListRecent(userID uuid.UUID, limit int) ([]models.NetWorthSnapshot, error) {
	snaps := []models.NetWorthSnapshot{}
	result := r.db.Where("user_id = ?", userID).
		Order("snapshot_date DESC").Limit(limit).Find(&snaps)
	if result.Error != nil {
		return nil, result.Error
	}
	// reverse to ascending for charts
	for i, j := 0, len(snaps)-1; i < j; i, j = i+1, j-1 {
		snaps[i], snaps[j] = snaps[j], snaps[i]
	}
	return snaps, nil
}

// LatestBefore returns the most recent snapshot strictly before the given
// date, or utils.ErrNotFound when there is no history yet.
func (r *NetWorthSnapshotRepo) LatestBefore(userID uuid.UUID, date time.Time) (*models.NetWorthSnapshot, error) {
	var snap models.NetWorthSnapshot
	result := r.db.Where("user_id = ? AND snapshot_date < ?", userID, date).
		Order("snapshot_date DESC").First(&snap)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, utils.ErrNotFound
		}
		return nil, result.Error
	}
	return &snap, nil
}
