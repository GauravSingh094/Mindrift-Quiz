-- V11__leaderboard_achievement_schema.sql
-- Leaderboard & Achievement Engine – Step 4
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── LEADERBOARD SEASONS ─────────────────────────────────────────────────────
CREATE TABLE leaderboard_seasons (
    id           UUID PRIMARY KEY,
    name         VARCHAR(100) NOT NULL,
    label        VARCHAR(50),
    start_date   TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date     TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by   VARCHAR(255) NOT NULL,
    updated_by   VARCHAR(255) NOT NULL,
    version      BIGINT NOT NULL DEFAULT 1
);

-- Only one season active at a time
CREATE UNIQUE INDEX uq_season_active
    ON leaderboard_seasons (is_active)
    WHERE is_active = TRUE;

-- ─── LEADERBOARD ENTRIES ─────────────────────────────────────────────────────
-- One row per (user, scope) where scope is one of:
--   global       : category_id IS NULL  AND season_id IS NULL
--   category     : category_id NOT NULL AND season_id IS NULL
--   seasonal     : category_id IS NULL  AND season_id NOT NULL
CREATE TABLE leaderboard_entries (
    id              UUID PRIMARY KEY,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id     UUID REFERENCES categories(id) ON DELETE CASCADE,
    season_id       UUID REFERENCES leaderboard_seasons(id) ON DELETE CASCADE,
    total_score     DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    total_attempts  BIGINT NOT NULL DEFAULT 0,
    perfect_scores  BIGINT NOT NULL DEFAULT 0,
    wins            BIGINT NOT NULL DEFAULT 0,
    top10_count     BIGINT NOT NULL DEFAULT 0,
    average_score   DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    current_rank    INT,
    best_rank       INT,
    last_active     TIMESTAMP WITH TIME ZONE,
    streak_days     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by      VARCHAR(255) NOT NULL,
    updated_by      VARCHAR(255) NOT NULL,
    version         BIGINT NOT NULL DEFAULT 1
);

-- Compound unique: one entry per user × scope
CREATE UNIQUE INDEX uq_lb_entry_global
    ON leaderboard_entries (user_id)
    WHERE category_id IS NULL AND season_id IS NULL;

CREATE UNIQUE INDEX uq_lb_entry_category
    ON leaderboard_entries (user_id, category_id)
    WHERE category_id IS NOT NULL AND season_id IS NULL;

CREATE UNIQUE INDEX uq_lb_entry_season
    ON leaderboard_entries (user_id, season_id)
    WHERE category_id IS NULL AND season_id IS NOT NULL;

-- Query indexes
CREATE INDEX idx_lb_user         ON leaderboard_entries (user_id);
CREATE INDEX idx_lb_total_score  ON leaderboard_entries (total_score DESC);
CREATE INDEX idx_lb_season       ON leaderboard_entries (season_id);
CREATE INDEX idx_lb_category     ON leaderboard_entries (category_id);

-- ─── USER ACHIEVEMENTS ────────────────────────────────────────────────────────
CREATE TABLE user_achievements (
    id               UUID PRIMARY KEY,
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(60) NOT NULL,
    earned_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    context          VARCHAR(500),
    created_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by       VARCHAR(255) NOT NULL,
    updated_by       VARCHAR(255) NOT NULL,
    version          BIGINT NOT NULL DEFAULT 1,
    CONSTRAINT uq_user_achievement UNIQUE (user_id, achievement_type)
);

CREATE INDEX idx_achievements_user   ON user_achievements (user_id);
CREATE INDEX idx_achievements_type   ON user_achievements (achievement_type);
CREATE INDEX idx_achievements_earned ON user_achievements (earned_at DESC);

-- ─── SEED: Default season ─────────────────────────────────────────────────────
INSERT INTO leaderboard_seasons
    (id, name, label, start_date, end_date, is_active,
     created_at, updated_at, created_by, updated_by, version)
VALUES
    (gen_random_uuid(),
     'Season 1',
     'Q2 2025',
     '2025-04-01 00:00:00+00',
     '2025-06-30 23:59:59+00',
     FALSE,
     NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
    (gen_random_uuid(),
     'Season 2',
     'Q3 2025',
     '2025-07-01 00:00:00+00',
     '2025-09-30 23:59:59+00',
     FALSE,
     NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1),
    (gen_random_uuid(),
     'Season 3',
     'Q1-Q2 2026',
     '2026-01-01 00:00:00+00',
     '2026-06-30 23:59:59+00',
     TRUE,
     NOW(), NOW(), 'SYSTEM', 'SYSTEM', 1);
