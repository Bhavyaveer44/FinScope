import sys
from pathlib import Path
from fastapi.testclient import TestClient

backend_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(backend_dir))

from main import app

client = TestClient(app)


def test_live_research_flow():
    print("\n--- 1. Testing Live Research for GOOGL ---")
    res = client.post("/research/GOOGL")
    assert res.status_code == 200, f"Expected 200 but got {res.status_code}: {res.text}"

    data = res.json()
    assert data["ticker"] == "GOOGL"
    assert "id" in data
    report_id = data["id"]
    assert len(data["final_report"]) > 100
    print(f"Report ID: {report_id}")
    print(f"Was revised: {data['was_revised']}")
    print(f"Report length: {len(data['final_report'])} characters")

    print("\n--- 2. Testing Follow-up QA ---")
    ask_res = client.post(
        f"/reports/{report_id}/ask",
        json={"question": "What is the company name and current price?"},
    )
    assert ask_res.status_code == 200
    answer = ask_res.json()["answer"]
    assert len(answer) > 10
    print(f"Follow-up answer: {answer}")

    print("\n--- 3. Testing Cache Hit ---")
    cache_res = client.post("/research/GOOGL")
    assert cache_res.status_code == 200
    cache_data = cache_res.json()
    assert cache_data["from_cache"] is True
    assert cache_data["id"] == report_id
    print("Cache hit confirmed!")

    print("\n--- 4. Testing History Endpoint ---")
    hist_res = client.get("/reports")
    assert hist_res.status_code == 200
    history = hist_res.json()
    assert any(h["id"] == report_id for h in history)
    print(f"History list contains {len(history)} report(s).")


if __name__ == "__main__":
    test_live_research_flow()
