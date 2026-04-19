# PathPilot AI — Study Abroad Intelligence Platform

> **AI-first platform that guides students through every step of studying abroad — from discovery to loan disbursement.**

---

## How We Built It & Requirements Fulfilled

### A. AI-Driven Engagement Layer

**AI Career Navigator** — Built using a LangChain `StructuredTool` called `university_search_tool` inside a LangGraph ReAct agent. It takes the student's GPA, field of study, and target country and returns tiered university recommendations (reach / match / safety) from a curated database. The agent autonomously calls this tool when a student asks "which universities should I apply to?" (`ai-service/agents/tools.py`)

**ROI Calculator** — A two-phase system. Phase 1 is a deterministic Python engine that maps field of study to expected salary (20+ fields) and multiplies by a country salary multiplier (15+ countries) to compute total investment, payback period, and 3/5/10-year ROI. Phase 2 uses LangChain to generate a human-readable explanation: _"You will recover your $21,000 investment in 0.3 years."_ (`ai-service/services/roi_service.py`)

**Admission Probability Predictor** — Part of the Journey Brain. A rule engine scores GPA (0–40 pts), activities/internships (0–35 pts), and application readiness (0–25 pts) to produce an admission likelihood score from 0–100. The score updates in real time as the student fills their profile. (`ai-service/services/journey_service.py`)

**Application Timeline Generator** — LangChain + Groq generates a personalized 12-month week-by-week action plan. It uses static deadline data for 10+ countries (Germany, Canada, UK, USA, etc.) and the student's profile to produce 5–6 phases with tasks, milestones, and critical deadlines. (`ai-service/services/timeline_service.py`)

**Conversational Mentor/Copilot** — A ChatGPT-style multi-session chat interface. Each conversation is a separate session stored in Supabase. LangChain `ChatPromptTemplate` with `MessagesPlaceholder` maintains conversation history. The student's profile (GPA, field, countries, goals) is injected as context into every message. pgvector semantic search retrieves relevant past conversations. (`ai-service/services/chat_service.py`)

**LLMs** — All AI responses use Groq's Llama 3.3 70B (`llama-3.3-70b-versatile`) via LangChain. The model is configurable via the `GROQ_MODEL` environment variable — swap models without touching code.

**Predictive Models** — The Journey Brain uses a hybrid approach: a deterministic rule engine for structured scoring, then LangChain converts the numbers into actionable insights (strengths, gaps, recommendations, next steps, university suggestions, scholarship tips).

**Generative AI — Essays** — The SOP Generator uses LangChain to write a 600–800 word Statement of Purpose draft tailored to the student's GPA, field, activities, goals, and target university. A static template fallback ensures the page always works even if the LLM is unavailable. (`ai-service/services/document_service.py`)

---

### B. AI-Led Marketing & Growth Engine

**Smart Nudges** — A 12-rule Python engine evaluates the student's state (unused features, missing profile data, low journey score, inactivity) and fires relevant triggers sorted by priority (high → medium → low). LangChain then personalizes each nudge message with the student's actual data — never generic. Example: _"As a CS student with GPA 8.5 targeting Germany, your ROI analysis will show a payback period under 1 year."_ (`ai-service/services/nudge_service.py`)

**Personalization Engine** — Every single AI call injects the student's profile as context. The chat system builds a `persistent_context` string from stored profile + semantic search results + recent actions, which is prepended to every LangChain prompt. The platform literally remembers: _"Since you previously mentioned Canada..."_

**Gamification** — A full XP system with 10 levels (Explorer → Legend), 11 badges (Profile Pro, Roadmap Ready, Week Warrior, Smart Investor, Doc Master, etc.), and daily login streak tracking. Every meaningful action awards XP: chatting (+50), calculating ROI (+75), generating a timeline (+100), completing the checklist (+150). All state is stored in Supabase's `gamification` table via the Express backend — not localStorage. (`backend/services/gamificationService.js`)

**Engagement Loops** — Streaks auto-award badges at 3 days and 7 days. Badge unlocks trigger XP boosts. The achievements page shows progress toward the next level with a visual XP bar. The platform is designed so every feature interaction rewards the user.

