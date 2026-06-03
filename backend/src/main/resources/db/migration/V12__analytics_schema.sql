-- V12__analytics_schema.sql
-- Analytics & Reporting Engine – Step 5
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── USER ANALYTICS ──────────────────────────────────────────────────────────
CREATE TABLE user_analytics (
    id                              UUID PRIMARY KEY,
    user_id                         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total_attempts                  BIGINT NOT NULL DEFAULT 0,
    submitted_attempts              BIGINT NOT NULL DEFAULT 0,
    passed_attempts                 BIGINT NOT NULL DEFAULT 0,
    perfect_score_count             BIGINT NOT NULL DEFAULT 0,
    total_score                     DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    average_score                   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    best_score                      DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    average_percentage              DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_questions_answered        BIGINT NOT NULL DEFAULT 0,
    total_correct                   BIGINT NOT NULL DEFAULT 0,
    total_incorrect                 BIGINT NOT NULL DEFAULT 0,
    total_unanswered                BIGINT NOT NULL DEFAULT 0,
    accuracy_rate                   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_time_spent_seconds        BIGINT NOT NULL DEFAULT 0,
    average_time_per_attempt_seconds BIGINT NOT NULL DEFAULT 0,
    difficulty_breakdown            JSONB DEFAULT '{}',
    difficulty_avg_score            JSONB DEFAULT '{}',
    current_streak_days             INT NOT NULL DEFAULT 0,
    longest_streak_days             INT NOT NULL DEFAULT 0,
    last_active_at                  TIMESTAMP WITH TIME ZONE,
    favourite_category_id           UUID REFERENCES categories(id) ON DELETE SET NULL,
    favourite_category_name         VARCHAR(100),
    competition_participations      BIGINT NOT NULL DEFAULT 0,
    competition_wins                BIGINT NOT NULL DEFAULT 0,
    created_at                      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by                      VARCHAR(255) NOT NULL,
    updated_by                      VARCHAR(255) NOT NULL,
    version                         BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_user_analytics_user UNIQUE (user_id)
);

CREATE INDEX idx_ua_user        ON user_analytics (user_id);
CREATE INDEX idx_ua_total_score ON user_analytics (total_score DESC);
CREATE INDEX idx_ua_last_active ON user_analytics (last_active_at DESC);

-- ─── QUIZ ANALYTICS ──────────────────────────────────────────────────────────
CREATE TABLE quiz_analytics (
    id                          UUID PRIMARY KEY,
    quiz_id                     UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    quiz_title                  VARCHAR(150),
    category_id                 UUID REFERENCES categories(id) ON DELETE SET NULL,
    category_name               VARCHAR(100),
    total_attempts              BIGINT NOT NULL DEFAULT 0,
    unique_players              BIGINT NOT NULL DEFAULT 0,
    submitted_attempts          BIGINT NOT NULL DEFAULT 0,
    expired_attempts            BIGINT NOT NULL DEFAULT 0,
    average_score               DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    average_percentage          DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    highest_score               DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    lowest_score                DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pass_count                  BIGINT NOT NULL DEFAULT 0,
    pass_rate                   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    perfect_score_count         BIGINT NOT NULL DEFAULT 0,
    question_accuracy_map       JSONB DEFAULT '{}',
    hardest_question_id         UUID,
    easiest_question_id         UUID,
    average_time_seconds        BIGINT NOT NULL DEFAULT 0,
    fastest_completion_seconds  BIGINT,
    repeat_attempt_rate         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    last_attempted_at           TIMESTAMP WITH TIME ZONE,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by                  VARCHAR(255) NOT NULL,
    updated_by                  VARCHAR(255) NOT NULL,
    version                     BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_quiz_analytics_quiz UNIQUE (quiz_id)
);

CREATE INDEX idx_qa_quiz      ON quiz_analytics (quiz_id);
CREATE INDEX idx_qa_avg_score ON quiz_analytics (average_score DESC);
CREATE INDEX idx_qa_attempts  ON quiz_analytics (total_attempts DESC);

-- ─── COMPETITION ANALYTICS ───────────────────────────────────────────────────
CREATE TABLE competition_analytics (
    id                          UUID PRIMARY KEY,
    competition_id              UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    competition_title           VARCHAR(200),
    organizer_id                UUID REFERENCES users(id) ON DELETE SET NULL,
    quiz_id                     UUID REFERENCES quizzes(id) ON DELETE SET NULL,
    registered_count            BIGINT NOT NULL DEFAULT 0,
    active_count                BIGINT NOT NULL DEFAULT 0,
    completed_count             BIGINT NOT NULL DEFAULT 0,
    disqualified_count          BIGINT NOT NULL DEFAULT 0,
    dropout_rate                DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    average_score               DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    highest_score               DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    lowest_score                DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    median_score                DOUBLE PRECISION,
    pass_rate                   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    top3_json                   JSONB DEFAULT '[]',
    started_at                  TIMESTAMP WITH TIME ZONE,
    ended_at                    TIMESTAMP WITH TIME ZONE,
    duration_minutes            INT,
    average_completion_seconds  BIGINT NOT NULL DEFAULT 0,
    total_rounds                INT NOT NULL DEFAULT 1,
    winner_user_id              UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by                  VARCHAR(255) NOT NULL,
    updated_by                  VARCHAR(255) NOT NULL,
    version                     BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_competition_analytics_comp UNIQUE (competition_id)
);

