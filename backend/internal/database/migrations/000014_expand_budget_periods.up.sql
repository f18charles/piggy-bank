-- The UI has always offered quarterly/yearly/custom periods, but the CHECK
-- constraint only allowed monthly/weekly, so those inserts failed at the DB.
ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_period_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_period_check
    CHECK (period IN ('monthly', 'weekly', 'quarterly', 'yearly', 'custom'));