**Referral System** — An Ambassador badge and XP reward are defined in the gamification system for referral actions. The `referral_sent` action ID awards 150 XP and unlocks the Ambassador badge.

**AI Content Feed** — The dashboard shows AI-generated insights from the journey analysis: overall summary, strengths, gaps, recommendations, next steps, university targets, and scholarship tips — all personalized to the student's actual profile data.

---

### C. Conversion Layer — Loan Funnel

**Personalized Loan Eligibility Estimator** — A rule engine scores eligibility 0–100 based on GPA (0–40 pts), STEM field bonus (+15 pts), scholarship-friendly country bonus (+15 pts), and income-to-debt ratio (+20 pts). LangChain generates a plain-English explanation: _"Based on your GPA of 8.5, you qualify for a loan up to $34,000."_ (`ai-service/services/loan_service.py`)

**Dynamic Loan Offers** — The maximum loan amount, recommended loan amount, and interest rate all adjust dynamically based on the student's eligibility score. A student with GPA 9.0 in a STEM field targeting Germany gets a higher eligibility score and better loan terms than a student with GPA 6.0.

**Financial Planning Tools** — The loan page shows monthly EMI (computed via standard amortization formula), total repayment over 10 years, total interest paid, and a comparison between the maximum loan and the recommended (conservative) loan amount.

**AI-Assisted Loan Application Flow** — A 4-step guided flow: Step 1 checks eligibility via the backend API, Step 2 shows a document checklist that must be completed before proceeding, Step 3 auto-fills the application form from the student's profile, Step 4 shows a confirmation with a reference ID. (`frontend/app/(main)/loan-apply/page.tsx`)

**Document Checklist + Auto-fill** — The AI generates a country-specific document checklist (Germany requires APS Certificate + blocked account proof; USA requires WES evaluation + F-1 visa; etc.) with priority levels and deadline estimates for each document. The loan application form auto-fills name, email, GPA, field, target country, and loan amount from the stored profile.

---

### D. AI-First Platform Design

**Frontend Prototype** — Next.js 16 with App Router, TypeScript, Tailwind CSS v4, shadcn/ui components, Geologica font, Material Symbols icons. 15 fully functional pages: Landing, Login, Signup, Dashboard, Chat, Journey, Timeline, ROI, Loan, Loan Apply, Documents, Achievements, Profile, and more.

**Backend Logic** — Express.js API Gateway handles all frontend requests, adds rate limiting (100 req/15min global, 20 req/min for AI endpoints), request validation, CORS, and Morgan logging. FastAPI handles all AI logic. The two services are cleanly separated.

**LLM Integrations** — Groq API via LangChain throughout. Not raw API calls — every LLM interaction uses LangChain's `ChatPromptTemplate`, `MessagesPlaceholder`, and chain composition (`prompt | llm`). The model is swappable via environment variable.

**Chatbot using LLM APIs** — Multi-session chat with full conversation history, profile context injection, and pgvector semantic search over past messages.

**Recommendation Engine** — LangChain ReAct Agent (`LangGraph create_react_agent`) with 5 `StructuredTool` instances. The LLM reads the user's question and autonomously decides which tools to call with what arguments. For complex questions it calls multiple tools simultaneously.

**Workflow Automation via AI Agents** — The agent handles the entire analysis workflow: receives a natural language question → selects tools → executes them → synthesizes results into a personalized response. No hardcoded flows.

