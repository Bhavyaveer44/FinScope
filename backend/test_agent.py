from types import SimpleNamespace
from unittest.mock import Mock, patch

import pytest

from agent import (
    _call_llm,
    _ensure_required_report_sections,
    gather_data,
    has_required_report_sections,
)


def test_call_llm_sets_completion_budget_for_gpt_oss(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    response = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(content="A grounded report."),
                finish_reason="stop",
            )
        ]
    )
    client = Mock()
    client.chat.completions.create.return_value = response

    with patch("agent.Groq", return_value=client):
        content = _call_llm("system", "user")

    assert content == "A grounded report."
    call = client.chat.completions.create.call_args.kwargs
    assert call["max_completion_tokens"] == 4096
    assert call["reasoning_effort"] == "low"


def test_call_llm_rejects_empty_model_response(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    response = SimpleNamespace(
        choices=[
            SimpleNamespace(
                message=SimpleNamespace(content="  "),
                finish_reason="length",
            )
        ]
    )
    client = Mock()
    client.chat.completions.create.return_value = response

    with patch("agent.Groq", return_value=client):
        with pytest.raises(RuntimeError, match="empty response.*length"):
            _call_llm("system", "user")


def test_gather_data_requires_a_market_price():
    with (
        patch(
            "agent.get_price_and_fundamentals",
            return_value={"company_name": "Example Corp", "current_price": "N/A"},
        ),
        patch("agent.get_recent_news") as get_recent_news,
    ):
        with pytest.raises(ValueError, match="try again later"):
            gather_data("EXM")

    get_recent_news.assert_not_called()


def test_research_report_always_includes_required_sections():
    report = """## 1. Company Overview
Example Corp
## 2. Financial Snapshot
Price: $10
## 3. Recent News Summary
No recent news.
## 6. Disclaimer
Not financial advice.
"""
    data = {"fundamentals": {"current_price": 10}, "news": []}

    completed_report = _ensure_required_report_sections(report, data)

    assert has_required_report_sections(completed_report)
    assert "No positive catalysts can be confirmed" in completed_report
    assert "insufficient to assess company-specific risks" in completed_report
