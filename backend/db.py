"""
Persistence layer for FinScout.
Supports Supabase with automatic SQLite fallback so the application
remains fully functional even if Supabase is unreachable, unconfigured, or offline.
"""

import json
import logging
import os
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from dotenv import load_dotenv

# Ensure backend/.env is loaded regardless of current working directory
_backend_dir = Path(__file__).resolve().parent
_env_path = _backend_dir / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
load_dotenv()

logger = logging.getLogger("finscout.db")
SQLITE_DB_PATH = _backend_dir / "finscout.db"


def _init_sqlite():
    with sqlite3.connect(SQLITE_DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                ticker TEXT NOT NULL,
                final_report TEXT NOT NULL,
                draft_report TEXT NOT NULL,
                critique TEXT NOT NULL,
                was_revised INTEGER NOT NULL,
                raw_data TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_reports_ticker ON reports(ticker)"
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at)"
        )
        conn.commit()


_init_sqlite()


def _get_supabase_client():
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    if not url or not key:
        return None
    try:
        from supabase import create_client

        client = create_client(url, key)
        # Verify connection with a lightweight check
        client.table("reports").select("id").limit(1).execute()
        return client
    except Exception as e:
        logger.warning(
            f"Supabase connection unavailable ({e}); falling back to local SQLite database."
        )
        return None


_supabase_client = None
_checked_supabase = False


def _get_active_supabase():
    global _supabase_client, _checked_supabase
    if not _checked_supabase:
        _checked_supabase = True
        _supabase_client = _get_supabase_client()
    return _supabase_client


# ---------------------------------------------------------------------------
# SQLite Handlers
# ---------------------------------------------------------------------------


def _sqlite_save_report(report_id: str, row: dict) -> dict:
    with sqlite3.connect(SQLITE_DB_PATH) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO reports (id, ticker, final_report, draft_report, critique, was_revised, raw_data, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                report_id,
                row["ticker"],
                row["final_report"],
                row["draft_report"],
                row["critique"],
                1 if row["was_revised"] else 0,
                json.dumps(row["raw_data"]),
                row["created_at"],
            ),
        )
        conn.commit()

    return {
        "id": report_id,
        "ticker": row["ticker"],
        "final_report": row["final_report"],
        "draft_report": row["draft_report"],
        "critique": row["critique"],
        "was_revised": bool(row["was_revised"]),
        "raw_data": row["raw_data"],
        "created_at": row["created_at"],
    }


def _sqlite_get_report(report_id: str) -> dict | None:
    with sqlite3.connect(SQLITE_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute("SELECT * FROM reports WHERE id = ?", (report_id,))
        row = cursor.fetchone()
        if not row:
            return None

        return {
            "id": row["id"],
            "ticker": row["ticker"],
            "final_report": row["final_report"],
            "draft_report": row["draft_report"],
            "critique": row["critique"],
            "was_revised": bool(row["was_revised"]),
            "raw_data": json.loads(row["raw_data"]),
            "created_at": row["created_at"],
        }


def _sqlite_get_latest_report(ticker: str, cutoff_iso: str) -> dict | None:
    with sqlite3.connect(SQLITE_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(
            """
            SELECT * FROM reports
            WHERE ticker = ? AND created_at >= ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (ticker.upper(), cutoff_iso),
        )
        row = cursor.fetchone()
        if not row:
            return None

        return {
            "id": row["id"],
            "ticker": row["ticker"],
            "final_report": row["final_report"],
            "draft_report": row["draft_report"],
            "critique": row["critique"],
            "was_revised": bool(row["was_revised"]),
            "raw_data": json.loads(row["raw_data"]),
            "created_at": row["created_at"],
        }


def _sqlite_list_reports(limit: int = 20) -> list[dict]:
    with sqlite3.connect(SQLITE_DB_PATH) as conn:
        conn.row_factory = sqlite3.Row
        cursor = conn.execute(
            """
            SELECT id, ticker, was_revised, created_at
            FROM reports
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        rows = cursor.fetchall()
        return [
            {
                "id": r["id"],
                "ticker": r["ticker"],
                "was_revised": bool(r["was_revised"]),
                "created_at": r["created_at"],
            }
            for r in rows
        ]


# ---------------------------------------------------------------------------
# Public Database API
# ---------------------------------------------------------------------------


def save_report(result: dict, raw_data: dict) -> dict:
    """Persists a completed research result. Returns the saved row."""
    report_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    row_data = {
        "id": report_id,
        "ticker": result["ticker"],
        "final_report": result["final_report"],
        "draft_report": result["draft_report"],
        "critique": result["critique"],
        "was_revised": bool(result["was_revised"]),
        "raw_data": raw_data,
        "created_at": created_at,
    }

    # Save to SQLite first to guarantee durability
    saved_sqlite = _sqlite_save_report(report_id, row_data)

    # If Supabase is available, dual-write
    sb = _get_active_supabase()
    if sb:
        try:
            sb.table("reports").insert(
                {
                    "id": report_id,
                    "ticker": row_data["ticker"],
                    "final_report": row_data["final_report"],
                    "draft_report": row_data["draft_report"],
                    "critique": row_data["critique"],
                    "was_revised": row_data["was_revised"],
                    "raw_data": raw_data,
                }
            ).execute()
        except Exception as e:
            logger.warning(f"Could not persist to Supabase: {e}")

    return saved_sqlite


def get_report(report_id: str) -> dict | None:
    """Fetches one report by id. Returns None if not found."""
    # Check SQLite first
    local = _sqlite_get_report(report_id)
    if local:
        return local

    # Try Supabase if available
    sb = _get_active_supabase()
    if sb:
        try:
            resp = sb.table("reports").select("*").eq("id", report_id).execute()
            if resp.data:
                return resp.data[0]
        except Exception as e:
            logger.warning(f"Failed to fetch report from Supabase: {e}")

    return None


def get_latest_report_for_ticker(ticker: str, max_age_minutes: int = 30) -> dict | None:
    """
    Checks if we already have a recent report for this ticker.
    Returns cached report or None.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(minutes=max_age_minutes)).isoformat()

    local = _sqlite_get_latest_report(ticker, cutoff)
    if local:
        return local

    sb = _get_active_supabase()
    if sb:
        try:
            resp = (
                sb.table("reports")
                .select("*")
                .eq("ticker", ticker.upper())
                .gte("created_at", cutoff)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if resp.data:
                return resp.data[0]
        except Exception as e:
            logger.warning(f"Failed to query latest report from Supabase: {e}")

    return None


def list_reports(limit: int = 20) -> list[dict]:
    """Returns recent reports across all tickers, newest first."""
    local_reports = _sqlite_list_reports(limit)
    if local_reports:
        return local_reports

    sb = _get_active_supabase()
    if sb:
        try:
            resp = (
                sb.table("reports")
                .select("id, ticker, was_revised, created_at")
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return resp.data or []
        except Exception as e:
            logger.warning(f"Failed to list reports from Supabase: {e}")

    return []