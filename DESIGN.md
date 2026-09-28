# Design — Piggy Bank

This document records the architecture and schema decisions for this project. It exists
so both humans and AI agents building on this repo make consistent choices instead of
re-deriving architecture per feature. Read it together with `docs/PROJECT.md` (what to
build and why) and `AGENTS.md` (coding conventions derived from these decisions).

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Backend language | Go 1.25 | Performance and idiomatic control; future payment callbacks need concurrency (`docs/PROJECT.md`). |
| HTTP framework | Gin | Larger middleware ecosystem than the alternatives for this use case (`docs/PROJECT.md`). |
| Database | PostgreSQL 15+ | Correct decimal handling for money and mature tooling (`docs/PROJECT.md`). |
| DB access | GORM | Speed of development; `PreferSimpleProtocol` + `PrepareStmt: false` avoid prepared-statement pooler issues (`backend/internal/database/db.go`). |
| Migrations | golang-migrate (versioned `.sql`) | Explicit, reviewable schema changes (`backend/internal/database/migrations`). |
| Auth | JWT (golang-jwt/v5), bcrypt | Stateless access + refresh tokens; bcrypt password hashing (`backend/internal/auth`). |
| Frontend | React 19 + Vite | Fast dev builds; React path toward a future native app (`docs/PROJECT.md`). |
| Routing | React Router v7 | Declarative routing with an auth guard (`frontend/piggy_bank/src/App.jsx`). |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` | Utility-first, responsive UI (`frontend/piggy_bank/package.json`). |
| Charts | Recharts | Dashboard cashflow/net-worth and insights/goal-growth charts (`docs/LONG_TERM_USE.md` §2.2). |
| Export | `jung-kurt/gofpdf` | PDF/CSV transaction export served by the backend. |
| Deployment | Multi-stage Dockerfiles + docker-compose; Vercel configs present | Self-hosted stack (`deployments/docker-compose.yml`). |

## 2. Data model / schema (v1)

Authoritative schema is the migration set under `backend/internal/database/migrations/`.
All IDs are UUIDs (`uuid_generate_v4()`); **all money is `NUMERIC(15,2)`**.

```sql
users (
  id uuid pk, email varchar unique not null, password_hash varchar not null,
  full_name varchar not null, currency varchar default 'KES',
  created_at timestamptz, updated_at timestamptz
)

accounts (
  id uuid pk, user_id uuid not null fk users on delete cascade,
  name varchar not null, type varchar check (type in ('bank','mpesa','cash')),
  balance numeric(15,2) default 0, currency varchar default 'KES',
  created_at timestamptz
)

categories (
  id uuid pk, user_id uuid fk users on delete cascade, -- null = system default
  name varchar not null, type varchar check (type in ('income','expense')),
  color varchar, icon varchar, is_default boolean default false, created_at timestamptz
)

transactions (
  id uuid pk, user_id uuid not null fk users on delete cascade,
  account_id uuid not null fk accounts on delete restrict,
  category_id uuid fk categories on delete set null,
  goal_id uuid fk goals on delete set null,          -- migration 000008
  from_account_id uuid fk accounts on delete set null, -- transfers, migration 000009
  to_account_id uuid fk accounts on delete set null,   -- transfers, migration 000009
  amount numeric(15,2) not null,
  type varchar check (type in ('income','expense','transfer')),
  description varchar, payment_method varchar check (cash|mpesa|card|bank_transfer),
  reference_id varchar, status varchar default 'completed',
  transaction_date timestamptz, created_at timestamptz
)
-- indexes: user_id, account_id, transaction_date, goal_id, description,
-- from_account_id, to_account_id, (user_id, reference_id) (migration 000013)

budgets (
  id uuid pk, user_id uuid not null fk users on delete cascade,
  category_id uuid not null fk categories on delete cascade,
  amount numeric(15,2) not null,
  period varchar check (period in ('monthly','weekly','quarterly','yearly','custom')),
  start_date date not null, end_date date not null, created_at timestamptz
)  -- `spent` column dropped in migration 000010; derived at read time

recurring_transactions (   -- migration 000011
  id uuid pk, user_id uuid not null fk users on delete cascade,
  account_id uuid not null fk accounts on delete cascade,
  to_account_id uuid fk accounts on delete set null,
  category_id uuid fk categories on delete set null,
  amount numeric(15,2) not null,
  type varchar check (type in ('income','expense','transfer')),
  description varchar, payment_method varchar,
  frequency varchar check (frequency in ('daily','weekly','monthly','yearly')),
  next_due_date date not null, last_run_at timestamptz,
  is_active boolean default true, created_at timestamptz
)

