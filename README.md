# Piggy Bank

> **A modern, self-hosted personal finance tracking platform built with Go, PostgreSQL, React 19, and Tailwind CSS.**

Piggy Bank gives you complete visibility and control over your personal finances. Manage multi-account balances across **Bank**, **Mobile Money**, and **Cash**, enforce monthly category budgets, track milestone savings goals, record detailed transaction ledgers, and analyze monthly burn rates — all within a fast, responsive interface.

---

## 🎯 Core Features

- **Consolidated Financial Dashboard (`/`)**: Real-time Net Worth aggregation, monthly burn rate meter, multi-account snapshot, and goal health indicators.
- **Multi-Account Management (`/accounts`)**: Track bank accounts, mobile wallets, and physical cash with real-time balance calculations.
- **Smart Category Budgeting (`/budgets`)**: Set monthly spending limits per category with visual burn indicators and threshold warnings.
- **Milestone Savings Goals (`/goals`)**: Create target savings deadlines, log deposits/withdrawals linked directly to your accounts, and track progress.
- **Transaction Ledger & Data Export (`/transactions`)**: Comprehensive recording of income, expenses, and transfers with multi-criteria filtering, full editing, and CSV/PDF export.
- **Inter-Account Transfers**: Move money between your own Bank/M-Pesa/Cash accounts without skewing income or expense totals.
- **Recurring Transactions (`/recurring`)**: Schedule rent, subscriptions, or salary; the backend scheduler records them automatically on each due date.
- **Insights & Trends (`/insights`)**: Category spending donut, anomalies, recommendations, monthly cashflow, and net-worth history.
- **JWT Authentication & Security**: Secure token pairs, bcrypt password hashing, and user data isolation.

---

## 🛠 Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend** | **Go (Gin Framework)** | High-throughput 3-tier architecture (Handlers, Services, Repositories) |
| **Database** | **PostgreSQL 15+** | Relational data integrity, ACID compliance, GORM ORM |
| **Frontend** | **React 19 (Vite)** | Reactive single-page application with modern component architecture |
| **Styling** | **Tailwind CSS v4** | Utility-first, responsive design with emerald/slate aesthetics |
| **Routing** | **React Router v7** | Declarative routing with protected authentication guards |
| **Auth** | **JWT (golang-jwt)** | Stateless access tokens with refresh token rotation |

---

## 📁 Repository Structure

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
│   │   └── utils/            # Standardized JSON envelopes, errors, logging
│   ├── pkg/                  # Insights, summary, and overview analytics
│   └── tests/                # Unit and integration test suites
├── frontend/
│   └── piggy_bank/           # React + Vite Web Application
│       ├── src/
│       │   ├── components/   # UI components (Layout, Dashboard, Accounts, etc.)
│       │   ├── pages/        # Route views (Welcome, Login, Dashboard, etc.)
│       │   ├── styles/       # Tailwind CSS styles
│       │   └── utils/        # API client, auth context, token storage
│       └── package.json
├── docs/                     # Project Specifications & Documentation
│   ├── ARCHITECTURE.md       # Full architectural breakdown & diagrams
│   ├── API.md                # Complete REST API reference
│   ├── BLOCKERS.md           # Production readiness & blockers report
│   ├── DEVELOPMENT_GUIDE.md  # Local setup, database, testing, and dev guide
│   └── PROJECT.md            # Original project specifications
└── README.md
```

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend

# Configure environment
cp .env.example .env

# Run database migrations
make migrate-up

# Start the API server
go run ./cmd/server
```
The API server will listen on `http://localhost:8080`.

### 2. Frontend

```bash
cd frontend/piggy_bank

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
The web application will be accessible at `http://localhost:5173`.

---

## 📚 Documentation

For in-depth guides, see the [`docs/`](./docs) directory:
- 🏗️ [Architecture & Data Models](./docs/ARCHITECTURE.md)
- 🔌 [REST API Reference](./docs/API.md)
- ⚠️ [Production Blockers & Audit Report](./docs/BLOCKERS.md)
- 💻 [Developer & Operations Guide](./docs/DEVELOPMENT_GUIDE.md)

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE.md](./LICENSE.md) for details.
