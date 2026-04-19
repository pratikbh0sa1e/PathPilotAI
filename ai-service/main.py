from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import journey, chat, agent, roi, loan, nudges, timeline
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="PathPilot AI Service", 
    version="2.0.0",
    description="AI-powered study abroad mentoring with LangChain + Groq"
)

# CORS — reads from env for production, falls back to localhost for dev
allowed_origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    os.getenv("BACKEND_URL", "http://localhost:5000"),
    "http://localhost:3000",
    "http://localhost:5000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(journey.router, tags=["Journey"])
app.include_router(chat.router, tags=["Chat"])
app.include_router(agent.router, tags=["Agent"])
app.include_router(roi.router, tags=["ROI"])
app.include_router(loan.router, tags=["Loan"])
app.include_router(nudges.router, tags=["Nudges"])
app.include_router(timeline.router, tags=["Timeline & Documents"])

@app.get("/health")
def health():
    """Health check — GET returns full status JSON"""
    groq_configured = bool(os.getenv('GROQ_API_KEY'))
    return {
        "status": "ok",
        "service": "PathPilot AI Service",
        "version": "2.0.0",
        "features": {
            "langchain_chat": True,
            "conversation_memory": True,
            "journey_scoring": True,
            "groq_configured": groq_configured,
            "groq_model": os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile"),
        }
    }

@app.head("/health")
def health_head():
    """Health check — HEAD for uptime monitors (no body, just 200)"""
    return {}

@app.get("/")
def root():
    """API information"""
    return {
        "service": "PathPilot AI Service",
        "version": "2.0.0",
        "description": "AI-powered study abroad mentoring",
        "endpoints": {
            "health": "GET /health",
            "chat": "POST /ai/chat",
            "journey": "POST /ai/journey",
            "docs": "GET /docs"
        },
        "features": [
            "LangChain conversation orchestration",
            "Groq LLM integration (Llama3-70B)",
            "Session-based conversation memory",
            "Dynamic user profile context",
            "Study abroad mentor persona"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)