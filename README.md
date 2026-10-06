# FinScope- Autonomous Equity Research Agent

FinScout is an autonomous equity research agent that takes a stock ticker and produces an institutional-grade research note. 
Instead of relying on a single LLM call, FinScout executes an iterative **Plan → Act → Reflect** agentic loop that 
fetches live market data, drafts a report, fact-checks its own output against ground truth source data, and revises discrepancies before presentation.

---

## Features

- **Autonomous Agentic Loop**:
  1. **Plan & Tool Use**: Gathers live fundamentals and recent news via `yfinance` & market search.
  2. **Draft**: Generates an initial research note strictly grounded in fetched metrics.
  3. **Reflect & Critique**: A separate fact-checking LLM pass audits the draft against the raw data for ungrounded claims or omitted sections.
  4. **Revise**: Re-writes and corrects any identified discrepancies in one unified pass.
  
- **Interactive Follow-Up Q&A**: Ask ad-hoc questions on any report. Answers are synthesized strictly from the report's fetched market data and sources without hallucinations.
- **Report Caching & History**: Fast report retrieval with 30-minute freshness caching to optimize LLM API usage.
- **Resilient Dual-Engine Persistence**: Works seamlessly offline or locally using embedded **SQLite**, with automatic **Supabase** cloud sync when configured.
- **Modern Responsive UI**: Built with Next.js 16 (App Router), Tailwind CSS v4, and Tailwind Typography in a sleek dark theme.

---

## Tech Stack

- **Backend**: FastAPI, Python 3.12, Uvicorn, SlowAPI (rate limiting)
- **AI / LLM**: Groq API (`openai/gpt-oss-20b` / `llama-3.3-70b-versatile`)
- **Market Data**: `yfinance` (real-time quotes, fundamentals, search news)
- **Database**: SQLite (local default) + Supabase (PostgreSQL cloud sync)
- **Frontend**: Next.js 16 (Turbopack), React 19, Tailwind CSS v4, `@tailwindcss/typography`
- **Testing**: `pytest`, FastAPI `TestClient`, ESLint

---

## Project Structure

```text
finscout/
├── backend/
│   ├── agent.py            # Agent loop (gather -> draft -> critique -> revise)
│   ├── db.py               # Dual-engine persistence (SQLite + Supabase fallback)
│   ├── main.py             # FastAPI HTTP routes & rate limiting
│   ├── tools.py            # Deterministic data fetching tools (yfinance)
│   ├── test_api.py         # API integration & persistence test suite
│   ├── test_cors.py        # CORS policy verification tests
│   ├── test_e2e_live.py    # Live end-to-end research flow test
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Backend environment variables template
├── frontend/
│   ├── app/                # Next.js App Router (page, history, detail routes)
│   ├── components/         # ReportView & AskFollowUp UI components
│   ├── lib/api.ts          # Type-safe API client & multi-endpoint fallback
│   ├── tailwind.config.ts  # Tailwind CSS configuration
│   └── .env.example        # Frontend environment variables template
└── README.md
```

---

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ and `npm`

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
pip install pytest

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env` with your API keys:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b

# Optional (SQLite will be used automatically if omitted or offline):
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key
```

Start the backend server:

```bash
python -m uvicorn main:app --reload --port 8000
```
Backend will be live at `http://127.0.0.1:8000` (Interactive API docs at `http://127.0.0.1:8000/docs`).

---

### 3. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
```

Ensure `frontend/.env.local` contains:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing

### Backend Test Suite
Run all unit, integration, and live verification tests:

```bash
cd backend
python -m pytest
```

### Frontend Linting & Build
Verify TypeScript compilation and lint rules:

```bash
cd frontend
npm run lint
npm run build
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/research/{ticker}` | Runs (or fetches cached) research report for a stock symbol |
| `POST` | `/reports/{id}/ask` | Answers follow-up questions strictly from fetched report data |
| `GET` | `/reports` | Retrieves recent research reports summary history |
| `GET` | `/reports/{id}` | Fetches complete report details by ID |
| `GET` | `/` | Service health check |

---

## Disclaimer

Generated reports are synthesized autonomously by an AI agent using publicly available market data. This project is for research and educational purposes only and does **not** constitute financial advice.
