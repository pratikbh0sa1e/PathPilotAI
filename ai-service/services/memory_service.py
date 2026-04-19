"""
Persistent Memory Service — Supabase + pgvector + LangChain

Handles:
  1. User profile storage/retrieval
  2. Chat message persistence with embeddings
  3. Semantic search over past conversations
  4. User action tracking
  5. Context injection into LangChain prompts
"""

import os
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime

from supabase import create_client, Client
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.messages import HumanMessage, AIMessage

logger = logging.getLogger(__name__)

# Lightweight embedding model — no GPU needed, fast inference
EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"


class MemoryService:
    """
    Persistent memory layer using Supabase + pgvector.
    Falls back gracefully to in-memory if Supabase is not configured.
    """

    def __init__(self):
        self._supabase: Optional[Client] = None
        self._embeddings = None
        self._available = False

        # Try to initialize Supabase
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")

        if url and key:
            try:
                self._supabase = create_client(url, key)
                self._embeddings = HuggingFaceEmbeddings(
                    model_name=EMBEDDING_MODEL,
                    model_kwargs={"device": "cpu"},
                    encode_kwargs={"normalize_embeddings": True}
                )
                self._available = True
                logger.info("✅ Memory service initialized with Supabase")
            except Exception as e:
                logger.warning(f"⚠️  Supabase init failed — using in-memory fallback: {e}")
        else:
            logger.info("ℹ️  SUPABASE_URL/KEY not set — using in-memory fallback")

    @property
    def is_available(self) -> bool:
        return self._available

    # ── Embeddings ─────────────────────────────────────────────────────────────

    def _embed(self, text: str) -> Optional[List[float]]:
        """Generate embedding vector for text"""
        if not self._embeddings:
            return None
        try:
            return self._embeddings.embed_query(text)
        except Exception as e:
            logger.error(f"Embedding failed: {e}")
            return None

    # ── User Profile ───────────────────────────────────────────────────────────

    async def save_profile(self, user_id: str, profile: Dict) -> bool:
        """Upsert user profile to Supabase"""
        if not self._available:
            return False
        try:
            data = {
                "user_id": user_id,
                "gpa": profile.get("gpa"),
                "field_of_study": profile.get("field_of_study"),
                "target_countries": profile.get("target_countries", []),
                "target_universities": profile.get("target_universities", []),
                "budget_range": profile.get("budget_range"),
                "goals": profile.get("goals"),
                "test_score": profile.get("test_score"),
                "activities": profile.get("activities", []),
            }
            self._supabase.table("user_profiles").upsert(
                data, on_conflict="user_id"
            ).execute()
            return True
        except Exception as e:
            logger.error(f"save_profile failed: {e}")
            return False

    async def get_profile(self, user_id: str) -> Optional[Dict]:
        """Retrieve user profile from Supabase"""
        if not self._available:
            return None
        try:
            result = (
                self._supabase.table("user_profiles")
                .select("*")
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            return result.data
        except Exception as e:
            logger.error(f"get_profile failed: {e}")
            return None

    # ── Chat Messages ──────────────────────────────────────────────────────────

    async def save_message(
        self,
        user_id: str,
        session_id: str,
        role: str,
        content: str
    ) -> bool:
        """Persist a chat message with its embedding"""
        if not self._available:
            return False
        try:
            embedding = self._embed(content)
            data = {
                "user_id": user_id,
                "session_id": session_id,
                "role": role,
                "content": content,
                "embedding": embedding,
            }
            self._supabase.table("chat_messages").insert(data).execute()
            return True
        except Exception as e:
            logger.error(f"save_message failed: {e}")
            return False

    async def get_recent_messages(
        self,
        user_id: str,
        session_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """Get recent messages for a session"""
        if not self._available:
            return []
        try:
            result = (
                self._supabase.table("chat_messages")
                .select("role, content, created_at")
                .eq("user_id", user_id)
                .eq("session_id", session_id)
                .order("created_at", desc=False)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"get_recent_messages failed: {e}")
            return []

    async def search_similar_messages(
        self,
        user_id: str,
        query: str,
        limit: int = 5
    ) -> List[Dict]:
        """
        Semantic search over all past messages for a user.
        Returns most relevant past conversations.
        """
        if not self._available or not self._embeddings:
            return []
        try:
            embedding = self._embed(query)
            if not embedding:
                return []

            result = self._supabase.rpc(
                "match_chat_messages",
                {
                    "query_embedding": embedding,
                    "match_user_id": user_id,
                    "match_count": limit,
                }
            ).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"search_similar_messages failed: {e}")
            return []

    # ── User Actions ───────────────────────────────────────────────────────────

    async def track_action(
        self,
        user_id: str,
        action_type: str,
        payload: Optional[Dict] = None
    ) -> bool:
        """Track a user action/event"""
        if not self._available:
            return False
        try:
            self._supabase.table("user_actions").insert({
                "user_id": user_id,
                "action_type": action_type,
                "payload": payload or {},
            }).execute()
            return True
        except Exception as e:
            logger.error(f"track_action failed: {e}")
            return False

    async def get_recent_actions(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict]:
        """Get recent user actions"""
        if not self._available:
            return []
        try:
            result = (
                self._supabase.table("user_actions")
                .select("action_type, payload, created_at")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return result.data or []
        except Exception as e:
            logger.error(f"get_recent_actions failed: {e}")
            return []

    # ── Context Builder ────────────────────────────────────────────────────────

    async def build_persistent_context(
        self,
        user_id: str,
        current_message: str,
        session_id: str
    ) -> str:
        """
        Build rich context from persistent memory for LangChain prompt injection.

        Combines:
          - Stored user profile
          - Semantically similar past conversations
          - Recent user actions
        """
        context_parts = []

        # 1. Stored profile
        profile = await self.get_profile(user_id)
        if profile:
            profile_parts = []
            if profile.get("gpa"):
                profile_parts.append(f"GPA: {profile['gpa']}")
            if profile.get("field_of_study"):
                profile_parts.append(f"Field: {profile['field_of_study']}")
            if profile.get("target_countries"):
                profile_parts.append(f"Target countries: {', '.join(profile['target_countries'])}")
            if profile.get("goals"):
                profile_parts.append(f"Goals: {profile['goals']}")
            if profile_parts:
                context_parts.append("Stored Profile: " + "; ".join(profile_parts))

        # 2. Semantically similar past messages
        similar = await self.search_similar_messages(user_id, current_message, limit=3)
        if similar:
            past = []
            for msg in similar:
                role = "Student" if msg["role"] == "human" else "PathPilot"
                past.append(f'{role}: {msg["content"][:150]}...')
            context_parts.append("Relevant past conversations:\n" + "\n".join(past))

        # 3. Recent actions
        actions = await self.get_recent_actions(user_id, limit=5)
        if actions:
            action_strs = []
            for a in actions:
                action_strs.append(f"- {a['action_type']}")
            context_parts.append("Recent activity:\n" + "\n".join(action_strs))

        return "\n\n".join(context_parts) if context_parts else "No persistent history yet."

    async def build_session_history(
        self,
        user_id: str,
        session_id: str
    ) -> List:
        """
        Load session history from Supabase as LangChain messages.
        Used to restore conversation state across server restarts.
        """
        messages = await self.get_recent_messages(user_id, session_id, limit=20)
        history = []
        for msg in messages:
            if msg["role"] == "human":
                history.append(HumanMessage(content=msg["content"]))
            elif msg["role"] == "ai":
                history.append(AIMessage(content=msg["content"]))
        return history


# ── Global instance ────────────────────────────────────────────────────────────
memory_service = MemoryService()
