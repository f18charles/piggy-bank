package main

import (
	"log"

	api "github.com/f18charles/piggy-bank/backend/internal/api/router"
	"github.com/f18charles/piggy-bank/backend/internal/auth"
	"github.com/f18charles/piggy-bank/backend/internal/config"
	"github.com/f18charles/piggy-bank/backend/internal/database"
	"github.com/f18charles/piggy-bank/backend/internal/services"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
)

func main() {
	// load config
	config.Load()

	// Connect to database
	database.Connect()

	// Initialize token blacklist and pruner
	if database.DB != nil {
		auth.InitRevocation(database.DB)
		auth.StartBlacklistPruner()
		// Recurring transactions and net-worth snapshots run in the
		// background; see services.StartSchedulers.
		services.StartSchedulers(database.DB)
	}

	// setup logger
	utils.InitLogger(config.App.AppEnv)

	r := api.SetupRouter()

	addr := ":" + config.App.Port
	log.Printf("Server starting on %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
