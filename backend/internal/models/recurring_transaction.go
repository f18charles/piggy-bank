package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RecurringTransaction is a template for transactions that the background
// scheduler materializes on each due date. account_id is the source/touched
// account; to_account_id is only set for `type = "transfer"`.
type RecurringTransaction struct {
	ID            uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID        uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	AccountID     uuid.UUID  `gorm:"type:uuid;not null" json:"account_id"`
	ToAccountID   *uuid.UUID `gorm:"type:uuid" json:"to_account_id"`
	CategoryID    *uuid.UUID `gorm:"type:uuid" json:"category_id"`
	Amount        float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	Type          string     `gorm:"not null" json:"type"`
	Description   string     `json:"description"`
	PaymentMethod string     `json:"payment_method"`
	Frequency     string     `gorm:"not null" json:"frequency"`
	NextDueDate   time.Time  `gorm:"type:date" json:"next_due_date"`
	LastRunAt     *time.Time `json:"last_run_at"`
	IsActive      bool       `gorm:"default:true" json:"is_active"`
	CreatedAt     time.Time  `json:"created_at"`

	Account   Account   `gorm:"foreignKey:AccountID" json:"account"`
	ToAccount *Account  `gorm:"foreignKey:ToAccountID" json:"to_account,omitempty"`
	Category  *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
}

func (r *RecurringTransaction) BeforeCreate(tx *gorm.DB) error {
	if r.ID == uuid.Nil {
		r.ID = uuid.New()
	}
	return nil
}
