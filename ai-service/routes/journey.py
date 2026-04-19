from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import logging

from services.journey_service import calculate_scores
from services.journey_reasoning_service import journey_reasoning

router = APIRouter()


# ─── Request / Response models ────────────────────────────────────────────────

class JourneyRequest(BaseModel):
    profile: Dict = Field(..., description="Student profile data")
    activity: Optional[List[str]] = Field(default=[], description="List of activities/experiences")
    include_insights: Optional[bool] = Field(
        default=True,
        description="Set to false to skip LangChain reasoning (scores only)"
    )


class ScoreBreakdown(BaseModel):
    score: int
    max: int
    note: str


class JourneyResponse(BaseModel):
    # Core scores
    journeyScore: int
    admissionScore: int
    loanProbability: int

    # Sub-score breakdown
    breakdown: Dict[str, ScoreBreakdown]

    # Detail notes from scoring engine
    admissionDetail: str
    loanDetail: str

    # LangChain AI insights (optional)
    insights: Optional[Dict] = None

    # Meta
    profile_summary: str
    insights_generated: bool


# ─── Route ────────────────────────────────────────────────────────────────────

@router.post("/ai/journey", response_model=JourneyResponse)
async def journey(request: JourneyRequest):
    """
    Hybrid Journey Brain endpoint.

    Phase 1 — Deterministic scoring (Python rule engine):
      journey_score = profile_score + engagement_score + progress_score

    Phase 2 — AI reasoning (LangChain + Groq):
      Converts raw scores into insights, recommendations, and next steps.
    """
    try:
        # ── Phase 1: Deterministic scoring ──────────────────────────────────
        scores = calculate_scores(request.profile, request.activity)

        # ── Phase 2: LangChain AI reasoning ─────────────────────────────────
        insights = None
        insights_generated = False

        if request.include_insights:
            try:
                insights = await journey_reasoning.generate_insights(
                    profile=request.profile,
                    activities=request.activity,
                    scores=scores
                )
                insights_generated = True
            except ValueError as e:
                # GROQ_API_KEY not set — return scores only
                logging.warning(f"AI insights skipped: {e}")
            except Exception as e:
                logging.error(f"AI reasoning failed: {e}")
                # Don't fail the whole request — return scores without insights

        # ── Build response ───────────────────────────────────────────────────
        gpa = request.profile.get("gpa", 0)
        activity_count = len(request.activity)

        profile_summary = (
            f"GPA: {gpa} | "
            f"Activities: {activity_count} | "
            f"Journey: {scores['journeyScore']}/100 | "
            f"Admission: {scores['admissionScore']}/100 | "
            f"Loan: {scores['loanProbability']}%"
        )

        return JourneyResponse(
            journeyScore=scores["journeyScore"],
            admissionScore=scores["admissionScore"],
            loanProbability=scores["loanProbability"],
            breakdown=scores["breakdown"],
            admissionDetail=scores["admissionDetail"],
            loanDetail=scores["loanDetail"],
            insights=insights,
            profile_summary=profile_summary,
            insights_generated=insights_generated
        )

    except Exception as e:
        logging.error(f"Journey endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/journey/scores-only", response_model=JourneyResponse)
async def journey_scores_only(request: JourneyRequest):
    """
    Scores-only endpoint — skips LangChain reasoning.
    Useful for fast scoring without LLM latency.
    """
    request.include_insights = False
    return await journey(request)