net_worth_snapshots (   -- migration 000012
  id uuid pk, user_id uuid not null fk users on delete cascade,
  total_net_worth numeric(15,2) not null,
  snapshot_date date not null, created_at timestamptz,
  unique (user_id, snapshot_date)
)

goals (
  id uuid pk, user_id uuid not null fk users on delete cascade,
  name varchar not null, target_amount numeric(15,2) not null,
  current_amount numeric(15,2) default 0, deadline date, created_at timestamptz
)

blacklisted_tokens (   -- migration 000007, JWT revocation store
  jti text pk, expires_at timestamptz not null
)
```

Model structs live one file per model in `backend/internal/models/` and carry matching
`gorm:"type:numeric(15,2)"` tags. `budget.Spent`, `overview.NetWorthBrief` change, and
goal growth are computed at read time and are not stored columns.

## 3. Core business logic (single owners)

| Logic | Owner | Notes |
|---|---|---|
| Create/update/delete transaction + account balance effect | `TxService.TxCreate`/`TxUpdate`/`TxDelete` (`transaction_service.go`) | Single DB transaction; `applyBalanceEffect` handles income/expense/transfer. |
| Goal contribution/withdrawal accounting | `GoalService.GoalContribute`/`GoalWithdraw` (`goal_service.go`) | Only path that changes `goals.current_amount`; writes a linked transaction. |
| Budget spending | `BudgetServices.computeSpent` (`budget_service.go`) | Derived from transactions in the active period window; never stored. |
| Recurring materialization | `RecurringService.RunDue` + `services.StartSchedulers` | Creates due transactions through `TxService`; catch-up capped. |
| Net worth + snapshots | `SnapshotService` (`snapshot_service.go`) | Current value and daily history; drives overview change %. |
| Net worth / account aggregation | `backend/pkg/overview` via `OverviewService` | Do not recompute in handlers. |
| Monthly/yearly totals, savings rate | `backend/pkg/summary` via `SummaryService` | Dashboard and report source of truth; excludes transfers. |
| Burn rate and top-category spending | `backend/pkg/insights` + `spending_insights_service.go` | Insights endpoints only. |
| Auth token mint/validate/revoke | `backend/internal/auth` (`jwt.go`, `revocation.go`) | Access vs refresh token types; `jti` blacklist. |

## 4. Authorization / access control

- **Trust boundary**: single authenticated user role. There is no admin/public split.
- **Enforcement**: `middleware.AuthRequired()` (`backend/internal/api/middleware/auth.go`)
  validates the `Bearer` access token, rejects refresh tokens on protected endpoints, and
  injects `user_id` into the Gin context.
- **Data isolation**: every repository method filters by `user_id`, and every service
  method re-checks ownership (`ErrForbidden`) before returning or mutating a record.
- **Rule**: the frontend guard (`Protectedroute.jsx`) is a UX convenience only — it is
  never the enforcement mechanism. The backend must reject cross-user access on its own.
- **Public routes**: `/auth/register`, `/auth/login`, `/auth/refresh`, and `/health` only.

## 5. External integrations

- **M-Pesa (Safaricom Daraja)**: planned STK push + callback. Currently only empty stubs
  exist in `backend/internal/api/handlers/mpesa.go` and are **not registered** in
  `router.go`. Provider-specific code belongs in a dedicated integration package behind
  a `PaymentProvider`-style interface so the rest of the app never imports a provider SDK.
- **NCBA**: planned balance/transfer/webhook integration; not started.
- No third-party SDK is currently a runtime dependency. Do not add one without a design
  update (see `AGENTS.md` #10).
- **AI (future)**: `backend/pkg/ai` fixes `Categorizer`/`InsightsGenerator` interfaces with
  no-op defaults. No model/provider is wired; services must depend on the interface only.
- **Bulk / SMS ingestion (future)**: `POST /api/v1/transactions/bulk` accepts an array and
  dedupes by `reference_id` per user (`TxCreateBulk`, indexed in migration 000013). The
  Android client is not built (`docs/LONG_TERM_USE.md` §4.1).

## 6. File / module structure

```
backend/
├── cmd/server/main.go            # entrypoint: config → DB → revocation → router
├── internal/
│   ├── api/router/router.go      # all route registration
│   ├── api/handlers/            # bind/validate input, call service, emit envelope
│   ├── api/middleware/          # auth.go, cors.go, logger.go
│   ├── auth/                    # jwt.go, password.go, revocation.go, context.go
│   ├── config/config.go         # env loading (DATABASE_URL, JWT_SECRET required)
│   ├── database/                # db.go + migrations/ (numbered up/down pairs)
│   ├── models/                  # one file per GORM model
│   ├── repository/              # DB-only queries, user-scoped
│   ├── services/                # business logic + transactional money flows,
│   │                            #   recurring_service.go, snapshot_service.go,
│   │                            #   scheduler.go (StartSchedulers)
│   └── utils/                   # response.go envelope, errors.go, logger.go
├── pkg/overview|summary|insights# pure analytics calculators
├── pkg/ai                       # Categorizer/InsightsGenerator interfaces (no provider)
└── tests/                       # service-level Go tests
frontend/piggy_bank/src/
├── components/<Domain>/         # Accounts, Budgets, Dashboard, Goals, Transactions,
│                                #   Recurring, Layout (charts live in Dashboard/Goals)
├── pages/                       # route views incl. pages/auth/{Login,Register}.jsx
│                                #   plus Recurring.jsx and Insights.jsx
└── utils/Client.js              # sole HTTP entry point (token refresh, envelope unwrap)
```

What does **not** belong here: GORM in handlers, HTTP concerns in repositories, `fetch`
calls in components, or analytics recomputed outside `pkg/`.

## 7. Concurrency & idempotency

Money flows are the only concurrency-sensitive surface:

- `TxCreate` / `TxUpdate` / `TxDelete` and `GoalContribute` / `GoalWithdraw` each run inside
  a single `db.Transaction`, so the transaction row and every `accounts.balance` change
  move together or not at all. Transfers touch source and destination in the same tx.
- `transactions.reference_id` prevents double-posting: an indexed per-user lookup plus
  `TxCreateBulk`'s in-request dedupe make bulk/SMS ingestion idempotent. Uniqueness is
  service-enforced (not a DB constraint) so legacy duplicate rows can't block migration.
- Recurring generation (`RecurringService.RunDue`) only advances `next_due_date` after the
  transaction is created, so a crashed run retries rather than skips, and re-running within
  the same period creates nothing.
- Known gap: concurrent writes to the same account use read-modify-write (`First` then
  `Save`) without row locking or a conditional `UPDATE`, so two simultaneous mutations can
  lose an update. When payments/integrations land, replace with an atomic conditional
  update or `SELECT ... FOR UPDATE`. Tracked in §12.

## 8. Environments

- `APP_ENV` selects behavior: `development` enables GORM `Info` logging; anything else
  uses `Error` level (`db.go`). GORM `AutoMigrate` is used only for the blacklist table.
- **Config is env-driven**; no secrets in code. Required: `DATABASE_URL`, `JWT_SECRET`.
  Optional: `PORT` (8080), `JWT_EXPIRY_MINUTES` (10), `ALLOWED_ORIGIN`.
- `deployments/docker-compose.yml` runs postgres + backend + frontend for production-like
  local use. Do not point one environment's deploy at another's database.

## 9. Observability

- Structured logging via `log/slog` (`backend/internal/utils/logger.go`), with request
  logging middleware.
- Auth and money paths log rejections and mutations with `user_id`/`tx_id` context.
  Keep these logs working — a silently failing balance update is the costliest bug here.
- `/health` currently returns a static `{"status":"ok"}` and does **not** check DB
  connectivity; deep health checks are an open improvement (§12).

## 10. Frontend / UX principles

- Currency is KES-centric and formatted via shared helpers; keep amounts in `NUMERIC`-safe
  display formatting, never float arithmetic for money in the UI.
- All requests go through `src/utils/Client.js`, which attaches the access token and
  transparently refreshes on 401 (emitting `auth:tokensRefreshed` so `AuthProvider` stays
  in sync).
- Avoid decorative, templated dashboard patterns: no gratuitous gradients, arrow-suffixed
  buttons, or uniform fade-ins on every element. Prefer the existing card/slate/emerald
  system and clear empty/loading/error states.

## 11. Legal & compliance

- The app stores personal financial records, so it falls under data-protection
  obligations (e.g. Kenya's Data Protection Act). Keep PII (email, name) minimal and
  never log passwords, hashes, or full token strings.
- No payment processing is live, so no PCI scope applies yet. Adding M-Pesa/NCBA
  integrations must be reviewed for handling of account numbers and transaction references.

## 12. Open decisions

- **Early goal withdrawal**: `GoalWithdraw` rejects withdrawal before `current_amount`
  reaches `target_amount` (`goal_service.go` TODO).
- **Account write concurrency**: no row-level locking on balance mutation (see §7).
- **Scheduler is in-process**: recurring materialization and daily snapshots run as
  goroutines in `main.go`. Running multiple server replicas would double-run them; move to a
  single worker/leader or a database lock before scaling horizontally.
- **Goal growth is contribution-based**: the curve uses linked transactions, not a
  revaluation of the goal, so it does not show market gains.
- **Budget history**: budgets now reflect the active period automatically; querying a
  specific past period is not yet exposed as an API parameter.
