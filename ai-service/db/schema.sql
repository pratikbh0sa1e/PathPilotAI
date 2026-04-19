-- PathPilot AI — Supabase Schema
-- Run this entire file in your Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Safe to re-run — all statements use IF NOT EXISTS / CREATE OR REPLACE

-- ── 1. Enable pgvector extension ──────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 2. User Profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             TEXT        UNIQUE NOT NULL,   -- auth user id or session id
    name                TEXT,
    gpa                 FLOAT       CHECK (gpa >= 0 AND gpa <= 10),
    field_of_study      TEXT,
    target_countries    TEXT[]      DEFAULT '{}',
    target_universities TEXT[]      DEFAULT '{}',
    budget_range        TEXT        CHECK (budget_range IN ('limited', 'medium', 'high')),
    goals               TEXT,
    test_score          TEXT,
    activities          TEXT[]      DEFAULT '{}',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Chat Sessions ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT        NOT NULL,
    title       TEXT        NOT NULL DEFAULT 'New Chat',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user
    ON chat_sessions (user_id, updated_at DESC);

-- ── 4. Chat Messages ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT        NOT NULL,
    session_id  TEXT        NOT NULL,
    role        TEXT        NOT NULL CHECK (role IN ('human', 'ai')),
    content     TEXT        NOT NULL,
    embedding   VECTOR(384),                    -- all-MiniLM-L6-v2 (384 dims)
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_session
    ON chat_messages (user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created
    ON chat_messages (created_at DESC);

-- pgvector cosine similarity index (speeds up semantic search)
CREATE INDEX IF NOT EXISTS idx_chat_messages_embedding
    ON chat_messages USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ── 4. User Actions / Journey Events ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_actions (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT        NOT NULL,
    action_type TEXT        NOT NULL,   -- e.g. 'chat_message', 'journey_scored', 'roi_calculated'
    payload     JSONB       DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user
    ON user_actions (user_id, created_at DESC);

-- ── 5. Gamification ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS gamification (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             TEXT        UNIQUE NOT NULL,
    xp                  INT         DEFAULT 0,
    level               INT         DEFAULT 1,
    streak              INT         DEFAULT 0,
    last_active_date    DATE,
    completed_actions   TEXT[]      DEFAULT '{}',
    badges              JSONB       DEFAULT '[]',   -- array of {id, earned, earnedAt}
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_gamification_updated_at
    BEFORE UPDATE ON gamification
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 5. Semantic search function ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION match_chat_messages(
    query_embedding VECTOR(384),
    match_user_id   TEXT,
    match_count     INT DEFAULT 5
)
RETURNS TABLE (
    id          UUID,
    session_id  TEXT,
    role        TEXT,
    content     TEXT,
    similarity  FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        cm.id,
        cm.session_id,
        cm.role,
        cm.content,
        1 - (cm.embedding <=> query_embedding) AS similarity
    FROM chat_messages cm
    WHERE cm.user_id = match_user_id
      AND cm.embedding IS NOT NULL
    ORDER BY cm.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ── 6. Auto-update updated_at trigger ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Drop and recreate trigger (CREATE OR REPLACE not supported for triggers)
DROP TRIGGER IF EXISTS trigger_user_profiles_updated_at ON user_profiles;

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 7. Row Level Security (RLS) — enable but allow all for now ─────────────────
-- Uncomment and customize once you add Supabase Auth
-- ALTER TABLE user_profiles  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE chat_messages  ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_actions   ENABLE ROW LEVEL SECURITY;
