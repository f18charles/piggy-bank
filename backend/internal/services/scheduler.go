package services

import (
	"log/slog"
	"time"

	"gorm.io/gorm"
)

// StartSchedulers launches the background jobs that keep recurring
// transactions and net-worth snapshots up to date. It is only called from
// main once the DB is connected, never during tests.
func StartSchedulers(db *gorm.DB) {
	recurring := NewRecurringService(db)
	snapshots := NewSnapshotService(db)

	go func() {
		// Catch up immediately, then hourly.
		runRecurring(recurring)
		ticker := time.NewTicker(time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			runRecurring(recurring)
		}
	}()

	go func() {
		// Give the DB a moment, then snapshot every 6 hours.
		time.Sleep(10 * time.Second)
		runSnapshots(snapshots)
		ticker := time.NewTicker(6 * time.Hour)
		defer ticker.Stop()
		for range ticker.C {
			runSnapshots(snapshots)
		}
	}()
}

func runRecurring(svc *RecurringService) {
	n, err := svc.RunDue(time.Now())
	if err != nil {
		slog.Error("recurring scheduler failed", "error", err)
		return
	}
	if n > 0 {
		slog.Info("recurring scheduler generated transactions", "count", n)
	}
}

func runSnapshots(svc *SnapshotService) {
	n, err := svc.SnapshotAll(time.Now())
	if err != nil {
		slog.Error("net worth snapshot scheduler failed", "error", err)
		return
	}
	slog.Info("net worth snapshots written", "count", n)
}
