"""
PathPilot AI Tools — LangChain Structured Tool Definitions

Each tool uses a Pydantic schema so the LLM can pass structured
arguments directly (no JSON string wrapping needed).

Tools:
  - roi_tool              → ROI calculator for a study program
  - loan_tool             → Loan eligibility + repayment estimate
  - university_search_tool → University recommendations by profile
  - journey_score_tool    → Full journey scoring
  - scholarship_tool      → Scholarship finder by country/field
"""

import json
from typing import Optional, List
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from services.journey_service import calculate_scores


# ─── Input schemas ────────────────────────────────────────────────────────────

class ROIInput(BaseModel):
    field_of_study: str = Field(description="Academic field, e.g. 'Computer Science'")
    country: str = Field(description="Target country, e.g. 'Germany'")
    tuition_usd: float = Field(default=25000, description="Total tuition cost in USD")
    duration_years: float = Field(default=2, description="Program duration in years")

class LoanInput(BaseModel):
    gpa: float = Field(description="Student GPA (0-10 scale)")
    tuition_usd: float = Field(default=30000, description="Total tuition cost in USD")
    duration_years: float = Field(default=2, description="Program duration in years")
    field_of_study: Optional[str] = Field(default="", description="Academic field")

class UniversitySearchInput(BaseModel):
    gpa: float = Field(description="Student GPA (0-10 scale)")
    field_of_study: str = Field(description="Academic field of interest")
    country: Optional[str] = Field(default="", description="Preferred country")
    budget_range: Optional[str] = Field(default="medium", description="Budget: low/medium/high")

class JourneyScoreInput(BaseModel):
    gpa: float = Field(description="Student GPA (0-10 scale)")
    activities: Optional[List[str]] = Field(default=[], description="List of activities/experiences")
    target_countries: Optional[List[str]] = Field(default=[], description="Target countries")
    goals: Optional[str] = Field(default="", description="Academic/career goals")
    field_of_study: Optional[str] = Field(default="", description="Academic field")

class ScholarshipInput(BaseModel):
    country: str = Field(description="Target country for study")
    field_of_study: str = Field(description="Academic field")
    gpa: Optional[float] = Field(default=7.0, description="Student GPA")


# ─── Tool functions ───────────────────────────────────────────────────────────

def _roi_fn(field_of_study: str, country: str,
            tuition_usd: float = 25000, duration_years: float = 2) -> str:
    """Calculate ROI for studying abroad"""
    field   = field_of_study.lower()
    country = country.lower()

    salary_map = {
        "computer science": 95000, "software engineering": 92000,
        "data science": 90000,     "ai": 100000,
        "machine learning": 98000, "engineering": 85000,
        "medicine": 110000,        "business": 75000,
        "mba": 85000,              "finance": 80000,
    }
    base_salary = next((v for k, v in salary_map.items() if k in field), 60000)

    country_mult = {
        "usa": 1.0, "united states": 1.0, "canada": 0.88,
        "uk": 0.85, "united kingdom": 0.85, "germany": 0.82,
        "australia": 0.87, "netherlands": 0.80, "sweden": 0.78,
        "singapore": 0.90,
    }
    mult = next((v for k, v in country_mult.items() if k in country), 0.75)
    expected_salary = round(base_salary * mult)

    total_cost   = round(tuition_usd * duration_years)
    payback      = round(total_cost / expected_salary, 1)
    roi_5yr      = round(((expected_salary * 5 - total_cost) / max(total_cost, 1)) * 100)
    roi_10yr     = round(((expected_salary * 10 - total_cost) / max(total_cost, 1)) * 100)

    high_demand = ["computer", "ai", "data", "engineering", "medicine", "software"]
    demand = "High" if any(h in field for h in high_demand) else "Medium"

    return json.dumps({
        "field": field_of_study, "country": country.title(),
        "total_cost_usd": total_cost,
        "expected_annual_salary_usd": expected_salary,
        "payback_period_years": payback,
        "roi_5_year_pct": roi_5yr,
        "roi_10_year_pct": roi_10yr,
        "job_demand": demand,
        "verdict": (
            "Excellent investment" if roi_5yr > 200 else
            "Good investment"      if roi_5yr > 100 else
            "Moderate investment"  if roi_5yr > 50  else
            "Consider alternatives"
        )
    }, indent=2)


