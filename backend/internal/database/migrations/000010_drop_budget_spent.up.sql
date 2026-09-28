-- Budget spending is now computed from transactions at read time (see
-- BudgetServices), so the stored accumulator is no longer written or read.
ALTER TABLE budgets DROP COLUMN IF EXISTS spent;
