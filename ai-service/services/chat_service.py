"""
Chat Service — LangChain + Groq + Persistent Memory

Memory layers (in order of priority):
  1. In-process cache (fast, current session)
  2. Supabase DB (persistent across restarts)
  3. pgvector semantic search (relevant past context)
"""

from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
import os
import logging
from typing import Dict, Optional, List

from services.memory_service import memory_service

logger = logging.getLogger(__name__)


class PathPilotChatService:

    SYSTEM_PROMPT = """You are PathPilot AI, an expert study abroad mentor and educational consultant.

Your role is to help students navigate their international education journey with personalized guidance on:
- University selection and admission strategies
- Scholarship and funding opportunities
- Visa and immigration processes
- Academic program recommendations
- Career planning and internship opportunities
- Cultural adaptation and living abroad tips

Guidelines:
- Be encouraging, supportive, and professional
- Provide specific, actionable advice
- Reference the student's past conversations and profile when relevant
  (e.g. "Since you previously mentioned Canada..." or "Given your GPA of 8.5...")
- Ask clarifying questions when needed
- Be honest about challenges while remaining optimistic

Always tailor your responses to the individual student's profile and history."""

    def __init__(self):
        self._llm = None

        # In-process session cache (fast path)
        self._sessions: Dict[str, List[Dict]] = {}

        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", self.SYSTEM_PROMPT + "\n\n{persistent_context}"),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}")
        ])

    # ── LLM (lazy) ─────────────────────────────────────────────────────────────

    @property
    def llm(self) -> ChatGroq:
        if self._llm is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY is not set")
            self._llm = ChatGroq(
                groq_api_key=api_key,
                model_name=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                temperature=0.7,
                max_tokens=1000
            )
        return self._llm

    # ── In-process cache ───────────────────────────────────────────────────────

    def _cache_get(self, session_id: str) -> List[Dict]:
        return self._sessions.setdefault(session_id, [])

    def _cache_add(self, session_id: str, role: str, content: str):
        cache = self._cache_get(session_id)
        cache.append({"type": role, "content": content})
        # Keep last 20 messages in cache
        if len(cache) > 20:
            self._sessions[session_id] = cache[-20:]

    def _cache_to_langchain(self, session_id: str) -> List:
        return [
            HumanMessage(content=m["content"]) if m["type"] == "human"
            else AIMessage(content=m["content"])
            for m in self._cache_get(session_id)
        ]

    # ── Profile context ────────────────────────────────────────────────────────

    def _build_profile_context(self, user_profile: Optional[Dict]) -> str:
        if not user_profile:
            return ""
        parts = []
        if user_profile.get("gpa"):
            parts.append(f"GPA: {user_profile['gpa']}")
        if user_profile.get("field_of_study"):
            parts.append(f"Field: {user_profile['field_of_study']}")
        if user_profile.get("target_countries"):
            parts.append(f"Target countries: {', '.join(user_profile['target_countries'])}")
        if user_profile.get("budget_range"):
            parts.append(f"Budget: {user_profile['budget_range']}")
        if user_profile.get("goals"):
            parts.append(f"Goals: {user_profile['goals']}")
        return "Current session profile: " + "; ".join(parts) if parts else ""

    # ── Main chat method ───────────────────────────────────────────────────────

    async def chat(
        self,
        message: str,
        session_id: str = "default",
        user_id: Optional[str] = None,
        user_profile: Optional[Dict] = None
    ) -> Dict:
        """
        Process a chat message with full memory integration.

        Memory flow:
          1. Load session history from cache (or Supabase on cold start)
          2. Build persistent context (profile + semantic search + actions)
          3. Run LangChain chain
          4. Persist new messages to Supabase
          5. Track action
        """
        try:
            effective_user_id = user_id or session_id

            # ── Step 1: Load history ─────────────────────────────────────────
            # Warm cache from Supabase if this is a cold start for this session
            if session_id not in self._sessions and memory_service.is_available:
                db_history = await memory_service.build_session_history(
                    effective_user_id, session_id
                )
                if db_history:
                    self._sessions[session_id] = [
                        {"type": "human" if isinstance(m, HumanMessage) else "ai",
                         "content": m.content}
                        for m in db_history
                    ]
                    logger.info(f"Restored {len(db_history)} messages from Supabase for session {session_id}")

            chat_history = self._cache_to_langchain(session_id)

            # ── Step 2: Save profile + build persistent context ──────────────
            if user_profile and memory_service.is_available:
                await memory_service.save_profile(effective_user_id, user_profile)

            persistent_context = ""
            if memory_service.is_available:
                persistent_context = await memory_service.build_persistent_context(
                    effective_user_id, message, session_id
                )

            # Merge with current session profile
            profile_ctx = self._build_profile_context(user_profile)
            if profile_ctx:
                persistent_context = profile_ctx + "\n\n" + persistent_context

            # ── Step 3: Run LangChain chain ──────────────────────────────────
            chain = self.prompt_template | self.llm
            response = await chain.ainvoke({
                "input": message,
                "chat_history": chat_history,
                "persistent_context": persistent_context or "No prior context."
            })
            ai_response = response.content.strip()

            # ── Step 4: Persist to Supabase ──────────────────────────────────
            if memory_service.is_available:
                await memory_service.save_message(
                    effective_user_id, session_id, "human", message
                )
                await memory_service.save_message(
                    effective_user_id, session_id, "ai", ai_response
                )

            # ── Step 5: Update in-process cache ─────────────────────────────
            self._cache_add(session_id, "human", message)
            self._cache_add(session_id, "ai", ai_response)

            # ── Step 6: Track action ─────────────────────────────────────────
            if memory_service.is_available:
                await memory_service.track_action(
                    effective_user_id,
                    "chat_message",
                    {"session_id": session_id, "message_length": len(message)}
                )

            return {
                "response": ai_response,
                "session_id": session_id,
                "user_id": effective_user_id,
                "memory_length": len(self._cache_get(session_id)),
                "persistent_memory": memory_service.is_available,
                "context_used": bool(persistent_context),
            }

        except Exception as e:
            logger.error(f"Chat error: {e}")
            raise Exception(f"Chat processing failed: {str(e)}")

    # ── Session management ─────────────────────────────────────────────────────

    def clear_session(self, session_id: str) -> bool:
        if session_id in self._sessions:
            del self._sessions[session_id]
            return True
        return False

    def get_session_history(self, session_id: str) -> List[Dict]:
        return self._cache_get(session_id)


# ── Global instance ────────────────────────────────────────────────────────────
chat_service = PathPilotChatService()
