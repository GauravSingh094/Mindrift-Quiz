-- V13__integrity_schema.sql
-- Anti-Cheat & Integrity Engine – Step 6
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── VIOLATION EVENTS ────────────────────────────────────────────────────────
CREATE TABLE violation_events (
    id                  UUID PRIMARY KEY,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_id          UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    competition_id      UUID REFERENCES competitions(id) ON DELETE SET NULL,
    violation_type      VARCHAR(50) NOT NULL,
    risk_level          VARCHAR(20) NOT NULL DEFAULT 'LOW',
    source              VARCHAR(20) NOT NULL DEFAULT 'BROWSER',
    evidence_json       JSONB,
    description         TEXT,
    occurred_at         TIMESTAMP WITH TIME ZONE NOT NULL,
    elapsed_seconds     BIGINT,
    ip_address          VARCHAR(45),
    user_agent          TEXT,
    reviewed            BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_by         VARCHAR(255),
    reviewed_at         TIMESTAMP WITH TIME ZONE,
    moderator_notes     TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by          VARCHAR(255) NOT NULL,
    updated_by          VARCHAR(255) NOT NULL,
    version             BIGINT NOT NULL DEFAULT 1
);

CREATE INDEX idx_viol_attempt   ON violation_events (attempt_id);
CREATE INDEX idx_viol_user      ON violation_events (user_id);
CREATE INDEX idx_viol_type      ON violation_events (violation_type);
CREATE INDEX idx_viol_occurred  ON violation_events (occurred_at DESC);
CREATE INDEX idx_viol_risk      ON violation_events (risk_level);
CREATE INDEX idx_viol_unreviewed ON violation_events (risk_level, reviewed)
    WHERE reviewed = FALSE;

-- ─── RISK SCORES ─────────────────────────────────────────────────────────────
CREATE TABLE risk_scores (
    id                      UUID PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_id              UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    competition_id          UUID REFERENCES competitions(id) ON DELETE SET NULL,
    risk_score              INT NOT NULL DEFAULT 0,
    risk_level              VARCHAR(20) NOT NULL DEFAULT 'SAFE',
    total_violations        INT NOT NULL DEFAULT 0,
    tab_switch_count        INT NOT NULL DEFAULT 0,
    copy_paste_count        INT NOT NULL DEFAULT 0,
    fullscreen_exit_count   INT NOT NULL DEFAULT 0,
    devtools_count          INT NOT NULL DEFAULT 0,
    rapid_change_count      INT NOT NULL DEFAULT 0,
    server_side_count       INT NOT NULL DEFAULT 0,
    auto_action_taken       BOOLEAN NOT NULL DEFAULT FALSE,
    auto_action_type        VARCHAR(50),
    auto_action_at          TIMESTAMP WITH TIME ZONE,
    first_violation_at      TIMESTAMP WITH TIME ZONE,
    last_violation_at       TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by              VARCHAR(255) NOT NULL,
    updated_by              VARCHAR(255) NOT NULL,
    version                 BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_risk_attempt UNIQUE (attempt_id)
);

CREATE INDEX idx_rs_user    ON risk_scores (user_id);
CREATE INDEX idx_rs_level   ON risk_scores (risk_level);
CREATE INDEX idx_rs_score   ON risk_scores (risk_score DESC);
-- Partial index for fast pending auto-action lookup
CREATE INDEX idx_rs_pending_action ON risk_scores (risk_level, auto_action_taken)
    WHERE auto_action_taken = FALSE AND risk_level IN ('HIGH', 'CRITICAL');

-- ─── PROCTORING SESSIONS ─────────────────────────────────────────────────────
CREATE TABLE proctoring_sessions (
    id                      UUID PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_id              UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    competition_id          UUID REFERENCES competitions(id) ON DELETE SET NULL,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    camera_consented        BOOLEAN NOT NULL DEFAULT FALSE,
    microphone_consented    BOOLEAN NOT NULL DEFAULT FALSE,
    screen_share_consented  BOOLEAN NOT NULL DEFAULT FALSE,
    fullscreen_required     BOOLEAN NOT NULL DEFAULT FALSE,
    started_at              TIMESTAMP WITH TIME ZONE,
    ended_at                TIMESTAMP WITH TIME ZONE,
    last_heartbeat_at       TIMESTAMP WITH TIME ZONE,
    heartbeat_missed_count  INT NOT NULL DEFAULT 0,
    frames_captured         BIGINT NOT NULL DEFAULT 0,
    face_detected_frames    BIGINT NOT NULL DEFAULT 0,
    no_face_frames          BIGINT NOT NULL DEFAULT 0,
    multiple_face_frames    BIGINT NOT NULL DEFAULT 0,
    face_detection_rate     DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    ip_address              VARCHAR(45),
    user_agent              TEXT,
    flagged_for_review      BOOLEAN NOT NULL DEFAULT FALSE,
    flag_reason             TEXT,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by              VARCHAR(255) NOT NULL,
    updated_by              VARCHAR(255) NOT NULL,
    version                 BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_proc_attempt UNIQUE (attempt_id)
);

