"""
Document Checklist + SOP Generator Service

1. AI-generated document checklist based on country/university
2. SOP/Essay draft generator using student profile
"""

import os
import json
import logging
from typing import Dict, List, Optional
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)

# Static base requirements by country
BASE_DOCS = {
    "germany":     ["Academic transcripts (attested)", "Bachelor's degree certificate", "IELTS/TOEFL (min 6.5/80)", "German language proof (if applicable)", "CV/Resume", "Statement of Purpose (SOP)", "2 Letters of Recommendation (LORs)", "APS Certificate (for Indian students)", "Passport copy", "Blocked account proof (€11,208)"],
    "canada":      ["Academic transcripts", "Degree certificate", "IELTS (min 6.5) or TOEFL (min 90)", "CV/Resume", "Statement of Purpose", "2-3 Letters of Recommendation", "Passport copy", "Proof of funds (CAD $10,000+)", "Study permit application"],
    "uk":          ["Academic transcripts", "Degree certificate", "IELTS (min 6.5) or equivalent", "CV/Resume", "Personal Statement", "2 Academic References", "Passport copy", "CAS number (from university)", "Proof of funds (£1,334/month)"],
    "usa":         ["Academic transcripts (WES evaluated)", "GRE scores", "TOEFL/IELTS", "CV/Resume", "Statement of Purpose", "3 Letters of Recommendation", "Passport copy", "Financial documents (I-20)", "F-1 Visa application"],
    "australia":   ["Academic transcripts", "Degree certificate", "IELTS (min 6.5)", "CV/Resume", "Statement of Purpose", "2 References", "Passport copy", "Proof of funds (AUD $21,041/yr)", "Student visa (subclass 500)"],
    "netherlands": ["Academic transcripts", "Degree certificate", "IELTS (min 6.0) or TOEFL (min 80)", "CV/Resume", "Motivation Letter", "2 References", "Passport copy", "Proof of funds (€900/month)", "MVV visa (if required)"],
    "default":     ["Academic transcripts", "Degree certificate", "English proficiency test", "CV/Resume", "Statement of Purpose", "2 Letters of Recommendation", "Passport copy", "Proof of funds"],
}

CHECKLIST_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are PathPilot AI, an expert study abroad document advisor.

Generate a personalized document checklist. Respond with valid JSON only:
{{
  "checklist": [
    {{
      "category": "Academic Documents",
      "items": [
        {{"doc": "document name", "status": "pending", "priority": "high", "tip": "specific tip for this student", "deadline_weeks": 8}}
      ]
    }}
  ],
  "total_documents": 15,
  "estimated_preparation_weeks": 10,
  "critical_items": ["most urgent doc 1", "most urgent doc 2"],
  "country_specific_note": "Important note for this specific country"
}}"""),

    ("human", """Generate a document checklist for:

Student: GPA {gpa}, {field_of_study}
Target Countries: {target_countries}
Target Universities: {target_universities}

Base requirements for {primary_country}: {base_docs}

Organize into categories: Academic, Language Tests, Financial, Visa & Immigration, Application Essays.
Add specific tips for each document based on their profile.""")
])

SOP_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are PathPilot AI, an expert academic writing coach.
Generate a compelling Statement of Purpose (SOP) draft.
The SOP should be 600-800 words, professional, and specific to the student's profile.
Structure: Opening hook → Academic background → Research/Work experience → Why this program → Why this university → Career goals → Closing"""),

    ("human", """Write an SOP draft for:

Name: {name}
GPA: {gpa}
Field: {field_of_study}
Target University/Program: {target_university}
Target Country: {target_country}
Goals: {goals}
Activities/Experience: {activities}
Test Scores: {test_score}

Make it personal, specific, and compelling. Use first person.""")
])


