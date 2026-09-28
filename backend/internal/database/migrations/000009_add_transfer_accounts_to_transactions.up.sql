ALTER TABLE transactions
    ADD COLUMN from_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    ADD COLUMN to_account_id   UUID REFERENCES accounts(id) ON DELETE SET NULL;

CREATE INDEX idx_transaction_from_account_id ON transactions(from_account_id);
CREATE INDEX idx_transaction_to_account_id   ON transactions(to_account_id);
