"""
Supabase persistence layer. Keeps all database calls in one place
so the rest of the app doesn't need to know or care what DB we use.
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

_client = create_client(
    os.environ["SUPABASE_URL"],
    os.environ["SUPABASE_KEY"],
)


def save_report(result: dict, raw_data: dict) -> dict:
    """Persists a completed research result. Returns the saved row (with its new id)."""
    row = {
        "ticker": result["ticker"],
        "final_report": result["final_report"],
        "draft_report": result["draft_report"],
        "critique": result["critique"],
        "was_revised": result["was_revised"],
        "raw_data": raw_data,
    }
    response = _client.table("reports").insert(row).execute()
    return response.data[0]


def get_report(report_id: str) -> dict | None:
    """Fetches one report by id. Returns None if not found."""
    response = _client.table("reports").select("*").eq("id", report_id).execute()
    return response.data[0] if response.data else None


def get_latest_report_for_ticker(ticker: str, max_age_minutes: int = 30) -> dict | None:
    """
    Checks if already have a recent report for this ticker,caching strategy
    no re-running the whole agent if someone asked for same ticker 2m ago.
    30m: reasonable freshness window for stock data that isn't intraday-critical.
    """
    from datetime import datetime, timedelta, timezone

    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=max_age_minutes)).isoformat()
    response = (
        _client.table("reports")
        .select("*")
        .eq("ticker", ticker.upper())
        .gte("created_at", cutoff)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return response.data[0] if response.data else None


def list_reports(limit: int = 20) -> list[dict]:
    """Returns recent reports across all tickers, newest first — powers the history page."""
    response = (
        _client.table("reports")
        .select("id, ticker, was_revised, created_at")  # skip heavy text fields for a list view
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    return response.data