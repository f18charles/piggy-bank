# Piggy Bank — Long-Term Use & Feature Enhancement Roadmap

> **Document Status:** Active Specification  
> **Target Scope:** Pure Personal Financial Record-Keeping & Wealth Analytics  
> **Context:** This document details the functional, architectural, and UI enhancements required to transition Piggy Bank from its current core state into a frictionless, long-term personal financial tracker.

---

## 📌 Executive Summary

Piggy Bank is designed as a self-hosted, user-controlled financial record-keeping platform. It acts as a single source of truth for tracking accounts (Bank, Mobile Money, Cash), monitoring category budgets, managing milestone savings goals, and reviewing financial health.

While the core architecture, auth security, and baseline CRUD endpoints are complete, achieving frictionless **everyday, multi-year usage** requires specific functional additions around transfers, dynamic budget resets, recurring transactions, and historical analytics.

---

## 🛠 1. Essential Record-Keeping Enhancements

### 1.1 Inter-Account Transfers
* **Problem:** Moving money between internal accounts (e.g. withdrawing KES 5,000 from NCBA Bank to Cash) currently must be logged as an `expense` or `income`, which skews monthly spending and income reports.
* **Requirement:** Support `type = "transfer"` transactions with `from_account_id` and `to_account_id`.
* **Behavior:**
  - Debits `from_account_id` balance and credits `to_account_id` balance in a single database transaction.
  - Excluded from monthly expense and income aggregation totals.
  - Displayed in transaction history as a neutral transfer.

### 1.2 Dynamic Budget Period Calculation & Monthly Rollover
* **Problem:** Currently, `budget.spent` is an accumulating column that increments when expenses are created. It does not automatically reset to zero at the start of a new calendar month.
* **Requirement:** Compute budget spending dynamically based on transaction dates.
* **Behavior:**
  - Query spending dynamically: `SELECT SUM(amount) FROM transactions WHERE category_id = ? AND transaction_date >= start_of_month AND transaction_date <= end_of_month`.
  - Budgets automatically reflect the active month without requiring manual resets or database maintenance.
  - Enables historical budget performance queries (e.g., inspecting July spending vs August spending).

### 1.3 Full Transaction Editability
* **Problem:** Transaction editing currently restricts edits to the `description` field. Users cannot fix mistyped amounts, dates, accounts, or categories.
* **Requirement:** Allow complete editing of transaction records.
* **Behavior:**
  - Recalculate account balance differences automatically when `amount` or `account_id` is updated.
  - Recalculate budget spent metrics if `category_id` or `amount` is updated.

### 1.4 Recurring Transactions Engine
* **Problem:** Fixed monthly commitments (Rent, Subscriptions, Internet bills, Salary) must currently be entered manually every month.
* **Requirement:** Introduce a recurring transaction scheduler.
* **Behavior:**
  - Database table `recurring_transactions` (`user_id`, `amount`, `type`, `category_id`, `account_id`, `frequency`, `next_due_date`).
  - Background worker or log prompt that auto-generates transactions or notifies the user to confirm scheduled entries.

---

## 📊 2. Long-Term Analytics & Visualizations

### 2.1 Net Worth Historical Snapshots
* **Problem:** Net Worth is currently calculated dynamically as `SUM(account.balance)`. There is no historical record of net worth progression over time.
* **Requirement:** Periodically log net worth snapshots.
* **Behavior:**
  - Daily or monthly automated snapshot table: `net_worth_snapshots` (`user_id`, `total_net_worth`, `snapshot_date`).
  - Powers historical net worth trend graphs (e.g., 6-month or 12-month net worth growth).

### 2.2 Interactive Visual Charts
* **Problem:** The frontend UI relies primarily on numeric text cards and standard progress bars.
* **Requirement:** Integrate charting components (e.g., Recharts or Chart.js).
* **Target Views:**
  - **Dashboard:** 12-month Income vs. Expense bar chart.
  - **Spending Insights:** Category spending breakdown pie/donut chart.
  - **Goals:** Savings growth curve over time.

---

## 🗄 3. Required Data Model & Database Schema Changes

```sql
-- 1. Support Inter-Account Transfers in Transactions
ALTER TABLE transactions 
ADD COLUMN from_account_id UUID REFERENCES accounts(id),
ADD COLUMN to_account_id UUID REFERENCES accounts(id);

-- 2. Recurring Transactions Table
CREATE TABLE recurring_transactions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    account_id UUID NOT NULL REFERENCES accounts(id),
    category_id UUID REFERENCES categories(id),
    amount NUMERIC(15,2) NOT NULL,
    type VARCHAR(20) NOT NULL, -- income | expense | transfer
    description VARCHAR(255),
    frequency VARCHAR(20) NOT NULL, -- monthly | weekly | yearly
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Net Worth Snapshots Table
CREATE TABLE net_worth_snapshots (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    total_net_worth NUMERIC(15,2) NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📱 4. Future Context & Architectural Readiness

### 4.1 Android SMS Parsing Integration
- **Future Workflow:** The upcoming Android app will inspect incoming financial SMS messages (M-Pesa notifications, bank alerts) and forward structured transaction payloads to Piggy Bank.
- **Backend Readiness:**
  - Ensure `POST /api/v1/transactions` supports bulk ingestion and external reference IDs (`reference_id`) to prevent duplicate entry of SMS-parsed transactions.

### 4.2 AI Financial Insights & Categorization
- **Future Workflow:** AI models will automatically suggest categories for unclassified transactions and offer spending optimization recommendations.
- **Backend Readiness:**
  - Keep transaction `description` and `reference_id` indexed for fast pattern matching.
  - Maintain decoupled service layers so an AI recommendation service can query summary metrics cleanly.

---

## 📋 Action Plan & Phased Implementation

| Phase | Milestone | Priority |
|---|---|---|
| **Phase 1** | Implement Inter-Account Transfers & Full Transaction Editing | Immediate |
| **Phase 2** | Convert Budgets to Dynamic Monthly Calculations | Short-Term |
| **Phase 3** | Implement Recurring Transactions & Net Worth Snapshots | Medium-Term |
| **Phase 4** | Integrate Interactive Recharts Frontend Visualizations | Medium-Term |
| **Phase 5** | Mobile SMS Ingestion API Preparation & AI Hook Interfaces | Long-Term |
