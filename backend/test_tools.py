import json
from unittest.mock import Mock, patch

import pandas as pd

from tools import get_price_and_fundamentals


def test_get_price_and_fundamentals_uses_quote_info():
    stock = Mock()
    stock.info = {
        "longName": "Apple Inc.",
        "currentPrice": 200.0,
        "regularMarketPrice": 199.0,
    }

    with patch("tools.yf.Ticker", return_value=stock) as ticker:
        result = get_price_and_fundamentals(" aapl ")

    ticker.assert_called_once_with("AAPL")
    stock.history.assert_not_called()
    assert result["ticker"] == "AAPL"
    assert result["company_name"] == "Apple Inc."
    assert result["current_price"] == 200.0


def test_get_price_and_fundamentals_falls_back_to_history():
    stock = Mock()
    stock.info = {"longName": "Example Corp"}
    stock.history.return_value = pd.DataFrame({"Close": [10.0, 12.5]})

    with patch("tools.yf.Ticker", return_value=stock):
        result = get_price_and_fundamentals("EXM")

    stock.history.assert_called_once_with(period="5d")
    assert result["company_name"] == "Example Corp"
    assert result["current_price"] == 12.5


def test_get_price_and_fundamentals_handles_empty_quote_and_history():
    stock = Mock()
    stock.info = {}
    stock.history.return_value = pd.DataFrame()

    with patch("tools.yf.Ticker", return_value=stock):
        result = get_price_and_fundamentals("INVALID")

    assert result["company_name"] == "N/A"
    assert result["current_price"] == "N/A"


def test_get_price_and_fundamentals_falls_back_to_chart_after_rate_limit():
    class RateLimitedStock:
        @property
        def info(self):
            raise Exception("Too Many Requests")

        def history(self, period):
            raise Exception("Too Many Requests")

    chart = {
        "chart": {
            "result": [
                {
                    "meta": {"shortName": "Oracle Corporation"},
                    "indicators": {"quote": [{"close": [None, 128.23]}]},
                }
            ]
        }
    }
    response = Mock()
    response.__enter__ = Mock(return_value=response)
    response.__exit__ = Mock(return_value=False)
    response.read = Mock(return_value=json.dumps(chart).encode())

    with (
        patch("tools.yf.Ticker", return_value=RateLimitedStock()),
        patch("tools.urlopen", return_value=response),
    ):
        result = get_price_and_fundamentals("ORCL")

    assert result["company_name"] == "Oracle Corporation"
    assert result["current_price"] == 128.23