CREATE INDEX idx_proc_user   ON proctoring_sessions (user_id);
CREATE INDEX idx_proc_status ON proctoring_sessions (status);
-- Partial index for active sessions (heartbeat monitoring)
CREATE INDEX idx_proc_active ON proctoring_sessions (last_heartbeat_at)
    WHERE status = 'ACTIVE';

-- ─── INTEGRITY REPORTS ───────────────────────────────────────────────────────
CREATE TABLE integrity_reports (
    id                          UUID PRIMARY KEY,
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attempt_id                  UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    competition_id              UUID REFERENCES competitions(id) ON DELETE SET NULL,
    risk_score                  INT NOT NULL DEFAULT 0,
    risk_level                  VARCHAR(20) NOT NULL DEFAULT 'SAFE',
    total_violations            INT NOT NULL DEFAULT 0,
    violation_summary           JSONB DEFAULT '{}',
    proctoring_session_id       UUID REFERENCES proctoring_sessions(id) ON DELETE SET NULL,
    face_detection_rate         DOUBLE PRECISION,
    was_proctored               BOOLEAN NOT NULL DEFAULT FALSE,
    moderation_status           VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    moderator_id                UUID REFERENCES users(id) ON DELETE SET NULL,
    moderator_username          VARCHAR(255),
    moderation_notes            TEXT,
    moderated_at                TIMESTAMP WITH TIME ZONE,
    auto_disqualified           BOOLEAN NOT NULL DEFAULT FALSE,
    auto_disqualified_at        TIMESTAMP WITH TIME ZONE,
    auto_disqualification_reason TEXT,
    generated_at                TIMESTAMP WITH TIME ZONE NOT NULL,
    attempt_start_time          TIMESTAMP WITH TIME ZONE,
    attempt_end_time            TIMESTAMP WITH TIME ZONE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by                  VARCHAR(255) NOT NULL,
    updated_by                  VARCHAR(255) NOT NULL,
    version                     BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_report_attempt UNIQUE (attempt_id)
);

CREATE INDEX idx_ir_user        ON integrity_reports (user_id);
CREATE INDEX idx_ir_status      ON integrity_reports (moderation_status);
CREATE INDEX idx_ir_risk        ON integrity_reports (risk_level);
CREATE INDEX idx_ir_generated   ON integrity_reports (generated_at DESC);
-- Partial index for fast pending queue
CREATE INDEX idx_ir_pending     ON integrity_reports (moderation_status, risk_score DESC)
    WHERE moderation_status = 'PENDING';

-- ─── PLATFORM-LEVEL INTEGRITY STATS VIEW ────────────────────────────────────
-- Refreshed by admin dashboard or scheduled job
CREATE MATERIALIZED VIEW mv_integrity_platform_stats AS
SELECT
    DATE_TRUNC('day', v.occurred_at)        AS day,
    COUNT(*)                                 AS total_violations,
    COUNT(DISTINCT v.user_id)               AS unique_violators,
    COUNT(DISTINCT v.attempt_id)            AS affected_attempts,
    COUNT(CASE WHEN v.risk_level = 'CRITICAL' THEN 1 END) AS critical_count,
    COUNT(CASE WHEN v.risk_level = 'HIGH'     THEN 1 END) AS high_count,
    COUNT(CASE WHEN v.risk_level = 'MEDIUM'   THEN 1 END) AS medium_count,
    COUNT(CASE WHEN v.violation_type = 'TAB_SWITCH'   THEN 1 END) AS tab_switches,
    COUNT(CASE WHEN v.violation_type = 'DEVTOOLS_OPEN' THEN 1 END) AS devtools_opens,
    COUNT(CASE WHEN v.violation_type = 'PASTE_ATTEMPT' THEN 1 END) AS paste_attempts
FROM violation_events v
GROUP BY DATE_TRUNC('day', v.occurred_at)
ORDER BY day DESC;

CREATE UNIQUE INDEX idx_mv_integrity_daily ON mv_integrity_platform_stats (day);
