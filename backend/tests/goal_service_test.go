package tests

import (
	"testing"
	"time"

	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGoalCreate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "goal@example.com")
	svc := services.NewGoalService(db)

	t.Run("creates goal successfully", func(t *testing.T) {
		deadline := time.Now().AddDate(0, 6, 0)
		req := services.GoalCreateRequest{
			Name:         "Emergency Fund",
			TargetAmount: 100000.00,
			Deadline:     &deadline,
		}
		goal, err := svc.GoalCreate(user.ID, req)
		require.NoError(t, err)
		assert.NotNil(t, goal)
		assert.Equal(t, "Emergency Fund", goal.Name)
		assert.Equal(t, 100000.00, goal.TargetAmount)
		assert.Equal(t, user.ID, goal.UserID)
	})

	t.Run("creates goal without deadline", func(t *testing.T) {
		req := services.GoalCreateRequest{
			Name:         "Car Fund",
			TargetAmount: 500000.00,
		}
		goal, err := svc.GoalCreate(user.ID, req)
		require.NoError(t, err)
		assert.Nil(t, goal.Deadline)
	})

	// GoalCreateRequest has no CurrentAmount field at all -- every goal must
	// start at $0 saved. The only way to put money into a goal is through
	// GoalContribute, so that every dollar saved is backed by a real
	// account transfer and a corresponding transaction record.
	t.Run("new goal always starts at $0 saved", func(t *testing.T) {
		req := services.GoalCreateRequest{
			Name:         "Laptop",
			TargetAmount: 80000.00,
		}
		goal, err := svc.GoalCreate(user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, 0.0, goal.CurrentAmount)
	})
}

func TestGoalGet(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "goalget@example.com")
	other := seedUser(t, db, "goalget2@example.com")
	svc := services.NewGoalService(db)

	goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Trip", TargetAmount: 50000})

	t.Run("owner can retrieve goal", func(t *testing.T) {
		result, err := svc.GetGoal(user.ID, goal.ID)
		require.NoError(t, err)
		assert.Equal(t, goal.ID, result.ID)
	})

	t.Run("other user gets ErrForbidden", func(t *testing.T) {
		_, err := svc.GetGoal(other.ID, goal.ID)
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("non-existent goal returns error", func(t *testing.T) {
		_, err := svc.GetGoal(user.ID, nonExistentUUID())
		assert.Error(t, err)
	})
}

func TestGoalUpdate(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "goalupdate@example.com")
	other := seedUser(t, db, "goalupdate2@example.com")
	svc := services.NewGoalService(db)

	goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Old Name", TargetAmount: 10000})

	t.Run("owner can update name", func(t *testing.T) {
		updated, err := svc.GoalUpdate(user.ID, goal.ID, services.GoalUpdateRequest{Name: "New Name"})
		require.NoError(t, err)
		assert.Equal(t, "New Name", updated.Name)
	})

	t.Run("owner can update target amount", func(t *testing.T) {
		updated, err := svc.GoalUpdate(user.ID, goal.ID, services.GoalUpdateRequest{TargetAmount: 20000})
		require.NoError(t, err)
		assert.Equal(t, 20000.0, updated.TargetAmount)
	})

	t.Run("owner can update deadline", func(t *testing.T) {
		newDeadline := time.Now().AddDate(1, 0, 0)
		updated, err := svc.GoalUpdate(user.ID, goal.ID, services.GoalUpdateRequest{Deadline: &newDeadline})
		require.NoError(t, err)
		assert.NotNil(t, updated.Deadline)
	})

	// GoalUpdateRequest has no CurrentAmount field -- progress can only move
	// via GoalContribute/GoalWithdraw (covered in their own tests below), so
	// there is nothing here that could accidentally bypass that path.

	t.Run("other user cannot update", func(t *testing.T) {
		_, err := svc.GoalUpdate(other.ID, goal.ID, services.GoalUpdateRequest{Name: "Hacked"})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})
}

func TestGoalList(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "goallist@example.com")
	other := seedUser(t, db, "goallist2@example.com")
	svc := services.NewGoalService(db)

	t.Run("empty list for new user", func(t *testing.T) {
		fresh := seedUser(t, db, "goalfresh@example.com")
		goals, err := svc.GoalList(fresh.ID)
		require.NoError(t, err)
		assert.Len(t, goals, 0)
	})

	t.Run("lists only user's goals", func(t *testing.T) {
		svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "G1", TargetAmount: 1000})
		svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "G2", TargetAmount: 2000})
		svc.GoalCreate(other.ID, services.GoalCreateRequest{Name: "Other", TargetAmount: 500})

		goals, err := svc.GoalList(user.ID)
		require.NoError(t, err)
		assert.GreaterOrEqual(t, len(goals), 2)
		for _, g := range goals {
			assert.Equal(t, user.ID, g.UserID)
		}
	})
}

