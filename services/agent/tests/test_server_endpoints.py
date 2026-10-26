"""Unit tests for FastAPI Agent Server REST and Chat endpoints."""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from server import app
import app.tools.event_management_tools as emt


@pytest.fixture(scope="module")
def client():
    """Provides an isolated TestClient instance for the FastAPI application."""
    temp_dir = tempfile.mkdtemp()
    test_db = os.path.join(temp_dir, "test_adk_sessions.db")
    import server
    server.DB_FILE = test_db
    server.init_db()
    with TestClient(app) as c:
        yield c
    if os.path.exists(test_db):
        try:
            os.remove(test_db)
        except OSError:
            pass


class TestServerEndpoints:
    """Test suite for server endpoints."""

    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["tools_count"] == 10
        assert data["agent"] == "ec_planner_agent"

    def test_tools_list_endpoint(self, client):
        response = client.get("/api/tools")
        assert response.status_code == 200
        data = response.json()
        assert "tools" in data
        assert len(data["tools"]) == 10
        tool_names = [t["name"] for t in data["tools"]]
        assert "create_event" in tool_names
        assert "calculate_budget_breakdown" in tool_names
        assert "generate_day_of_run_sheet" in tool_names

    def test_get_events_endpoint(self, client):
        response = client.get("/api/events")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "events" in data
        assert isinstance(data["events"], list)

    def test_chat_list_events(self, client, monkeypatch):
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        response = client.post(
            "/chat",
            json={
                "message": "List all events",
                "user_id": "test-user",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "parts" in data
        # Check A2UI part is present
        a2ui_parts = [p for p in data["parts"] if p.get("kind") == "a2ui"]
        assert len(a2ui_parts) >= 1
        assert a2ui_parts[0]["data"]["type"] == "list_events"
        assert "events" in a2ui_parts[0]["data"]["payload"]

    def test_chat_calculate_budget(self, client, monkeypatch):
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        response = client.post(
            "/chat",
            json={
                "message": "Calculate budget breakdown for wedding with $25,000",
                "user_id": "test-user",
                "event_context": {
                    "eventType": "wedding",
                    "guestCount": 120,
                    "budget": 25000,
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        a2ui_parts = [p for p in data["parts"] if p.get("kind") == "a2ui"]
        assert len(a2ui_parts) >= 1
        assert a2ui_parts[0]["data"]["type"] == "calculate_budget_breakdown"
        payload = a2ui_parts[0]["data"]["payload"]
        assert payload["total_budget"] == 25000.0

    def test_chat_run_sheet(self, client, monkeypatch):
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        response = client.post(
            "/chat",
            json={
                "message": "Generate day of run sheet schedule",
                "user_id": "test-user",
                "event_context": {
                    "eventType": "birthday",
                },
            },
        )
        assert response.status_code == 200
        data = response.json()
        a2ui_parts = [p for p in data["parts"] if p.get("kind") == "a2ui"]
        assert len(a2ui_parts) >= 1
        assert a2ui_parts[0]["data"]["type"] == "generate_day_of_run_sheet"
        assert len(a2ui_parts[0]["data"]["payload"]["timeline"]) > 0

    def test_events_rest_crud_lifecycle(self, client):
        # 1. Create event via POST /api/events
        create_res = client.post(
            "/api/events",
            json={
                "name": "REST Test Gala",
                "event_type": "corporate",
                "start_date": "2026-12-10",
                "planned_budget": 50000.0,
                "expected_guest_count": 250,
                "venue_name": "Skyline Convention Center",
                "venue_address": "88 Tower Rd",
                "theme": "Innovation 2026",
                "dress_code": "Formal",
                "special_instructions": "VIP badges required",
                "currency": "USD",
            },
        )
        assert create_res.status_code == 200
        event_data = create_res.json()["event"]
        eid = event_data["id"]
        assert event_data["name"] == "REST Test Gala"

        # 2. Retrieve event via GET /api/events/{id}
        get_res = client.get(f"/api/events/{eid}")
        assert get_res.status_code == 200
        assert get_res.json()["event"]["id"] == eid

        # 3. Update event via PUT /api/events/{id}
        put_res = client.put(
            f"/api/events/{eid}",
            json={
                "planned_budget": 55000.0,
                "expected_guest_count": 280,
                "status": "confirmed",
            },
        )
        assert put_res.status_code == 200
        assert put_res.json()["event"]["planned_budget"] == 55000.0

        # 4. Delete event via DELETE /api/events/{id}
        del_res = client.delete(f"/api/events/{eid}")
        assert del_res.status_code == 200
        assert del_res.json()["status"] == "success"

        # 5. Non-existent event returns 404
        assert client.get("/api/events/evt-missing").status_code == 404
        assert client.put("/api/events/evt-missing", json={"name": "Ghost"}).status_code == 404
        assert client.delete("/api/events/evt-missing").status_code == 404

    def test_create_session_endpoint(self, client):
        res = client.post("/api/sessions", json={"user_id": "session-tester"})
        assert res.status_code == 200
        data = res.json()
        assert "session_id" in data
        assert data["user_id"] == "session-tester"

    def test_offline_matching_tools(self, client, monkeypatch):
        # Force offline/local execution pathway to directly exercise execute_matching_tool
        from server import execute_matching_tool

        # 1. Create event tool match
        create_res = execute_matching_tool("Please create an event for 2026-12-15 with budget 12000")
        assert create_res is not None
        assert create_res["tool"] == "create_event"

        # 2. Update event tool match
        update_res = execute_matching_tool("update event change budget to 18000 and 150 guests", {"eventId": create_res["result"]["event"]["id"]})
        assert update_res is not None
        assert update_res["tool"] == "update_event"

        # 3. Checklist tasks tool match
        chk_res = execute_matching_tool("what should i do next? Show my checklist tasks")
        assert chk_res is not None
        assert chk_res["tool"] == "generate_checklist_tasks"

        # 4. Vendor recommendation tool match
        v_res = execute_matching_tool("Recommend a photographer vendor and key questions to ask")
        assert v_res is not None
        assert v_res["tool"] == "recommend_vendors"

        # 5. Readiness evaluation tool match
        r_res = execute_matching_tool("Analyze event readiness score and risks")
        assert r_res is not None
        assert r_res["tool"] == "analyze_event_readiness"

        # 6. Unmatched query returns None
        unmatched = execute_matching_tool("Tell me a bedtime story about dragons")
        assert unmatched is None

    def test_offline_chat_mode(self, client, monkeypatch):
        # Temporarily simulate offline environment without Google GenAI client
        monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)

        offline_queries = [
            ("Calculate budget breakdown for wedding with $30,000", {"eventType": "wedding", "guestCount": 150}),
            ("Please create an event for 2026-12-15 with budget 20000", {}),
            ("update event change budget to 25000 and 150 guests", {"eventId": "evt-1"}),
            ("List all events currently in my planner", {}),
            ("Generate hourly run sheet starting at 10:00", {"eventType": "wedding"}),
            ("Show my checklist tasks and next steps", {"eventType": "wedding"}),
            ("Recommend catering vendor and key questions to ask", {}),
            ("Analyze event readiness score and risks", {"spentAmount": 20000.0, "budget": 10000.0, "completedTasks": 2, "totalTasks": 20}),
        ]

        for query, ctx in offline_queries:
            res = client.post(
                "/chat",
                json={
                    "message": query,
                    "user_id": "offline-user",
                    "event_context": ctx,
                },
            )
            assert res.status_code == 200
            data = res.json()
            assert any(p.get("kind") == "a2ui" for p in data["parts"])

        # Unmatched query in offline mode returns guidance
        res_unknown = client.post(
            "/chat",
            json={
                "message": "Can penguins fly in the arctic?",
                "user_id": "offline-user",
            },
        )
        assert res_unknown.status_code == 200
        data_unknown = res_unknown.json()
        assert any("PlanCraft AI" in p.get("text", "") for p in data_unknown["parts"])

    def test_mocked_gemini_client_success_and_exception(self, client, monkeypatch):
        from google import genai

        class MockModels:
            def generate_content(self, model, contents, config=None):
                class MockResponse:
                    text = "Gemini generated intelligent response."
                return MockResponse()

        class MockClient:
            models = MockModels()

        monkeypatch.setenv("GOOGLE_API_KEY", "test-api-key")
        monkeypatch.setattr(genai, "Client", lambda *args, **kwargs: MockClient())

        # Success path
        res = client.post(
            "/chat",
            json={"message": "List all events", "user_id": "gemini-user"},
        )
        assert res.status_code == 200
        data = res.json()
        assert any("Gemini generated" in p.get("text", "") for p in data["parts"])

        # Exception path fallback to local tool
        class FailingModels:
            def generate_content(self, model, contents, config=None):
                raise RuntimeError("Quota exceeded or connection error")

        class FailingClient:
            models = FailingModels()

        monkeypatch.setattr(genai, "Client", lambda *args, **kwargs: FailingClient())
        res_fail = client.post(
            "/chat",
            json={"message": "Calculate budget for wedding with $15,000", "user_id": "gemini-user"},
        )
        assert res_fail.status_code == 200
        data_fail = res_fail.json()
        assert any(p.get("kind") == "a2ui" for p in data_fail["parts"])

        # Exception path fallback with unmatched query (lines 440-441)
        res_fail_unmatched = client.post(
            "/chat",
            json={"message": "Unknown query with no matching tool", "user_id": "gemini-user"},
        )
        assert res_fail_unmatched.status_code == 200
        assert any("running in offline planner mode" in p.get("text", "") for p in res_fail_unmatched.json()["parts"])
