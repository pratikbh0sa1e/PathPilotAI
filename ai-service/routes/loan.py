from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import logging

from services.loan_service import loan_service, calculate_loan

router = APIRouter()


class LoanRequest(BaseModel):
    gpa: float = Field(..., ge=0, le=10, description="Student GPA (0-10 scale)")
    tuition_usd: float = Field(..., gt=0, description="Annual tuition in USD")
    duration_years: float = Field(default=2.0, ge=0.5, le=10, description="Program duration in years")
    field_of_study: Optional[str] = Field(default="", description="Academic field")
    target_country: Optional[str] = Field(default="", description="Target country")
    annual_income_usd: Optional[float] = Field(None, description="Current annual income (optional)")


class LoanResponse(BaseModel):
    # Inputs
    gpa: float
    field_of_study: str
    target_country: str
    total_program_cost_usd: float
    duration_years: float

    # Eligibility
    eligibility_score: int
    eligibility_rating: str

    # Loan amounts
    max_loan_usd: int
    recommended_loan_usd: int
    interest_rate_pct: float
    repayment_years: int

    # Repayment
    monthly_emi_max_usd: int
    monthly_emi_recommended_usd: int
    total_repayment_usd: int
    total_interest_usd: int

    # Alternatives
    available_scholarships: List[str]
    is_low_tuition_country: bool
    scholarship_note: str

    # LangChain explanation
    explanation: str


@router.post("/ai/loan", response_model=LoanResponse)
async def loan(request: LoanRequest):
    """
    Loan Eligibility Calculator for study abroad.

    Returns:
    - Eligibility score and rating
    - Maximum and recommended loan amounts
    - Monthly EMI breakdown
    - Available scholarships
    - LangChain explanation: "Based on your GPA of X, you qualify for $Y loan..."
    """
    try:
        result = await loan_service.analyze(
            gpa=request.gpa,
            tuition_usd=request.tuition_usd,
            duration_years=request.duration_years,
            field_of_study=request.field_of_study or "",
            target_country=request.target_country or "",
            annual_income_usd=request.annual_income_usd,
        )
        return LoanResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logging.error(f"Loan endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Loan calculation failed")


@router.post("/ai/loan/quick")
async def loan_quick(request: LoanRequest):
    """
    Fast loan calculation — numbers only, no LLM explanation.
    """
    try:
        result = calculate_loan(
            gpa=request.gpa,
            tuition_usd=request.tuition_usd,
            duration_years=request.duration_years,
            field_of_study=request.field_of_study or "",
            target_country=request.target_country or "",
            annual_income_usd=request.annual_income_usd,
        )
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
