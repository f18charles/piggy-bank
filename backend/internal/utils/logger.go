package utils

import (
	"log/slog"
	"os"
)

func InitLogger(env string) {
	var level slog.Level
	if env == "production" {
		level = slog.LevelWarn
	} else {
		level = slog.LevelDebug
	}
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level: level,
	})))
}
