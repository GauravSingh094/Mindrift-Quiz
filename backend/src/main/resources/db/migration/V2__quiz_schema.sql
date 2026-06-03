-- V2__quiz_schema.sql

-- Categories Table
CREATE TABLE categories (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Tags Table
CREATE TABLE tags (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Quizzes Table
CREATE TABLE quizzes (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    difficulty VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    estimated_duration INT NOT NULL DEFAULT 15,
    passing_score DOUBLE PRECISION NOT NULL DEFAULT 70.0,
    visibility VARCHAR(50) NOT NULL DEFAULT 'PUBLIC',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Questions Table
CREATE TABLE questions (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    explanation TEXT,
    points INT NOT NULL DEFAULT 1,
    order_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Question Options Table
CREATE TABLE question_options (
    id UUID PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Quizzes Tags Map (Many-to-Many Join Table)
CREATE TABLE quizzes_tags_map (
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (quiz_id, tag_id)
);

-- Quiz Versions Table (Historical Snapshots)
CREATE TABLE quiz_versions (
    id UUID PRIMARY KEY,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    version INT NOT NULL,
    snapshot JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Audit Logs Table (Enterprise Telemetry Audit Trails)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL,
    metadata JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Core Index Optimization for High Concurrency Performance
CREATE INDEX idx_quizzes_search_composite ON quizzes(category_id, status, visibility, title);
CREATE INDEX idx_quizzes_creator ON quizzes(creator_id);
CREATE INDEX idx_questions_quiz_order ON questions(quiz_id, order_index);
CREATE INDEX idx_options_question_order ON question_options(question_id, order_index);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
