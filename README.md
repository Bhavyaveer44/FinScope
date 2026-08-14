# FinScout — Autonomous Equity Research Agent

FinScout takes a stock ticker and produces a structured research report
by autonomously fetching live market data, drafting a report, and
critiquing/revising its own output before returning it
a plan → act → reflect loop, not a single LLM call.


- Plans which data to fetch based on the ticker
- Calls real tools (yfinance, not model memory) for grounded numbers
- Self-critiques the draft against source data and revises when it
  finds unsupported claims.

## Live demo
https://fin-scope-seven.vercel.app 

## Stack
FastAPI, Groq (Llama 3.3 70B), yfinance, Supabase, Next.js, Tailwind

