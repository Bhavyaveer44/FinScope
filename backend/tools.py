# tools.py
"""
Data-fetching tools for FinScope.
Each function takes a ticker and returns a plain dict, no LLM calls here.
Keeping tools deterministic means so that agent's report can always be
traced back to real numbers, not the model's imagination.
"""

import json
import math
from urllib.parse import quote
from urllib.request import Request, urlopen

import yfinance as yf


def _is_valid_price(value) -> bool:
    try:
        return math.isfinite(float(value)) and float(value) > 0
    except (TypeError, ValueError):
        return False


def _get_chart_fallback(ticker: str) -> tuple[str, float | None]:
    url = (
        "https://query1.finance.yahoo.com/v8/finance/chart/"
        f"{quote(ticker, safe='.-')}?range=5d&interval=1d"
    )
    request = Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urlopen(request, timeout=10) as response:
        payload = json.load(response)

    chart = payload.get("chart") or {}
    results = chart.get("result") or []
    if not results:
        raise ValueError(chart.get("error") or "Yahoo chart returned no data.")

    result = results[0]
    metadata = result.get("meta") or {}
    price = metadata.get("regularMarketPrice")
    if not _is_valid_price(price):
        quotes = (result.get("indicators") or {}).get("quote") or []
        closes = quotes[0].get("close", []) if quotes else []
        price = next((close for close in reversed(closes) if _is_valid_price(close)), None)

    name = metadata.get("longName") or metadata.get("shortName") or "N/A"
    return name, price if _is_valid_price(price) else None


def get_price_and_fundamentals(ticker: str) -> dict:
    """
    Pulls current price + core fundamentals for a ticker.
    yfinance scrapes this from Yahoo Finance, no API key needed.
    """
    ticker = ticker.strip().upper()
    stock = None
    info = {}
    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}
    except Exception as e:
        print(f"Warning: Failed to fetch yfinance info for {ticker}: {e}")

    current_price = info.get("currentPrice")
    if not _is_valid_price(current_price):
        current_price = info.get("regularMarketPrice")
    company_name = info.get("longName") or info.get("shortName", "N/A")
    if not _is_valid_price(current_price) and stock is not None:
        try:
            history = stock.history(period="5d")
            if not history.empty:
                closes = history["Close"].dropna()
                if not closes.empty:
                    history_price = closes.iloc[-1]
                    if _is_valid_price(history_price):
                        current_price = history_price
        except Exception as e:
            print(f"Warning: Failed to fetch yfinance price history for {ticker}: {e}")

    if not _is_valid_price(current_price):
        try:
            chart_name, chart_price = _get_chart_fallback(ticker)
            if company_name == "N/A":
                company_name = chart_name
            if chart_price is not None:
                current_price = chart_price
        except Exception as e:
            print(f"Warning: Failed to fetch Yahoo chart data for {ticker}: {e}")

    # yfinance's `info` dict has 100+ keys; want the ones relevant to a research report. 
    # Missing keys default to "N/A" instead of crashing, since not every company reports everything.
    return {
        "ticker": ticker.upper(),
        "company_name": company_name,
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "current_price": current_price if _is_valid_price(current_price) else "N/A",
        "market_cap": info.get("marketCap", "N/A"),
        "pe_ratio": info.get("trailingPE", "N/A"),
        "forward_pe": info.get("forwardPE", "N/A"),
        "eps": info.get("trailingEps", "N/A"),
        "revenue_growth": info.get("revenueGrowth", "N/A"),
        "profit_margin": info.get("profitMargins", "N/A"),
        "debt_to_equity": info.get("debtToEquity", "N/A"),
        "52_week_high": info.get("fiftyTwoWeekHigh", "N/A"),
        "52_week_low": info.get("fiftyTwoWeekLow", "N/A"),
        "dividend_yield": info.get("dividendYield", "N/A"),
        "analyst_recommendation": info.get("recommendationKey", "N/A"),
        "business_summary": info.get("longBusinessSummary", "N/A"),
    }


def get_recent_news(ticker: str, limit: int = 5) -> list[dict]:
    """
    Pulls recent news headlines for a ticker via yfinance.
    Returns a short list of {title, publisher, link} so the LLM has
    real, citable sources instead of vague 'recent sentiment'.
    """
    raw_news = []
    try:
        stock = yf.Ticker(ticker)
        raw_news = stock.news or []
    except Exception as e:
        print(f"Warning: stock.news failed for {ticker}: {e}")

    # Fallback to yf.Search if stock.news was empty or failed
    if not raw_news:
        try:
            search = yf.Search(ticker)
            raw_news = getattr(search, "news", []) or []
        except Exception as e:
            print(f"Warning: yf.Search news failed for {ticker}: {e}")

    articles = []
    for item in raw_news[:limit]:
        if not isinstance(item, dict):
            continue
        content = item.get("content", item)
        if not isinstance(content, dict):
            content = item

        title = content.get("title") or item.get("title", "N/A")

        publisher = "N/A"
        if isinstance(content.get("publisher"), str):
            publisher = content["publisher"]
        elif isinstance(item.get("publisher"), str):
            publisher = item["publisher"]
        elif isinstance(content.get("provider"), dict):
            publisher = content["provider"].get("displayName", "N/A")
        elif isinstance(item.get("provider"), dict):
            publisher = item["provider"].get("displayName", "N/A")

        link = "N/A"
        if isinstance(content.get("link"), str):
            link = content["link"]
        elif isinstance(item.get("link"), str):
            link = item["link"]
        elif isinstance(content.get("canonicalUrl"), dict):
            link = content.get("canonicalUrl", {}).get("url", "N/A")
        elif isinstance(item.get("canonicalUrl"), dict):
            link = item.get("canonicalUrl", {}).get("url", "N/A")

        if title and title != "N/A":
            articles.append({
                "title": title,
                "publisher": publisher,
                "link": link,
            })

    return articles