CREATE INDEX idx_ca_competition ON competition_analytics (competition_id);
CREATE INDEX idx_ca_ended_at    ON competition_analytics (ended_at DESC);

-- ─── SKILL ANALYTICS ─────────────────────────────────────────────────────────
CREATE TABLE skill_analytics (
    id                          UUID PRIMARY KEY,
    user_id                     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id                 UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    category_name               VARCHAR(100),
    mastery_score               DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    skill_level                 VARCHAR(30) NOT NULL DEFAULT 'BEGINNER',
    attempts_in_category        BIGINT NOT NULL DEFAULT 0,
    average_score_in_category   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    correct_answers_in_category BIGINT NOT NULL DEFAULT 0,
    total_answers_in_category   BIGINT NOT NULL DEFAULT 0,
    accuracy_in_category        DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    trend                       VARCHAR(20) NOT NULL DEFAULT 'STABLE',
    trend_delta                 DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    score_history               JSONB DEFAULT '[]',
    created_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at                  TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by                  VARCHAR(255) NOT NULL,
    updated_by                  VARCHAR(255) NOT NULL,
    version                     BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_skill_user_category UNIQUE (user_id, category_id)
);

CREATE INDEX idx_skill_user     ON skill_analytics (user_id);
CREATE INDEX idx_skill_category ON skill_analytics (category_id);
CREATE INDEX idx_skill_mastery  ON skill_analytics (mastery_score DESC);

-- ─── ANALYTICS SNAPSHOTS ─────────────────────────────────────────────────────
CREATE TABLE analytics_snapshots (
    id            UUID PRIMARY KEY,
    subject_id    UUID NOT NULL,
    subject_type  VARCHAR(20) NOT NULL,
    snapshot_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    period_label  VARCHAR(20),
    granularity   VARCHAR(20) NOT NULL,
    total_attempts BIGINT NOT NULL DEFAULT 0,
    total_score   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    average_score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    pass_rate     DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    unique_users  BIGINT NOT NULL DEFAULT 0,
    metrics_json  JSONB DEFAULT '{}',
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at    TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by    VARCHAR(255) NOT NULL,
    updated_by    VARCHAR(255) NOT NULL,
    version       BIGINT NOT NULL DEFAULT 1
);

CREATE INDEX idx_snap_subject ON analytics_snapshots (subject_id, subject_type);
CREATE INDEX idx_snap_ts      ON analytics_snapshots (snapshot_at DESC);
CREATE INDEX idx_snap_period  ON analytics_snapshots (subject_id, period_label);
CREATE INDEX idx_snap_granularity ON analytics_snapshots (granularity, snapshot_at DESC);

-- ─── MATERIALIZED VIEW: Platform Daily Stats ─────────────────────────────────
-- Used by admin dashboards for fast platform-wide metrics.
-- Refreshed by the weekly aggregation job (or manually).
CREATE MATERIALIZED VIEW mv_platform_daily_stats AS
SELECT
    DATE_TRUNC('day', qa.submitted_at)      AS day,
    COUNT(*)                                 AS total_attempts,
    COUNT(DISTINCT qa.user_id)               AS unique_users,
    AVG(qa.score)                            AS avg_score,
    AVG(qa.percentage)                       AS avg_percentage,
    SUM(CASE WHEN qa.passed THEN 1 ELSE 0 END)::BIGINT AS pass_count,
    COUNT(*)::DOUBLE PRECISION               AS attempt_count,
    ROUND(
        (SUM(CASE WHEN qa.passed THEN 1 ELSE 0 END)::NUMERIC /
         NULLIF(COUNT(*), 0) * 100), 2
    )                                        AS pass_rate
FROM quiz_attempts qa
WHERE qa.status IN ('SUBMITTED', 'EXPIRED')
  AND qa.submitted_at IS NOT NULL
GROUP BY DATE_TRUNC('day', qa.submitted_at)
ORDER BY day DESC;

CREATE UNIQUE INDEX idx_mv_platform_daily ON mv_platform_daily_stats (day);

-- Refresh command (run by cron or admin API):
-- REFRESH MATERIALIZED VIEW CONCURRENTLY mv_platform_daily_stats;

-- ─── MATERIALIZED VIEW: Quiz Performance Summary ──────────────────────────────
CREATE MATERIALIZED VIEW mv_quiz_performance AS
SELECT
    qa.quiz_id,
    q.title                                  AS quiz_title,
    COUNT(*)                                 AS total_attempts,
    COUNT(DISTINCT qa.user_id)               AS unique_players,
    AVG(qa.score)                            AS avg_score,
    MAX(qa.score)                            AS max_score,
    MIN(qa.score)                            AS min_score,
    ROUND(
        (SUM(CASE WHEN qa.passed THEN 1 ELSE 0 END)::NUMERIC /
         NULLIF(COUNT(*), 0) * 100), 2
    )                                        AS pass_rate,
    AVG(qa.time_taken_seconds)               AS avg_time_seconds
FROM quiz_attempts qa
JOIN quizzes q ON q.id = qa.quiz_id
WHERE qa.status IN ('SUBMITTED', 'EXPIRED')
GROUP BY qa.quiz_id, q.title;

CREATE UNIQUE INDEX idx_mv_quiz_perf ON mv_quiz_performance (quiz_id);
