"""
FastAPI app exposing the FinScout agent over HTTP.
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from groq import RateLimitError

from agent import research
from db import save_report, get_report, get_latest_report_for_ticker, list_reports

app = FastAPI(title="FinScout API")

# Rate limiter setup — identifies callers by IP address and enforces
# the per-route limits declared below with @limiter.limit(...)
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Locked to your actual frontend domain + local dev — not "*" anymore.
# Update the vercel URL here once you know your final deployed domain.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://finscout-frontend.vercel.app",
        "http://localhost:3000",
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class ResearchResponse(BaseModel):
    id: str
    ticker: str
    final_report: str
    was_revised: bool
    from_cache: bool


@app.post("/research/{ticker}", response_model=ResearchResponse)
@limiter.limit("10/minute")
def run_research(request: Request, ticker: str):
    """
    Runs (or reuses) a research report for a ticker.
    Checks cache first — this is the endpoint your frontend's
    search box calls. Rate-limited to 10 requests/minute per IP
    since each uncached call burns several Groq API calls.
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
    except Exception as e:
        # yfinance throws all sorts of things for bad/delisted tickers —
        # surface it as a clean 404 instead of a raw stack trace.
        raise HTTPException(404, f"Couldn't find data for '{ticker}': {e}")

    raw_data = result["raw_data"]
    saved = save_report(result, raw_data)

    return ResearchResponse(
        id=saved["id"],
        ticker=saved["ticker"],
        final_report=saved["final_report"],
        was_revised=saved["was_revised"],
        from_cache=False,
    )


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
    return list_reports(limit)


@app.get("/")
def health_check():
    return {"status": "ok", "service": "FinScout API"}