-- V3__attempt_schema.sql

-- Quiz Attempts Table
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'STARTED',
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE,
    score DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    attempt_number INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Question Responses Table
CREATE TABLE question_responses (
    id UUID PRIMARY KEY,
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    selected_option_ids JSONB NOT NULL,
    points_earned DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    answered_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Indexing for Concurrency Performance and Speed
CREATE INDEX idx_attempts_user ON quiz_attempts(user_id);
CREATE INDEX idx_attempts_quiz ON quiz_attempts(quiz_id);
CREATE INDEX idx_attempts_status ON quiz_attempts(status);
CREATE UNIQUE INDEX idx_attempts_user_quiz_num ON quiz_attempts(user_id, quiz_id, attempt_number);
CREATE INDEX idx_responses_attempt ON question_responses(attempt_id);
CREATE UNIQUE INDEX idx_responses_attempt_question ON question_responses(attempt_id, question_id);
