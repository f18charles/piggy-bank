# WORKFLOW — development, verification, and git flow

Read this before making a change, and again before committing or pushing. It complements
`docs/PROJECT.md` (what to build), `DESIGN.md` (architecture), and `AGENTS.md` (coding
conventions). This file governs process, not code.

## 1. Local development

Prerequisites: Go 1.25, Node 20+, PostgreSQL 15+, and optionally `golang-migrate` and
`make`. Full environment details live in `README.md` and `docs/DEVELOPMENT_GUIDE.md`.

```bash
# Backend
cd backend
cp .env.example .env          # set DATABASE_URL and JWT_SECRET (both required)
make migrate-up               # apply migrations with golang-migrate
go run ./cmd/server           # serves http://localhost:8080, health at /health

# Frontend
cd frontend/piggy_bank
npm install
npm run dev                   # serves http://localhost:5173
```

`backend/Makefile` exposes `build`, `run`, `fmt`, `vet`, `tidy`, `test`, `test-cover`,
and `migrate-*` targets.

## 2. Verification (run before calling work done)

CI runs exactly these checks (`.github/workflows/test-and-merge.yml`):

```bash
# Backend
cd backend
go vet ./...
go test ./... -v -race -coverprofile=coverage.out
go build -o bin/piggybank ./cmd/server

# Frontend
cd frontend/piggy_bank
npm ci
npm run lint
npm test --if-present
npm run build
```

Run the narrowest relevant subset while iterating; run the full set before opening a PR.

## 3. Branching

- `main` is the integration branch and is kept green by CI. Do not commit directly to it;
  work happens on a branch merged via pull request.
- One branch, one concern. If work reveals an unrelated issue, open a separate branch.
- Naming:

```
<type>/<short-slug>
```

`<type>` matches the commit types in §4 (for example `feat/project-scaffolder`,
`fix/jwt-revocation`).

## 4. Commit messages

Conventional Commits:

```
<type>(<scope>): <short imperative summary>
```

| type | use for |
|---|---|
| `feat` | a new feature or capability |
| `fix` | a bug fix |
| `chore` | tooling, deps, config, no behavior change |
| `docs` | documentation only |
| `refactor` | code change that is not a fix or a feature |
| `test` | adding or fixing tests |
| `style` | formatting only, no logic change |
| `ci` / `deploy` | CI/CD and deployment changes (used in this repo's history) |

- One logical change per commit; summary in the imperative mood ("add", not "added").
- `<scope>` names the affected area (`backend`, `frontend`, `auth`, `ci/deploy`, …).
- Reference the GitHub issue/PR number when one exists.
- Optional body explains *why*, not *what*.

## 5. Pull requests

- Branch from `main`, push, and open a PR against `main` using `gh`.
- The PR title matches the change; the description states what changed, why, and any
  follow-up left for later.
- CI (`.github/workflows/test-and-merge.yml`) runs the backend and frontend jobs; the
  `auto-merge` job then merges the PR automatically once both jobs pass (disabled for
  Dependabot and non-PR events). Do not merge a PR with failing checks.
- Use `Closes #<N>` / `Fixes #<N>` when the PR resolves an issue.

## 6. Before committing/pushing checklist

- [ ] Branch name matches the §3 convention.
- [ ] Commit messages follow the §4 format.
- [ ] `AGENTS.md` "Definition of done" items pass for everything touched.
- [ ] Backend and frontend verification commands in §2 pass.
- [ ] Docs (`README.md`, `DESIGN.md`, `docs/`) updated if setup or architecture changed.
- [ ] Explicit approval obtained before pushing or opening a PR.
