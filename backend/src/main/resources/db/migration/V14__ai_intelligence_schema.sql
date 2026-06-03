-- V14__ai_intelligence_schema.sql
-- AI Intelligence Layer – Step 7
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── AI REQUESTS (audit trail) ───────────────────────────────────────────────
CREATE TABLE ai_requests (
    id                  UUID PRIMARY KEY,
    user_id             UUID REFERENCES users(id) ON DELETE SET NULL,
    request_type        VARCHAR(50)  NOT NULL,
    provider            VARCHAR(20)  NOT NULL,
    prompt_template     VARCHAR(80),
    system_prompt       TEXT,
    user_prompt         TEXT NOT NULL,
    prompt_context      JSONB,
    model_id            VARCHAR(80),
    temperature         DOUBLE PRECISION DEFAULT 0.7,
    max_tokens          INT DEFAULT 4096,
    status              VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    error_message       TEXT,
    retry_count         INT DEFAULT 0,
    prompt_tokens       INT,
    completion_tokens   INT,
    total_tokens        INT,
    started_at          TIMESTAMP WITH TIME ZONE,
    completed_at        TIMESTAMP WITH TIME ZONE,
    latency_ms          BIGINT,
    prompt_hash         VARCHAR(64),
    cache_hit           BOOLEAN DEFAULT FALSE,
    job_id              VARCHAR(50),
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by          VARCHAR(255) NOT NULL,
    updated_by          VARCHAR(255) NOT NULL,
    version             BIGINT NOT NULL DEFAULT 1
);

CREATE INDEX idx_aireq_user      ON ai_requests (user_id);
CREATE INDEX idx_aireq_type      ON ai_requests (request_type);
CREATE INDEX idx_aireq_provider  ON ai_requests (provider);
CREATE INDEX idx_aireq_status    ON ai_requests (status);
CREATE INDEX idx_aireq_created   ON ai_requests (created_at DESC);
-- For cache lookup by prompt hash
CREATE INDEX idx_aireq_hash_type ON ai_requests (prompt_hash, request_type)
    WHERE status = 'COMPLETED';
-- For token quota calculation
CREATE INDEX idx_aireq_user_time ON ai_requests (user_id, created_at)
    WHERE status = 'COMPLETED';

-- ─── AI RESPONSES ─────────────────────────────────────────────────────────────
CREATE TABLE ai_responses (
    id                      UUID PRIMARY KEY,
    request_id              UUID NOT NULL REFERENCES ai_requests(id) ON DELETE CASCADE,
    user_id                 UUID REFERENCES users(id) ON DELETE SET NULL,
    raw_response            TEXT,
    parsed_json             JSONB,
    quality_score           DOUBLE PRECISION,
    content_flagged         BOOLEAN DEFAULT FALSE,
    flag_reason             TEXT,
    user_rating             SMALLINT CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback           TEXT,
    generated_entity_id     UUID,
    generated_entity_type   VARCHAR(50),
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by              VARCHAR(255) NOT NULL,
    updated_by              VARCHAR(255) NOT NULL,
    version                 BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_aires_request UNIQUE (request_id)
);

CREATE INDEX idx_aires_request ON ai_responses (request_id);
CREATE INDEX idx_aires_user    ON ai_responses (user_id);

-- ─── GENERATED QUIZZES ────────────────────────────────────────────────────────
CREATE TABLE generated_quizzes (
    id                          UUID PRIMARY KEY,
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_request_id               UUID REFERENCES ai_requests(id) ON DELETE SET NULL,
    topic                       TEXT NOT NULL,
    category_id                 UUID,
    category_name               VARCHAR(100),
    difficulty                  VARCHAR(20),
    requested_question_count    INT DEFAULT 10,
    generated_question_count    INT DEFAULT 0,
    status                      VARCHAR(20) NOT NULL DEFAULT 'GENERATING',
    generated_title             VARCHAR(200),
    generated_description       TEXT,
    quiz_json                   JSONB,
    published_quiz_id           UUID,
    reviewer_notes              TEXT,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by                  VARCHAR(255) NOT NULL,
    updated_by                  VARCHAR(255) NOT NULL,
    version                     BIGINT NOT NULL DEFAULT 1
);

CREATE INDEX idx_gq_user    ON generated_quizzes (user_id);
CREATE INDEX idx_gq_status  ON generated_quizzes (status);
CREATE INDEX idx_gq_request ON generated_quizzes (ai_request_id);

