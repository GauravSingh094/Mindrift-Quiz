-- V10__competition_schema.sql
-- Full Competition & Tournament Engine schema

-- ─── COMPETITIONS ──────────────────────────────────────────────────────────
CREATE TABLE competitions (
    id                  UUID PRIMARY KEY,
    title               VARCHAR(200) NOT NULL,
    description         TEXT,
    organizer_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    quiz_id             UUID NOT NULL REFERENCES quizzes(id) ON DELETE RESTRICT,
    status              VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    type                VARCHAR(50) NOT NULL DEFAULT 'OPEN',  -- OPEN | PRIVATE | INVITE_ONLY
    mode                VARCHAR(50) NOT NULL DEFAULT 'STANDARD',  -- STANDARD | SPEED | SURVIVAL
    join_code           VARCHAR(12) UNIQUE,
    max_participants    INT NOT NULL DEFAULT 100,
    min_participants    INT NOT NULL DEFAULT 2,
    registration_start  TIMESTAMP WITH TIME ZONE,
    registration_end    TIMESTAMP WITH TIME ZONE,
    scheduled_start     TIMESTAMP WITH TIME ZONE,
    scheduled_end       TIMESTAMP WITH TIME ZONE,
    actual_start        TIMESTAMP WITH TIME ZONE,
    actual_end          TIMESTAMP WITH TIME ZONE,
    current_round       INT NOT NULL DEFAULT 0,
    total_rounds        INT NOT NULL DEFAULT 1,
    time_limit_secs     INT NOT NULL DEFAULT 1800,
    allow_late_join     BOOLEAN NOT NULL DEFAULT FALSE,
    prize_description   TEXT,
    banner_url          TEXT,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by          VARCHAR(255) NOT NULL,
    updated_by          VARCHAR(255) NOT NULL,
    version             INT NOT NULL DEFAULT 1
);

-- ─── COMPETITION PARTICIPANTS ───────────────────────────────────────────────
CREATE TABLE competition_participants (
    id                  UUID PRIMARY KEY,
    competition_id      UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status              VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',  -- REGISTERED | ACTIVE | DISQUALIFIED | LEFT | COMPLETED
    joined_at           TIMESTAMP WITH TIME ZONE NOT NULL,
    left_at             TIMESTAMP WITH TIME ZONE,
    total_score         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    current_rank        INT,
    rounds_completed    INT NOT NULL DEFAULT 0,
    is_ready            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by          VARCHAR(255) NOT NULL,
    updated_by          VARCHAR(255) NOT NULL,
    version             INT NOT NULL DEFAULT 1,
    UNIQUE (competition_id, user_id)
);

-- ─── COMPETITION ROUNDS ─────────────────────────────────────────────────────
CREATE TABLE competition_rounds (
    id                  UUID PRIMARY KEY,
    competition_id      UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    round_number        INT NOT NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',  -- PENDING | ACTIVE | COMPLETED
    start_time          TIMESTAMP WITH TIME ZONE,
    end_time            TIMESTAMP WITH TIME ZONE,
    time_limit_secs     INT NOT NULL DEFAULT 1800,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by          VARCHAR(255) NOT NULL,
    updated_by          VARCHAR(255) NOT NULL,
    version             INT NOT NULL DEFAULT 1,
    UNIQUE (competition_id, round_number)
);

-- ─── COMPETITION LEADERBOARD ────────────────────────────────────────────────
CREATE TABLE competition_leaderboard (
    id                  UUID PRIMARY KEY,
    competition_id      UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank                INT NOT NULL DEFAULT 0,
    total_score         DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    correct_answers     INT NOT NULL DEFAULT 0,
    incorrect_answers   INT NOT NULL DEFAULT 0,
    time_taken_secs     BIGINT NOT NULL DEFAULT 0,
    last_updated        TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by          VARCHAR(255) NOT NULL,
    updated_by          VARCHAR(255) NOT NULL,
    version             INT NOT NULL DEFAULT 1,
    UNIQUE (competition_id, user_id)
);

-- ─── INDEXES ────────────────────────────────────────────────────────────────
CREATE INDEX idx_competitions_status        ON competitions(status);
CREATE INDEX idx_competitions_organizer     ON competitions(organizer_id);
CREATE INDEX idx_competitions_scheduled     ON competitions(scheduled_start) WHERE status IN ('SCHEDULED', 'REGISTRATION_OPEN');
CREATE UNIQUE INDEX idx_competitions_join_code ON competitions(join_code) WHERE join_code IS NOT NULL;

CREATE INDEX idx_participants_competition   ON competition_participants(competition_id);
CREATE INDEX idx_participants_user          ON competition_participants(user_id);
CREATE INDEX idx_participants_status        ON competition_participants(competition_id, status);

CREATE INDEX idx_rounds_competition         ON competition_rounds(competition_id);
CREATE INDEX idx_rounds_status              ON competition_rounds(status);

CREATE INDEX idx_leaderboard_competition    ON competition_leaderboard(competition_id);
CREATE INDEX idx_leaderboard_rank           ON competition_leaderboard(competition_id, rank);
CREATE INDEX idx_leaderboard_score          ON competition_leaderboard(competition_id, total_score DESC);
