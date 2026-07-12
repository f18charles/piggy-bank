package database

import (
	"log/slog"

	"github.com/f18charles/piggy-bank/backend/internal/config"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// Connect initializes the global database connection
func Connect() {
	var logLevel logger.LogLevel

	if config.App.AppEnv == "development" {
		logLevel = logger.Info
	} else {
		logLevel = logger.Error
	}

	// FIX: Use PostgreSQL with simple protocol to avoid prepared statement issues
	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  config.App.DatabaseURL,
		PreferSimpleProtocol: true, // THIS IS THE KEY FIX
	}), &gorm.Config{
		Logger: logger.Default.LogMode(logLevel),
		// Disable prepared statements
		PrepareStmt: false,
	})
	if err != nil {
		slog.Error("Failed to connect to database: %v", "error", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		slog.Error("Failed to get database instance: %v", "error", err)
	}

	// Reduced connection pool for free tier
	sqlDB.SetMaxOpenConns(10)
	sqlDB.SetMaxIdleConns(5)

	DB = db

	// After gorm.Open succeeds
	slog.Info("database connected", "max_open", 10, "max_idle", 5)
}
