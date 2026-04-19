from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import logging

from services.nudge_service import nudge_service, evaluate_nudges

router = APIRouter()


class NudgeRequest(BaseModel):
    profile: Dict = Field(..., description="Student profile")
    activity: Optional[List[str]] = Field(default=[], description="Activities list")
    used_features: Optional[List[str]] = Field(
        default=[],
        description="Features already used: ['roi', 'loan', 'journey', 'chat']"
    )
    journey_score: Optional[int] = Field(None, ge=0, le=100)
    days_since_last_active: Optional[int] = Field(None, ge=0)
    max_nudges: Optional[int] = Field(default=5, ge=1, le=10)
    personalize: Optional[bool] = Field(
        default=True,
        description="Use LangChain to personalize messages (set false for speed)"
    )


class NudgeItem(BaseModel):
    id: str
    category: str
    priority: str
    message: str
    action_label: str
    action_route: str


class NudgeResponse(BaseModel):
    nudges: List[NudgeItem]
    count: int
    personalized: bool


@router.post("/ai/nudges", response_model=NudgeResponse)
async def get_nudges(request: NudgeRequest):
    """
    Smart Nudges endpoint.

    Phase 1 — Rule engine evaluates student state:
      - Which features haven't been used?
      - What profile data is missing?
      - Is the journey score low?
      - Has the student been inactive?

    Phase 2 — LangChain personalizes each message:
      Generic: "You should check ROI..."
      Personalized: "With your CS background and Germany as a target,
                     your ROI analysis will show a payback period under 1 year."

    Returns up to max_nudges nudges sorted by priority (high → medium → low).
    """
    try:
        nudges = await nudge_service.get_nudges(
            profile=request.profile,
            activity=request.activity,
            used_features=request.used_features,
            journey_score=request.journey_score,
            days_since_last_active=request.days_since_last_active,
            max_nudges=request.max_nudges,
            personalize=request.personalize,
        )
        return NudgeResponse(
            nudges=nudges,
            count=len(nudges),
            personalized=request.personalize,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Nudges endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Nudge generation failed")


@router.post("/ai/nudges/quick")
async def get_nudges_quick(request: NudgeRequest):
    """
    Fast nudges — rule engine only, no LLM personalization.
    Returns immediately with template messages.
    """
    try:
        triggers = evaluate_nudges(
            profile=request.profile,
            activity=request.activity,
            used_features=request.used_features,
            journey_score=request.journey_score,
            days_since_last_active=request.days_since_last_active,
        )
        nudges = [
            {
                "id":           t.id,
                "category":     t.category.value,
                "priority":     t.priority.value,
                "message":      t.template,
                "action_label": t.action_label,
                "action_route": t.action_route,
            }
            for t in triggers[:request.max_nudges]
        ]
        return {"nudges": nudges, "count": len(nudges), "personalized": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
