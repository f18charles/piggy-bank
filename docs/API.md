# Piggy Bank — REST API Reference

Base URL: `http://localhost:8080/api/v1` (configurable via `PORT` or `VITE_API_URL`)

All endpoints returning JSON adhere to the standardized response envelope:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

---

## 1. Authentication Endpoints

### 1.1 Register New User
- **Method:** `POST`
- **Path:** `/auth/register`
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongPassword123!",
  "full_name": "Jane Doe",
  "currency": "KES"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c1f7a46e-1510-449e-b7d1-e6df63309a4d",
      "email": "user@example.com",
      "full_name": "Jane Doe",
      "currency": "KES",
      "created_at": "2026-09-26T00:00:00Z"
    },
    "tokens": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "eyJhbGciOi...",
      "token_type": "Bearer",
      "expires_in": 600
    }
  }
}
```

### 1.2 Login
- **Method:** `POST`
- **Path:** `/auth/login`
- **Auth Required:** No
- **Request Body:**
```json
{
  "email": "user@example.com",
  "password": "strongPassword123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "c1f7a46e-1510-449e-b7d1-e6df63309a4d",
      "email": "user@example.com",
      "full_name": "Jane Doe",
      "currency": "KES"
    },
    "tokens": {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "eyJhbGciOi...",
      "token_type": "Bearer",
      "expires_in": 600
    }
  }
}
```

### 1.3 Refresh Access Token
- **Method:** `POST`
- **Path:** `/auth/refresh`
- **Auth Required:** No
- **Request Body:**
```json
{
  "refresh_token": "eyJhbGciOi..."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "Bearer",
    "expires_in": 600
  }
}
```

### 1.4 Logout
- **Method:** `POST`
- **Path:** `/auth/logout`
- **Auth Required:** Yes (`Authorization: Bearer <token>`)
- **Request Body:**
```json
{
  "refresh_token": "eyJhbGciOi..."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "successfully logged out"
  }
}
```

### 1.5 Get Current Profile
- **Method:** `GET`
- **Path:** `/auth/profile`
- **Auth Required:** Yes

---

## 2. Accounts Endpoints

### 2.1 List Accounts
- **Method:** `GET`
- **Path:** `/accounts`
- **Auth Required:** Yes
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "93b0dfb2-efce-49cf-b7ad-45237ea0b284",
      "name": "NCBA Bank",
      "type": "bank",
      "balance": 154000.50,
      "currency": "KES"
    },
    {
      "id": "11ab9c50-c44d-44aa-9c3f-c9d3efee71cb",
      "name": "M-Pesa Wallet",
      "type": "mpesa",
      "balance": 12500.00,
      "currency": "KES"
    }
  ]
}
```

### 2.2 Create Account
- **Method:** `POST`
- **Path:** `/accounts`
- **Auth Required:** Yes
- **Request Body:**
```json
{
  "name": "Emergency Cash",
  "type": "cash",
  "balance": 5000.00,
  "currency": "KES"
}
```

### 2.3 Get / Update / Delete Account
- `GET /accounts/:id`
- `PATCH /accounts/:id`
- `DELETE /accounts/:id`

---

## 3. Categories Endpoints

- `GET /categories` — List user & system categories
- `POST /categories` — Create custom category (`name`, `type`, `color`, `icon`)
- `PATCH /categories/:id` — Update category
- `DELETE /categories/:id` — Delete category

---

## 4. Transactions Endpoints

### 4.1 List Transactions
- **Method:** `GET`
- **Path:** `/transactions`
- **Query Parameters:**
  - `page`: integer (default: 1)
  - `limit`: integer (default: 20)
  - `account_id`: UUID string (optional filter)
  - `category_id`: UUID string (optional filter)
  - `type`: `income` | `expense` | `transfer` (optional filter)
  - `start_date`: ISO timestamp (optional filter)
  - `end_date`: ISO timestamp (optional filter)