def _loan_fn(gpa: float, tuition_usd: float = 30000,
             duration_years: float = 2, field_of_study: str = "") -> str:
    """Calculate loan eligibility and repayment"""
    field = field_of_study.lower()

    if gpa >= 8.5:   eligibility = 90
    elif gpa >= 7.5: eligibility = 75
    elif gpa >= 6.5: eligibility = 60
    else:            eligibility = 45

    stem = ["computer", "engineering", "science", "medicine", "data", "ai"]
    if any(s in field for s in stem):
        eligibility = min(eligibility + 10, 100)

    total_cost   = tuition_usd * duration_years
    max_loan     = round(total_cost * 0.85)
    rate         = 0.055
    n            = 10 * 12
    monthly_rate = rate / 12
    emi          = round(max_loan * (monthly_rate * (1 + monthly_rate) ** n)
                         / ((1 + monthly_rate) ** n - 1))

    return json.dumps({
        "eligibility_score": eligibility,
        "eligibility_rating": (
            "Excellent" if eligibility >= 85 else
            "Good"      if eligibility >= 70 else
            "Fair"      if eligibility >= 55 else
            "Poor — consider scholarships"
        ),
        "max_loan_usd": max_loan,
        "interest_rate_pct": 5.5,
        "repayment_years": 10,
        "monthly_emi_usd": emi,
        "total_repayment_usd": emi * 120,
        "tips": [
            "Apply for scholarships first to reduce loan amount",
            "Germany and Norway offer near-free tuition",
            "STEM fields have higher loan approval rates",
        ]
    }, indent=2)


def _university_search_fn(gpa: float, field_of_study: str,
                           country: str = "", budget_range: str = "medium") -> str:
    """Find university recommendations"""
    field  = field_of_study.lower()
    budget = budget_range.lower()

    uni_db = {
        "computer science": {
            "reach":  ["MIT", "Stanford", "Carnegie Mellon", "ETH Zurich", "Oxford"],
            "match":  ["TU Munich", "University of Toronto", "NUS Singapore",
                       "University of Edinburgh", "TU Berlin"],
            "safety": ["University of Groningen", "Vrije Universiteit Amsterdam",
                       "University of Tartu", "Tallinn University of Technology"],
        },
        "data science": {
            "reach":  ["MIT", "Stanford", "Columbia", "UCL", "ETH Zurich"],
            "match":  ["University of Amsterdam", "TU Munich", "McGill",
                       "University of Melbourne", "KTH Stockholm"],
            "safety": ["University of Tartu", "Aalto University",
                       "University of Groningen", "Poznan University"],
        },
        "engineering": {
            "reach":  ["MIT", "ETH Zurich", "Imperial College London", "TU Delft", "Caltech"],
            "match":  ["TU Munich", "KTH Stockholm", "University of Toronto",
                       "RWTH Aachen", "University of Melbourne"],
            "safety": ["University of Twente", "Aalto University",
                       "Politecnico di Milano", "University of Tartu"],
        },
        "business": {
            "reach":  ["Harvard Business School", "INSEAD", "London Business School",
                       "Wharton", "MIT Sloan"],
            "match":  ["IE Business School", "HEC Paris", "University of Toronto Rotman",
                       "Melbourne Business School", "NUS Business School"],
            "safety": ["Maastricht University", "University of Groningen",
                       "Aalto Business School", "Copenhagen Business School"],
        },
    }

    matched = next((k for k in uni_db if any(w in field for w in k.split())), "computer science")
    unis = uni_db[matched]

    if gpa >= 8.5:
        tiers = {"reach": unis["reach"][:3], "match": unis["match"][:3], "safety": unis["safety"][:2]}
    elif gpa >= 7.5:
        tiers = {"reach": unis["match"][:2], "match": unis["match"][2:4], "safety": unis["safety"][:3]}
    else:
        tiers = {"reach": unis["match"][:2], "match": unis["safety"][:2], "safety": unis["safety"][2:]}

    budget_note = ""
    if "low" in budget or "limited" in budget:
        budget_note = "Consider Germany, Norway, or Finland — near-zero tuition for international students"

    return json.dumps({
        "field": field_of_study, "gpa": gpa,
        "recommendations": tiers,
        "application_tips": [
            "Apply to 2-3 reach, 3-4 match, and 2 safety schools",
            "Most European deadlines: Jan-Mar; North America: Dec-Feb",
            "Required: SOP, LORs, transcripts, IELTS/TOEFL",
        ],
        "budget_note": budget_note or "Research scholarship options at each university",
    }, indent=2)


def _journey_score_fn(gpa: float, activities: List[str] = [],
                      target_countries: List[str] = [],
                      goals: str = "", field_of_study: str = "") -> str:
    """Calculate study abroad readiness score"""
    profile = {
        "gpa": gpa,
        "field_of_study": field_of_study,
        "target_countries": target_countries,
        "goals": goals,
    }
    scores = calculate_scores(profile, activities)

    return json.dumps({
        "journey_score":    f"{scores['journeyScore']}/100",
        "admission_score":  f"{scores['admissionScore']}/100",
        "loan_probability": f"{scores['loanProbability']}%",
        "breakdown": {
            k: f"{v['score']}/{v['max']} — {v['note']}"
            for k, v in scores["breakdown"].items()
        },
        "rating": (
            "Excellent — Strong candidate" if scores["journeyScore"] >= 80 else
            "Good — Competitive candidate" if scores["journeyScore"] >= 65 else
            "Fair — Needs improvement"     if scores["journeyScore"] >= 50 else
            "Weak — Significant gaps to address"
        )
    }, indent=2)


