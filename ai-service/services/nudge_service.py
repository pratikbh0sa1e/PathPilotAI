"""
Smart Nudges Service — Rule Engine + LangChain Personalization

Phase 1: Python rule engine evaluates the student's state
         and fires relevant nudge triggers.

Phase 2: LangChain converts each trigger into a personalized,
         context-aware message — never generic.

Nudge categories:
  - feature_unused   → Student hasn't used a key feature yet
  - profile_gap      → Missing profile data that would improve results
  - action_needed    → Time-sensitive action required
  - milestone        → Positive reinforcement for progress
  - risk_alert       → Something needs attention
"""

import os
import json
import logging
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from enum import Enum

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate

logger = logging.getLogger(__name__)


# ─── Nudge types ──────────────────────────────────────────────────────────────

class NudgeCategory(str, Enum):
    FEATURE_UNUSED  = "feature_unused"
    PROFILE_GAP     = "profile_gap"
    ACTION_NEEDED   = "action_needed"
    MILESTONE       = "milestone"
    RISK_ALERT      = "risk_alert"


class NudgePriority(str, Enum):
    HIGH   = "high"
    MEDIUM = "medium"
    LOW    = "low"


@dataclass
class NudgeTrigger:
    """Raw trigger from the rule engine — no LLM yet"""
    id: str
    category: NudgeCategory
    priority: NudgePriority
    template: str                    # fallback message
    action_label: str                # CTA button text
    action_route: str                # frontend route to navigate to
    context: Dict = field(default_factory=dict)  # data for LLM personalization


# ─── Rule Engine ──────────────────────────────────────────────────────────────

def evaluate_nudges(
    profile: Dict,
    activity: Optional[List[str]] = None,
    used_features: Optional[List[str]] = None,
    journey_score: Optional[int] = None,
    days_since_last_active: Optional[int] = None,
) -> List[NudgeTrigger]:
    """
    Evaluate all nudge rules against the student's current state.
    Returns a list of triggered nudges, sorted by priority.
    """
    triggers: List[NudgeTrigger] = []
    used = set(used_features or [])
    acts = activity or []
    gpa  = float(profile.get("gpa", 0))

    # ── Feature unused nudges ──────────────────────────────────────────────

    if "roi" not in used:
        triggers.append(NudgeTrigger(
            id="unused_roi",
            category=NudgeCategory.FEATURE_UNUSED,
            priority=NudgePriority.HIGH,
            template="You haven't checked your ROI yet. See if your investment is worth it.",
            action_label="Calculate ROI",
            action_route="/roi",
            context={
                "feature": "ROI Calculator",
                "benefit": "know if your investment pays off",
                "field": profile.get("field_of_study", ""),
                "country": (profile.get("target_countries") or [""])[0],
            }
        ))

    if "loan" not in used:
        triggers.append(NudgeTrigger(
            id="unused_loan",
            category=NudgeCategory.FEATURE_UNUSED,
            priority=NudgePriority.HIGH,
            template="Check your loan eligibility to plan your finances.",
            action_label="Check Loan Eligibility",
            action_route="/loan",
            context={
                "feature": "Loan Calculator",
                "benefit": "plan your finances before applying",
                "gpa": gpa,
            }
        ))

    if "journey" not in used:
        triggers.append(NudgeTrigger(
            id="unused_journey",
            category=NudgeCategory.FEATURE_UNUSED,
            priority=NudgePriority.MEDIUM,
            template="Calculate your journey score to see your study abroad readiness.",
            action_label="Get Journey Score",
            action_route="/journey",
            context={
                "feature": "Journey Score",
                "benefit": "understand your readiness and gaps",
            }
        ))

    if "chat" not in used:
        triggers.append(NudgeTrigger(
            id="unused_chat",
            category=NudgeCategory.FEATURE_UNUSED,
            priority=NudgePriority.MEDIUM,
            template="Chat with your AI mentor for personalized guidance.",
            action_label="Start Chat",
            action_route="/chat",
            context={
                "feature": "AI Mentor Chat",
                "benefit": "get personalized advice for your situation",
            }
        ))

    # ── Profile gap nudges ─────────────────────────────────────────────────

    if not profile.get("target_countries"):
        triggers.append(NudgeTrigger(
            id="missing_countries",
            category=NudgeCategory.PROFILE_GAP,
            priority=NudgePriority.HIGH,
            template="Add your target countries to get personalized recommendations.",
            action_label="Update Profile",
            action_route="/profile",
            context={
                "missing_field": "target countries",
                "impact": "personalized university and scholarship recommendations",
            }
        ))

    if not profile.get("field_of_study"):
        triggers.append(NudgeTrigger(
            id="missing_field",
            category=NudgeCategory.PROFILE_GAP,
            priority=NudgePriority.HIGH,
            template="Add your field of study to unlock tailored insights.",
            action_label="Update Profile",
            action_route="/profile",
            context={
                "missing_field": "field of study",
                "impact": "accurate salary projections and university matches",
            }
        ))

    if not profile.get("goals"):
        triggers.append(NudgeTrigger(
            id="missing_goals",
            category=NudgeCategory.PROFILE_GAP,
            priority=NudgePriority.MEDIUM,
            template="Define your goals to get a more accurate journey score.",
            action_label="Set Goals",
            action_route="/profile",
            context={
                "missing_field": "goals",
                "impact": "better journey score and AI recommendations",
            }
        ))

    if not profile.get("test_score"):
        triggers.append(NudgeTrigger(
            id="missing_test_score",
            category=NudgeCategory.PROFILE_GAP,
            priority=NudgePriority.MEDIUM,
            template="Add your test scores (GRE/IELTS/TOEFL) to improve your admission score.",
            action_label="Add Test Scores",
            action_route="/profile",
            context={
                "missing_field": "test scores",
                "impact": "higher admission score and better university matches",
            }
        ))

    # ── Action needed nudges ───────────────────────────────────────────────

    if gpa > 0 and len(acts) == 0:
        triggers.append(NudgeTrigger(
            id="no_activities",
            category=NudgeCategory.ACTION_NEEDED,
            priority=NudgePriority.HIGH,
            template="Add your activities and experiences to strengthen your profile.",
            action_label="Add Activities",
            action_route="/profile",
            context={
                "gpa": gpa,
                "issue": "no activities listed",
                "impact": "activities can boost your journey score by up to 35 points",
            }
        ))

    if journey_score is not None and journey_score < 50:
        triggers.append(NudgeTrigger(
            id="low_journey_score",
            category=NudgeCategory.RISK_ALERT,
            priority=NudgePriority.HIGH,
            template=f"Your journey score is {journey_score}/100. Let's improve it.",
            action_label="See Recommendations",
            action_route="/journey",
            context={
                "journey_score": journey_score,
                "issue": "low readiness score",
                "impact": "improving score increases admission chances significantly",
            }
        ))

    if days_since_last_active is not None and days_since_last_active > 7:
        triggers.append(NudgeTrigger(
            id="inactive",
            category=NudgeCategory.ACTION_NEEDED,
            priority=NudgePriority.MEDIUM,
            template=f"You haven't been active for {days_since_last_active} days. Application deadlines are approaching.",
            action_label="Resume Journey",
            action_route="/dashboard",
            context={
                "days_inactive": days_since_last_active,
                "urgency": "application deadlines are typically 6-12 months away",
            }
        ))

    # ── Milestone nudges ───────────────────────────────────────────────────

    if journey_score is not None and journey_score >= 80:
        triggers.append(NudgeTrigger(
            id="high_score_milestone",
            category=NudgeCategory.MILESTONE,
            priority=NudgePriority.LOW,
            template=f"Great work! Your journey score is {journey_score}/100. You're ready to apply.",
            action_label="Find Universities",
            action_route="/universities",
            context={
                "journey_score": journey_score,
                "achievement": "strong readiness score",
            }
        ))

    if gpa >= 8.5 and len(acts) >= 3:
        triggers.append(NudgeTrigger(
            id="strong_profile_milestone",
            category=NudgeCategory.MILESTONE,
            priority=NudgePriority.LOW,
            template="Your profile is strong! You qualify for top-tier scholarships.",
            action_label="Find Scholarships",
            action_route="/scholarships",
            context={
                "gpa": gpa,
                "activities": len(acts),
                "achievement": "strong academic + extracurricular profile",
            }
        ))

    # Sort: HIGH first, then MEDIUM, then LOW
    priority_order = {NudgePriority.HIGH: 0, NudgePriority.MEDIUM: 1, NudgePriority.LOW: 2}
    triggers.sort(key=lambda t: priority_order[t.priority])

    return triggers


