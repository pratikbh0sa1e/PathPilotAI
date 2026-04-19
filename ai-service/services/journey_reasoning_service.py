"""
Journey Reasoning Service — LangChain AI Layer

Takes deterministic scores from journey_service.py and uses
LangChain + Groq to generate human-readable insights,
recommendations, and next steps.

Pattern: Scores → Structured Prompt → LLM → Parsed Output
"""

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
import os
import json


# ─── Output schema ────────────────────────────────────────────────────────────

class JourneyInsights(BaseModel):
    """Structured output from the LangChain reasoning layer"""
    strengths: List[str] = Field(description="2–3 key strengths of the student profile")
    gaps: List[str] = Field(description="2–3 areas that need improvement")
    recommendations: List[str] = Field(description="3–5 specific, actionable recommendations")
    next_steps: List[str] = Field(description="Top 3 immediate next steps the student should take")
    university_suggestions: List[str] = Field(description="3 university tiers to target (reach/match/safety)")
    scholarship_tips: List[str] = Field(description="2–3 scholarship or funding tips relevant to this profile")
    overall_summary: str = Field(description="2–3 sentence overall assessment of the student's readiness")


# ─── Reasoning Service ────────────────────────────────────────────────────────

class JourneyReasoningService:

    REASONING_PROMPT = ChatPromptTemplate.from_messages([
        ("system", """You are PathPilot AI, an expert study abroad counselor and academic mentor.

You receive structured scoring data about a student's study abroad readiness and must generate 
actionable, personalized insights. Be specific, encouraging, and realistic.

Always respond with valid JSON matching this exact schema:
{{
  "strengths": ["...", "..."],
  "gaps": ["...", "..."],
  "recommendations": ["...", "...", "..."],
  "next_steps": ["...", "...", "..."],
  "university_suggestions": ["...", "...", "..."],
  "scholarship_tips": ["...", "..."],
  "overall_summary": "..."
}}

Rules:
- Be specific to the student's actual data (GPA, field, countries, activities)
- Recommendations must be actionable, not generic
- University suggestions should name real universities when possible
- next_steps should be things the student can do THIS WEEK
- Respond ONLY with the JSON object, no extra text"""),

        ("human", """Analyze this student's study abroad profile and generate insights:

=== SCORES ===
Journey Score:     {journey_score}/100
Admission Score:   {admission_score}/100
Loan Probability:  {loan_probability}/100

=== SCORE BREAKDOWN ===
Profile Score:    {profile_score}/40  ({profile_note})
Engagement Score: {engagement_score}/35  ({engagement_note})
Progress Score:   {progress_score}/25  ({progress_note})

=== STUDENT PROFILE ===
GPA:              {gpa}
Field of Study:   {field_of_study}
Target Countries: {target_countries}
Target Universities: {target_universities}
Budget Range:     {budget_range}
Goals:            {goals}
Test Scores:      {test_score}

=== ACTIVITIES ===
{activities}

=== ADMISSION DETAIL ===
{admission_detail}

=== LOAN/SCHOLARSHIP DETAIL ===
{loan_detail}

Generate personalized insights, recommendations, and next steps for this student.""")
    ])

    def __init__(self):
        self._llm = None

    @property
    def llm(self) -> ChatGroq:
        if self._llm is None:
            api_key = os.getenv('GROQ_API_KEY')
            if not api_key:
                raise ValueError("GROQ_API_KEY environment variable is not set")
            self._llm = ChatGroq(
                groq_api_key=api_key,
                model_name=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                temperature=0.4,
                max_tokens=1500
            )
        return self._llm

    def _build_prompt_vars(self, profile: Dict, activities: List[str], scores: Dict) -> Dict:
        """Flatten all data into prompt variables"""
        breakdown = scores.get("breakdown", {})

        return {
            # Scores
            "journey_score":    scores.get("journeyScore", 0),
            "admission_score":  scores.get("admissionScore", 0),
            "loan_probability": scores.get("loanProbability", 0),

            # Breakdown
            "profile_score":    breakdown.get("profileScore", {}).get("score", 0),
            "profile_note":     breakdown.get("profileScore", {}).get("note", "N/A"),
            "engagement_score": breakdown.get("engagementScore", {}).get("score", 0),
            "engagement_note":  breakdown.get("engagementScore", {}).get("note", "N/A"),
            "progress_score":   breakdown.get("progressScore", {}).get("score", 0),
            "progress_note":    breakdown.get("progressScore", {}).get("note", "N/A"),

            # Profile fields
            "gpa":                  profile.get("gpa", "Not provided"),
            "field_of_study":       profile.get("field_of_study", "Not specified"),
            "target_countries":     ", ".join(profile.get("target_countries", [])) or "Not specified",
            "target_universities":  ", ".join(profile.get("target_universities", [])) or "Not specified",
            "budget_range":         profile.get("budget_range", "Not specified"),
            "goals":                profile.get("goals", "Not specified"),
            "test_score":           profile.get("test_score", "Not provided"),

            # Activities
            "activities": "\n".join(f"  - {a}" for a in activities) if activities else "  None listed",

            # Detail notes
            "admission_detail": scores.get("admissionDetail", "N/A"),
            "loan_detail":      scores.get("loanDetail", "N/A"),
        }

    def _parse_response(self, raw: str) -> Dict:
        """Safely parse LLM JSON output"""
        try:
            # Strip markdown code fences if present
            text = raw.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
        except json.JSONDecodeError:
            # Fallback: return raw text wrapped in structure
            return {
                "strengths": [],
                "gaps": [],
                "recommendations": [],
                "next_steps": [],
                "university_suggestions": [],
                "scholarship_tips": [],
                "overall_summary": raw.strip()
            }

    async def generate_insights(
        self,
        profile: Dict,
        activities: List[str],
        scores: Dict
    ) -> Dict:
        """
        Generate AI insights from deterministic scores.
        
        Args:
            profile:    Student profile dict
            activities: List of activity strings
            scores:     Output from journey_service.calculate_scores()
            
        Returns:
            Parsed insights dict
        """
        prompt_vars = self._build_prompt_vars(profile, activities, scores)

        chain = self.REASONING_PROMPT | self.llm

        response = await chain.ainvoke(prompt_vars)
        insights = self._parse_response(response.content)

        return insights


# ─── Global instance ──────────────────────────────────────────────────────────

journey_reasoning = JourneyReasoningService()
