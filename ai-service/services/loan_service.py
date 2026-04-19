"""
Loan Service — Rule Engine + LangChain Explanation

Phase 1: Python rule engine computes eligibility + repayment
Phase 2: LangChain generates a personalized explanation
"""

import os
import logging
from typing import Dict, Optional, List

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)


# ─── Loan data ────────────────────────────────────────────────────────────────

# Scholarship-friendly countries (reduce loan need)
SCHOLARSHIP_COUNTRIES = ["germany", "norway", "finland", "sweden", "denmark", "austria"]

# STEM fields (higher approval + better rates)
STEM_FIELDS = ["computer", "engineering", "science", "medicine", "data", "ai",
               "machine learning", "pharmacy", "biotechnology", "mathematics"]

# Major scholarship programs by country
SCHOLARSHIP_DB = {
    "germany":  ["DAAD (€850/month)", "Deutschlandstipendium (€300/month)"],
    "norway":   ["Norwegian Government Scholarship", "Quota Scheme"],
    "finland":  ["CIMO Fellowship", "University-specific grants"],
    "sweden":   ["SISGP Scholarship", "Swedish Institute Scholarship"],
    "uk":       ["Chevening (full funding)", "Commonwealth Scholarship"],
    "canada":   ["Vanier CGS (CAD $50k/yr)", "Ontario Graduate Scholarship"],
    "usa":      ["Fulbright (full funding)", "Hubert Humphrey Fellowship"],
    "australia":["Australia Awards", "Endeavour Scholarships"],
}


# ─── Deterministic calculator ─────────────────────────────────────────────────

def calculate_loan(
    gpa: float,
    tuition_usd: float,
    duration_years: float = 2,
    field_of_study: str = "",
    target_country: str = "",
    annual_income_usd: Optional[float] = None,
) -> Dict:
    """
    Compute loan eligibility and repayment plan.
    Returns structured numbers — no LLM involved here.
    """
    field   = field_of_study.lower()
    country = target_country.lower()

    # ── Eligibility score (0-100) ──────────────────────────────────────────
    eligibility = 0

    # GPA component (0-40 pts)
    if gpa >= 9.0:   eligibility += 40
    elif gpa >= 8.5: eligibility += 35
    elif gpa >= 8.0: eligibility += 30
    elif gpa >= 7.5: eligibility += 25
    elif gpa >= 7.0: eligibility += 18
    elif gpa >= 6.0: eligibility += 10
    else:            eligibility += 5

    # STEM bonus (0-15 pts)
    if any(s in field for s in STEM_FIELDS):
        eligibility += 15

    # Income-to-debt ratio (0-20 pts)
    total_cost = tuition_usd * duration_years
    if annual_income_usd:
        ratio = total_cost / max(annual_income_usd, 1)
        if ratio < 1:    eligibility += 20
        elif ratio < 2:  eligibility += 15
        elif ratio < 3:  eligibility += 10
        else:            eligibility += 5
    else:
        eligibility += 10  # neutral if no income data

    # Country bonus (0-15 pts) — scholarship-friendly countries reduce risk
    if any(c in country for c in SCHOLARSHIP_COUNTRIES):
        eligibility += 15

    eligibility = min(eligibility, 100)

    # ── Loan amounts ───────────────────────────────────────────────────────
    total_cost    = round(tuition_usd * duration_years)
    max_loan      = round(total_cost * 0.85)   # 85% coverage
    recommended   = round(total_cost * 0.60)   # 60% — leave room for scholarships

    # ── Repayment calculation (standard amortization) ──────────────────────
    interest_rate = 0.055   # 5.5% avg education loan
    repay_years   = 10
    n             = repay_years * 12
    monthly_rate  = interest_rate / 12

    def emi(principal):
        if principal <= 0:
            return 0
        return round(principal * (monthly_rate * (1 + monthly_rate) ** n)
                     / ((1 + monthly_rate) ** n - 1))

    max_emi       = emi(max_loan)
    recommended_emi = emi(recommended)
    total_repay   = max_emi * n
    total_interest = total_repay - max_loan

    # ── Eligibility rating ─────────────────────────────────────────────────
    if eligibility >= 85:   rating = "Excellent"
    elif eligibility >= 70: rating = "Good"
    elif eligibility >= 55: rating = "Fair"
    elif eligibility >= 40: rating = "Poor"
    else:                   rating = "Very Poor — consider scholarships first"

    # ── Scholarships available ─────────────────────────────────────────────
    scholarships = SCHOLARSHIP_DB.get(country, [])
    is_free_country = any(c in country for c in ["germany", "norway", "finland"])

    return {
        # Inputs
        "gpa":                      gpa,
        "field_of_study":           field_of_study,
        "target_country":           target_country,
        "total_program_cost_usd":   total_cost,
        "duration_years":           duration_years,

        # Eligibility
        "eligibility_score":        eligibility,
        "eligibility_rating":       rating,

        # Loan amounts
        "max_loan_usd":             max_loan,
        "recommended_loan_usd":     recommended,
        "interest_rate_pct":        5.5,
        "repayment_years":          repay_years,

        # Repayment
        "monthly_emi_max_usd":      max_emi,
        "monthly_emi_recommended_usd": recommended_emi,
        "total_repayment_usd":      total_repay,
        "total_interest_usd":       total_interest,

        # Alternatives
        "available_scholarships":   scholarships,
        "is_low_tuition_country":   is_free_country,
        "scholarship_note": (
            f"{target_country} has near-zero tuition — loan may not be needed"
            if is_free_country else
            f"Apply for scholarships to reduce loan to ~${recommended:,}"
        ),
    }


