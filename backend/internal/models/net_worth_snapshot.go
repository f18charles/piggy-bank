package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NetWorthSnapshot is a point-in-time record of a user's total net worth,
// written once per day by the background scheduler. It powers trend charts
// and the month-over-month net-worth change.
type NetWorthSnapshot struct {
	ID            uuid.UUID `gorm:"type:uuid;primaryKey" json:"id"`
	UserID        uuid.UUID `gorm:"type:uuid;not null;uniqueIndex:idx_user_snapshot" json:"user_id"`
	TotalNetWorth float64   `gorm:"type:numeric(15,2);not null" json:"total_net_worth"`
	SnapshotDate  time.Time `gorm:"type:date;uniqueIndex:idx_user_snapshot" json:"snapshot_date"`
	CreatedAt     time.Time `json:"created_at"`
}

func (n *NetWorthSnapshot) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}
