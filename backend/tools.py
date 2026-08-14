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
    Pulls current price +core fundamentals for a ticker.
    yfinance scrapes this from Yahoo Finance, no API key needed.
    """
    stock = yf.Ticker(ticker)
    info = stock.info  # a big dict of company data

    # yfinance's `info` dict has 100+ keys; want the ones relevant to a research report. 
    # Missing keys default to "N/A" instead of crashing, since not every company reports everything.
    return {
        "ticker": ticker.upper(),
        "company_name": info.get("longName", "N/A"),
        "sector": info.get("sector", "N/A"),
        "industry": info.get("industry", "N/A"),
        "current_price": info.get("currentPrice", "N/A"),
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
    stock = yf.Ticker(ticker)
    raw_news = stock.news[:limit]

    articles = []
    for item in raw_news:
        content = item.get("content", item)  # yfinance news format varies
        articles.append({
            "title": content.get("title", "N/A"),
            "publisher": content.get("provider", {}).get("displayName", "N/A")
                         if isinstance(content.get("provider"), dict) else "N/A",
            "link": content.get("canonicalUrl", {}).get("url", "N/A")
                    if isinstance(content.get("canonicalUrl"), dict) else "N/A",
        })
    return articles