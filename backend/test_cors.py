import os

os.environ["SUPABASE_URL"] = "https://example.supabase.co"
os.environ["SUPABASE_KEY"] = "test-key"

from fastapi.testclient import TestClient

from main import app


def test_vercel_production_origin_is_allowed():
    client = TestClient(app)
    response = client.options(
        "/research/GOOGL",
        headers={
            "Origin": "https://fin-scope-seven.vercel.app",
            "Access-Control-Request-Method": "POST",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://fin-scope-seven.vercel.app"
    assert "POST" in response.headers.get("access-control-allow-methods", "")


def test_vercel_production_origin_get_reports():
    client = TestClient(app)
    response = client.get(
        "/reports",
        headers={
            "Origin": "https://fin-scope-seven.vercel.app",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "https://fin-scope-seven.vercel.app"
