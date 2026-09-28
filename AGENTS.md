# AGENTS.md

Instructions for AI agents and human contributors working in this repo. Read this
together with `docs/PROJECT.md` (what to build), `DESIGN.md` (architecture and
schema decisions already made), and `WORKFLOW.md` (branching, commits, verification).
Do not re-derive architecture that `DESIGN.md` already decides — follow it, and if a
decision looks wrong, say so explicitly rather than diverging silently.

## Rules

- Keep responses and diffs concise. Read the smallest relevant scope before acting.
- Follow `DESIGN.md` and `WORKFLOW.md` on every change.
- Run the relevant checks in `WORKFLOW.md` before calling work done.
- Never commit or push without explicit approval.

## Ground rules

These are constraints tied to real decisions in `DESIGN.md` / `docs/PROJECT.md`, not
generic advice.

1. **Respect the backend layer boundary.** `handler → service → repository`. A handler
   binds/validates input and shapes the HTTP response; a service owns business logic; a
   repository talks to the database. Do not let a handler query GORM directly or a
   repository contain business rules (see `DESIGN.md` §6).
2. **Every user-owned read and write must be scoped by `user_id`.** Repository queries
   filter by the authenticated user, and services additionally verify ownership and
   return `utils.ErrForbidden` on mismatch. Never rely on the frontend to hide another
   user's data (see `DESIGN.md` §4).
3. **Money lives in `NUMERIC(15,2)`, never floating-point columns.** Go request/struct
   fields use `float64`, but new money columns must be declared `numeric(15,2)` in the
   migration and tagged `gorm:"type:numeric(15,2)"` on the model (see `DESIGN.md` §2).
4. **Balance changes must be atomic with the transaction row.** Any flow that moves
   money must run inside a single `db.Transaction(...)` that writes the `transactions`
   row and the `accounts.balance` change(s) together. Transfers debit the source and
   credit the destination through `applyBalanceEffect`. Canonical implementations are
   `TxCreate`/`TxUpdate`/`TxDelete` in `backend/internal/services/transaction_service.go`
   and `GoalContribute`/`GoalWithdraw` in `backend/internal/services/goal_service.go`.
5. **Goals change value only through contribute/withdraw.** `current_amount` is excluded
   from `GoalCreateRequest` and `GoalUpdateRequest` on purpose, so every change is backed
   by a real account transfer and transaction. Do not add a path that sets it directly
   (see `DESIGN.md` §3).
6. **Do not reimplement analytics.** Net worth, monthly/yearly summary, burn rate, and
   spending insights are owned by `backend/pkg/overview`, `backend/pkg/summary`, and
   `backend/pkg/insights`, surfaced through their services. Do not recompute them inline
   in handlers or the frontend (see `DESIGN.md` §3).
7. **Transfers are real transactions, not expenses.** `type = "transfer"` moves money
   between two of the user's own accounts via `from_account_id`/`to_account_id` and must
   stay excluded from income/expense totals and budget spending. Never represent an
   inter-account move as an income+expense pair (see `DESIGN.md` §3).
8. **Budget spending is derived, never stored.** `budget.spent` is computed from
   transactions for the budget's active period (`BudgetServices.computeSpent`); the
   `budgets.spent` column was dropped in migration 000010. Do not add a path that writes
   spending onto the budget row.
9. **Recurring templates are materialized through the service.** The scheduler
   (`services.StartSchedulers`, called only from `main.go`) creates due transactions via
   `TxService.TxCreate`; never insert transactions or touch balances directly from a
   scheduler.
10. **External payment integrations are not wired.** `backend/internal/api/handlers/mpesa.go`
    contains empty stubs and is intentionally not registered in `router.go`. Do not mount
    or half-implement M-Pesa/NCBA routes without following `DESIGN.md` §5.
11. **Applied migrations are immutable.** Never edit an existing file in
    `backend/internal/database/migrations/`; add the next numbered `_up.sql`/`_down.sql`
    pair (see `DESIGN.md` §6).

## Conventions

- **Language**: Go 1.25 (backend), JavaScript/JSX (frontend). Format Go with `gofmt`/`make fmt`.
- **API envelope**: all JSON responses go through `utils.SuccessResponse`,
  `utils.ErrorResponse`, or `utils.PaginatedResponse` in `backend/internal/utils/response.go`.
  Data is returned under `data`; errors under `error`. Do not hand-roll `c.JSON` shapes.
- **Errors**: use the sentinel errors in `backend/internal/utils/errors.go`
  (`ErrForbidden`, `ErrNotFound`, `ErrUnauthorized`, …) and map them to status codes at
  the handler boundary.
- **Naming**: Go exported identifiers use PascalCase; JSON tags use `snake_case` matching
  the database columns. React components are PascalCase files under `src/components/<Domain>/`.
- **Validation**: request structs use Gin `binding:` tags in the service/handler request
  types (e.g. `RegisterRequest`, `TxCreateRequest`). Validate once at the boundary; do not
  redefine the same shape per handler.
- **File placement**: match `DESIGN.md` §6. New frontend API access goes through
  `frontend/piggy_bank/src/utils/Client.js`; do not call `fetch` directly from components.
- **Comments**: explain *why*, not *what*. Keep the existing note style around the
  money-moving transactions and token/revocation logic, which is the easiest code to
  break without noticing.

## Definition of done for a feature

- [ ] New/changed tables ship with a numbered migration pair and matching model tags (`DESIGN.md` §2).
- [ ] Every new query is scoped to the authenticated `user_id` (`DESIGN.md` §4).
- [ ] Money or budget mutations are wrapped in a single DB transaction (`DESIGN.md` §7).
- [ ] Responses use the shared envelope helpers (`DESIGN.md` §6).
- [ ] `cd backend && go vet ./... && go test ./...` passes.
- [ ] `cd frontend/piggy_bank && npm run lint && npm run build` passes.
- [ ] `README.md` / `DESIGN.md` updated if the change alters setup or architecture.

## What NOT to do

- Don't add a second data-access path that bypasses the repository layer "for now" — extend
  the existing repo method instead.
- Don't set `goal.current_amount` or `account.balance` directly outside the transactional
  service methods.
- Don't reimplement derived values (budget spending, net worth, summaries) outside their
  owning service or `backend/pkg` package.
- Don't build an actual AI provider or Android client: only the `backend/pkg/ai` interfaces
  and the bulk-ingestion boundary exist (`docs/LONG_TERM_USE.md` §4-5).
- Don't mount `mpesa.go` stubs or invent payment provider clients without a design update.
- Don't introduce money as `float` columns or speculative dependencies without a stated reason.
