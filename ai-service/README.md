# PathPilot AI Service

FastAPI-based AI service for PathPilot.

## Setup

1. Install dependencies:

```bash
cd ai-service
pip install -r requirements.txt
```

2. Create `.env` file:

```bash
cp .env.example .env
# Add your GROQ_API_KEY
```

3. Run the server:

```bash
uvicorn main:app --reload --port 8000
```

## Endpoints

- `GET /health` - Health check
- `POST /ai/chat` - Chat with AI
- `POST /ai/journey` - Calculate journey scores

## Usage

The service will be available at:

- http://localhost:8000/ai/chat
- http://localhost:8000/ai/journey
