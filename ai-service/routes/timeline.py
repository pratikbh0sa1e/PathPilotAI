from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict
import logging
from datetime import datetime

from services.timeline_service import timeline_service
from services.document_service import document_service

router = APIRouter()


class TimelineRequest(BaseModel):
    profile: Dict = Field(..., description="Student profile")
    journey_score: Optional[int] = Field(default=50, ge=0, le=100)


class DocumentRequest(BaseModel):
    profile: Dict = Field(..., description="Student profile")


class SOPRequest(BaseModel):
    profile: Dict = Field(..., description="Student profile with name, gpa, field, goals, activities")


@router.post("/ai/timeline")
async def generate_timeline(request: TimelineRequest):
    """Generate a week-by-week application timeline using AI"""
    try:
        current_month = datetime.now().strftime("%B %Y")
        result = await timeline_service.generate(
            profile=request.profile,
            journey_score=request.journey_score,
            current_month=current_month
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Timeline error: {e}")
        raise HTTPException(status_code=500, detail="Timeline generation failed")


@router.post("/ai/documents/checklist")
async def generate_checklist(request: DocumentRequest):
    """Generate AI-powered document checklist based on target country/university"""
    try:
        result = await document_service.generate_checklist(request.profile)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Checklist error: {e}")
        raise HTTPException(status_code=500, detail="Checklist generation failed")


@router.post("/ai/documents/sop")
async def generate_sop(request: SOPRequest):
    """Generate a Statement of Purpose draft using AI"""
    try:
        result = await document_service.generate_sop(request.profile)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"SOP error: {e}")
        raise HTTPException(status_code=500, detail="SOP generation failed")
