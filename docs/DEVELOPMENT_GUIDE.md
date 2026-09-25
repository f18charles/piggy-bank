# Piggy Bank — Developer & Operations Guide

This guide covers local environment configuration, running the database, executing migrations, testing, and deployment.

---

## 1. Prerequisites

- **Go**: 1.22 or 1.25+
- **Node.js**: 18+ (LTS) & `npm`
- **PostgreSQL**: 15+ (local instance or Docker container)
- **Make**: (Optional, for running Makefile automation commands)

---

## 2. Environment Variables

### Backend Configuration (`backend/.env`)

```env
# Server
PORT=8080
APP_ENV=development

# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/piggybank?sslmode=disable

# Authentication
JWT_SECRET=replace_with_a_cryptographically_secure_random_string_32_chars_min
JWT_EXPIRY_MINUTES=15
REFRESH_TOKEN_EXPIRY_DAYS=7

# CORS
ALLOWED_ORIGIN=http://localhost:5173
```

### Frontend Configuration (`frontend/piggy_bank/.env`)

```env
VITE_API_URL=http://localhost:8080/api/v1
```

---

## 3. Database Setup & Migrations

### Running PostgreSQL with Docker
```bash
docker run --name piggy-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=piggybank -p 5432:5432 -d postgres:15-alpine
```

### Running Migrations
Using `golang-migrate`:
```bash
# Install CLI tool
go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest

# Run migrations up
migrate -path backend/internal/database/migrations -database "postgres://postgres:postgres@localhost:5432/piggybank?sslmode=disable" up
```

Or using the Makefile:
```bash
cd backend
make migrate-up
```

---

## 4. Running the Application Locally

### Starting Backend
```bash
cd backend
go run ./cmd/server
```
The server will boot and listen on `http://localhost:8080`. Health check: `http://localhost:8080/health`.

### Starting Frontend
```bash
cd frontend/piggy_bank
npm install
npm run dev
```
The frontend will start on `http://localhost:5173`.

---

## 5. Running Tests & Quality Checks

### Backend Tests
```bash
cd backend
go test -v ./tests/...
```

### Frontend Typecheck & Build
```bash
cd frontend/piggy_bank
npm run lint
npm run build
```

---

## 6. Project Architecture Overview

```
piggy-bank/
├── backend/
│   ├── cmd/server/main.go            # HTTP server entrypoint
│   ├── internal/
│   │   ├── api/                      # Routing, handlers, CORS & Auth middleware
│   │   ├── auth/                     # JWT tokens, bcrypt, revocation blacklist
│   │   ├── config/                   # Env variable loader
│   │   ├── database/                 # GORM initialization & SQL migrations
│   │   ├── models/                   # Struct models (User, Account, Tx, Budget, Goal)
│   │   ├── repository/               # SQL queries & DB interaction layer
│   │   ├── services/                 # Business logic, calculations, CSV/PDF export
│   │   └── utils/                    # JSON response envelopes, logger, error types
│   ├── pkg/                          # Independent calculators (insights, overview, summary)
│   └── tests/                        # Go test suite
├── frontend/piggy_bank/
│   ├── src/
│   │   ├── components/               # Modals, tables, cards, layout drawer
│   │   ├── pages/                    # Views (Dashboard, Accounts, Budgets, Goals, Transactions)
│   │   └── utils/                    # Client API interceptor, Auth Context & Protected Route
│   └── package.json
└── docs/                             # Full architectural & API documentation
```
