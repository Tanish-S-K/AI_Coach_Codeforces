# ⚡ Codeforces AI Coach

> A full-stack web app that analyzes your Codeforces performance and delivers personalized AI coaching based on your real contest history.

---

## 📋 Project Summary

- **Built a Codeforces analytics dashboard** that fetches live user data via the Codeforces public API and visualizes rating history, weekly problem-solving activity, difficulty distribution, and topic coverage using interactive charts (Area, Bar, Radar).
- **Engineered a per-contest AI coaching engine** powered by Google Gemini (gemini-2.5-flash) that ingests a user's last N contests — including solved/upsolved/unsolved problems, accuracy, timing, and rating deltas — and generates personalized, paragraph-style improvement advice for each contest.
- **Delivered a responsive React frontend** with four distinct pages (Dashboard, Contests, Problems, AI Advice) that communicate with a Flask REST API backend, featuring server-side caching to avoid redundant Codeforces API calls and a clean dark-themed UI.

---

## ⚡ Performance Optimization

Implemented **server-side in-memory caching** for Codeforces API responses using **Flask-Caching**, eliminating redundant external API requests for frequently accessed user data.

### Benchmark Results

| Endpoint                | Before (avg) | After (avg) | Improvement |
| ----------------------- | -----------: | ----------: | ----------: |
| `/user/info`            |      2372 ms |   **23 ms** |  **99.02%** |
| `/user/problem-history` |      4978 ms |   **34 ms** |  **99.31%** |
| `/user/weekly-progress` |      5684 ms |   **28 ms** |  **99.50%** |
| `/user/rating-history`  |      7831 ms |   **20 ms** |  **99.74%** |

**Overall impact**

* Reduced repeated Codeforces API requests from **2–8 seconds** to **20–34 ms** through in-memory cache lookups.
* Achieved **99%+ reduction in average response latency** across all major analytics endpoints.
* Decreased external API usage, improving scalability while reducing the likelihood of Codeforces rate limiting.
* Cached responses automatically expire after **1 hour**, ensuring users receive fresh data without sacrificing performance.


## 🔗 Live Demo
👉 **[Try it here](https://ai-coach-codeforces.vercel.app/)**

> ⚠️ Backend is on Render's free tier — first load may take 30–60 sec to wake up. Subsequent requests are instant.

## 🗂️ Project Structure

```
project/
├── frontend/                        # React frontend (Vite)
│   ├── public/
│   │   └── index.html               # HTML entry point
│   ├── src/
│   │   ├── App.jsx                  # Entire frontend — all pages & components
│   │   └── main.jsx                 # React root mount
│   ├── vite.config.js               # Vite config with /user proxy to Flask
│   └── package.json                 # Frontend dependencies
│
└── src/                             # Flask backend
    ├── main.py                      # Flask app — all API routes
    ├── cf_api.py                    # Codeforces API calls + caching logic
    ├── ai_api.py                    # Google Gemini API wrapper
    ├── contest_advice.py            # Contest analysis + AI prompt builder
    ├── .env                         # API keys (not committed to git)
    └── requirements.txt             # Python dependencies
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/user/info?handle=` | Basic profile — rating, rank, avatar |
| GET | `/user/rating-history?handle=` | Full contest history with per-contest solve stats |
| GET | `/user/weekly-progress?handle=` | Problems solved per week (last 24 weeks) |
| GET | `/user/problem-history?handle=` | Every problem ever solved with tags & difficulty |
| GET/POST | `/user/contest-advice?handle=` | AI coaching report for last 3 contests |

---

## 📦 Dependencies

### Backend (Python)

Install with:
```bash
pip install -r requirements.txt
```

| Package | Purpose |
|---------|---------|
| `flask` | Web framework & REST API server |
| `flask-cors` | Allow cross-origin requests from the React frontend |
| `flask-caching` | Server-side in-memory caching for CF API responses |
| `requests` | HTTP calls to the Codeforces public API |
| `google-genai` | Google Gemini AI SDK for generating coaching advice |
| `python-dotenv` | Load `GEMINI_API_KEY` from the `.env` file |

### Frontend (Node.js)

Install with:
```bash
npm install
```

| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `recharts` | Charts — Area, Bar, Radar, and more |
| `vite` | Dev server & bundler |

---

## 🔑 Environment Setup

Create a `.env` file inside the `src/` folder:

```
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Get your free Gemini API key at: https://aistudio.google.com/app/apikey

---

## 🚀 How to Run

You need **two terminals** running simultaneously — one for the backend, one for the frontend.

### Terminal 1 — Start the Flask Backend

```bash
cd project/src
pip install -r requirements.txt      # first time only
python main.py
```

Flask will start at `http://localhost:5000`

### Terminal 2 — Start the React Frontend

```bash
cd project/frontend
npm install                          # first time only
npm run dev
```

Frontend will start at `http://localhost:5173`

Open `http://localhost:5173` in your browser, type any Codeforces handle, and hit **Analyze**.

---

## 🖥️ Pages

| Page | What it shows |
|------|--------------|
| **Dashboard** | Profile card, rating over time, weekly grind chart, difficulty distribution, top tags bar chart, topic radar |
| **Contests** | Full contest history table — rank, rating change, division, problems solved |
| **Problems** | Searchable + filterable list of every problem solved, with difficulty color coding |
| **AI Advice** | Per-contest accordion cards with metrics, problem breakdowns, and AI coach paragraphs |

---

## ⚙️ How the AI Coaching Works

1. The backend fetches the user's last 3 contests from Codeforces
2. For each contest, it calculates: problems solved/upsolved/unsolved, first AC time, accuracy, rating delta, tags covered, and difficulty range
3. All of this is packed into a structured prompt and sent to **Gemini 2.5 Flash**
4. The AI responds with coach-style paragraph advice — no bullet lists, just natural language
5. The frontend splits that advice across the contest cards so each contest gets its own coaching section
6. Results are cached for 1 hour so the AI isn't called on every page refresh

---

## 📝 Notes

- The Codeforces API is public and requires no key — but it rate-limits heavy traffic, so caching is important
- The AI Advice page can take **10–20 seconds** to load on first fetch since Gemini needs to process a large prompt
- Clicking **Refresh Analysis** on the AI page bypasses the cache and re-generates fresh advice
- The frontend proxies all `/user/...` API calls to Flask via Vite's `server.proxy` config, so no CORS issues in development
