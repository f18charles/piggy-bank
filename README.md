# Piggy Bank

> **A modern, self-hosted personal finance platform built with Go, Gin, PostgreSQL, and React.**

Piggy Bank gives you complete control and visibility over your personal finances. Track multi-currency accounts across **NCBA Bank**, **M-Pesa**, and **Cash**, enforce category budgets, track savings milestone goals, and analyze monthly spending burn rates — all within a fast, responsive web interface.

---

## Key Features & Overview

### 1. Welcome & Landing Experience (`/welcome`)
- Clean, modern introduction to PiggyBank's core capabilities, layered architecture, and workflow.
- Quick navigation into the dashboard or authentication flow.

### 2. Consolidated Financial Dashboard (`/`)
- **Total Net Worth Tracker**: Real-time aggregated balance across all active accounts with month-over-month growth.
- **Monthly Burn Rate Meter**: Live spending progress bar and visual burn health against overall monthly budgets.
- **Accounts Snapshot**: Instant status of Bank, M-Pesa, and Cash balances.
- **Budget Health & Goal Progress**: High-level visual cards summarizing ongoing goals and category budgets.

### 3. Multi-Account Management (`/accounts`)
- Create and organize accounts by type: **Bank (NCBA)**, **Mobile Money (M-Pesa)**, and **Cash**.
- Live balance tracking, account details, and quick deposit/withdrawal recording.

### 4. Smart Category Budgeting (`/budget`)
- Set custom monthly spending thresholds for each spending category.
- Visual progress meters indicating percentage spent and warning indicators when approaching or exceeding limits.

### 5. Milestone Savings Goals (`/goals`)
- Create financial targets with specific deadline dates and target amounts (e.g. Emergency Fund, Travel, Tech).
- Direct contributions and withdrawals linked to your accounts with automated percentage progress tracking.

### 6. Detailed Transaction Ledger & CSV Export (`/transactions`)
- Record income, expenses, and inter-account transfers with timestamps, categories, payment methods, and notes.
- Granular search and filtering by date range, account, and category.
- **One-click CSV export** of transaction logs for external analysis.

### 7. Bank-Grade Auth & Security
- Secure JWT authentication with short-lived access tokens and refresh token rotation.
- SHA-256 token revocation store and bcrypt password hashing.

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend** | **Go (Gin Framework)** | High-throughput, concurrent RESTful API |
| **Database** | **PostgreSQL 15+** | Relational data integrity, ACID compliance, GORM ORM |
| **Frontend** | **React 19 (Vite)** | Reactive single-page application with modern component architecture |
| **Styling** | **Tailwind CSS v4** | Utility-first, responsive design with emerald/slate aesthetics |
| **Routing** | **React Router v7** | Declarative client routing and protected route guards |
| **Auth** | **JWT (golang-jwt)** | Stateless access tokens with server-side revocation tracking |
| **Icons** | **React Icons (Material)** | Intuitive, accessible visual icons |

---

## Project Structure

```
piggy-bank/
├── backend/                  # Go RESTful API Server
│   ├── cmd/server/           # Application entrypoint
│   ├── internal/             # Layered architecture packages
│   │   ├── api/              # Gin router, middleware (CORS, Auth), handlers
│   │   ├── auth/             # JWT utils, bcrypt password hashing, revocation
│   │   ├── database/         # Database connection and migrations
│   │   ├── models/           # Data models (User, Account, Budget, Goal, Tx)
│   │   ├── repository/       # Data access layer (PostgreSQL queries)
│   │   ├── services/         # Business logic and reporting engine
│   │   └── utils/            # Logging, standardized JSON responses, errors
│   ├── pkg/                  # Insights, summary, and overview calculators
│   ├── tests/                # Unit and integration test suites
│   ├── Makefile              # Build, test, and migration automation
│   └── README.md             # Backend architecture & API documentation
├── frontend/
│   └── piggy_bank/           # React + Vite Web Application
│       ├── src/
│       │   ├── assets/       # Brand logo and media assets
│       │   ├── components/   # UI components (Layout, Dashboard, Accounts, etc.)
│       │   ├── pages/        # Route views (Welcome, Login, Dashboard, etc.)
│       │   ├── styles/       # Tailwind CSS styles
│       │   └── utils/        # API client, auth context, token storage
│       ├── package.json      # Dependencies and scripts
│       └── README.md         # Frontend documentation and component guide
├── deployments/              # Docker and deployment configurations
├── docs/                     # Project specifications and architecture docs
├── LICENSE.md                # MIT License
└── README.md                 # Root project overview
```

---

## Getting Started

### Prerequisites
- **Go 1.21+**
- **Node.js 18+** & **npm**
- **PostgreSQL 15+**

---

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Copy environment variables template
cp .env.example .env
# Configure your DATABASE_URL and JWT_SECRET in .env

# Run database migrations
make migrate-up

# Start the API server
make run
# Or: go run ./cmd/server
```
The API server will listen on `http://localhost:8080`.

---

### 2. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend/piggy_bank

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Start the Vite development server
npm run dev
```
The web application will be available at `http://localhost:5173`.

---

## Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP server port | `8080` |
| `DATABASE_URL` | PostgreSQL connection URI | `postgres://postgres:password@localhost:5432/piggybank?sslmode=disable` |
| `JWT_SECRET` | Secret key for signing JWTs | `replace-with-a-strong-secret` |
| `JWT_EXPIRY_MINUTES` | Access token lifespan in minutes | `10` |
| `APP_ENV` | Environment (`development` / `production`) | `development` |
| `ALLOWED_ORIGIN` | CORS allowed origins | `*` |

### Frontend (`frontend/piggy_bank/.env`)
| Variable | Description | Default |
|---|---|---|
| `VITE_API_URL` | Base endpoint for backend API | `http://localhost:8080/api/v1` |

---

## Documentation Links

- [Backend API & Architecture Guide](./backend/README.md)
- [Frontend Web App Guide](./frontend/piggy_bank/README.md)
- [Internal Architecture Specification](./backend/internal/README.md)
- [Project Specification (PROJECT.md)](./docs/PROJECT.md)

---

## License

This project is licensed under the MIT License — see the [LICENSE.md](./LICENSE.md) file for details.
