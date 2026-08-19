# agent.py
"""
The FinScout orchestrator: draft > critique > revise > final report.
agentic part, everything else is plumbing.
"""

import os
import json
import time
from groq import Groq
from groq import RateLimitError
from dotenv import load_dotenv

from tools import get_price_and_fundamentals, get_recent_news

load_dotenv()
client = Groq(api_key=os.environ["GROQ_API_KEY"])

MODEL = "llama-3.3-70b-versatile"
MAX_RATE_LIMIT_RETRIES = 3
RATE_LIMIT_BACKOFF_SECONDS = 2


def _call_llm(system_prompt: str, user_prompt: str) -> str:
    """Small wrapper so every LLM call in this file looks the same."""
    for attempt in range(MAX_RATE_LIMIT_RETRIES + 1):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,  # low temperature:grounded, consistent output, not creative writing
            )
            break
        except RateLimitError:
            if attempt == MAX_RATE_LIMIT_RETRIES:
                raise
            time.sleep(RATE_LIMIT_BACKOFF_SECONDS * (2**attempt))

    return response.choices[0].message.content


def gather_data(ticker: str) -> dict:
    """
    Step 1: PLAN + TOOL USE.
    - fetch fundamentals + news.
    (Later make this smarter: skip news for a query that's
    purely about valuation ratios. Keeping it fixed for now keeps 
    the agent loop easy to reason about while you build it.)
    """
    print(f"[1/4] Fetching data for {ticker}...")
    fundamentals = get_price_and_fundamentals(ticker)
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
    provided. Keep the same section structure as the original draft."""

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

    if critique.strip() == "OK":
        final = draft
        revised = False
    else:
        final = revise_report(draft, critique, data)
        revised = True

    return {
        "ticker": ticker.upper(),
        "final_report": final,
        "draft_report": draft,
        "critique": critique,
        "was_revised": revised,
        "raw_data": data,
    }