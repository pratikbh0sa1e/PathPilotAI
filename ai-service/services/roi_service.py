"""
ROI Service — Deterministic Calculator + LangChain Explanation

Phase 1: Python rule engine computes hard numbers
Phase 2: LangChain converts numbers into human narrative
"""

import os
import json
import logging
from typing import Dict, Optional

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)


# ─── Static data maps ─────────────────────────────────────────────────────────

# Average annual salary (USD) by field
SALARY_MAP = {
    "computer science":     95000,
    "software engineering": 92000,
    "data science":         90000,
    "artificial intelligence": 100000,
    "ai":                   100000,
    "machine learning":     98000,
    "electrical engineering": 85000,
    "mechanical engineering": 80000,
    "engineering":          82000,
    "medicine":             110000,
    "pharmacy":             90000,
    "business":             75000,
    "mba":                  88000,
    "finance":              82000,
    "economics":            72000,
    "law":                  78000,
    "architecture":         65000,
    "design":               58000,
    "arts":                 45000,
    "humanities":           48000,
    "education":            52000,
    "psychology":           60000,
}

# Country salary multiplier (relative to USA = 1.0)
COUNTRY_MULTIPLIER = {
    "usa":            1.00, "united states":  1.00,
    "canada":         0.88, "australia":      0.87,
    "uk":             0.85, "united kingdom": 0.85,
    "germany":        0.82, "netherlands":    0.80,
    "sweden":         0.78, "norway":         0.80,
    "denmark":        0.79, "finland":        0.76,
    "singapore":      0.90, "uae":            0.85,
    "new zealand":    0.80, "ireland":        0.83,
    "switzerland":    0.95, "france":         0.75,
    "japan":          0.72, "south korea":    0.70,
}

# Average annual tuition (USD) by country if not provided
DEFAULT_TUITION = {
    "usa":            35000, "united states":  35000,
    "canada":         20000, "australia":      25000,
    "uk":             22000, "united kingdom": 22000,
    "germany":        500,   "netherlands":    12000,
    "sweden":         12000, "norway":         0,
    "denmark":        10000, "finland":        0,
    "singapore":      18000, "france":         3000,
    "ireland":        15000, "new zealand":    20000,
}

# Living cost per year (USD) by country
LIVING_COST = {
    "usa":            18000, "united states":  18000,
    "canada":         14000, "australia":      16000,
    "uk":             15000, "united kingdom": 15000,
    "germany":        10000, "netherlands":    12000,
    "sweden":         13000, "norway":         15000,
    "denmark":        14000, "finland":        11000,
    "singapore":      16000, "france":         12000,
    "ireland":        14000, "new zealand":    14000,
}


# ─── Deterministic calculator ─────────────────────────────────────────────────

