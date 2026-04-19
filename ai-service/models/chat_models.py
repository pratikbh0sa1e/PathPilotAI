from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from enum import Enum

class MessageType(str, Enum):
    HUMAN = "human"
    AI = "ai"
    SYSTEM = "system"

class UserProfile(BaseModel):
    """User profile for personalized chat context"""
    gpa: Optional[float] = Field(None, ge=0.0, le=10.0, description="Grade Point Average")
    field_of_study: Optional[str] = Field(None, description="Academic field of interest")
    target_countries: Optional[List[str]] = Field(None, description="Countries of interest for study")
    budget_range: Optional[str] = Field(None, description="Budget range for studies")
    activities: Optional[List[str]] = Field(None, description="Extracurricular activities")
    goals: Optional[str] = Field(None, description="Academic and career goals")
    current_level: Optional[str] = Field(None, description="Current education level")

class ChatMessage(BaseModel):
    """Individual chat message"""
    type: MessageType
    content: str
    timestamp: Optional[str] = None

class ConversationSession(BaseModel):
    """Conversation session metadata"""
    session_id: str
    created_at: str
    last_activity: str
    message_count: int
    user_profile: Optional[UserProfile] = None