func TestGoalDelete(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "goaldel@example.com")
	other := seedUser(t, db, "goaldel2@example.com")
	svc := services.NewGoalService(db)

	goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "ToDelete", TargetAmount: 1000})

	t.Run("other user cannot delete", func(t *testing.T) {
		err := svc.GoalDelete(other.ID, goal.ID)
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("owner can delete", func(t *testing.T) {
		err := svc.GoalDelete(user.ID, goal.ID)
		require.NoError(t, err)

		_, err = svc.GetGoal(user.ID, goal.ID)
		assert.Error(t, err)
	})
}

func TestGoalContribute(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "goalcontribute@example.com")
	other := seedUser(t, db, "goalcontribute2@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	otherAcc := seedAccount(t, db, other.ID, "bank")
	svc := services.NewGoalService(db)

	t.Run("debits the account and credits the goal, recording a linked transaction", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Emergency Fund", TargetAmount: 10000})

		updated, err := svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{
			AccountID: acc.ID,
			Amount:    3000,
		})
		require.NoError(t, err)
		assert.Equal(t, 3000.0, updated.CurrentAmount)

		var refreshedAccount models.Account
		require.NoError(t, db.First(&refreshedAccount, "id = ?", acc.ID).Error)
		assert.Equal(t, -3000.0, refreshedAccount.Balance)

		var tx models.Transaction
		require.NoError(t, db.Where("goal_id = ?", goal.ID).First(&tx).Error)
		assert.Equal(t, "expense", tx.Type)
		assert.Equal(t, "completed", tx.Status)
		assert.Equal(t, 3000.0, tx.Amount)
		assert.Equal(t, acc.ID, tx.AccountID)
		require.NotNil(t, tx.GoalID)
		assert.Equal(t, goal.ID, *tx.GoalID)
	})

	t.Run("overfunding past the target amount is allowed", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Small Goal", TargetAmount: 1000})

		updated, err := svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{
			AccountID: acc.ID,
			Amount:    1500,
		})
		require.NoError(t, err)
		assert.Equal(t, 1500.0, updated.CurrentAmount)
	})

	t.Run("zero or negative amount is rejected", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Zero Test", TargetAmount: 1000})

		_, err := svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{
			AccountID: acc.ID,
			Amount:    0,
		})
		assert.ErrorIs(t, err, utils.ErrBadRequest)

		_, err = svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{
			AccountID: acc.ID,
			Amount:    -100,
		})
		assert.ErrorIs(t, err, utils.ErrBadRequest)
	})

	t.Run("other user cannot contribute to someone else's goal", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Private Goal", TargetAmount: 1000})

		_, err := svc.GoalContribute(other.ID, goal.ID, services.GoalContributeRequest{
			AccountID: otherAcc.ID,
			Amount:    100,
		})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("cannot use an account that belongs to another user", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Mismatched Account", TargetAmount: 1000})

		_, err := svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{
			AccountID: otherAcc.ID,
			Amount:    100,
		})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})
}

func TestGoalWithdraw(t *testing.T) {
	db := setupTestDB(t)
	user := seedUser(t, db, "goalwithdraw@example.com")
	other := seedUser(t, db, "goalwithdraw2@example.com")
	acc := seedAccount(t, db, user.ID, "bank")
	otherAcc := seedAccount(t, db, other.ID, "bank")
	svc := services.NewGoalService(db)

	t.Run("blocked before the goal reaches its target", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Not There Yet", TargetAmount: 10000})
		svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{AccountID: acc.ID, Amount: 5000})

		_, err := svc.GoalWithdraw(user.ID, goal.ID, services.GoalWithdrawRequest{AccountID: acc.ID, Amount: 1000})
		assert.ErrorIs(t, err, utils.ErrGoalNotReached)
	})

	t.Run("allowed once the goal has reached its target, credits the account and records a linked transaction", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Fully Funded", TargetAmount: 5000})
		svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{AccountID: acc.ID, Amount: 5000})

		var accountBeforeWithdraw models.Account
		require.NoError(t, db.First(&accountBeforeWithdraw, "id = ?", acc.ID).Error)

		updated, err := svc.GoalWithdraw(user.ID, goal.ID, services.GoalWithdrawRequest{AccountID: acc.ID, Amount: 2000})
		require.NoError(t, err)
		assert.Equal(t, 3000.0, updated.CurrentAmount)

		var refreshedAccount models.Account
		require.NoError(t, db.First(&refreshedAccount, "id = ?", acc.ID).Error)
		assert.Equal(t, accountBeforeWithdraw.Balance+2000.0, refreshedAccount.Balance)

		var tx models.Transaction
		require.NoError(t, db.Where("goal_id = ? AND type = ?", goal.ID, "income").First(&tx).Error)
		assert.Equal(t, "completed", tx.Status)
		assert.Equal(t, 2000.0, tx.Amount)
		assert.Equal(t, acc.ID, tx.AccountID)
	})

	t.Run("cannot withdraw more than the goal's current amount", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Overdraw Attempt", TargetAmount: 1000})
		svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{AccountID: acc.ID, Amount: 1000})

		_, err := svc.GoalWithdraw(user.ID, goal.ID, services.GoalWithdrawRequest{AccountID: acc.ID, Amount: 5000})
		assert.ErrorIs(t, err, utils.ErrInsufficientGoalFunds)
	})

	t.Run("zero or negative amount is rejected", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Zero Withdraw", TargetAmount: 1000})
		svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{AccountID: acc.ID, Amount: 1000})

		_, err := svc.GoalWithdraw(user.ID, goal.ID, services.GoalWithdrawRequest{AccountID: acc.ID, Amount: 0})
		assert.ErrorIs(t, err, utils.ErrBadRequest)
	})

	t.Run("other user cannot withdraw from someone else's completed goal", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Someone Else's Goal", TargetAmount: 1000})
		svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{AccountID: acc.ID, Amount: 1000})

		_, err := svc.GoalWithdraw(other.ID, goal.ID, services.GoalWithdrawRequest{AccountID: otherAcc.ID, Amount: 500})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})

	t.Run("cannot deposit into an account that belongs to another user", func(t *testing.T) {
		goal, _ := svc.GoalCreate(user.ID, services.GoalCreateRequest{Name: "Mismatched Deposit", TargetAmount: 1000})
		svc.GoalContribute(user.ID, goal.ID, services.GoalContributeRequest{AccountID: acc.ID, Amount: 1000})

		_, err := svc.GoalWithdraw(user.ID, goal.ID, services.GoalWithdrawRequest{AccountID: otherAcc.ID, Amount: 500})
		assert.ErrorIs(t, err, utils.ErrForbidden)
	})
}
