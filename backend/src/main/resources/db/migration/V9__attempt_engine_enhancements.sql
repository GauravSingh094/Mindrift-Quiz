-- V9__attempt_engine_enhancements.sql
-- Adds scoring metadata, negative marking config, and session tracking columns

-- Attempt: add metadata columns
ALTER TABLE quiz_attempts
    ADD COLUMN IF NOT EXISTS max_score    DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS percentage   DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS passed       BOOLEAN,
    ADD COLUMN IF NOT EXISTS correct_count   INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS incorrect_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS unanswered_count INT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS time_taken_seconds BIGINT,
    ADD COLUMN IF NOT EXISTS ip_address   VARCHAR(64),
    ADD COLUMN IF NOT EXISTS user_agent   VARCHAR(512),
    ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;

-- Question response: add scoring breakdown columns
ALTER TABLE question_responses
    ADD COLUMN IF NOT EXISTS max_points       DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    ADD COLUMN IF NOT EXISTS is_correct       BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_partial       BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS score_type       VARCHAR(50),
    ADD COLUMN IF NOT EXISTS time_spent_ms    BIGINT;

-- Idempotency index for submission deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_attempts_idempotency_key
    ON quiz_attempts(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- Additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_attempts_user_status  ON quiz_attempts(user_id, status);
CREATE INDEX IF NOT EXISTS idx_attempts_submitted_at ON quiz_attempts(submitted_at);
CREATE INDEX IF NOT EXISTS idx_responses_question     ON question_responses(question_id);
