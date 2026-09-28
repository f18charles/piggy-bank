CREATE TABLE net_worth_snapshots (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_net_worth     NUMERIC(15,2) NOT NULL,
    snapshot_date       DATE NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_net_worth_user_date UNIQUE (user_id, snapshot_date)
);

CREATE INDEX idx_net_worth_snapshots_user_date ON net_worth_snapshots(user_id, snapshot_date);
