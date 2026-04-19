from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import logging

from services.roi_service import roi_service, calculate_roi

router = APIRouter()


class ROIRequest(BaseModel):
    field_of_study: str = Field(..., description="Academic field, e.g. 'Computer Science'")
    country: str = Field(..., description="Target country, e.g. 'Germany'")
    tuition_usd: Optional[float] = Field(None, description="Annual tuition in USD (uses country average if omitted)")
    duration_years: float = Field(default=2.0, ge=0.5, le=10, description="Program duration in years")
    include_living_costs: bool = Field(default=True, description="Include living cost estimates")


class ROIResponse(BaseModel):
    # Inputs
    field_of_study: str
    country: str
    duration_years: float

    # Costs
    annual_tuition_usd: float
    annual_living_cost_usd: float
    total_tuition_usd: float
    total_living_cost_usd: float
    total_investment_usd: float

    # Returns
    expected_annual_salary_usd: float

    # ROI
    payback_period_years: float
    roi_3_year_pct: float
    roi_5_year_pct: float
    roi_10_year_pct: float

    # Qualitative
    job_demand: str
    verdict: str

    # LangChain explanation
    explanation: str


@router.post("/ai/roi", response_model=ROIResponse)
async def roi(request: ROIRequest):
    """
    ROI Calculator for study abroad programs.

    Returns:
    - Total investment (tuition + living costs)
    - Expected salary after graduation
    - Payback period
    - 3/5/10-year ROI percentages
    - LangChain explanation: "You will recover your investment in X years..."
    """
    try:
        result = await roi_service.analyze(
            field_of_study=request.field_of_study,
            country=request.country,
            tuition_usd=request.tuition_usd,
            duration_years=request.duration_years,
            include_living_costs=request.include_living_costs,
        )
        return ROIResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"ROI endpoint error: {e}")
        raise HTTPException(status_code=500, detail="ROI calculation failed")


@router.post("/ai/roi/quick")
async def roi_quick(request: ROIRequest):
    """
    Fast ROI — numbers only, no LLM explanation.
    """
    try:
        result = calculate_roi(
            field_of_study=request.field_of_study,
            country=request.country,
            tuition_usd=request.tuition_usd,
            duration_years=request.duration_years,
            include_living_costs=request.include_living_costs,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
