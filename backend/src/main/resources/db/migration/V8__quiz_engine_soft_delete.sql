-- V8__quiz_engine_soft_delete.sql
-- Adds soft-delete column to quizzes, quiz_version column, and supporting indexes

-- Soft-delete and version tracking on quizzes table
ALTER TABLE quizzes
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS quiz_version INT NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

-- Index for efficient soft-delete filtering
CREATE INDEX IF NOT EXISTS idx_quizzes_deleted_at ON quizzes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
CREATE INDEX IF NOT EXISTS idx_quizzes_creator ON quizzes(creator_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_category ON quizzes(category_id);

-- Full-text search index on title and description
CREATE INDEX IF NOT EXISTS idx_quizzes_title_text ON quizzes USING gin(to_tsvector('english', title));

-- Tags table: add description column
ALTER TABLE tags
    ADD COLUMN IF NOT EXISTS description TEXT;

-- Categories table: add description and icon columns
ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS icon_url TEXT,
    ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- quiz_versions: add created_by column
ALTER TABLE quiz_versions
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) NOT NULL DEFAULT 'SYSTEM',
    ADD COLUMN IF NOT EXISTS change_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_quiz_versions_quiz ON quiz_versions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_question_options_question ON question_options(question_id);
