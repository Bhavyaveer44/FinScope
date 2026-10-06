"""
FastAPI app exposing the FinScope agent over HTTP.
"""

import json
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from groq import RateLimitError

# Load environment reliably
_backend_dir = Path(__file__).resolve().parent
_env_path = _backend_dir / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
load_dotenv()

from agent import research, _call_llm
from db import save_report, get_report, get_latest_report_for_ticker, list_reports

app = FastAPI(title="FinScout API")

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allow the production Vercel app plus its preview deployments and local dev.
allowed_origins = [
    "https://fin-scope-seven.vercel.app",
    "https://finscope-eqgc.onrender.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
]
extra_allowed_origins = os.getenv("CORS_ALLOWED_ORIGINS", "")
if extra_allowed_origins:
    allowed_origins.extend(
        origin.strip() for origin in extra_allowed_origins.split(",") if origin.strip()
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class ResearchResponse(BaseModel):
    id: str
    ticker: str
    final_report: str
    was_revised: bool
    from_cache: bool


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str


@app.post("/research/{ticker}", response_model=ResearchResponse)
@limiter.limit("10/minute")
def run_research(request: Request, ticker: str):
    """
    Runs (or reuses) a research report for a ticker.
    Checks cache first. Rate-limited to 10 requests/minute per IP.
    """
    ticker = ticker.upper().strip()
    if not ticker.isalpha() or len(ticker) > 6:
        raise HTTPException(400, "That doesn't look like a valid ticker symbol.")

    cached = get_latest_report_for_ticker(ticker)
    if cached:
        return ResearchResponse(
            id=cached["id"],
            ticker=cached["ticker"],
            final_report=cached["final_report"],
            was_revised=cached["was_revised"],
            from_cache=True,
        )

    try:
        result = research(ticker)
    except RateLimitError:
        raise HTTPException(
            429,
            "The research provider is temporarily rate limited. Please try again in a moment.",
        )
    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(404, str(e))
    except RuntimeError as e:
        raise HTTPException(500, f"Research service failed for '{ticker}': {e}")
    except Exception as e:
        raise HTTPException(500, f"Couldn't complete research for '{ticker}': {e}")

    raw_data = result["raw_data"]
    saved = save_report(result, raw_data)

    return ResearchResponse(
        id=saved["id"],
        ticker=saved["ticker"],
        final_report=saved["final_report"],
        was_revised=saved["was_revised"],
        from_cache=False,
    )


@app.post("/reports/{report_id}/ask", response_model=AskResponse)
@limiter.limit("20/minute")
def ask_followup(request: Request, report_id: str, body: AskRequest):
    """
    Answers a follow-up question using ONLY the data already fetched
    for this report -- no new tool calls, grounded in fetched data.
    """
    if not body.question.strip():
        raise HTTPException(400, "Question cannot be empty.")

    report = get_report(report_id)
    if not report:
        raise HTTPException(404, "Report not found.")

    system_prompt = """You are answering a follow-up question about an
equity research report. Answer ONLY using the report text and source
data provided below. If the answer isn't in the data, say so clearly
instead of guessing. Keep the answer to 2-4 sentences."""

    user_prompt = f"""REPORT:
{report['final_report']}

SOURCE DATA:
{json.dumps(report['raw_data'], indent=2)}

QUESTION: {body.question}"""

    try:
        answer = _call_llm(system_prompt, user_prompt)
    except RateLimitError:
        raise HTTPException(
            429,
            "The AI provider is temporarily rate limited. Please try again in a moment.",
        )
    except Exception as e:
        raise HTTPException(500, f"Failed to answer question: {e}")

    return AskResponse(answer=answer)


@app.get("/reports/{report_id}")
@limiter.limit("30/minute")
def fetch_report(request: Request, report_id: str):
    report = get_report(report_id)
    if not report:
        raise HTTPException(404, "Report not found.")
    return report


@app.get("/reports")
@limiter.limit("30/minute")
def fetch_history(request: Request, limit: int = 20):
    try:
        return list_reports(limit)
    except Exception as e:
        raise HTTPException(500, f"Failed to retrieve report history: {e}")


@app.get("/")
def health_check():
    return {"status": "ok", "service": "FinScout API"}