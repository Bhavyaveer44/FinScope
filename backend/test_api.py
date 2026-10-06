import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from main import app
from db import save_report, get_report, list_reports

client = TestClient(app)


def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "FinScout" in data["service"]


def test_invalid_ticker_validation():
    # Digits are invalid
    res = client.post("/research/1234")
    assert res.status_code == 400

    # Too long ticker
    res = client.post("/research/TOOLONGTICKER")
    assert res.status_code == 400


def test_cors_preflight_localhost():
    for origin in ["http://localhost:3000", "http://127.0.0.1:3000"]:
        response = client.options(
            "/research/AAPL",
            headers={
                "Origin": origin,
                "Access-Control-Request-Method": "POST",
            },
        )
        assert response.status_code == 200
        assert response.headers.get("access-control-allow-origin") == origin


def test_database_persistence_and_endpoints():
    mock_result = {
        "ticker": "NVDA",
        "final_report": "### Nvidia Overview\nStrong AI revenue growth.",
        "draft_report": "Draft notes on NVDA.",
        "critique": "OK",
        "was_revised": False,
    }
    raw_data = {
        "fundamentals": {"current_price": 120.5, "company_name": "NVIDIA Corporation"},
        "news": [{"title": "Nvidia announces new chip", "publisher": "Reuters", "link": "https://example.com"}],
    }

    saved = save_report(mock_result, raw_data)
    report_id = saved["id"]
    assert report_id is not None
    assert saved["ticker"] == "NVDA"

    # Fetch report by ID
    get_res = client.get(f"/reports/{report_id}")
    assert get_res.status_code == 200
    data = get_res.json()
    assert data["id"] == report_id
    assert data["ticker"] == "NVDA"
    assert "Nvidia Overview" in data["final_report"]

    # History listing
    hist_res = client.get("/reports")
    assert hist_res.status_code == 200
    hist = hist_res.json()
    assert any(r["id"] == report_id for r in hist)

    # Ask follow-up question
    with patch("main._call_llm", return_value="Nvidia is experiencing strong AI growth."):
        ask_res = client.post(
            f"/reports/{report_id}/ask",
            json={"question": "What is driving revenue?"},
        )
        assert ask_res.status_code == 200
        assert "revenue" in ask_res.json()["answer"].lower() or "growth" in ask_res.json()["answer"].lower()


def test_cached_research_flow():
    mock_result = {
        "ticker": "MSFT",
        "final_report": "Microsoft research note.",
        "draft_report": "MSFT draft.",
        "critique": "OK",
        "was_revised": False,
    }
    raw_data = {"fundamentals": {"current_price": 400.0, "company_name": "Microsoft"}}
    saved = save_report(mock_result, raw_data)

    # Calling research for MSFT should hit cache
    res = client.post("/research/MSFT")
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == saved["id"]
    assert data["from_cache"] is True
    assert data["ticker"] == "MSFT"
