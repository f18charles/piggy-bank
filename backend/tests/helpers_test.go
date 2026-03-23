package tests

import (
	"testing"

	"github.com/f18charles/piggy-bank/backend/internal/config"
	"github.com/f18charles/piggy-bank/backend/internal/models"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// setupTestDB creates an in-memory SQLite database, runs auto-migrations for
// all models, and returns a clean *gorm.DB for use in a single test.
// Each call gets its own isolated database — tests do not share state.
func setupTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	config.App.JWTSecret = "test-secret"
	config.App.JWTExpiryMinutes = 60
	config.App.AppEnv = "test"

	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	require.NoError(t, err, "failed to open in-memory test database")

	// Register BeforeCreate hooks so UUIDs are generated in SQLite.
	// uuid_generate_v4() is PostgreSQL-only and does not run in SQLite,
	// so without this hook all IDs stay as zero UUIDs and FK constraints fail.
	registerUUIDHooks(db)

	err = db.AutoMigrate(
		&models.User{},
		&models.Account{},
		&models.Category{},
		&models.Transaction{},
		&models.Budget{},
		&models.Goal{},
	)
	require.NoError(t, err, "failed to run migrations on test database")

	return db
}

// registerUUIDHooks registers a GORM callback that auto-generates UUIDs for
// all models before insert, since uuid_generate_v4() is PostgreSQL-only.
func registerUUIDHooks(db *gorm.DB) {
	_ = db.Callback().Create().Before("gorm:create").Register("uuid:before_create", func(tx *gorm.DB) {
		if tx.Statement == nil || tx.Statement.Schema == nil {
			return
		}
		field := tx.Statement.Schema.LookUpField("ID")
		if field == nil {
			return
		}
		_, zero := field.ValueOf(tx.Statement.Context, tx.Statement.ReflectValue)
		if zero {
			_ = field.Set(tx.Statement.Context, tx.Statement.ReflectValue, uuid.New())
		}
	})
}

// nonExistentUUID returns a UUID guaranteed not to exist in any test database.
func nonExistentUUID() uuid.UUID {
	return uuid.MustParse("00000000-0000-0000-0000-000000000001")
}

// seedAccount creates an account for a user for use in other tests.
func seedAccount(t *testing.T, db *gorm.DB, userID uuid.UUID, accType string) *models.Account {
	t.Helper()
	svc := services.NewAccService(db)
	acc, err := svc.AccountCreate(userID, services.AccCreateRequest{
		Name:    accType + "-account",
		Type:    accType,
		Balance: 0,
	})
	require.NoError(t, err)
	return acc
}
