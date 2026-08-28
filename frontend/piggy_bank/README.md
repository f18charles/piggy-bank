# Piggy Bank — Frontend Web Application

The official web frontend for **Piggy Bank**, built with **React 19**, **Vite**, **Tailwind CSS v4**, and **React Router v7**.

---

## Features & Pages

- **Welcome Landing Page (`/welcome`)**: Modern, high-converting overview of PiggyBank features, architecture, and workflow with instant navigation to sign in.
- **Interactive Dashboard (`/`)**: Consolidated view of Net Worth, monthly burn rate meter, multi-account summaries, budget health indicators, and savings goal progress.
- **Accounts Management (`/accounts`)**: Real-time management and tracking of bank accounts (e.g. NCBA), mobile wallets (M-Pesa), and physical cash holdings.
- **Smart Budgeting (`/budget`)**: Monthly category caps with spending visual progress bars and burn rate warnings.
- **Milestone Savings Goals (`/goals`)**: Track target savings deadlines, log manual contributions/withdrawals, and monitor milestone completion.
- **Transactions & CSV Export (`/transactions`)**: Comprehensive ledger of income, expense, and transfer operations with filtering and CSV export.
- **Secure Authentication (`/login`)**: JWT-based session management with automatic refresh token rotation and client-side protection.

---

## Tech Stack

| Technology | Purpose |
|---|---|
| **React 19** | Modern UI components and reactive state |
| **Vite** | Fast build tooling and Hot Module Replacement (HMR) |
| **Tailwind CSS v4** | Utility-first, responsive design system |
| **React Router v7** | Declarative client-side routing and protected route guards |
| **React Icons** | Clean icon set (Material Design) |

---

## Directory Structure

```
src/
├── assets/             # Brand logos, icons, and static images
├── components/         # Reusable UI components
│   ├── Accounts/       # Account creation modal & account cards
│   ├── Budgets/        # Budget modals, cards, and progress meters
│   ├── Dashboard/      # Net worth, burn rate, and overview cards
│   ├── Goals/          # Goal creation, deposit/withdraw modals
│   ├── Layout/         # Header, Sidebar drawer, and Main layout
│   └── Transactions/   # Transaction modals, filters, and tables
├── pages/              # Application views / routes
│   ├── auth/           # Login view
│   ├── Accounts.jsx    # Accounts page
│   ├── Budgets.jsx     # Budgets page
│   ├── Dashboard.jsx   # Dashboard page
│   ├── Goals.jsx       # Goals page
│   ├── Transactions.jsx# Transactions page
│   └── Welcome.jsx     # Welcome / Landing page
├── styles/             # Global CSS and Tailwind directives
└── utils/              # Client API helper, auth context, and token storage
    ├── auth/           # AuthProvider, ProtectedRoute, and session handlers
    └── Client.js       # Fetch wrapper with interceptors & auto-refresh
```

---

## Getting Started

### Prerequisites
- **Node.js 18+**
- **npm** or **pnpm** / **yarn**

### 1. Installation
Navigate to the frontend directory and install dependencies:
```bash
cd frontend/piggy_bank
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Ensure `VITE_API_URL` points to your backend server:
```env
VITE_API_URL=http://localhost:8080/api/v1
```

### 3. Running Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`.

---

## Build & Production

```bash
# Build production bundle
npm run build

# Preview production build locally
npm run preview

# Run ESLint checks
npm run lint
```
