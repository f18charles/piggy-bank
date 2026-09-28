-- Support fast pattern matching (AI categorization) and external ingestion
-- (SMS parsing). reference_id lookups power TxCreateBulk's dedupe; uniqueness
-- is enforced in the service rather than the DB so this migration cannot fail
-- on pre-existing duplicates.
CREATE INDEX idx_transactions_description ON transactions(description);

CREATE INDEX idx_transactions_user_reference ON transactions(user_id, reference_id);
