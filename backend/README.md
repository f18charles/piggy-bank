# Piggy Bank — Backend API

A high-performance RESTful API server for the **Piggy Bank** personal finance platform, built with **Go**, **Gin**, **GORM**, and **PostgreSQL**.

---

## Architecture & Design

The backend follows a strict **Layered Clean Architecture** pattern ensuring clean separation of concerns, testability, and maintainability:

```
                  ┌───────────────────────────────┐
                  │    HTTP Requests (Clients)    │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │    Handlers (HTTP Layer)      │  api/handlers/
                  │  - Request parsing/validation │
                  │  - Auth middleware checks     │
                  │  - Standardized JSON response │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │   Services (Business Logic)   │  internal/services/
                  │  - Business rules & ownership │
                  │  - Financial calculations     │
                  │  - Data transformations       │
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │  Repositories (Data Access)   │  internal/repository/
                  │  - GORM / PostgreSQL queries  │
                  │  - Transactions & aggregations│
                  └──────────────┬────────────────┘
                                 │
                                 ▼
                  ┌───────────────────────────────┐
                  │       PostgreSQL Database     │
                  └───────────────────────────────┘
```

### Key Components:
- **`cmd/server/`**: Server entrypoint, configuration bootstrapping, and database connection.
- **`internal/api/`**: Gin router setup, CORS, and auth middleware.
- **`internal/api/handlers/`**: HTTP controllers for Auth, Accounts, Transactions, Categories, Budgets, Goals, and Insights.
- **`internal/auth/`**: JWT generation, parsing, password hashing (bcrypt), and token revocation tracking.
- **`internal/database/`**: GORM database initialization, connection pooling, and SQL migration files.
- **`internal/models/`**: Database entities (User, Account, Category, Budget, Goal, Transaction).
- **`internal/repository/`**: Database access layer.
- **`internal/services/`**: Core financial business logic and reporting engines.
- **`internal/utils/`**: Context helpers, standardized JSON response formatters, logger, and custom error types.
- **`pkg/`**: Standalone computational packages for summary, insights, and overview metrics.

---

## API Endpoints Overview

Base path: `/api/v1`

### Authentication (`/api/v1/auth`)
| Method | Path | Description | Protected |
|---|---|---|:---:|
| `POST` | `/auth/register` | Register a new user | No |
| `POST` | `/auth/login` | Log in and receive access + refresh tokens | No |
| `POST` | `/auth/refresh` | Refresh an expired access token | No |
| `POST` | `/auth/logout` | Revoke active session tokens | Yes |
| `GET` | `/auth/profile` | Get current authenticated user profile | Yes |

### Accounts (`/api/v1/accounts`)
| Method | Path | Description | Protected |
|---|---|---|:---:|
| `GET` | `/accounts` | List all accounts with balances | Yes |
| `POST` | `/accounts` | Create an account (Bank, M-Pesa, Cash) | Yes |
| `GET` | `/accounts/:id` | Get account details | Yes |
| `PATCH` | `/accounts/:id` | Update account name or attributes | Yes |
| `DELETE` | `/accounts/:id` | Soft delete an account | Yes |

### Transactions (`/api/v1/transactions`)
| Method | Path | Description | Protected |
|---|---|---|:---:|
| `GET` | `/transactions` | List transactions with filters (type, category, account, dates) | Yes |
| `POST` | `/transactions` | Record an income, expense, or transfer | Yes |
| `GET` | `/transactions/export` | Export transaction history to CSV | Yes |
| `GET` | `/transactions/:id` | Get transaction by ID | Yes |
| `PATCH` | `/transactions/:id` | Update transaction record | Yes |
| `DELETE` | `/transactions/:id` | Remove a transaction | Yes |

### Categories (`/api/v1/categories`)
| Method | Path | Description | Protected |
|---|---|---|:---:|
| `GET` | `/categories` | List user & system categories | Yes |
| `POST` | `/categories` | Create a custom category | Yes |
| `PATCH` | `/categories/:id` | Update category name / icon | Yes |
| `DELETE` | `/categories/:id` | Delete a category | Yes |

### Budgets (`/api/v1/budgets`)
| Method | Path | Description | Protected |
|---|---|---|:---:|
| `GET` | `/budgets` | List monthly budgets with current spending progress | Yes |
| `POST` | `/budgets` | Create category budget with monthly limit | Yes |
| `GET` | `/budgets/:id` | Get budget details | Yes |
| `PATCH` | `/budgets/:id` | Update budget target limit | Yes |
| `DELETE` | `/budgets/:id` | Delete a budget | Yes |

### Savings Goals (`/api/v1/goals`)
| Method | Path | Description | Protected |
|---|---|---|:---:|
| `GET` | `/goals` | List all savings goals and progress | Yes |
| `POST` | `/goals` | Create a goal with target amount & deadline | Yes |
| `GET` | `/goals/:id` | Get goal details | Yes |
| `PATCH` | `/goals/:id` | Update goal target or deadline | Yes |
| `DELETE` | `/goals/:id` | Delete a goal | Yes |
| `POST` | `/goals/:id/contribute`| Add funds to a goal from an account | Yes |
| `POST` | `/goals/:id/withdraw`  | Withdraw funds from a goal to an account | Yes |

### Insights & Overview (`/api/v1/insights`)
| Method | Path | Description | Protected |
|---|---|---|:---:|
| `GET` | `/insights/overview` | Aggregated dashboard overview (Net Worth, Burn Rate, Health) | Yes |
| `GET` | `/insights/spending` | Spending breakdown by category and distribution | Yes |
| `GET` | `/insights/summary/monthly` | Monthly income vs expenses summary | Yes |
| `GET` | `/insights/summary/yearly` | Year-to-date financial summary | Yes |

---

## Getting Started

### Prerequisites
- **Go 1.21+**
- **PostgreSQL 15+**
- **golang-migrate** (optional, for CLI migrations)

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL credentials:
```env
PORT=8080
DATABASE_URL=postgres://postgres:password@localhost:5432/piggybank?sslmode=disable
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRY_MINUTES=15
APP_ENV=development
ALLOWED_ORIGIN=*
```

### 2. Run Database Migrations
```bash
make migrate-up
```

### 3. Run the Server
```bash
# Using Makefile
make run

# Or directly with Go
go run ./cmd/server
```
The server will start on `http://localhost:8080` (or your configured `PORT`).

---

## Testing & Code Quality

Run tests and linting via `Makefile`:

```bash
# Run all tests
make test

# Run tests with HTML coverage report
make test-cover

# Format code
make fmt

# Run Go vet
make vet
```
