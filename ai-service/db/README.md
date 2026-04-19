# PathPilot — Supabase Setup

## 1. Create a Supabase project

Go to https://supabase.com → New Project

## 2. Run the schema

In Supabase SQL Editor, paste and run `schema.sql`

## 3. Add env vars to `ai-service/.env`

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

Find these in: Supabase Dashboard → Settings → API

## 4. Restart the AI service

```bash
uvicorn main:app --reload --port 8000
```

## 5. Verify

```bash
curl http://localhost:8000/ai/chat/memory/status
```

Should return:

```json
{
  "persistent_memory_available": true,
  "backend": "supabase+pgvector"
}
```

## Memory features enabled after setup

- User profiles stored across sessions
- Chat history persisted (survives server restarts)
- Semantic search over past conversations
- "Oh, you previously mentioned Canada..." style responses
- User action tracking (journey scores, saved universities)
