# agent.py
"""
The FinScope orchestrator: draft > critique > revise > final report.
agentic part, everything else is plumbing.
"""

import os
import json
import re
import time
from pathlib import Path
from groq import Groq
from groq import RateLimitError
from dotenv import load_dotenv

from tools import get_price_and_fundamentals, get_recent_news

# Load backend/.env reliably regardless of working directory
_backend_dir = Path(__file__).resolve().parent
_env_path = _backend_dir / ".env"
if _env_path.exists():
    load_dotenv(dotenv_path=_env_path)
load_dotenv()

DEFAULT_MODEL = "openai/gpt-oss-20b"
MAX_RATE_LIMIT_RETRIES = 3
RATE_LIMIT_BACKOFF_SECONDS = 2
MAX_COMPLETION_TOKENS = 4096
REQUIRED_REPORT_SECTIONS = (
    "Company Overview",
    "Financial Snapshot",
    "Recent News Summary",
    "Bull Case",
    "Bear Case",
    "Disclaimer",
)


def has_required_report_sections(report: str) -> bool:
    for section in REQUIRED_REPORT_SECTIONS:
        pattern = rf"(?im)^\s*(?:#{{1,6}}\s*)?(?:\*\*)?(?:\d+[.)]\s*)?{re.escape(section)}\b"
        if not re.search(pattern, report):
            return False
    return True


def _ensure_required_report_sections(report: str, data: dict) -> str:
    fallback_content = {
        "Company Overview": "Verified business details were unavailable in the source data.",
        "Financial Snapshot": (
            f"Current price: {data['fundamentals'].get('current_price', 'Unavailable')}. "
            "Other verified metrics were unavailable in this report."
        ),
        "Recent News Summary": "No recent news summary was provided in this report.",
        "Bull Case": "No positive catalysts can be confirmed from the provided source data.",
        "Bear Case": "The provided source data is insufficient to assess company-specific risks.",
        "Disclaimer": "This report is for research purposes only and is not financial advice.",
    }
    missing = [
        f"## {index}. {section}\n\n{fallback_content[section]}"
        for index, section in enumerate(REQUIRED_REPORT_SECTIONS, start=1)
        if not re.search(
            rf"(?im)^\s*(?:#{{1,6}}\s*)?(?:\*\*)?(?:\d+[.)]\s*)?{re.escape(section)}\b",
            report,
        )
    ]
    if missing:
        report = f"{report.rstrip()}\n\n" + "\n\n".join(missing)
    return report