def calculate_roi(
    field_of_study: str,
    country: str,
    tuition_usd: Optional[float] = None,
    duration_years: float = 2,
    include_living_costs: bool = True,
) -> Dict:
    """
    Compute ROI metrics for a study abroad program.
    Returns structured numbers — no LLM involved here.
    """
    field   = field_of_study.lower().strip()
    country_key = country.lower().strip()

    # Base salary
    base_salary = next(
        (v for k, v in SALARY_MAP.items() if k in field or field in k),
        62000  # default
    )

    # Country multiplier
    mult = next(
        (v for k, v in COUNTRY_MULTIPLIER.items() if k in country_key or country_key in k),
        0.75
    )
    expected_salary = round(base_salary * mult)

    # Costs
    annual_tuition = tuition_usd if tuition_usd else next(
        (v for k, v in DEFAULT_TUITION.items() if k in country_key or country_key in k),
        20000
    )
    annual_living = next(
        (v for k, v in LIVING_COST.items() if k in country_key or country_key in k),
        12000
    ) if include_living_costs else 0

    total_tuition     = round(annual_tuition * duration_years)
    total_living      = round(annual_living * duration_years)
    total_investment  = total_tuition + total_living

    # ROI metrics
    payback_years = round(total_investment / max(expected_salary, 1), 1)
    roi_3yr  = round(((expected_salary * 3  - total_investment) / max(total_investment, 1)) * 100)
    roi_5yr  = round(((expected_salary * 5  - total_investment) / max(total_investment, 1)) * 100)
    roi_10yr = round(((expected_salary * 10 - total_investment) / max(total_investment, 1)) * 100)

    # Demand rating
    high_demand_fields = ["computer", "ai", "data", "engineering", "medicine", "software", "machine"]
    demand = "High" if any(h in field for h in high_demand_fields) else "Medium"

    # Verdict
    if roi_5yr > 300:   verdict = "Excellent"
    elif roi_5yr > 150: verdict = "Good"
    elif roi_5yr > 50:  verdict = "Moderate"
    else:               verdict = "Low"

    return {
        # Inputs
        "field_of_study":          field_of_study,
        "country":                 country,
        "duration_years":          duration_years,

        # Costs
        "annual_tuition_usd":      round(annual_tuition),
        "annual_living_cost_usd":  annual_living,
        "total_tuition_usd":       total_tuition,
        "total_living_cost_usd":   total_living,
        "total_investment_usd":    total_investment,

        # Returns
        "expected_annual_salary_usd": expected_salary,
        "salary_currency_note":    "USD equivalent",

        # ROI
        "payback_period_years":    payback_years,
        "roi_3_year_pct":          roi_3yr,
        "roi_5_year_pct":          roi_5yr,
        "roi_10_year_pct":         roi_10yr,

        # Qualitative
        "job_demand":              demand,
        "verdict":                 verdict,
    }


# ─── LangChain explanation layer ──────────────────────────────────────────────

EXPLANATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are PathPilot AI, a friendly study abroad financial advisor.

You receive ROI calculation data and must explain it in clear, encouraging, human language.
Be specific with numbers. Use the student's actual data.
Keep it to 3-4 sentences. End with a clear recommendation."""),

    ("human", """Explain this ROI analysis to the student:

Field: {field_of_study}
Country: {country}
Duration: {duration_years} years
Total Investment: ${total_investment_usd:,}
  - Tuition: ${total_tuition_usd:,}
  - Living costs: ${total_living_cost_usd:,}
Expected Annual Salary: ${expected_annual_salary_usd:,}
Payback Period: {payback_period_years} years
ROI after 5 years: {roi_5_year_pct}%
ROI after 10 years: {roi_10_year_pct}%
Job Demand: {job_demand}
Verdict: {verdict}

Write a 3-4 sentence explanation that:
1. States the payback period clearly (e.g. "You will recover your investment in X years")
2. Explains the 5-year ROI in plain terms
3. Mentions job demand
4. Gives a clear recommendation""")
])


class ROIService:
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
        field_of_study: str,
        country: str,
        tuition_usd: Optional[float] = None,
        duration_years: float = 2,
        include_living_costs: bool = True,
    ) -> Dict:
        """
        Full ROI analysis: numbers + LangChain explanation.
        """
        # Phase 1: deterministic numbers
        metrics = calculate_roi(
            field_of_study=field_of_study,
            country=country,
            tuition_usd=tuition_usd,
            duration_years=duration_years,
            include_living_costs=include_living_costs,
        )

        # Phase 2: LangChain explanation
        explanation = ""
        try:
            chain = EXPLANATION_PROMPT | self.llm
            response = await chain.ainvoke(metrics)
            explanation = response.content.strip()
        except Exception as e:
            logger.warning(f"LLM explanation failed, using fallback: {e}")
            explanation = (
                f"You will recover your ${metrics['total_investment_usd']:,} investment "
                f"in approximately {metrics['payback_period_years']} years. "
                f"After 5 years, your ROI will be {metrics['roi_5_year_pct']}%. "
                f"Job demand in {field_of_study} is {metrics['job_demand'].lower()}. "
                f"Overall verdict: {metrics['verdict']} investment."
            )

        return {**metrics, "explanation": explanation}


roi_service = ROIService()
