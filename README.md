# Codeforces AI Coach, Rebuilt

A much deeper version of the original project.

Instead of only plotting Codeforces stats and sending a loose prompt to Gemini, this version builds a structured competitive-programming profile first, then uses an LLM as the final coaching layer.

## What changed

### 1. Hybrid coaching engine

The backend now computes a richer player model from Codeforces data:

- recent rating momentum across short and long windows
- weekly practice consistency
- average and hardest solved difficulty
- tag exposure across solved problems
- contest pressure score
- contest efficiency score
- first-AC speed and conversion rate
- upsolve behavior as a resilience signal
- strengths and focus areas inferred from the data

This makes the project feel more like an AI system with explicit reasoning, not just an API wrapper around a chatbot.

### 2. Structured deep-analysis endpoint

New main endpoint:

- `GET /user/deep-analysis?handle=...`

It returns:

- profile snapshot
- overview metrics
- full rating history
- weekly practice data
- recent contest diagnostics
- skill radar data
- one-week training plan
- AI report payload

### 3. Better AI design

The app now uses a hybrid flow:

1. deterministic contest + practice analytics are computed first
2. those metrics are packed into a structured coaching prompt
3. Gemini is used only if available
4. if Gemini is unavailable, the app falls back to a deterministic local coaching report instead of breaking

That fallback makes the project far more robust and demo-friendly.

### 4. Full frontend rebuild

The frontend now presents:

- a stronger landing/analysis surface
- player identity card
- coach score
- rating trajectory chart
- weekly consistency chart
- skill radar
- tag exposure chart
- strengths and focus areas
- recent contest diagnosis cards
- one-week training plan
- dedicated AI report page

## Stack

### Backend

- Flask
- Flask-CORS
- Flask-Caching
- Requests
- python-dotenv
- Google GenAI SDK

### Frontend

- React 19
- TypeScript
- Vite
- Recharts

## Run locally

### Backend

```bash
cd src
pip install -r requirements.txt
python main.py
```

Backend runs at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Optional environment variable

Create `src/.env` if you want live Gemini output:

```env
GEMINI_API_KEY=your_key_here
```

Without this key, the app still works using the built-in heuristic coaching fallback.

## Core files

- `src/main.py`: API routes
- `src/cf_api.py`: Codeforces fetching + caching
- `src/contest_advice.py`: deep analytics, contest diagnosis, skill model, training plan, LLM prompt builder
- `src/ai_api.py`: Gemini wrapper + local fallback report
- `frontend/src/App.tsx`: main dashboard
- `frontend/src/contest_advice.tsx`: AI report page
- `frontend/src/types.ts`: shared frontend data model

## Verification

Verified during the rewrite:

- backend files pass Python AST parsing
- frontend production build passes
- frontend lint passes
