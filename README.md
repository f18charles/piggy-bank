# 🐷 Piggy Bank

A personal finance management web app built with Go and React. Piggy Bank lets you track income and expenses, manage budgets, set savings goals, and initiate real payments via M-Pesa and NCBA — all from one place.

## What it does

- Log income and expenses with categories, payment methods, and notes
- Set monthly budgets per category and track progress with alerts
- Manage multiple accounts: NCBA bank, M-Pesa, and cash
- Initiate M-Pesa STK push payments and NCBA transfers directly from the app
- Every transaction — whether manually logged or initiated through the app — is automatically recorded
- View monthly summaries, spending insights, and savings trends
- Set and track financial goals with deadlines

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Go (Gin framework) |
| Database | PostgreSQL |
| Frontend | React (Vite) (currently the frontend is on [pb_frontend](https://github.com/f18charles/pb_frontend) for a short demo) | 
| Auth | JWT |
| Payments | M-Pesa Daraja API, NCBA API |
| Notifications | Africa's Talking (SMS), SendGrid (email) |

## Project Structure

```
piggy-bank/
├── backend/        # Go API server
├── frontend/       # React web app
├── deployments/    # Docker and deployment configs
├── docs/           # Documentation
├── PROJECT.md      # Full project spec and decisions
└── CLAUDE.md       # AI assistant context file
```

## Getting Started

### Prerequisites

- Go 1.21+
- Node.js 18+
- PostgreSQL 15+
- ngrok (for M-Pesa callback testing locally)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your environment variables
go mod download
make migrate
go run ./cmd/server
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 8080) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |
| `MPESA_CONSUMER_KEY` | Daraja API consumer key |
| `MPESA_CONSUMER_SECRET` | Daraja API consumer secret |
| `MPESA_SHORTCODE` | M-Pesa business shortcode |
| `MPESA_PASSKEY` | M-Pesa Lipa Na M-Pesa passkey |
| `MPESA_CALLBACK_URL` | Public URL for M-Pesa callbacks |
| `NCBA_API_KEY` | NCBA API key |
| `NCBA_BASE_URL` | NCBA API base URL |
| `APP_ENV` | Environment: development / production |

## License

See LICENSE.md
