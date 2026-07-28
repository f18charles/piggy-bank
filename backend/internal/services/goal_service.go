package services

import (
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/repository"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// GoalCreateRequest creates a new goal starting at $0 saved. CurrentAmount
// is intentionally not settable here — use GoalContribute afterwards so
// every dollar saved is backed by a real account transfer and transaction.
type GoalCreateRequest struct {
	Name         string     `json:"name" binding:"required"`
	TargetAmount float64    `json:"target_amount" binding:"required"`
	Deadline     *time.Time `json:"deadline"`
}

type GoalService struct {
	goalRepo *repository.GoalRepo
	db       *gorm.DB
}

// NewGoalService creates a GoalService with an initialized repository.
func NewGoalService(db *gorm.DB) *GoalService {
	return &GoalService{
		goalRepo: repository.NewGoalRepo(db),
		db:       db,
	}
}

// GoalUpdateRequest updates descriptive goal fields only. CurrentAmount is
// intentionally excluded here — it can only change via GoalContribute or
// GoalWithdraw so that every change is backed by a real account transfer
// and a corresponding transaction record.
type GoalUpdateRequest struct {
	Name         string     `json:"name"`
	TargetAmount float64    `json:"target_amount"`
	Deadline     *time.Time `json:"deadline"`
}

// GoalCreate creates a new savings goal for the user and persists it via the repository.
func (gs *GoalService) GoalCreate(user_id uuid.UUID, req GoalCreateRequest) (*models.Goal, error) {
	goal := &models.Goal{
		UserID:       user_id,
		Name:         req.Name,
		TargetAmount: req.TargetAmount,
		Deadline:     req.Deadline,
	}
	if err := gs.goalRepo.CreateGoal(goal); err != nil {
		return nil, err
	}
	return goal, nil
}

// GetGoal fetches a goal by ID and ensures the requesting user is the owner.
func (gs *GoalService) GetGoal(user_id, goal_id uuid.UUID) (*models.Goal, error) {
	goal, err := gs.goalRepo.GetGoalByID(goal_id)
	if err != nil {
		return nil, err
	}
	if goal.UserID != user_id {
		return nil, utils.ErrForbidden
	}
	return goal, nil
}

// GoalUpdate updates an existing goal's fields that were provided in the request.
func (gs *GoalService) GoalUpdate(user_id, goal_id uuid.UUID, req GoalUpdateRequest) (*models.Goal, error) {
	goal, err := gs.goalRepo.GetGoalByID(goal_id)
	if err != nil {
		return nil, err
	}
	if goal.UserID != user_id {
		return nil, utils.ErrForbidden
	}
	if req.Name != "" {
		goal.Name = req.Name
	}
	if req.TargetAmount != 0 {
		goal.TargetAmount = req.TargetAmount
	}
	if req.Deadline != nil {
		goal.Deadline = req.Deadline
	}
	if err := gs.goalRepo.UpdateGoal(goal); err != nil {
		return nil, err
	}
	return goal, nil
}

// GoalList returns all goals for the specified user.
func (gs *GoalService) GoalList(user_id uuid.UUID) ([]models.Goal, error) {
	goals, err := gs.goalRepo.ListGoalsByUser(user_id)
	if err != nil {
		return nil, err
	}
	return goals, nil
}

// GoalDelete deletes a goal after verifying ownership.
func (gs *GoalService) GoalDelete(user_id, goal_id uuid.UUID) error {
	goal, err := gs.goalRepo.GetGoalByID(goal_id)
	if err != nil {
		return err
	}
	if goal.UserID != user_id {
		return utils.ErrForbidden
	}
	return gs.goalRepo.DeleteGoal(goal_id)
}

type GoalContributeRequest struct {
	AccountID uuid.UUID `json:"account_id" binding:"required"`
	Amount    float64   `json:"amount" binding:"required"`
}

type GoalWithdrawRequest struct {
	AccountID uuid.UUID `json:"account_id" binding:"required"`
	Amount    float64   `json:"amount" binding:"required"`
}

// GoalContribute moves money from the given account into the goal. This is
// always allowed, including past the target amount (overfunding). It debits
// the account balance, credits the goal's current amount, and records a
// completed "expense" transaction linked to the goal so it shows up in the
// user's transaction history.
func (gs *GoalService) GoalContribute(user_id, goal_id uuid.UUID, req GoalContributeRequest) (*models.Goal, error) {
	if req.Amount <= 0 {
		return nil, utils.ErrBadRequest
	}

	goal, err := gs.goalRepo.GetGoalByID(goal_id)
	if err != nil {
		return nil, err
	}
	if goal.UserID != user_id {
		return nil, utils.ErrForbidden
	}

	err = gs.db.Transaction(func(dbTx *gorm.DB) error {
		var account models.Account
		if err := dbTx.First(&account, "id = ?", req.AccountID).Error; err != nil {
			return err
		}
		if account.UserID != user_id {
			return utils.ErrForbidden
		}

		account.Balance -= req.Amount
		if err := dbTx.Save(&account).Error; err != nil {
			return err
		}

		goal.CurrentAmount += req.Amount
		if err := dbTx.Save(goal).Error; err != nil {
			return err
		}

		tx := &models.Transaction{
			UserID:          user_id,
			AccountID:       account.ID,
			GoalID:          &goal.ID,
			Amount:          req.Amount,
			PaymentMethod:   "cash",
			Type:            "expense",
			Description:     "Contribution to goal: " + goal.Name,
			Status:          "completed",
			TransactionDate: time.Now(),
		}
		return dbTx.Create(tx).Error
	})
	if err != nil {
		return nil, err
	}

	return gs.goalRepo.GetGoalByID(goal_id)
}

// GoalWithdraw moves money from the goal back into the given account. Only
// allowed once the goal has reached its target amount.
// TODO: support early/emergency withdrawal before the target is reached.
func (gs *GoalService) GoalWithdraw(user_id, goal_id uuid.UUID, req GoalWithdrawRequest) (*models.Goal, error) {
	if req.Amount <= 0 {
		return nil, utils.ErrBadRequest
	}

	goal, err := gs.goalRepo.GetGoalByID(goal_id)
	if err != nil {
		return nil, err
	}
	if goal.UserID != user_id {
		return nil, utils.ErrForbidden
	}

	if goal.CurrentAmount < goal.TargetAmount {
		return nil, utils.ErrGoalNotReached
	}
	if req.Amount > goal.CurrentAmount {
		return nil, utils.ErrInsufficientGoalFunds
	}

	err = gs.db.Transaction(func(dbTx *gorm.DB) error {
		var account models.Account
		if err := dbTx.First(&account, "id = ?", req.AccountID).Error; err != nil {
			return err
		}
		if account.UserID != user_id {
			return utils.ErrForbidden
		}

		account.Balance += req.Amount
		if err := dbTx.Save(&account).Error; err != nil {
			return err
		}

		goal.CurrentAmount -= req.Amount
		if err := dbTx.Save(goal).Error; err != nil {
			return err
		}

		tx := &models.Transaction{
			UserID:          user_id,
			AccountID:       account.ID,
			GoalID:          &goal.ID,
			Amount:          req.Amount,
			Type:            "income",
			Description:     "Withdrawal from goal: " + goal.Name,
			Status:          "completed",
			TransactionDate: time.Now(),
		}
		return dbTx.Create(tx).Error
	})
	if err != nil {
		return nil, err
	}

	return gs.goalRepo.GetGoalByID(goal_id)
}
