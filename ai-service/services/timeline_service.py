"""
Application Timeline Generator Service

Generates a personalized week-by-week action plan using:
1. Static deadline data for popular universities/countries
2. LangChain + Groq to generate the full timeline narrative
"""

import os
import json
import logging
from typing import Dict, List, Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

# Static deadline map — months before program start
COUNTRY_DEADLINES = {
    "germany":     {"app_deadline_months": 6,  "language_test_months": 8,  "visa_months": 3,  "tuition": "Free/Low"},
    "canada":      {"app_deadline_months": 8,  "language_test_months": 10, "visa_months": 4,  "tuition": "$15k-25k/yr"},
    "uk":          {"app_deadline_months": 9,  "language_test_months": 10, "visa_months": 3,  "tuition": "$18k-30k/yr"},
    "usa":         {"app_deadline_months": 10, "language_test_months": 12, "visa_months": 4,  "tuition": "$25k-50k/yr"},
    "australia":   {"app_deadline_months": 7,  "language_test_months": 9,  "visa_months": 3,  "tuition": "$20k-35k/yr"},
    "netherlands": {"app_deadline_months": 7,  "language_test_months": 9,  "visa_months": 3,  "tuition": "$10k-18k/yr"},
    "sweden":      {"app_deadline_months": 8,  "language_test_months": 10, "visa_months": 3,  "tuition": "$10k-15k/yr"},
    "norway":      {"app_deadline_months": 6,  "language_test_months": 8,  "visa_months": 3,  "tuition": "Free"},
    "finland":     {"app_deadline_months": 7,  "language_test_months": 9,  "visa_months": 3,  "tuition": "Free/Low"},
}

TIMELINE_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are PathPilot AI, an expert study abroad application coach.

Generate a detailed week-by-week application timeline for a student.
The timeline should be practical, specific, and motivating.

Respond with valid JSON only:
{{
  "program_start": "September 2026",
  "total_weeks": 52,
  "phases": [
    {{
      "phase": "Phase name",
      "duration": "Month range",
      "weeks": "1-8",
      "tasks": ["specific task 1", "specific task 2"],
      "milestone": "Key milestone for this phase",
      "priority": "high|medium|low"
    }}
  ],
  "critical_deadlines": [
    {{"item": "deadline name", "date": "Month Year", "weeks_from_now": 12}}
  ],
  "quick_wins": ["thing to do this week 1", "thing to do this week 2", "thing to do this week 3"],
  "motivational_note": "One encouraging sentence for this student"
}}"""),

    ("human", """Generate a study abroad application timeline for:

Student Profile:
- GPA: {gpa}
- Field: {field_of_study}
- Target Countries: {target_countries}
- Target Universities: {target_universities}
- Goals: {goals}
- Journey Score: {journey_score}/100
- Current Month: {current_month}

Country Deadline Info:
{deadline_info}

Create a realistic 12-month timeline with 5-6 phases covering:
1. Profile building & test prep
2. Research & shortlisting
3. Document preparation (SOP, LORs, transcripts)
4. Application submission
5. Visa & pre-departure
6. Arrival & settling in

Be specific to their field and target countries.""")
])


class TimelineService:
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
                max_tokens=2000
            )
        return self._llm

    def _get_deadline_info(self, countries: List[str]) -> str:
        lines = []
        for c in countries:
            key = c.lower()
            info = COUNTRY_DEADLINES.get(key, {"app_deadline_months": 8, "language_test_months": 10, "visa_months": 3, "tuition": "Varies"})
            lines.append(f"- {c}: Apply {info['app_deadline_months']} months before start, language test {info['language_test_months']} months before, visa {info['visa_months']} months before. Tuition: {info['tuition']}")
        return "\n".join(lines) if lines else "- General: Apply 8-10 months before program start"

    def _parse_response(self, raw: str) -> Dict:
        try:
            text = raw.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
        except json.JSONDecodeError:
            return {"error": "Could not parse timeline", "raw": raw[:500]}

    async def generate(
        self,
        profile: Dict,
        journey_score: int = 50,
        current_month: str = "April 2026"
    ) -> Dict:
        countries = profile.get("target_countries", ["Germany"])
        deadline_info = self._get_deadline_info(countries)

        chain = TIMELINE_PROMPT | self.llm
        response = await chain.ainvoke({
            "gpa": profile.get("gpa", "Not provided"),
            "field_of_study": profile.get("field_of_study", "Not specified"),
            "target_countries": ", ".join(countries),
            "target_universities": profile.get("target_universities", "Not specified"),
            "goals": profile.get("goals", "Not specified"),
            "journey_score": journey_score,
            "current_month": current_month,
            "deadline_info": deadline_info,
        })

        return self._parse_response(response.content)


timeline_service = TimelineService()