-- ─── LEARNING PATHS ────────────────────────────────────────────────────────────
CREATE TABLE learning_paths (
    id                      UUID PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_request_id           UUID REFERENCES ai_requests(id) ON DELETE SET NULL,
    title                   VARCHAR(200) NOT NULL,
    description             TEXT,
    target_skill            VARCHAR(100),
    estimated_hours         INT,
    difficulty              VARCHAR(20),
    milestones_json         JSONB NOT NULL DEFAULT '[]',
    skill_gaps_json         JSONB DEFAULT '[]',
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    total_milestones        INT DEFAULT 0,
    completed_milestones    INT DEFAULT 0,
    progress_percentage     DOUBLE PRECISION DEFAULT 0.0,
    started_at              TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,
    target_completion_date  TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by              VARCHAR(255) NOT NULL,
    updated_by              VARCHAR(255) NOT NULL,
    version                 BIGINT NOT NULL DEFAULT 1
);

CREATE INDEX idx_lp_user    ON learning_paths (user_id);
CREATE INDEX idx_lp_status  ON learning_paths (status);
CREATE INDEX idx_lp_request ON learning_paths (ai_request_id);

-- ─── INTERVIEW SESSIONS ────────────────────────────────────────────────────────
CREATE TABLE interview_sessions (
    id                      UUID PRIMARY KEY,
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic                   VARCHAR(200) NOT NULL,
    role_title              VARCHAR(100),
    experience_level        VARCHAR(30),
    focus_areas_json        JSONB DEFAULT '[]',
    total_questions         INT DEFAULT 10,
    current_question        INT DEFAULT 0,
    questions_answered      INT DEFAULT 0,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    conversation_json       JSONB NOT NULL DEFAULT '[]',
    overall_score           DOUBLE PRECISION,
    technical_score         DOUBLE PRECISION,
    communication_score     DOUBLE PRECISION,
    problem_solving_score   DOUBLE PRECISION,
    final_feedback          TEXT,
    strengths_json          JSONB DEFAULT '[]',
    improvements_json       JSONB DEFAULT '[]',
    started_at              TIMESTAMP WITH TIME ZONE,
    completed_at            TIMESTAMP WITH TIME ZONE,
    created_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at              TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by              VARCHAR(255) NOT NULL,
    updated_by              VARCHAR(255) NOT NULL,
    version                 BIGINT NOT NULL DEFAULT 1
);

CREATE INDEX idx_iv_user    ON interview_sessions (user_id);
CREATE INDEX idx_iv_status  ON interview_sessions (status);
CREATE INDEX idx_iv_started ON interview_sessions (started_at DESC);

-- ─── AI RECOMMENDATIONS ─────────────────────────────────────────────────────
CREATE TABLE ai_recommendations (
    id                          UUID PRIMARY KEY,
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ai_request_id               UUID REFERENCES ai_requests(id) ON DELETE SET NULL,
    recommendation_type         VARCHAR(30) NOT NULL,
    items_json                  JSONB NOT NULL DEFAULT '[]',
    item_count                  INT DEFAULT 0,
    rationale                   TEXT,
    analytics_snapshot_json     JSONB,
    expires_at                  TIMESTAMP WITH TIME ZONE,
    was_acted_on                BOOLEAN DEFAULT FALSE,
    acted_on_at                 TIMESTAMP WITH TIME ZONE,
    acted_entity_id             UUID,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by                  VARCHAR(255) NOT NULL,
    updated_by                  VARCHAR(255) NOT NULL,
    version                     BIGINT NOT NULL DEFAULT 1
);

CREATE INDEX idx_rec_user    ON ai_recommendations (user_id);
CREATE INDEX idx_rec_type    ON ai_recommendations (recommendation_type);
CREATE INDEX idx_rec_request ON ai_recommendations (ai_request_id);
-- Index for active-recommendation lookup (expires_at used for filtering at query time)
CREATE INDEX idx_rec_active  ON ai_recommendations (user_id, expires_at);

-- ─── MATERIALIZED VIEW: AI usage daily stats ────────────────────────────────
CREATE MATERIALIZED VIEW mv_ai_usage_daily AS
SELECT
    DATE_TRUNC('day', created_at)       AS day,
    provider,
    request_type,
    COUNT(*)                             AS request_count,
    COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) AS success_count,
    COUNT(CASE WHEN status = 'FAILED'    THEN 1 END) AS failure_count,
    COUNT(CASE WHEN cache_hit = TRUE     THEN 1 END) AS cache_hits,
    COALESCE(AVG(latency_ms) FILTER (WHERE status = 'COMPLETED'), 0) AS avg_latency_ms,
    COALESCE(SUM(total_tokens), 0)       AS total_tokens_used
FROM ai_requests
GROUP BY DATE_TRUNC('day', created_at), provider, request_type
ORDER BY day DESC, request_count DESC;

CREATE UNIQUE INDEX idx_mv_ai_daily ON mv_ai_usage_daily (day, provider, request_type);
