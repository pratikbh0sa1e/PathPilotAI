"""
Journey Brain — Deterministic Scoring Engine

Computes structured scores from raw profile + activity data.
These scores feed into the LangChain reasoning layer.

Score breakdown:
  journey_score     = profile_score + engagement_score + progress_score
  admission_score   = academic strength + extracurriculars + test scores
  loan_probability  = financial need + academic merit + program type
"""

from typing import Dict, List, Tuple


# ─── Constants ────────────────────────────────────────────────────────────────

MAX_JOURNEY_SCORE    = 100
MAX_ADMISSION_SCORE  = 100
MAX_LOAN_PROBABILITY = 100


# ─── Sub-score helpers ────────────────────────────────────────────────────────

def _profile_score(profile: Dict) -> Tuple[int, str]:
    """
    Academic + demographic strength (0–40 pts)
    Returns (score, explanation)
    """
    score = 0
    notes = []

    gpa = float(profile.get("gpa", 0))
    if gpa >= 9.0:
        score += 40; notes.append("Exceptional GPA (9+)")
    elif gpa >= 8.0:
        score += 32; notes.append("Strong GPA (8–9)")
    elif gpa >= 7.0:
        score += 22; notes.append("Good GPA (7–8)")
    elif gpa >= 6.0:
        score += 12; notes.append("Average GPA (6–7)")
    else:
        score += 5;  notes.append("Below-average GPA (<6)")

    if profile.get("test_score"):          # SAT/GRE/GMAT/IELTS etc.
        score += 5; notes.append("Test score provided")

    if profile.get("field_of_study"):
        score += 3; notes.append("Field of study defined")

    return min(score, 40), "; ".join(notes)


def _engagement_score(activities: List[str]) -> Tuple[int, str]:
    """
    Extracurricular + experience depth (0–35 pts)
    Returns (score, explanation)
    """
    count = len(activities)
    score = min(count * 5, 25)   # 5 pts per activity, cap at 25

    bonus_keywords = {
        "research": 5,
        "internship": 5,
        "volunteer": 3,
        "leadership": 4,
        "publication": 5,
        "award": 4,
        "sports": 2,
        "project": 3,
    }

    bonus = 0
    matched = []
    for activity in activities:
        for keyword, pts in bonus_keywords.items():
            if keyword in activity.lower() and bonus < 10:
                bonus += pts
                matched.append(keyword)
                break

    total = min(score + bonus, 35)
    note = f"{count} activities"
    if matched:
        note += f"; bonus for: {', '.join(set(matched))}"

    return total, note


def _progress_score(profile: Dict) -> Tuple[int, str]:
    """
    Application readiness + goal clarity (0–25 pts)
    Returns (score, explanation)
    """
    score = 0
    notes = []

    if profile.get("target_countries"):
        score += 5; notes.append("Target countries set")

    if profile.get("target_universities"):
        score += 5; notes.append("Target universities identified")

    if profile.get("goals"):
        score += 5; notes.append("Goals defined")

    if profile.get("budget_range"):
        score += 5; notes.append("Budget planned")

    if profile.get("visa_status"):
        score += 5; notes.append("Visa status known")

    return min(score, 25), "; ".join(notes) if notes else "No progress data"


def _admission_score(profile: Dict, activities: List[str]) -> Tuple[int, str]:
    """
    University admission likelihood (0–100)
    """
    gpa = float(profile.get("gpa", 0))
    base = 0

    if gpa >= 9.0:   base = 90
    elif gpa >= 8.5: base = 80
    elif gpa >= 8.0: base = 70
    elif gpa >= 7.5: base = 60
    elif gpa >= 7.0: base = 50
    elif gpa >= 6.0: base = 35
    else:            base = 20

    # Boost for strong extracurriculars
    activity_boost = min(len(activities) * 2, 10)

    # Boost for test scores
    test_boost = 5 if profile.get("test_score") else 0

    total = min(base + activity_boost + test_boost, 100)
    note = f"Base: {base}, Activity boost: +{activity_boost}, Test boost: +{test_boost}"

    return total, note


def _loan_probability(profile: Dict) -> Tuple[int, str]:
    """
    Scholarship / loan approval likelihood (0–100)
    """
    gpa = float(profile.get("gpa", 0))
    score = 0
    notes = []

    # Academic merit
    if gpa >= 8.5:   score += 40; notes.append("High merit (GPA 8.5+)")
    elif gpa >= 7.5: score += 30; notes.append("Good merit (GPA 7.5+)")
    elif gpa >= 6.5: score += 20; notes.append("Average merit")
    else:            score += 10; notes.append("Low merit")

    # Financial need indicator
    budget = profile.get("budget_range", "")
    if "low" in str(budget).lower() or "limited" in str(budget).lower():
        score += 25; notes.append("Financial need indicated")
    elif budget:
        score += 10; notes.append("Budget info provided")

    # Program type
    field = str(profile.get("field_of_study", "")).lower()
    funded_fields = ["stem", "engineering", "computer", "science", "medicine", "research"]
    if any(f in field for f in funded_fields):
        score += 20; notes.append("STEM/funded field")
    else:
        score += 10

    # Target country scholarships
    countries = profile.get("target_countries", [])
    scholarship_countries = ["germany", "norway", "finland", "sweden", "denmark"]
    if any(c.lower() in scholarship_countries for c in countries):
        score += 15; notes.append("Scholarship-friendly country")

    return min(score, 100), "; ".join(notes)


# ─── Public API ───────────────────────────────────────────────────────────────

def calculate_scores(profile: Dict, activities: List[str]) -> Dict:
    """
    Main scoring function — returns all scores + sub-breakdowns.
    This is the deterministic layer consumed by the LangChain reasoning layer.
    """
    p_score, p_note   = _profile_score(profile)
    e_score, e_note   = _engagement_score(activities)
    pr_score, pr_note = _progress_score(profile)

    journey_score    = p_score + e_score + pr_score          # max 100
    adm_score, adm_note = _admission_score(profile, activities)
    loan_prob, loan_note = _loan_probability(profile)

    return {
        # Top-level scores
        "journeyScore":    min(journey_score, MAX_JOURNEY_SCORE),
        "admissionScore":  adm_score,
        "loanProbability": loan_prob,

        # Sub-score breakdown (feeds LangChain reasoning)
        "breakdown": {
            "profileScore":    {"score": p_score,  "max": 40,  "note": p_note},
            "engagementScore": {"score": e_score,  "max": 35,  "note": e_note},
            "progressScore":   {"score": pr_score, "max": 25,  "note": pr_note},
        },

        # Admission + loan detail
        "admissionDetail": adm_note,
        "loanDetail":      loan_note,
    }
