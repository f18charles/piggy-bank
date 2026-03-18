package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Goal struct {
	ID            uuid.UUID  `gorm:"type:uuid;default:primaryKey" json:"id"`
	UserID        uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	Name          string     `gorm:"not null" json:"name"`
	TargetAmount  float64    `gorm:"type:numeric(15,2);not null" json:"target_amount"`
	CurrentAmount float64    `gorm:"type:numeric(15,2);default:0" json:"current_amount"`
	Deadline      *time.Time `json:"deadline"`
	CreatedAt     time.Time  `json:"created_at"`

	User User `gorm:"foreignKey:UserID" json:"-"`
}

func (g *Goal) BeforeCreate(tx *gorm.DB) error {
	if g.ID == uuid.Nil {
		g.ID = uuid.New()
	}
	return nil
}
