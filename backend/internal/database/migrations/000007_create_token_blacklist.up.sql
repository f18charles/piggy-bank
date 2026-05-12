CREATE TABLE IF NOT EXISTS blacklisted_tokens (
    jti         TEXT        PRIMARY KEY,
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_blacklisted_tokens_expires_at ON blacklisted_tokens (expires_at)