### 4.2 Create Transaction
- **Method:** `POST`
- **Path:** `/transactions`
- **Request Body:**
```json
{
  "account_id": "93b0dfb2-efce-49cf-b7ad-45237ea0b284",
  "category_id": "77ad5fb2-11ce-49cf-b7ad-99237ea0b112",
  "amount": 2500.00,
  "type": "expense",
  "description": "Weekly Groceries",
  "payment_method": "mpesa",
  "transaction_date": "2026-09-26T12:00:00Z"
}
```

### 4.3 Update / Delete Transaction
- `PATCH /transactions/:id` — full edit. Accepts any of `amount`, `type`,
  `account_id`, `category_id`, `description`, `payment_method`, `reference_id`,
  `status`, `transaction_date`, and for transfers `from_account_id`/`to_account_id`.
  Account balances are recalculated atomically.
- `DELETE /transactions/:id` — reverses the transaction's balance effect.

### 4.4 Inter-Account Transfer
`POST /transactions` with `type: "transfer"`:
```json
{
  "type": "transfer",
  "from_account_id": "93b0dfb2-...",
  "to_account_id": "11ab9c50-...",
  "amount": 5000.00,
  "description": "Move to M-Pesa",
  "payment_method": "mpesa",
  "status": "completed"
}
```
Debits the source and credits the destination in one DB transaction. Transfers are
excluded from income/expense totals and budget spending.

### 4.5 Bulk Ingestion
- **Method:** `POST`
- **Path:** `/transactions/bulk`
- **Body:** a JSON array of transaction objects (1–500). Items whose `reference_id`
  already exists for the user are skipped, so retried SMS/webhook deliveries are
  idempotent.
- **Response:** `{ "created": [...], "skipped": 0, "failed": 0 }`

### 4.6 Export Transactions
- **Method:** `GET`
- **Path:** `/transactions/export?format=csv` (or `?format=pdf`)
- **Response:** File stream (`text/csv` or `application/pdf`)

---

## 5. Budgets Endpoints

- `GET /budgets` — List all active budgets with calculated spending progress
- `POST /budgets` — Create budget (`category_id`, `amount`, `period`, `start_date`, `end_date`)
- `GET /budgets/:id` — Get single budget
- `PATCH /budgets/:id` — Update budget limit or period
- `DELETE /budgets/:id` — Delete budget

---

## 6. Goals Endpoints

- `GET /goals` — List user savings goals
- `POST /goals` — Create new goal (`name`, `target_amount`, `deadline`)
- `GET /goals/:id` — Get goal details
- `PATCH /goals/:id` — Update goal
- `DELETE /goals/:id` — Delete goal
- `POST /goals/:id/contribute` — Deposit funds into goal (`account_id`, `amount`)
- `POST /goals/:id/withdraw` — Withdraw saved funds back into account (`account_id`, `amount`)
- `GET /goals/:id/history` — Cumulative savings growth points (`date`, `change`, `cumulative`)

---

## 7. Insights & Summary Endpoints

- `GET /insights/overview` — Dashboard summary (Net Worth, Account balances, Monthly Burn, Goals overview)
- `GET /insights/summary/monthly` — Total income, expense, and savings rate for current month
- `GET /insights/summary/yearly` — Annual totals and month-by-month financial progression
- `GET /insights/spending` — Category spending breakdown, burn rate percentage, and expense distribution
- `GET /insights/net-worth?months=12` — Current net worth, month-over-month change, and daily snapshot history

---

## 8. Recurring Transactions

Generated automatically by the backend scheduler on each due date.

- `GET /recurring` — List the user's recurring templates
- `POST /recurring` — Create (`account_id`, `amount`, `type`, `frequency`, `next_due_date`, optional `to_account_id`/`category_id`/`description`/`payment_method`/`is_active`)
- `GET /recurring/:id` — Get one
- `PATCH /recurring/:id` — Update (same fields; `is_active` pauses/resumes)
- `DELETE /recurring/:id` — Delete
