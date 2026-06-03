-- V1__init_schema.sql
-- Create Enum Types for DB Data Consistency
CREATE TYPE user_role AS ENUM (
    'ROLE_SUPER_ADMIN', 
    'ROLE_ADMIN', 
    'ROLE_MODERATOR', 
    'ROLE_QUIZ_CREATOR', 
    'ROLE_TOURNAMENT_ORGANIZER', 
    'ROLE_PLAYER'
);

CREATE TYPE user_status AS ENUM (
    'ACTIVE', 
    'INACTIVE', 
    'SUSPENDED', 
    'BANNED'
);

-- Core Users Table with Auditing Base Columns
CREATE TABLE users (
    id UUID PRIMARY KEY,
    clerk_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(100) UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    avatar_url TEXT,
    role user_role NOT NULL DEFAULT 'ROLE_PLAYER',
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Active User Session Tracking (For Suspicious Login Detection)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_fingerprint VARCHAR(64) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT NOT NULL,
    login_time TIMESTAMP WITH TIME ZONE NOT NULL,
    last_activity TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    updated_by VARCHAR(255) NOT NULL,
    version INT NOT NULL DEFAULT 1
);

-- Transactional Outbox Pattern Schema
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance scale
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_outbox_pending ON outbox_events(status, created_at) WHERE status = 'PENDING';
CREATE INDEX idx_sessions_user ON user_sessions(user_id);
