"""
PathPilot Agent Service — LangChain ReAct Agent

The agent receives a user message and autonomously decides:
  - Which tool(s) to call
  - What arguments to pass
  - How to synthesize the results into a response

Tools available:
  - roi_tool              → Is studying in X worth it?
  - loan_tool             → How do I finance my studies?
  - university_search_tool → Which universities should I apply to?
  - journey_score_tool    → What are my chances?
  - scholarship_tool      → What scholarships can I get?
"""

import os
import logging
from typing import Dict, Optional, List

from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent

from agents.tools import ALL_TOOLS

logger = logging.getLogger(__name__)


class PathPilotAgentService:

    AGENT_SYSTEM_PROMPT = """You are PathPilot AI, an expert study abroad advisor with access to powerful tools.

You help students make data-driven decisions about studying abroad by calling the right tools.

## Your Tools:
- **roi_tool**: Calculate financial return on investment for a study program
- **loan_tool**: Calculate loan eligibility and monthly repayment
- **university_search_tool**: Find and recommend universities by profile
- **journey_score_tool**: Calculate overall study abroad readiness score
- **scholarship_tool**: Find scholarships and funding opportunities

## When to use tools:
- "Is studying in UK worth it?" → roi_tool
- "Can I get a loan?" / "How much will I pay monthly?" → loan_tool
- "Which universities should I apply to?" → university_search_tool
- "What are my chances?" / "Am I ready?" → journey_score_tool
- "What scholarships can I get?" / "Free education?" → scholarship_tool
- Complex questions → call MULTIPLE tools and synthesize

## Rules:
- Always use tools when the question involves numbers, rankings, or specific data
- Synthesize tool results into clear, personalized advice
- Reference the student's profile (GPA, field, country) in your response
- Be encouraging and specific — never give generic advice
- If a tool returns data, explain what it means for THIS student

Student context: {user_context}"""

    def __init__(self):
        self._llm = None
        self._agent_executor = None

    @property
    def llm(self) -> ChatGroq:
        if self._llm is None:
            api_key = os.getenv("GROQ_API_KEY")
            if not api_key:
                raise ValueError("GROQ_API_KEY is not set")
            self._llm = ChatGroq(
                groq_api_key=api_key,
                model_name=os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
                temperature=0.3,   # Lower temp for tool calling accuracy
                max_tokens=2000
            )
        return self._llm

    def _build_executor(self, user_context: str):
        """Build a LangGraph ReAct agent with user context in system prompt"""
        system_prompt = self.AGENT_SYSTEM_PROMPT.format(user_context=user_context)
        return create_react_agent(
            model=self.llm,
            tools=ALL_TOOLS,
            prompt=system_prompt,
        )

    def _build_user_context(self, user_profile: Optional[Dict]) -> str:
        if not user_profile:
            return "No profile provided"
        parts = []
        if user_profile.get("gpa"):
            parts.append(f"GPA: {user_profile['gpa']}")
        if user_profile.get("field_of_study"):
            parts.append(f"Field: {user_profile['field_of_study']}")
        if user_profile.get("target_countries"):
            parts.append(f"Countries: {', '.join(user_profile['target_countries'])}")
        if user_profile.get("goals"):
            parts.append(f"Goals: {user_profile['goals']}")
        if user_profile.get("budget_range"):
            parts.append(f"Budget: {user_profile['budget_range']}")
        return "; ".join(parts) if parts else "General inquiry"

    def _build_history(self, history: List[Dict]) -> List:
        """Convert session history to LangChain messages"""
        messages = []
        for msg in history[-10:]:  # Last 10 messages for context
            if msg.get("type") == "human":
                messages.append(HumanMessage(content=msg["content"]))
            elif msg.get("type") == "ai":
                messages.append(AIMessage(content=msg["content"]))
        return messages

    async def run(
        self,
        message: str,
        user_profile: Optional[Dict] = None,
        chat_history: Optional[List[Dict]] = None
    ) -> Dict:
        """
        Run the ReAct agent on a user message.
        The agent autonomously decides which tools to call.
        """
        user_context = self._build_user_context(user_profile)
        history = self._build_history(chat_history or [])
        executor = self._build_executor(user_context)

        # Build messages list: history + current message
        messages = history + [HumanMessage(content=message)]

        result = await executor.ainvoke({"messages": messages})

        # Extract final response and tool calls from message history
        tools_used = []
        tool_results = []
        final_response = ""

        for msg in result.get("messages", []):
            msg_type = type(msg).__name__

            # Tool call messages
            if msg_type == "AIMessage" and hasattr(msg, "tool_calls") and msg.tool_calls:
                for tc in msg.tool_calls:
                    tools_used.append(tc.get("name", "unknown"))

            # Tool result messages
            elif msg_type == "ToolMessage":
                tool_results.append({
                    "tool": msg.name,
                    "output": msg.content[:500]  # Truncate for response
                })

            # Final AI response (last AIMessage with no tool calls)
            elif msg_type == "AIMessage" and not getattr(msg, "tool_calls", None):
                final_response = msg.content

        return {
            "response": final_response or "I couldn't generate a response.",
            "tools_used": list(dict.fromkeys(tools_used)),  # deduplicate
            "tool_results": tool_results,
            "tools_count": len(set(tools_used)),
        }


# ── Global instance ────────────────────────────────────────────────────────────
agent_service = PathPilotAgentService()
