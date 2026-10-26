"""Unit tests for FastAPI Agent Server REST and Chat endpoints."""

import os
import tempfile
import pytest
from fastapi.testclient import TestClient
from server import app
import app.tools.event_management_tools as emt


@pytest.fixture(scope="module")
def client():
    """Provides a TestClient instance for the FastAPI application."""
    with TestClient(app) as c:
        yield c


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

    def test_chat_list_events(self, client):
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

    def test_chat_calculate_budget(self, client):
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

    def test_chat_run_sheet(self, client):
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
