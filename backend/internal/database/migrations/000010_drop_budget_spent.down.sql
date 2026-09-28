-- Restore the accumulator column for rollback. Historical values are not
-- recoverable; it comes back at its default.
ALTER TABLE budgets ADD COLUMN spent NUMERIC(15,2) DEFAULT 0;
