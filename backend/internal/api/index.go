// Package handler adapts the existing Gin router to Vercel's Go serverless
// runtime. Vercel invokes Handler per-request rather than running a
// long-lived process, so this is a different entrypoint from
// cmd/server/main.go, not a replacement for it -- main.go still works
// unchanged for local development or deployment elsewhere.
package handler

import (
	"net/http"
	"sync"

	api "github.com/f18charles/piggy-bank/backend/internal/api/router"
	"github.com/f18charles/piggy-bank/backend/internal/config"
	"github.com/f18charles/piggy-bank/backend/internal/database"
	"github.com/f18charles/piggy-bank/backend/internal/utils"
)

var (
	setupOnce sync.Once
	router    http.Handler
)

// setup runs the same startup steps main.go does (load config, connect to
// the database, build the router) -- but guarded by sync.Once, so it only
// actually runs once per warm function instance, not on every single
// request. Vercel may reuse an instance across nearby requests; without
// this guard, every invocation would re-open a database connection.
func setup() {
	config.Load()
	database.Connect()
	utils.InitLogger(config.App.AppEnv)
	router = api.SetupRouter()
}

// Handler is the function signature Vercel's Go runtime looks for. Every
// request Vercel routes here (see vercel.json) lands in this one function,
// which just hands off to the Gin router exactly as main.go would have.
func Handler(w http.ResponseWriter, r *http.Request) {
	setupOnce.Do(setup)
	router.ServeHTTP(w, r)
}