def _get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing GROQ_API_KEY. Add it to backend/.env before running research."
        )
    return Groq(api_key=api_key)


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Small wrapper so every LLM call in this file looks the same."""
    client = _get_groq_client()
    model = os.getenv("GROQ_MODEL", DEFAULT_MODEL)
    completion_options = {"max_completion_tokens": MAX_COMPLETION_TOKENS}
    if model.startswith("openai/gpt-oss-"):
        completion_options["reasoning_effort"] = "low"

    response = None
    for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,  # low temperature: grounded, consistent output, not creative writing
                **completion_options,
            )
            break
        except RateLimitError:
            if attempt == MAX_RATE_LIMIT_RETRIES:
                raise
            time.sleep(RATE_LIMIT_BACKOFF_SECONDS * (2**attempt))

    if response is None or not response.choices:
        raise RuntimeError("No response returned by language model.")

    choice = response.choices[0]
    content = choice.message.content
    if not content or not content.strip():
        finish_reason = choice.finish_reason or "unknown"
        raise RuntimeError(
            f"Language model returned an empty response (finish reason: {finish_reason})."
        )

    return content


def gather_data(ticker: str) -> dict:
    """
    Step 1: PLAN + TOOL USE.
    - fetch fundamentals + news.
    """
    print(f"[1/4] Fetching data for {ticker}...")
    fundamentals = get_price_and_fundamentals(ticker)

    # A company name alone is not sufficient evidence that market data was found.
    if fundamentals.get("current_price") == "N/A":
        raise ValueError(
            f"No market data found for ticker '{ticker}'. Please verify the symbol or try again later."
        )

    news = get_recent_news(ticker)
    return {"fundamentals": fundamentals, "news": news}


def draft_report(data: dict) -> str:
    """
    Step 2: DRAFT.
    The LLM only sees the data we fetched — it's instructed not to
    invent numbers. This is what keeps the report grounded.
    """
    print("[2/4] Drafting report...")

    system_prompt = """You are an equity research assistant. Write a
    clear, structured research note using ONLY the data provided below.
    Never invent numbers, dates, or facts not present in the data.
    If a data point is 'N/A', say it's unavailable rather than guessing.

    Structure your report with these sections:
    1. Company Overview
    2. Financial Snapshot (key ratios, explain what they mean briefly)
    3. Recent News Summary
    4. Bull Case (2-3 points)
    5. Bear Case / Risks (2-3 points)
    6. Disclaimer: this is not financial advice, for research purposes only.
    Do not omit any section. If the source data is insufficient, state that
    clearly instead of inventing details.
    """

    user_prompt = f"""Here is the data to base the report on:

    FUNDAMENTALS:
    {json.dumps(data['fundamentals'], indent=2)}

    RECENT NEWS:
    {json.dumps(data['news'], indent=2)}
    """

    return _call_llm(system_prompt, user_prompt)


def critique_report(draft: str, data: dict) -> str:
    """
    Step 3: REFLECT.
    This is the part most 'agent' tutorials skip. A separate LLM call
    re-reads the draft against the raw data and looks for problems —
    unsupported claims, missing sections, or numbers that don't match
    the source data. It returns either 'OK' or a bullet list of fixes.
    """
    print("[3/4] Critiquing draft...")

    system_prompt = """You are a meticulous fact-checking editor for
    equity research notes. Compare the DRAFT REPORT against the SOURCE DATA.

    Check for:
    - Any number or claim in the draft that is NOT supported by the source data
    - Any required section that's missing (Overview, Financial Snapshot,
    News Summary, Bull Case, Bear Case, Disclaimer)
    - Vague claims that should be more specific given the data available

    If the report is accurate and complete, respond with exactly: OK
    Otherwise, respond with a short bullet list of specific fixes needed.
    Do not rewrite the report yourself — just list the problems.
    """

    user_prompt = f"""SOURCE DATA:
    {json.dumps(data, indent=2)}

    DRAFT REPORT:
    {draft}
    """

    return _call_llm(system_prompt, user_prompt)


def revise_report(draft: str, critique: str, data: dict) -> str:
    """
    Step 4: REVISE.
    Only called if critique found problems. The LLM gets the original
    draft, the specific complaints, and the source data, and produces
    a corrected version in one pass.
    """
    print("[4/4] Revising based on critique...")

    system_prompt = """You are an equity research assistant. You wrote
    a draft report that an editor found issues with. Produce a corrected
    final version that fixes every issue listed, using ONLY the source data
    provided. Include all six sections: Company Overview, Financial Snapshot,
    Recent News Summary, Bull Case, Bear Case / Risks, and Disclaimer. If
    evidence is unavailable, state that rather than omitting a section or
    inventing facts."""

    user_prompt = f"""SOURCE DATA:
    {json.dumps(data, indent=2)}

    ORIGINAL DRAFT:
    {draft}

    EDITOR'S FEEDBACK:
    {critique}

    Write the corrected final report."""

    return _call_llm(system_prompt, user_prompt)


def research(ticker: str) -> dict:
    """
    The full agent loop, tied together. Returns both the final report
    and a trace of what happened — useful for debugging and, later,
    for showing users 'how the agent got here'.
    """
    data = gather_data(ticker)
    draft = draft_report(data)
    critique = critique_report(draft, data)

    critique_clean = critique.strip().strip("'\"").upper()
    if critique_clean == "OK" or critique_clean.startswith("OK.") or critique_clean.startswith("OK -"):
        final = draft
        revised = False
    else:
        final = revise_report(draft, critique, data)
        revised = True

    final = _ensure_required_report_sections(final, data)

    return {
        "ticker": ticker.upper(),
        "final_report": final.strip(),
        "draft_report": draft.strip(),
        "critique": critique.strip(),
        "was_revised": revised,
        "raw_data": data,
    }