def _scholarship_fn(country: str, field_of_study: str, gpa: float = 7.0) -> str:
    """Find scholarships and funding opportunities"""
    country_key = country.lower()
    field = field_of_study.lower()

    scholarships = {
        "germany": [
            {"name": "DAAD Scholarship", "amount": "€850/month + tuition",
             "eligibility": "GPA 7+, any field", "deadline": "October/November"},
            {"name": "Deutschlandstipendium", "amount": "€300/month",
             "eligibility": "Top academic performance", "deadline": "Varies by university"},
            {"name": "Heinrich Böll Foundation", "amount": "€850/month",
             "eligibility": "Social/political engagement", "deadline": "March/September"},
        ],
        "uk": [
            {"name": "Chevening Scholarship", "amount": "Full funding",
             "eligibility": "2yr work experience, leadership", "deadline": "November"},
            {"name": "Commonwealth Scholarship", "amount": "Full funding",
             "eligibility": "Commonwealth citizens", "deadline": "December"},
        ],
        "canada": [
            {"name": "Vanier Canada Graduate", "amount": "CAD $50,000/year",
             "eligibility": "PhD students, GPA 8+", "deadline": "November"},
            {"name": "Ontario Graduate Scholarship", "amount": "CAD $15,000",
             "eligibility": "Ontario universities", "deadline": "Varies"},
        ],
        "usa": [
            {"name": "Fulbright Foreign Student", "amount": "Full funding",
             "eligibility": "Academic excellence", "deadline": "Varies by country"},
        ],
        "general": [
            {"name": "Aga Khan Foundation", "amount": "Partial/Full",
             "eligibility": "Developing country students", "deadline": "March"},
            {"name": "Joint Japan/World Bank", "amount": "Full funding",
             "eligibility": "Development-related fields", "deadline": "April"},
        ]
    }

    relevant = scholarships.get(country_key, []) + scholarships["general"]

    tips = []
    if gpa >= 8.5:
        tips.append("Your GPA qualifies you for merit-based scholarships")
    if any(s in field for s in ["stem", "computer", "engineering", "science"]):
        tips.append("STEM fields have more funding opportunities")
    if country_key in ["germany", "norway", "finland", "sweden"]:
        tips.append(f"{country} offers near-free or free tuition for international students")

    return json.dumps({
        "country": country,
        "scholarships_found": len(relevant),
        "scholarships": relevant[:5],
        "tips": tips or ["Apply early — most deadlines are 6-12 months before program start"],
        "free_tuition_countries": ["Germany", "Norway", "Finland", "Sweden", "Denmark"],
    }, indent=2)


# ─── Tool registry ────────────────────────────────────────────────────────────

roi_tool = StructuredTool.from_function(
    func=_roi_fn,
    name="roi_tool",
    description=(
        "Calculate the Return on Investment (ROI) for studying abroad. "
        "Use when the user asks if a country/program is 'worth it', "
        "about salary expectations, payback period, or financial returns."
    ),
    args_schema=ROIInput,
)

loan_tool = StructuredTool.from_function(
    func=_loan_fn,
    name="loan_tool",
    description=(
        "Calculate loan eligibility and repayment plan for study abroad. "
        "Use when the user asks about loans, financing, EMI, "
        "monthly payments, or how to fund their education."
    ),
    args_schema=LoanInput,
)

university_search_tool = StructuredTool.from_function(
    func=_university_search_fn,
    name="university_search_tool",
    description=(
        "Find and recommend universities based on student profile. "
        "Use when the user asks which universities to apply to, "
        "for university rankings, or for reach/match/safety suggestions."
    ),
    args_schema=UniversitySearchInput,
)

journey_score_tool = StructuredTool.from_function(
    func=_journey_score_fn,
    name="journey_score_tool",
    description=(
        "Calculate a student's overall study abroad readiness score. "
        "Use when the user wants to know their chances, readiness, "
        "or overall score for studying abroad."
    ),
    args_schema=JourneyScoreInput,
)

scholarship_tool = StructuredTool.from_function(
    func=_scholarship_fn,
    name="scholarship_tool",
    description=(
        "Find scholarships and funding opportunities for study abroad. "
        "Use when the user asks about scholarships, grants, funding, "
        "financial aid, or free education options."
    ),
    args_schema=ScholarshipInput,
)

ALL_TOOLS = [
    roi_tool,
    loan_tool,
    university_search_tool,
    journey_score_tool,
    scholarship_tool,
]
