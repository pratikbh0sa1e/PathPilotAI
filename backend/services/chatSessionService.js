/**
 * Chat Session Service
 *
 * Manages chat sessions (create, list, delete, rename).
 * Messages are stored in Supabase `chat_messages` table via the AI service.
 * Session metadata is stored in Supabase `chat_sessions` table (or in-memory fallback).
 */

const { supabase, isAvailable } = require("./supabaseClient");
const { v4: uuidv4 } = require("uuid");

// In-memory fallback
const memorySessions = new Map(); // userId → [session, ...]

// ── Helpers ───────────────────────────────────────────────────────────────────

function newSession(userId, title = "New Chat") {
  return {
    id: uuidv4(),
    user_id: userId,
    title,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    message_count: 0,
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

async function getSessions(userId) {
  if (!isAvailable) {
    return (memorySessions.get(userId) ?? []).sort(
      (a, b) => new Date(b.updated_at) - new Date(a.updated_at),
    );
  }
  const { data, error } = await supabase
    .from("chat_sessions")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  return error ? [] : data;
}

async function createSession(userId, title = "New Chat") {
  const session = newSession(userId, title);

  if (!isAvailable) {
    const list = memorySessions.get(userId) ?? [];
    list.unshift(session);
    memorySessions.set(userId, list);
    return session;
  }

  const { data, error } = await supabase
    .from("chat_sessions")
    .insert({ ...session })
    .select()
    .single();

  return error ? session : data;
}

async function updateSession(sessionId, updates) {
  if (!isAvailable) {
    for (const [userId, sessions] of memorySessions.entries()) {
      const s = sessions.find((s) => s.id === sessionId);
      if (s) {
        Object.assign(s, updates, { updated_at: new Date().toISOString() });
        return s;
      }
    }
    return null;
  }
  const { data } = await supabase
    .from("chat_sessions")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", sessionId)
    .select()
    .single();
  return data;
}

async function deleteSession(sessionId) {
  if (!isAvailable) {
    for (const [userId, sessions] of memorySessions.entries()) {
      const idx = sessions.findIndex((s) => s.id === sessionId);
      if (idx !== -1) {
        sessions.splice(idx, 1);
        return true;
      }
    }
    return false;
  }
  // Delete messages first, then session
  await supabase.from("chat_messages").delete().eq("session_id", sessionId);
  const { error } = await supabase
    .from("chat_sessions")
    .delete()
    .eq("id", sessionId);
  return !error;
}

async function getMessages(userId, sessionId) {
  if (!isAvailable) return [];
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("user_id", userId)
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });
  return error ? [] : data;
}

async function touchSession(sessionId) {
  await updateSession(sessionId, { updated_at: new Date().toISOString() });
}

module.exports = {
  getSessions,
  createSession,
  updateSession,
  deleteSession,
  getMessages,
  touchSession,
};
