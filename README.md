# PathPilot AI — Study Abroad Intelligence Platform

> **AI-first platform that guides students through every step of studying abroad — from discovery to loan disbursement.**

---

## 🏆 Hackathon Requirements Fulfillment

### A. AI-Driven Engagement Layer ✅

| Requirement                     | How PathPilot Fulfills It                                                                                          | File                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| AI Career Navigator             | `university_search_tool` — LangChain agent recommends reach/match/safety universities based on GPA, field, country | `ai-service/agents/tools.py`              |
| ROI Calculator                  | Deterministic salary/cost model + LangChain explanation: _"You will recover your investment in 0.3 years"_         | `ai-service/services/roi_service.py`      |
| Admission Probability Predictor | Rule engine scores GPA + activities + test scores → admission likelihood 0–100                                     | `ai-service/services/journey_service.py`  |
| Application Timeline Generator  | LLM generates week-by-week 12-month action plan with phase breakdown and critical deadlines                        | `ai-service/services/timeline_service.py` |
| Conversational Mentor/Copilot   | ChatGPT-style multi-session chat with LangChain memory, session history, profile context injection                 | `ai-service/services/chat_service.py`     |
| LLMs for guidance               | Groq Llama 3.3 70B via LangChain — all AI responses                                                                | `ai-service/services/chat_service.py`     |
| Predictive models               | Hybrid rule engine + LLM reasoning for journey scoring                                                             | `ai-service/services/journey_service.py`  |
| Generative AI (essays)          | SOP/Statement of Purpose generator — full 600–800 word draft from profile                                          | `ai-service/services/document_service.py` |

### B. AI-Led Marketing & Growth Engine ✅

| Requirement            | How PathPilot Fulfills It                                                                                 | File                                                 |
| ---------------------- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Smart Nudges           | 12-rule engine fires personalized nudges based on journey stage, then LangChain personalizes each message | `ai-service/services/nudge_service.py`               |
| Personalization Engine | Every AI call injects user profile (GPA, field, countries, goals) as context                              | `ai-service/services/chat_service.py`                |
| Gamification           | XP system, 10 levels (Explorer → Legend), 11 badges, daily login streaks — all stored in Supabase         | `backend/services/gamificationService.js`            |
| Engagement Loops       | Streak tracking, badge unlocks, XP rewards for every action (chat, ROI, loan, timeline)                   | `frontend/lib/gamification.ts`                       |
| Referral System        | Ambassador badge + XP reward for referrals                                                                | `backend/services/gamificationService.js`            |
| AI Content Feed        | Dashboard shows AI-generated insights, recommendations, next steps from journey analysis                  | `frontend/components/dashboard/JourneyDashboard.tsx` |

### C. Conversion Layer — Loan Funnel ✅

| Requirement                    | How PathPilot Fulfills It                                                                             | File                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Loan Eligibility Estimator     | Rule engine scores GPA + STEM field + country + income → eligibility 0–100 with LangChain explanation | `ai-service/services/loan_service.py`     |
| Dynamic Loan Offers            | Eligibility score adjusts max loan amount and interest rate based on profile strength                 | `ai-service/services/loan_service.py`     |
| EMI / Repayment Scenarios      | Standard amortization formula → monthly EMI, total repayment, total interest breakdown                | `ai-service/services/loan_service.py`     |
| AI-Assisted Loan Application   | 4-step flow: Eligibility → Document Checklist → Auto-filled Form → Submission                         | `frontend/app/(main)/loan-apply/page.tsx` |
| Document Checklist + Auto-fill | AI generates country-specific document checklist; application form auto-fills from profile            | `ai-service/services/document_service.py` |

### D. AI-First Platform Design ✅

| Requirement            | How PathPilot Fulfills It                                                |
| ---------------------- | ------------------------------------------------------------------------ |
| Frontend Prototype     | Next.js 16 with App Router, Tailwind CSS v4, shadcn/ui — 15 pages        |
| Backend Logic          | Express.js API Gateway + FastAPI AI Service                              |
| LLM Integration        | Groq API (Llama 3.3 70B) via LangChain                                   |
| Chatbot using LLM APIs | Multi-session chat with memory, profile context, semantic search         |
| Recommendation Engine  | LangChain ReAct Agent with 5 structured tools                            |
| Workflow Automation    | AI agents autonomously decide which tools to call based on user intent   |
| Vector DB / Embeddings | pgvector + sentence-transformers (all-MiniLM-L6-v2, 384-dim) in Supabase |

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
│       ├── profile-context.tsx  # Auth + profile state (localStorage + backend)
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
│       ├── gamificationService.js  # XP, badges, streaks
│       ├── chatSessionService.js   # Multi-session chat management
│       ├── profileController.js    # User profile CRUD
│       └── seedService.js          # Guest user seed on startup
│
└── ai-service/                  # FastAPI — AI Brain
    ├── routes/                  # chat, journey, roi, loan, nudges,
    │                            # agent, timeline
    ├── services/
    │   ├── chat_service.py      # LangChain + Groq + memory
    │   ├── journey_service.py   # Rule engine scoring
    │   ├── journey_reasoning_service.py  # LangChain insights
    │   ├── roi_service.py       # ROI calculator + LLM explanation
    │   ├── loan_service.py      # Loan eligibility + LLM explanation
    │   ├── nudge_service.py     # Smart nudges (rules + LLM)
    │   ├── timeline_service.py  # Timeline generator
    │   ├── document_service.py  # Checklist + SOP generator
    │   └── memory_service.py    # Supabase + pgvector memory
    ├── agents/
    │   ├── agent_service.py     # LangGraph ReAct agent
    │   └── tools.py             # 5 structured tools
    └── db/schema.sql            # Supabase schema