**Vector Databases / Embeddings** — Supabase with pgvector extension. Chat messages are embedded using `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions) and stored in the `chat_messages` table. A custom SQL function `match_chat_messages()` performs cosine similarity search to retrieve semantically relevant past conversations.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js 16)                     │
│  Landing · Login · Dashboard · Chat · Journey · Timeline    │
│  ROI · Loan · Documents · Achievements · Profile            │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (REST)
┌──────────────────────▼──────────────────────────────────────┐
│              BACKEND (Express.js — API Gateway)              │
│  Rate limiting · Validation · CORS · Logging                │
│  Session management · Gamification · Profile sync           │
│  Supabase client (chat_sessions, gamification, profiles)    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP (REST)
┌──────────────────────▼──────────────────────────────────────┐
│              AI SERVICE (FastAPI + LangChain)                │
│  Chat (LangChain + Groq)  · Journey Brain (hybrid)          │
│  ROI Calculator · Loan Eligibility · Smart Nudges           │
│  Timeline Generator · Document Checklist · SOP Generator    │
│  LangChain ReAct Agent (5 tools)                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│   Groq API     │          │    Supabase      │
│ Llama 3.3 70B  │          │ PostgreSQL +     │
│ (LLM calls)    │          │ pgvector         │
└────────────────┘          └─────────────────┘
```

---

## 📁 Project Structure

```
pathpilot-ai/
├── frontend/                    # Next.js 16 — UI
│   ├── app/
│   │   ├── (auth)/              # Login, Signup
│   │   ├── (main)/              # Protected pages
│   │   │   ├── dashboard/       # Journey overview + AI insights
│   │   │   ├── chat/            # ChatGPT-style multi-session AI chat
│   │   │   ├── journey/         # Score breakdown with progress bars
│   │   │   ├── timeline/        # AI-generated application timeline
│   │   │   ├── roi/             # ROI calculator
│   │   │   ├── loan/            # Loan eligibility checker
│   │   │   ├── loan-apply/      # 4-step loan application flow
│   │   │   ├── documents/       # Document checklist + SOP generator
│   │   │   ├── achievements/    # Gamification — XP, badges, streaks
│   │   │   └── profile/         # User profile management
│   │   └── page.tsx             # Landing page
│   ├── components/
│   │   ├── chat/ChatWindow.tsx  # Chat UI component
│   │   └── dashboard/           # Score rings, insight cards, nudge bar
│   └── lib/
│       ├── api.ts               # Typed API client
│       ├── profile-context.tsx  # Auth + profile state
│       └── gamification.ts      # Gamification API client
│
├── backend/                     # Express.js — API Gateway
│   ├── controllers/             # chat, journey, roi, loan, agent, nudges,
│   │                            # gamification, chatSession, profile, timeline
│   ├── middleware/              # logger, errorHandler, rateLimiter, validate
│   ├── routes/api.js            # All routes with validation
│   └── services/
│       ├── aiService.js         # Axios client → FastAPI
│       ├── supabaseClient.js    # Supabase connection
│       ├── gamificationService.js
│       ├── chatSessionService.js
│       └── seedService.js       # Guest user seed on startup
│
└── ai-service/                  # FastAPI — AI Brain
    ├── routes/                  # chat, journey, roi, loan, nudges, agent, timeline
    ├── services/
    │   ├── chat_service.py      # LangChain + Groq + memory
    │   ├── journey_service.py   # Rule engine scoring
    │   ├── journey_reasoning_service.py
    │   ├── roi_service.py
    │   ├── loan_service.py
    │   ├── nudge_service.py
    │   ├── timeline_service.py
    │   ├── document_service.py
    │   └── memory_service.py    # Supabase + pgvector
    ├── agents/
    │   ├── agent_service.py     # LangGraph ReAct agent
    │   └── tools.py             # 5 structured tools
    └── db/schema.sql            # Supabase schema
```

---

## 🛠️ Tech Stack

- **Frontend** — Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui
- **Backend** — Express.js, Node.js, Axios, express-validator, morgan
- **AI Service** — FastAPI, Python, LangChain, LangGraph
- **LLM** — Groq API — Llama 3.3 70B (`llama-3.3-70b-versatile`)
- **Embeddings** — sentence-transformers/all-MiniLM-L6-v2 (384-dim)
- **Database** — Supabase (PostgreSQL + pgvector)
- **Font** — Geologica (Google Fonts)
- **Icons** — Material Symbols Outlined

---

## ⚡ Quick Start

### Prerequisites

