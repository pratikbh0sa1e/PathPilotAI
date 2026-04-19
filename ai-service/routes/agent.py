from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, List
import logging

from agents.agent_service import agent_service
from agents.tools import ALL_TOOLS

router = APIRouter()


class AgentRequest(BaseModel):
    message: str = Field(..., description="User's question or request")
    user_profile: Optional[Dict] = Field(None, description="Student profile for context")
    chat_history: Optional[List[Dict]] = Field(None, description="Previous messages")


class AgentResponse(BaseModel):
    response: str
    tools_used: List[str]
    tools_count: int
    tool_results: Optional[List[Dict]] = None


@router.post("/ai/agent", response_model=AgentResponse)
async def run_agent(request: AgentRequest):
    """
    PathPilot AI Agent — autonomous tool-calling endpoint.

    The agent decides which tools to call based on the user's question:
    - ROI analysis → roi_tool
    - Loan calculation → loan_tool
    - University search → university_search_tool
    - Readiness score → journey_score_tool
    - Scholarships → scholarship_tool

    Example questions:
    - "Is studying Computer Science in Germany worth it?"
    - "What universities should I apply to with a 8.5 GPA?"
    - "Can I get a loan for studying in Canada?"
    - "What scholarships are available for STEM in UK?"
    """
    try:
        result = await agent_service.run(
            message=request.message,
            user_profile=request.user_profile,
            chat_history=request.chat_history or []
        )
        return AgentResponse(**result)

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Agent error: {e}")
        raise HTTPException(status_code=500, detail="Agent execution failed")


@router.get("/ai/agent/tools")
async def list_tools():
    """List all available agent tools"""
    return {
        "tools": [
            {
                "name": t.name,
                "description": t.description.strip().split("\n")[0],
            }
            for t in ALL_TOOLS
        ],
        "count": len(ALL_TOOLS)
    }