```

---

## 🚀 Features

### 1. AI Mentor Chat (ChatGPT-style)

- Multi-session conversations with sidebar session list
- Session history persisted in Supabase `chat_messages` table
- LangChain `ChatPromptTemplate` with `MessagesPlaceholder` for memory
- Profile context injected into every message (GPA, field, countries, goals)
- pgvector semantic search over past conversations
- Auto-titles sessions from first message
- Rename / delete sessions

### 2. Journey Score Engine (Hybrid AI)

- **Phase 1 — Rule Engine**: `profile_score (0–40) + engagement_score (0–35) + progress_score (0–25) = journey_score (0–100)`
- **Phase 2 — LangChain Reasoning**: Converts scores into strengths, gaps, recommendations, next steps, university suggestions, scholarship tips
- Admission likelihood and loan probability as separate scores

### 3. ROI Calculator

- Static salary map (20+ fields) × country multiplier (15+ countries)
- Computes: total investment, payback period, 3/5/10-year ROI %
- LangChain generates human explanation: _"You will recover your $21,000 investment in 0.3 years"_

### 4. Loan Eligibility + Application Flow

- Rule engine: GPA (0–40pts) + STEM bonus + country bonus + income ratio
- Monthly EMI via standard amortization formula
- LangChain explanation: _"Based on your GPA of 8.5, you qualify for a $34,000 loan"_
- 4-step application: Eligibility → Document checklist → Auto-filled form → Confirmation

### 5. Application Timeline Generator

- LLM generates 5–6 phase week-by-week plan
- Static deadline data for 10+ countries
- Critical deadlines with urgency indicators
- "Do This Week" quick wins

### 6. Document Checklist + SOP Generator

- Country-specific document requirements (Germany, Canada, UK, USA, Australia, etc.)
- AI personalizes each document tip based on student profile
- SOP generator: 600–800 word draft with profile-specific content
- Static fallbacks when LLM is unavailable

### 7. LangChain ReAct Agent

- 5 structured tools: `roi_tool`, `loan_tool`, `university_search_tool`, `journey_score_tool`, `scholarship_tool`
- LLM autonomously decides which tools to call
- Multi-tool calls for complex questions: _"What are my chances and how should I finance my MS?"_ → calls 3 tools simultaneously

### 8. Smart Nudges

- 12 rule-based triggers across 5 categories: feature_unused, profile_gap, action_needed, risk_alert, milestone
- LangChain personalizes each nudge message with student's actual data
- Priority levels: high (red), medium (amber), low (violet)

### 9. Gamification

- XP system with 10 levels (Explorer → Legend)
- 11 badges: Profile Pro, Roadmap Ready, Week Warrior, Smart Investor, etc.
- Daily login streaks with auto-award at 3 and 7 days
- All state stored in Supabase `gamification` table via Express backend

### 10. Persistent Memory (Supabase + pgvector)

- `user_profiles` — profile data synced across devices
- `chat_sessions` — session metadata (title, timestamps)
- `chat_messages` — full message history with 384-dim embeddings
- `user_actions` — event tracking
- `gamification` — XP, badges, streaks
- Semantic search: `match_chat_messages()` SQL function using cosine similarity

---

## 🛠️ Tech Stack

| Layer      | Technology                                                      |
| ---------- | --------------------------------------------------------------- |
| Frontend   | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui |
| Backend    | Express.js, Node.js, Axios, express-validator, morgan           |
| AI Service | FastAPI, Python, LangChain, LangGraph                           |
| LLM        | Groq API — Llama 3.3 70B (llama-3.3-70b-versatile)              |
| Embeddings | sentence-transformers/all-MiniLM-L6-v2 (384-dim)                |
| Database   | Supabase (PostgreSQL + pgvector)                                |
| Font       | Geologica (Google Fonts)                                        |
| Icons      | Material Symbols Outlined                                       |

---

## ⚡ Quick Start

### Prerequisites

- Node.js 22+
- Python 3.12+
- Groq API key ([console.groq.com](https://console.groq.com))
- Supabase project ([supabase.com](https://supabase.com)) — optional but recommended

### 1. AI Service (FastAPI)

```bash
cd ai-service
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Add: GROQ_API_KEY=gsk_...
# Add: GROQ_MODEL=llama-3.3-70b-versatile

