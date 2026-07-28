ALTER TABLE transactions ADD COLUMN goal_id UUID REFERENCES goals(id) ON DELETE SET NULL;

CREATE INDEX idx_transaction_goal_id ON transactions(goal_id);
