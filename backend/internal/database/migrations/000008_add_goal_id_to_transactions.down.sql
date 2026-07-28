DROP INDEX IF EXISTS idx_transaction_goal_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS goal_id;
