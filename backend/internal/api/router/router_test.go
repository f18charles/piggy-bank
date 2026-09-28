package api

import "testing"

// TestSetupRouterRegistersRoutes builds the full route tree. Gin panics on
// conflicting static/param sibling routes, so this guards against a route
// like /transactions/bulk being added next to /transactions/:id without it
// being caught.
func TestSetupRouterRegistersRoutes(t *testing.T) {
	router := SetupRouter()
	if router == nil {
		t.Fatal("SetupRouter returned nil")
	}
}