# ─── LangChain personalization layer ──────────────────────────────────────────

PERSONALIZATION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """You are PathPilot AI. You generate short, personalized nudge messages for students.

Rules:
- Maximum 2 sentences
- Be specific to the student's actual data (GPA, field, country)
- Sound like a helpful mentor, not a marketing notification
- Reference their specific situation
- End with a clear benefit statement
- Never be generic or use placeholder text"""),

    ("human", """Generate a personalized nudge message for this student:

Nudge type: {category}
Default message: {template}
Student context: {context_str}
Student profile:
  GPA: {gpa}
  Field: {field_of_study}
  Target countries: {target_countries}
  Goals: {goals}

Write a 1-2 sentence personalized message that references their specific data.""")
])


class NudgeService:
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
                temperature=0.6,
                max_tokens=150
            )
        return self._llm

    async def _personalize(self, trigger: NudgeTrigger, profile: Dict) -> str:
        """Use LangChain to personalize a nudge message"""
        try:
            chain = PERSONALIZATION_PROMPT | self.llm
            response = await chain.ainvoke({
                "category":       trigger.category.value,
                "template":       trigger.template,
                "context_str":    json.dumps(trigger.context),
                "gpa":            profile.get("gpa", "not provided"),
                "field_of_study": profile.get("field_of_study", "not specified"),
                "target_countries": ", ".join(profile.get("target_countries", [])) or "not specified",
                "goals":          profile.get("goals", "not specified"),
            })
            return response.content.strip()
        except Exception as e:
            logger.warning(f"Nudge personalization failed for {trigger.id}: {e}")
            return trigger.template  # fallback to template

    async def get_nudges(
        self,
        profile: Dict,
        activity: Optional[List[str]] = None,
        used_features: Optional[List[str]] = None,
        journey_score: Optional[int] = None,
        days_since_last_active: Optional[int] = None,
        max_nudges: int = 5,
        personalize: bool = True,
    ) -> List[Dict]:
        """
        Get personalized nudges for a student.

        Returns up to max_nudges nudges, sorted by priority,
        each with a LangChain-personalized message.
        """
        # Phase 1: rule engine
        triggers = evaluate_nudges(
            profile=profile,
            activity=activity,
            used_features=used_features,
            journey_score=journey_score,
            days_since_last_active=days_since_last_active,
        )

        # Limit to max_nudges
        triggers = triggers[:max_nudges]

        # Phase 2: personalize each nudge
        nudges = []
        for trigger in triggers:
            if personalize:
                message = await self._personalize(trigger, profile)
            else:
                message = trigger.template

            nudges.append({
                "id":           trigger.id,
                "category":     trigger.category.value,
                "priority":     trigger.priority.value,
                "message":      message,
                "action_label": trigger.action_label,
                "action_route": trigger.action_route,
            })

        return nudges


nudge_service = NudgeService()