class DocumentService:
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

    def _parse_json(self, raw: str) -> Dict:
        try:
            text = raw.strip()
            if text.startswith("```"):
                text = text.split("```")[1]
                if text.startswith("json"):
                    text = text[4:]
            return json.loads(text.strip())
        except json.JSONDecodeError:
            return {"error": "Parse failed", "raw": raw[:300]}

    async def generate_checklist(self, profile: Dict) -> Dict:
        countries = profile.get("target_countries", ["Germany"])
        primary = countries[0].lower() if countries else "default"
        base = BASE_DOCS.get(primary, BASE_DOCS["default"])

        try:
            chain = CHECKLIST_PROMPT | self.llm
            response = await chain.ainvoke({
                "gpa": profile.get("gpa", "Not provided"),
                "field_of_study": profile.get("field_of_study", "Not specified"),
                "target_countries": ", ".join(countries),
                "target_universities": profile.get("target_universities", "Not specified"),
                "primary_country": countries[0] if countries else "Germany",
                "base_docs": ", ".join(base),
            })
            result = self._parse_json(response.content)

            # Validate structure — if LLM returned garbage, use static fallback
            if "checklist" not in result or not isinstance(result.get("checklist"), list):
                logger.warning("LLM returned invalid checklist structure, using static fallback")
                return self._static_checklist(countries[0] if countries else "Germany", base)

            return result

        except Exception as e:
            logger.error(f"Checklist LLM error: {e}")
            # Return static fallback so the page still works
            return self._static_checklist(countries[0] if countries else "Germany", base)

    def _static_checklist(self, country: str, base_docs: list) -> Dict:
        """Static fallback checklist when LLM is unavailable"""
        items = [
            {"doc": doc, "status": "pending", "priority": "high" if i < 3 else "medium",
             "tip": "Prepare this document early", "deadline_weeks": 8 - i}
            for i, doc in enumerate(base_docs)
        ]
        return {
            "checklist": [
                {"category": "Required Documents", "items": items[:5]},
                {"category": "Supporting Documents", "items": items[5:]},
            ],
            "total_documents": len(base_docs),
            "estimated_preparation_weeks": 10,
            "critical_items": base_docs[:3],
            "country_specific_note": f"Standard requirements for {country.title()}. AI personalization unavailable — using base requirements.",
        }

    async def generate_sop(self, profile: Dict) -> Dict:
        countries = profile.get("target_countries", ["Germany"])
        unis = profile.get("target_universities", "")
        primary_uni = unis.split(",")[0].strip() if unis else f"a top university in {countries[0] if countries else 'Germany'}"

        try:
            chain = SOP_PROMPT | self.llm
            response = await chain.ainvoke({
                "name": profile.get("name", "Student"),
                "gpa": profile.get("gpa", "Not provided"),
                "field_of_study": profile.get("field_of_study", "Computer Science"),
                "target_university": primary_uni,
                "target_country": countries[0] if countries else "Germany",
                "goals": profile.get("goals", "Not specified"),
                "activities": ", ".join(profile.get("activities", [])) or "Not specified",
                "test_score": profile.get("test_score", "Not provided"),
            })

            return {
                "sop_draft": response.content.strip(),
                "word_count": len(response.content.split()),
                "target_university": primary_uni,
                "note": "This is an AI-generated draft. Personalize it with specific details before submitting."
            }

        except Exception as e:
            logger.error(f"SOP LLM error: {e}")
            # Return a template SOP as fallback
            return self._static_sop(profile, primary_uni)

    def _static_sop(self, profile: Dict, university: str) -> Dict:
        """Static SOP template fallback"""
        name = profile.get("name", "Student")
        field = profile.get("field_of_study", "Computer Science")
        gpa = profile.get("gpa", "N/A")
        goals = profile.get("goals", "pursue advanced studies")
        country = (profile.get("target_countries") or ["Germany"])[0]

        draft = f"""Dear Admissions Committee,

I am writing to express my strong interest in the {field} program at {university}. With a GPA of {gpa} and a passion for {field}, I am confident that this program aligns perfectly with my academic and professional aspirations.

Throughout my academic journey, I have developed a strong foundation in {field}. My coursework and projects have equipped me with both theoretical knowledge and practical skills that I am eager to apply in an advanced academic setting.

My goal is to {goals}. I believe that {university} offers the ideal environment to achieve this through its world-class faculty, cutting-edge research facilities, and vibrant academic community in {country}.

I am particularly drawn to this program because of its emphasis on innovation and research. I am confident that my background and dedication will allow me to make meaningful contributions to the program and to the broader academic community.

I look forward to the opportunity to contribute to and grow within your esteemed institution.

Sincerely,
{name}"""

        return {
            "sop_draft": draft,
            "word_count": len(draft.split()),
            "target_university": university,
            "note": "AI personalization unavailable — this is a template SOP. Please customize it with your specific experiences and achievements before submitting."
        }


document_service = DocumentService()