uvicorn main:app --reload --port 8000
```

### 2. Backend (Express)

```bash
cd backend
npm install

# Create .env
cp .env.example .env
# Add: SUPABASE_URL=https://your-project.supabase.co
# Add: SUPABASE_KEY=your_anon_key

npm start
# Runs on http://localhost:5000
```

### 3. Frontend (Next.js)

```bash
cd frontend
npm install

# .env.local already has:
# NEXT_PUBLIC_BACKEND_URL=http://localhost:5000

npm run dev
# Runs on http://localhost:3000
```

### 4. Database Setup (Optional — for persistence)

Run `ai-service/db/schema.sql` in your Supabase SQL Editor.

---

## 🌐 API Endpoints

### Express Backend (`:5000`)

| Method                | Endpoint                    | Description                   |
| --------------------- | --------------------------- | ----------------------------- |
| GET                   | `/health`                   | Health check                  |
| HEAD                  | `/health`                   | Uptime monitor ping           |
| POST                  | `/api/chat`                 | Chat with AI mentor           |
| POST                  | `/api/journey`              | Journey scoring + AI insights |
| POST                  | `/api/roi`                  | ROI calculator                |
| POST                  | `/api/loan`                 | Loan eligibility              |
| POST                  | `/api/agent`                | LangChain ReAct agent         |
| POST                  | `/api/nudges`               | Smart nudges                  |
| POST                  | `/api/timeline`             | Application timeline          |
| POST                  | `/api/documents/checklist`  | Document checklist            |
| POST                  | `/api/documents/sop`        | SOP generator                 |
| GET/POST              | `/api/profile/:userId`      | User profile CRUD             |
| GET/POST/PATCH/DELETE | `/api/chat/sessions`        | Chat session management       |
| GET/POST              | `/api/gamification/:userId` | Gamification state            |
| POST                  | `/api/gamification/track`   | Track action + award XP       |

### FastAPI AI Service (`:8000`)

All routes prefixed with `/ai/` — mirrors the Express routes above.
Interactive docs at `http://localhost:8000/docs`

---

## 🗄️ Database Schema

```sql
user_profiles     -- GPA, field, countries, goals, activities
chat_sessions     -- Session title, timestamps per user
chat_messages     -- Messages with 384-dim vector embeddings
user_actions      -- Event tracking (journey_scored, roi_calculated, etc.)
gamification      -- XP, level, streak, badges per user
```

---

## 🔑 Environment Variables

### `ai-service/.env`

```env
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
DATABASE_URL=postgresql://...  # optional
```

### `backend/.env`

```env
PORT=5000
AI_SERVICE_URL=http://127.0.0.1:8000
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co   # optional
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key                 # optional
```

---

## 📊 Judging Criteria Mapping

| Criteria                       | PathPilot Implementation                                                                                                                               |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Innovation & Creativity**    | Hybrid scoring (rule engine + LLM), ReAct agent with autonomous tool selection, ChatGPT-style multi-session chat with pgvector memory                  |
| **AI Integration & Execution** | LangChain orchestration throughout, not just raw API calls. LangGraph ReAct agent. pgvector semantic search. LLM explanations on every numeric output. |
| **User Experience**            | Geologica font, Material Symbols icons, light mode, animated score rings, gamification badges, smart nudge bar, responsive sidebar                     |
| **Business Relevance**         | Clear funnel: Landing → Signup → Journey Score → Nudges → Loan Eligibility → Loan Application. Guest user seeded with demo data.                       |
| **Prototype Quality**          | 15 working pages, 3 running services, Supabase persistence, 20+ API endpoints                                                                          |

### Bonus: Zero Human Intervention Growth Loop

```
New user lands → Signup (profile captured)
      ↓
Journey score calculated → Nudges fired (AI-personalized)
      ↓
User engages with ROI/Loan → XP awarded → Badge unlocked
      ↓
Streak maintained → More nudges → Loan application initiated
      ↓
All managed by AI agents — no human intervention required
```

---

## 👥 Guest Demo

Click **"Continue as Guest"** on the login page to explore with a pre-seeded profile:

- GPA: 7.5 | Field: Computer Science
- Target: Germany, Canada | Goal: MS in AI
- Activities: Internship, Research, Volunteer work

---

_Built with ❤️ using LangChain, Groq, FastAPI, Express, Next.js, and Supabase_