# ─── LangChain explanation layer ──────────────────────────────────────────────

EXPLANATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are PathPilot AI, a friendly study abroad financial advisor.

You receive loan eligibility data and must explain it in clear, encouraging, human language.
Be specific with numbers. Use the student's actual GPA and amounts.
Keep it to 3-4 sentences. End with a clear recommendation."""),

    ("human", """Explain this loan analysis to the student:

GPA: {gpa}
Field: {field_of_study}
Country: {target_country}
Total Program Cost: ${total_program_cost_usd:,}
Eligibility Score: {eligibility_score}/100 ({eligibility_rating})
Maximum Loan: ${max_loan_usd:,}
Recommended Loan: ${recommended_loan_usd:,}
Monthly EMI (max loan): ${monthly_emi_max_usd:,}
Monthly EMI (recommended): ${monthly_emi_recommended_usd:,}
Total Repayment: ${total_repayment_usd:,}
Interest Rate: {interest_rate_pct}%
Available Scholarships: {available_scholarships}
Note: {scholarship_note}

Write a 3-4 sentence explanation that:
1. States eligibility clearly (e.g. "Based on your GPA of X, you qualify for a $Y loan")
2. Explains the monthly EMI in plain terms
3. Mentions scholarship alternatives
4. Gives a clear recommendation on how to minimize debt""")
])


class LoanService:
    def __init__(self):
        self._llm = None

    @property
    def llm(self) -> ChatGroq:
        if self._llm is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY is not set")
            self._llm = ChatGroq(
                groq_api_key=api_key,
                model_name=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                temperature=0.4,
                max_tokens=300
            )
        return self._llm

    async def analyze(
        self,
        gpa: float,
        tuition_usd: float,
        duration_years: float = 2,
        field_of_study: str = "",
        target_country: str = "",
        annual_income_usd: Optional[float] = None,
    ) -> Dict:
        """
        Full loan analysis: numbers + LangChain explanation.
        """
        # Phase 1: deterministic numbers
        metrics = calculate_loan(
            gpa=gpa,
            tuition_usd=tuition_usd,
            duration_years=duration_years,
            field_of_study=field_of_study,
            target_country=target_country,
            annual_income_usd=annual_income_usd,
        )

        # Phase 2: LangChain explanation
        explanation = ""
        try:
            chain = EXPLANATION_PROMPT | self.llm
            prompt_data = {**metrics}
            # Convert list to string for prompt
            prompt_data["available_scholarships"] = (
                ", ".join(metrics["available_scholarships"])
                if metrics["available_scholarships"] else "None listed"
            )
            response = await chain.ainvoke(prompt_data)
            explanation = response.content.strip()
        except Exception as e:
            logger.warning(f"LLM explanation failed, using fallback: {e}")
            explanation = (
                f"Based on your GPA of {gpa}, you qualify for a loan up to "
                f"${metrics['max_loan_usd']:,} ({metrics['eligibility_rating']} eligibility). "
                f"Your monthly EMI would be ${metrics['monthly_emi_recommended_usd']:,} "
                f"for the recommended ${metrics['recommended_loan_usd']:,} loan. "
                f"{metrics['scholarship_note']}"
            )

        return {**metrics, "explanation": explanation}


loan_service = LoanService()
