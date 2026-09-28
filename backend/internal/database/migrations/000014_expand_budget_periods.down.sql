ALTER TABLE budgets DROP CONSTRAINT IF EXISTS budgets_period_check;
ALTER TABLE budgets ADD CONSTRAINT budgets_period_check
    CHECK (period IN ('monthly', 'weekly'));
