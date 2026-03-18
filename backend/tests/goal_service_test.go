package tests

import (
	"testing"
	"time"

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
		assert.Equal(t, 0.0, goal.CurrentAmount)
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

	t.Run("creates goal with initial current amount", func(t *testing.T) {
		req := services.GoalCreateRequest{
			Name:          "Laptop",
			TargetAmount:  80000.00,
			CurrentAmount: 20000.00,
		}
		goal, err := svc.GoalCreate(user.ID, req)
		require.NoError(t, err)
		assert.Equal(t, 20000.00, goal.CurrentAmount)
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

	t.Run("owner can update current amount (progress)", func(t *testing.T) {
		updated, err := svc.GoalUpdate(user.ID, goal.ID, services.GoalUpdateRequest{CurrentAmount: 5000})
		require.NoError(t, err)
		assert.Equal(t, 5000.0, updated.CurrentAmount)
	})

	t.Run("owner can update deadline", func(t *testing.T) {
		newDeadline := time.Now().AddDate(1, 0, 0)
		updated, err := svc.GoalUpdate(user.ID, goal.ID, services.GoalUpdateRequest{Deadline: &newDeadline})
		require.NoError(t, err)
		assert.NotNil(t, updated.Deadline)
	})

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