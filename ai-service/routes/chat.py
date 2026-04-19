from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
from services.chat_service import chat_service
from services.memory_service import memory_service
import logging

router = APIRouter()

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = "default"
    user_id: Optional[str] = None          # persistent identity across sessions
    user_profile: Optional[Dict] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    user_id: str
    memory_length: int
    persistent_memory: bool
    context_used: bool

@router.post("/ai/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with PathPilot AI.
    - LangChain + Groq for generation
    - Supabase for persistent memory
    - pgvector for semantic context retrieval
    """
    try:
        result = await chat_service.chat(
            message=request.message,
            session_id=request.session_id,
            user_id=request.user_id,
            user_profile=request.user_profile
        )
        return ChatResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Chat endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/ai/chat/session/{session_id}")
async def clear_session(session_id: str):
    success = chat_service.clear_session(session_id)
    return {"success": success, "session_id": session_id}

@router.get("/ai/chat/session/{session_id}/history")
async def get_history(session_id: str):
    return {
        "session_id": session_id,
        "history": chat_service.get_session_history(session_id)
    }

@router.get("/ai/chat/memory/status")
async def memory_status():
    return {
        "persistent_memory_available": memory_service.is_available,
        "backend": "supabase+pgvector" if memory_service.is_available else "in-memory",
    }

@router.get("/ai/chat/sessions")
async def list_sessions():
    sessions = list(chat_service._sessions.keys())
    return {"active_sessions": sessions, "count": len(sessions)}