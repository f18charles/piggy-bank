CREATE TABLE recurring_transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    account_id      UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    to_account_id   UUID REFERENCES accounts(id) ON DELETE SET NULL,
    category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
    amount          NUMERIC(15,2) NOT NULL,
    type            VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    description     VARCHAR(255),
    payment_method  VARCHAR(50) CHECK (payment_method IN ('cash', 'mpesa', 'card', 'bank_transfer')),
    frequency       VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
    next_due_date   DATE NOT NULL,
    last_run_at     TIMESTAMP WITH TIME ZONE,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_recurring_user_id ON recurring_transactions(user_id);
CREATE INDEX idx_recurring_next_due_date ON recurring_transactions(next_due_date);
