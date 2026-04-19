# PathPilot AI

AI-powered path planning and navigation system.

## Project Structure

```
pathpilot-ai/
├── frontend/          # Next.js 16 frontend (TypeScript + Tailwind)
├── backend/           # Express.js API Gateway
└── ai-service/        # FastAPI AI service
```

## Quick Start

### 1. AI Service (FastAPI)

```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env
# Add your GROQ_API_KEY to .env
uvicorn main:app --reload --port 8000
```

### 2. Backend (Express API Gateway)

```bash
cd backend
npm install
npm start
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
```

## Services

- **AI Service**: `http://localhost:8000`
  - `/health` - Health check
  - `/ai/chat` - Chat with AI
  - `/ai/journey` - Calculate journey scores

- **Backend**: `http://localhost:5000`
  - `/health` - Backend health check
  - `/api/chat` - Chat proxy to AI service
  - `/api/journey` - Journey proxy to AI service

- **Frontend**: `http://localhost:3000`
  - Next.js 16 with App Router
  - TypeScript + Tailwind CSS

## Architecture

```
Frontend (Next.js) → Backend (Express) → AI Service (FastAPI) → Groq API
```

The backend acts as an API gateway, providing:

- CORS handling for frontend requests
- Error handling and timeouts
- Request/response logging
- Service health monitoring