- Node.js 22+, Python 3.12+
- Groq API key — [console.groq.com](https://console.groq.com)
- Supabase project — [supabase.com](https://supabase.com) _(optional but recommended)_

### 1. AI Service

```bash
cd ai-service
python -m venv venv && venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env   # add GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # add SUPABASE_URL + SUPABASE_KEY
npm start
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

### 4. Database

Run `ai-service/db/schema.sql` in your Supabase SQL Editor to create all tables.

---

## 🌐 API Endpoints

**Express Backend** (`:5000`)

- `GET/HEAD /health` — health check + uptime monitor
- `POST /api/chat` — chat with AI mentor
- `POST /api/journey` — journey scoring + AI insights
- `POST /api/roi` — ROI calculator
- `POST /api/loan` — loan eligibility
- `POST /api/agent` — LangChain ReAct agent
- `POST /api/nudges` — smart nudges
- `POST /api/timeline` — application timeline
- `POST /api/documents/checklist` — document checklist
- `POST /api/documents/sop` — SOP generator
- `GET/POST /api/profile/:userId` — user profile CRUD
- `GET/POST/PATCH/DELETE /api/chat/sessions` — chat session management
- `GET/POST /api/gamification/:userId` — gamification state + track actions

**FastAPI AI Service** (`:8000`) — all routes prefixed `/ai/`, interactive docs at `/docs`

---

## 🗄️ Database Schema

Five tables in Supabase:

- `user_profiles` — GPA, field, countries, goals, activities
- `chat_sessions` — session title and timestamps per user
- `chat_messages` — full message history with 384-dim vector embeddings
- `user_actions` — event tracking
- `gamification` — XP, level, streak, badges per user

---

## 🔑 Environment Variables

**`ai-service/.env`**

```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

**`backend/.env`**

```env
PORT=5000
AI_SERVICE_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

**`frontend/.env.local`**

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

---

## 🏆 Judging Criteria

**Innovation & Creativity** — PathPilot's Journey Brain is a hybrid system that no existing platform uses: a deterministic rule engine produces structured scores, then LangChain converts those numbers into human insights. The LangGraph ReAct agent autonomously selects which of 5 tools to call based on the user's natural language question — no hardcoded flows. The ChatGPT-style multi-session chat with pgvector semantic memory means the AI genuinely remembers past conversations.

**AI Integration & Execution** — Every numeric output has an LLM explanation. Every chat message has profile context. Every nudge is personalized by LangChain. The platform uses LangChain `ChatPromptTemplate`, `MessagesPlaceholder`, `StructuredTool`, `LangGraph create_react_agent`, and pgvector cosine similarity — not just raw API calls.

**User Experience** — Geologica font, Material Symbols icons, light mode throughout, animated SVG score rings, gamification badge grid, smart nudge bar with priority colors, ChatGPT-style sidebar with session management, responsive sidebar navigation with active state indicators.

**Business Relevance** — The funnel is clear: Landing page → Signup (profile captured) → Dashboard (journey score + nudges) → ROI/Loan pages (financial awareness) → Loan Apply (4-step conversion). A guest user is seeded with demo data on server startup so judges can explore immediately without signing up.

**Prototype Quality** — 15 working pages, 3 running services (Next.js + Express + FastAPI), Supabase persistence with 5 tables, 20+ API endpoints, full error handling with static fallbacks, route protection, session persistence across page refreshes.

---

## 🔄 Zero Human Intervention Growth Loop (Bonus)

```
Student lands on PathPilot
        ↓
Signup captures profile (GPA, field, countries, goals)
        ↓
Journey score calculated automatically
        ↓
Smart nudges fire — AI-personalized to their exact profile
        ↓
Student engages with ROI / Loan → XP awarded → Badge unlocked
        ↓
Daily login streak maintained → More nudges → Deeper engagement
        ↓
Loan application initiated → Document checklist → Submission
        ↓
Entire lifecycle managed by AI — zero human intervention
```

---

## 👥 Guest Demo

Click **"Continue as Guest"** on the login page. A pre-seeded profile loads automatically:

- GPA 7.5 · Computer Science · Germany & Canada · MS in AI
- Activities: Internship, Research, Volunteer work

---

_Built with LangChain, Groq, FastAPI, Express, Next.js, and Supabase_
