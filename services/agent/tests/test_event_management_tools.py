"""Unit tests for ADK event management tools (CRUD operations in SQLite)."""

import os
import tempfile
import pytest
import app.tools.event_management_tools as emt


@pytest.fixture(autouse=True)
def setup_test_db(monkeypatch):
    """Creates an isolated temporary SQLite database for each test."""
    temp_dir = tempfile.mkdtemp()
    test_db = os.path.join(temp_dir, "test_events.db")
    monkeypatch.setattr(emt, "DB_FILE", test_db)
    emt.init_events_table()
    yield test_db
    if os.path.exists(test_db):
        os.remove(test_db)


class TestEventManagementTools:
    """Test suite for event lifecycle management tools."""

    def test_list_events_initial_seed(self):
        res = emt.list_events()
        assert res["status"] == "success"
        assert res["count"] >= 2
        assert len(res["events"]) >= 2

    def test_create_event_success(self):
        res = emt.create_event(
            name="Maya & Dev Reception",
            event_type="wedding",
            start_date="2026-12-25",
            planned_budget=15000.0,
            expected_guest_count=120,
            venue_name="Lotus Grand Banquet",
            venue_address="Bangalore Central",
        )

        assert res["status"] == "success"
        assert "event" in res
        event = res["event"]
        assert event["name"] == "Maya & Dev Reception"
        assert event["planned_budget"] == 15000.0
        assert event["expected_guest_count"] == 120
        assert event["venue_name"] == "Lotus Grand Banquet"
        assert event["id"].startswith("evt-")

    def test_create_event_validation_errors(self):
        # Empty name
        res_empty = emt.create_event(name="", event_type="wedding", start_date="2026-12-25", planned_budget=1000.0)
        assert res_empty["status"] == "error"

        # Invalid budget
        res_budget = emt.create_event(name="Test", event_type="wedding", start_date="2026-12-25", planned_budget=-10)
        assert res_budget["status"] == "error"

        # Invalid guest count
        res_guests = emt.create_event(name="Test", event_type="wedding", start_date="2026-12-25", planned_budget=1000.0, expected_guest_count=0)
        assert res_guests["status"] == "error"

    def test_get_event_details(self):
        create_res = emt.create_event(
            name="Anita 30th Birthday",
            event_type="birthday",
            start_date="2026-11-10",
            planned_budget=3500.0,
            expected_guest_count=40,
        )
        eid = create_res["event"]["id"]

        get_res = emt.get_event_details(event_id=eid)
        assert get_res["status"] == "success"
        assert get_res["event"]["id"] == eid
        assert get_res["event"]["name"] == "Anita 30th Birthday"

        # Non-existent event
        not_found = emt.get_event_details(event_id="evt-non-existent")
        assert not_found["status"] == "error"

    def test_update_event(self):
        create_res = emt.create_event(
            name="Annual Corporate Gala",
            event_type="corporate",
            start_date="2026-12-01",
            planned_budget=10000.0,
            expected_guest_count=150,
        )
        eid = create_res["event"]["id"]

        update_res = emt.update_event(
            event_id=eid,
            planned_budget=12500.0,
            expected_guest_count=180,
            venue_name="Hyatt Regency Ballroom",
            theme="Midnight Elegance",
        )

        assert update_res["status"] == "success"
        updated = update_res["event"]
        assert updated["planned_budget"] == 12500.0
        assert updated["expected_guest_count"] == 180
        assert updated["venue_name"] == "Hyatt Regency Ballroom"
        assert updated["theme"] == "Midnight Elegance"

    def test_delete_event(self):
        create_res = emt.create_event(
            name="Temporary Party",
            event_type="party",
            start_date="2026-11-20",
            planned_budget=2000.0,
        )
        eid = create_res["event"]["id"]

        del_res = emt.delete_event(event_id=eid)
        assert del_res["status"] == "success"
        assert del_res["deleted_event_id"] == eid

        # Verify it's no longer retrievable
        get_res = emt.get_event_details(event_id=eid)
        assert get_res["status"] == "error"

        # Delete again should return error
        del_again = emt.delete_event(event_id=eid)
        assert del_again["status"] == "error"
