# PathPilot Backend

Express.js API Gateway for PathPilot - proxies requests to the FastAPI AI service.

## Setup

1. Install dependencies:

```bash
cd backend
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Start the server:

```bash
npm run dev  # Development with auto-reload
# or
npm start    # Production
```

## Architecture

The backend acts as an API gateway that:

- Receives requests from the frontend
- Proxies them to the AI service (FastAPI)
- Handles errors and timeouts
- Provides consistent API responses

## Endpoints

- `GET /health` - Backend health check
- `GET /api` - API information
- `POST /api/chat` - Chat with AI (proxied to AI service)
- `POST /api/journey` - Calculate journey scores (proxied to AI service)

## Usage

The backend will be available at:

- http://localhost:5000/api/chat
- http://localhost:5000/api/journey

## Request Flow

```
Frontend → Backend (Express) → AI Service (FastAPI) → Groq API
```

## Error Handling

The backend provides robust error handling:

- Service unavailable (503) when AI service is down
- Timeout handling for long requests
- Proper error messages and status codes
