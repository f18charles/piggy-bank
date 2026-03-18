package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	JWTSecret        string
	JWTExpiryMinutes int
	AppEnv           string

	MpesaConsumerKey    string
	MpesaConsumerSecret string
	MpesaShortCode      string
	MpesaPassKey        string
	MpesaCallbackURL    string

	// ncba
}

var App Config

// Load reads environment variables (optionally from .env) and populates the
// package-level App configuration value.
func Load() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	expiryMinutes, err := strconv.Atoi(getEnv("JWT_EXPIRY_MINUTES", "10"))
	if err != nil {
		expiryMinutes = 10
	}

	App = Config{
		Port:             getEnv("PORT", "8080"),
		DatabaseURL:      mustGetEnv("DATABASE_URL"),
		JWTSecret:        mustGetEnv("JWT_SECRET"),
		JWTExpiryMinutes: expiryMinutes,
		AppEnv:           getEnv("APP_ENV", "development"),
	}
}

// getEnv returns the environment variable value or the provided fallback.
func getEnv(key, fallback string) string {
	if value, ok := os.LookupEnv(key); ok {
		return value
	}
	return fallback
}

// mustGetEnv returns the value for a required env var or logs/fails when
// it's missing.
func mustGetEnv(key string) string {
	value, ok := os.LookupEnv(key)
	if !ok || value == "" {
		log.Fatalf("Required enviroment variable %s is not set", key)
	}
	return value
}
