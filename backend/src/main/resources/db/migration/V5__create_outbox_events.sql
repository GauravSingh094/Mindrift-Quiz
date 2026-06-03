-- V5__create_outbox_events.sql

-- Drop the old outbox_events table if it exists to establish the new schema safely
DROP TABLE IF EXISTS outbox_events CASCADE;

CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    last_error TEXT
);

-- Core indexing for fast pending and aggregate queries
CREATE INDEX idx_outbox_events_status ON outbox_events(status);
CREATE INDEX idx_outbox_events_created ON outbox_events(created_at);
CREATE INDEX idx_outbox_events_agg ON outbox_events(aggregate_type, aggregate_id);
