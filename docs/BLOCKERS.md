# Production Readiness & Blockers Report

> **Project:** Piggy Bank  
> **Status:** Pre-Production / Core Feature Complete with Critical Blockers  
> **Domain Focus:** Personal Financial Tracking (Accounts, Budgets, Goals, Transactions, Insights)  
> *Note: Bank integrations (M-Pesa / NCBA payment APIs) are scoped out of core production functionality per project requirements.*

---

## Executive Summary

Piggy Bank has a solid foundation with a clean 3-tier Go backend architecture (Handlers -> Services -> Repositories) and a modern React 19 + Tailwind CSS frontend. The core domain models (Accounts, Transactions, Budgets, Goals, Categories) and reporting engines are well-structured.

However, several **critical blockers, security vulnerabilities, frontend integration gaps, and deployment omissions** prevent this project from functioning reliably and securely in a production environment.

---

## 1. Critical Backend Blockers & Vulnerabilities

### 1.1 Insecure CORS Configuration
- **Location:** [`backend/internal/api/middleware/cors.go`](file:///D:/FCO/Coding/piggy-bank/backend/internal/api/middleware/cors.go)
- **Issue:** The CORS middleware returns `Access-Control-Allow-Credentials: true` alongside wildcard origin `*` when `ALLOWED_ORIGIN` is not set or empty.
- **Impact:** Per the W3C CORS specification, modern browsers block cross-origin requests that combine `Allow-Credentials: true` with wildcard origins. In production, requests will fail with CORS errors.
- **Fix:** Explicitly default to the frontend origin (e.g. `http://localhost:5173` or specific production domain), or mirror the incoming `Origin` header if it matches an allowlist.

### 1.2 Broken JWT Revocation & Blacklisting
- **Location:** [`backend/internal/auth/jwt.go`](file:///D:/FCO/Coding/piggy-bank/backend/internal/auth/jwt.go), [`backend/internal/auth/revocation.go`](file:///D:/FCO/Coding/piggy-bank/backend/internal/auth/revocation.go), [`backend/internal/services/auth_service.go`](file:///D:/FCO/Coding/piggy-bank/backend/internal/services/auth_service.go)
- **Issues:**
  1. `generateToken` in `jwt.go` does not embed a `jti` (JWT ID) claim when minting tokens.
  2. `RevokeRefreshToken` in `revocation.go` looks for the `jti` claim and fails with `"token missing jti claim"`.
  3. `AuthRequired` middleware in `internal/api/middleware/auth.go` validates JWT signatures but never checks if the token has been revoked / blacklisted.
  4. In `auth_service.go`, `RefreshTokens` does not check if the refresh token is blacklisted before issuing new token pairs.
  5. Typo in function name `IsRevocked` in `revocation.go`.
- **Impact:** Logging out does not actually invalidate tokens on the server; an attacker with a leaked token or refresh token retains access indefinitely until expiration.
- **Fix:** Populate `jti` in token generation, enforce token blacklist verification in both the auth middleware and the refresh service, and implement automatic background cleanup of expired blacklisted tokens.

### 1.3 Incomplete / Blocked Goal Withdrawal Business Logic
- **Location:** [`backend/internal/services/goal_service.go`](file:///D:/FCO/Coding/piggy-bank/backend/internal/services/goal_service.go#L185)
- **Issue:** `GoalWithdraw` strictly rejects any withdrawal if `goal.CurrentAmount < goal.TargetAmount` returning `ErrGoalNotReached`.
- **Impact:** Users are completely blocked from withdrawing emergency funds from ongoing savings goals prior to reaching 100% of the target.
- **Fix:** Allow partial or full early withdrawals by reducing the goal's `CurrentAmount`, adjusting the account balance, and creating a corresponding withdrawal transaction record.

### 1.4 Unhandled Budget End-Date Calculation
- **Location:** [`backend/internal/services/budget_service.go`](file:///D:/FCO/Coding/piggy-bank/backend/internal/services/budget_service.go)
- **Issue:** The backend does not automatically compute or validate `start_date` and `end_date` when creating or updating budgets if only `period` (e.g., monthly) is provided.
- **Impact:** The frontend currently polyfills this calculation (`BudgetForm.jsx`), but direct API calls without explicit dates result in zero-value dates or malformed budget cycles.

---

## 2. Critical Frontend Blockers & UI Gaps

### 2.1 Missing User Registration / Signup Flow
- **Location:** [`frontend/piggy_bank/src/App.jsx`](file:///D:/FCO/Coding/piggy-bank/frontend/piggy_bank/src/App.jsx), [`frontend/piggy_bank/src/pages/Welcome.jsx`](file:///D:/FCO/Coding/piggy-bank/frontend/piggy_bank/src/pages/Welcome.jsx)
- **Issue:** While the backend exposes `POST /api/v1/auth/register`, there is **no Register / Signup page** anywhere in the frontend. All "Get Started" and "Create Account" buttons navigate directly to `/login`.
- **Impact:** New users cannot self-register through the web interface.
- **Fix:** Build a dedicated `Register.jsx` page and add the `/register` route to `App.jsx`.

### 2.2 Token Refresh Crash & State Desynchronization
- **Location:** [`frontend/piggy_bank/src/utils/Client.js`](file:///D:/FCO/Coding/piggy-bank/frontend/piggy_bank/src/utils/Client.js), [`frontend/piggy_bank/src/utils/auth/AuthProvider.jsx`](file:///D:/FCO/Coding/piggy-bank/frontend/piggy_bank/src/utils/auth/AuthProvider.jsx)
- **Issues:**
  1. In `Client.js`, when a 401 triggers `refreshAccessToken()`, `res.json()` failure handling returns `null`, but the next line directly accesses `json.data.access_token`, triggering an uncaught `TypeError: Cannot read properties of null` and crashing the application.
  2. Tokens are saved directly to `localStorage`, but `AuthProvider`'s internal React state (`accessToken`) is never updated on refresh.
- **Impact:** Silent authentication failures crash the frontend, and components consuming `useAuth()` hold stale tokens.
- **Fix:** Add null checks before accessing `json.data` and trigger an event or auth state callback when new tokens are received.

### 2.3 Partial Transaction Editing
- **Location:** [`frontend/piggy_bank/src/components/Transactions/TransactionForm.jsx`](file:///D:/FCO/Coding/piggy-bank/frontend/piggy_bank/src/components/Transactions/TransactionForm.jsx)
- **Issue:** Editing a transaction only allows updating the `description` field. Modifying amount, category, date, or account is disabled.
- **Impact:** Users who mistype an amount or categorize an entry incorrectly must delete and recreate the transaction.

### 2.4 Missing User Profile / Settings UI
- **Location:** Header & Layout components
- **Issue:** The backend provides `GET /auth/profile`, but the frontend does not provide a profile or settings view to view user details, change preferred currency, or update credentials.

### 2.5 No 404 / NotFound Route
- **Location:** [`frontend/piggy_bank/src/App.jsx`](file:///D:/FCO/Coding/piggy-bank/frontend/piggy_bank/src/App.jsx)
- **Issue:** Unknown routes are silently redirected to `/` or `/welcome` with no error message or user feedback.

---

## 3. Database & Migration Blockers

### 3.1 Hardcoded Migration Assumptions in Deployment
- **Location:** [`backend/internal/database/migrations`](file:///D:/FCO/Coding/piggy-bank/backend/internal/database/migrations)
- **Issue:** The application relies on external migration execution (`golang-migrate` CLI or Makefile) rather than running pending migrations automatically during application boot.
- **Impact:** In production container environments (Docker, Kubernetes, Render, Railway), deploying a new version without manual migration runs will cause crashes on missing columns/tables.
- **Fix:** Embed migrations using `embed.FS` in Go and run automated migrations on startup if configured.

---

## 4. Production Operations & Security Blockers

### 4.1 Missing Rate Limiting
- **Issue:** Auth endpoints (`/api/v1/auth/login`, `/api/v1/auth/register`) have no rate limiting or brute-force protection.
- **Fix:** Add middleware using token bucket or Redis-backed rate limiter.

### 4.2 Lack of Structured Observability & Health Checks
- **Issue:** The `/health` endpoint only returns `{"status": "ok"}` without pinging the PostgreSQL database.
- **Fix:** Implement deep health checking (verifying DB connectivity) and structured JSON logging in production.

### 4.3 Missing Production Containerization Setup
- **Location:** `deployments/`
- **Issue:** The `deployments/` folder contains only a stub README. There is no multi-stage `Dockerfile` for the Go backend or the React frontend, nor a `docker-compose.prod.yml`.
- **Fix:** Provide production-ready Dockerfiles and docker-compose configurations.

---

## Action Plan to Achieve Production Readiness

| Phase | Tasks | Priority |
|---|---|---|
| **P0: Security & Auth** | Fix CORS credentials mismatch, implement `jti` in JWT, enforce revocation checks in middleware & refresh, fix `Client.js` refresh crash | Immediate |
| **P0: User Onboarding** | Create `/register` page and link welcome buttons to register flow | Immediate |
| **P1: Core Business Logic**| Allow flexible goal withdrawal, full transaction editability, server-side budget period resolution | High |
| **P1: Deployment Setup** | Create multi-stage Dockerfiles, Docker Compose production stack, automated database migration runner | High |
| **P2: Observability & UX** | DB-aware health checks, 404 page, profile & currency preferences page | Medium |
