-- PathPilot AI — Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ── User Profiles ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT UNIQUE NOT NULL,          -- from auth or frontend
    gpa         FLOAT,
    field_of_study TEXT,
    target_countries TEXT[],
    target_universities TEXT[],
    budget_range TEXT,
    goals       TEXT,
    test_score  TEXT,
    activities  TEXT[],
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Chat Messages ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    session_id  TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('human', 'ai')),
    content     TEXT NOT NULL,
    embedding   VECTOR(384),                   -- sentence-transformers/all-MiniLM-L6-v2
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_user_session
    ON chat_messages (user_id, session_id);

CREATE INDEX IF NOT EXISTS idx_chat_messages_created
    ON chat_messages (created_at DESC);

-- ── User Actions / Journey Events ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_actions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     TEXT NOT NULL,
    action_type TEXT NOT NULL,                 -- e.g. 'journey_scored', 'university_saved'
    payload     JSONB,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_actions_user
    ON user_actions (user_id, created_at DESC);

-- ── Semantic search function (pgvector) ───────────────────────────────────────
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

-- ── Auto-update updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
