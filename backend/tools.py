# tools.py
"""
Data-fetching tools for FinScout.
Each function takes a ticker and returns a plain dict, no LLM calls here.
Keeping tools deterministic means so that agent's report can always be
traced back to real numbers, not the model's imagination.
"""

import yfinance as yf


def get_price_and_fundamentals(ticker: str) -> dict:
    """
    Pulls current price + core fundamentals for a ticker.
    yfinance scrapes this from Yahoo Finance, no API key needed.
    """
    try:
        stock = yf.Ticker(ticker)
        info = stock.info or {}
    except Exception as e:
        print(f"Warning: Failed to fetch yfinance info for {ticker}: {e}")
        info = {}

    # yfinance's `info` dict has 100+ keys; want the ones relevant to a research report. 
    # Missing keys default to "N/A" instead of crashing, since not every company reports everything.
    return {
        "ticker": ticker.upper(),
        "company_name": info.get("longName") or info.get("shortName", "N/A"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "current_price": info.get("currentPrice") or info.get("regularMarketPrice", "N/A"),
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