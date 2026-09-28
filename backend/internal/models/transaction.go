package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Transaction struct {
	ID         uuid.UUID  `gorm:"type:uuid;primaryKey" json:"id"`
	UserID     uuid.UUID  `gorm:"type:uuid;not null" json:"user_id"`
	AccountID  uuid.UUID  `gorm:"type:uuid;not null" json:"account_id"`
	CategoryID *uuid.UUID `gorm:"type:uuid" json:"category_id"`
	GoalID     *uuid.UUID `gorm:"type:uuid" json:"goal_id"`
	// FromAccountID/ToAccountID are only set on `type = "transfer"` rows.
	// account_id mirrors the source account for transfers so existing
	// account-scoped queries keep working unchanged.
	FromAccountID   *uuid.UUID `gorm:"type:uuid" json:"from_account_id"`
	ToAccountID     *uuid.UUID `gorm:"type:uuid" json:"to_account_id"`
	Amount          float64    `gorm:"type:numeric(15,2);not null" json:"amount"`
	Type            string     `gorm:"not null" json:"type"`
	Description     string     `json:"description"`
	PaymentMethod   string     `json:"payment_method"`
	ReferenceID     string     `json:"reference_id"`
	Status          string     `gorm:"default:completed" json:"status"`
	TransactionDate time.Time  `json:"transaction_date"`
	CreatedAt       time.Time  `json:"created_at"`

	User        User      `gorm:"foreignKey:UserID" json:"-"`
	Account     Account   `gorm:"foreignKey:AccountID" json:"account"`
	Category    *Category `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Goal        *Goal     `gorm:"foreignKey:GoalID" json:"goal,omitempty"`
	FromAccount *Account  `gorm:"foreignKey:FromAccountID" json:"from_account,omitempty"`
	ToAccount   *Account  `gorm:"foreignKey:ToAccountID" json:"to_account,omitempty"`
}

func (t *Transaction) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	return nil
}
