-- V6__create_dead_letter_events.sql

CREATE TABLE dead_letter_events (
    id UUID PRIMARY KEY,
    topic VARCHAR(255) NOT NULL,
    partition_id INT NOT NULL,
    offset_id BIGINT NOT NULL,
    key_value VARCHAR(255),
    payload TEXT NOT NULL,
    failure_reason TEXT NOT NULL,
    stack_trace TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Core indexing for admin telemetry queries
CREATE INDEX idx_dlq_topic ON dead_letter_events(topic);
CREATE INDEX idx_dlq_created ON dead_letter_events(created_at);
