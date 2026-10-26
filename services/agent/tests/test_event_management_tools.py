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

    def test_update_all_fields_and_validations(self):
        create_res = emt.create_event(
            name="Field Test Event",
            event_type="anniversary",
            start_date="2026-11-20",
            planned_budget=5000.0,
            expected_guest_count=50,
        )
        eid = create_res["event"]["id"]

        # Update all optional fields
        update_res = emt.update_event(
            event_id=eid,
            name="Renamed Field Test Event",
            event_type="reception",
            start_date="2026-11-25",
            planned_budget=7500.0,
            expected_guest_count=80,
            venue_name="Grand Lawn",
            venue_address="123 Park Avenue",
            theme="Vintage Gold",
            dress_code="Black Tie",
            status="confirmed",
            special_instructions="Quiet zone for elderly guests",
        )
        assert update_res["status"] == "success"
        ev = update_res["event"]
        assert ev["name"] == "Renamed Field Test Event"
        assert ev["venue_address"] == "123 Park Avenue"
        assert ev["dress_code"] == "Black Tie"
        assert ev["special_instructions"] == "Quiet zone for elderly guests"
        assert ev["status"] == "confirmed"

        # Update non-existent event
        not_found = emt.update_event(event_id="evt-fake", name="Ghost")
        assert not_found["status"] == "error"

        # Update with no fields provided
        no_fields = emt.update_event(event_id=eid)
        assert no_fields["status"] == "warning"
        assert "No fields were specified" in no_fields["message"]

        # Update validation / zero fields
        bad_budget = emt.update_event(event_id=eid, planned_budget=-100)
        assert bad_budget["status"] == "warning"
        bad_guests = emt.update_event(event_id=eid, expected_guest_count=0)
        assert bad_guests["status"] == "warning"

        # Update without event_id falls back to latest active event
        fallback_update = emt.update_event(event_id="", venue_name="Latest Event Venue")
        assert fallback_update["status"] == "success"
        assert fallback_update["event"]["venue_name"] == "Latest Event Venue"

        # get_event_details without event_id returns latest event
        latest_res = emt.get_event_details(event_id="")
        assert latest_res["status"] == "success"

        # Invalid date string falls back to days_until = 0
        bad_date_event = emt.create_event(
            name="TBD Date Gala",
            event_type="party",
            start_date="InvalidDateString",
            planned_budget=1000.0,
        )
        assert bad_date_event["event"]["days_until"] == 0

    def test_empty_database_branches(self, monkeypatch):
        import tempfile
        temp_dir = tempfile.mkdtemp()
        empty_db = os.path.join(temp_dir, "empty.db")
        monkeypatch.setattr(emt, "DB_FILE", empty_db)

        # Create empty table without initial seed
        conn = emt.get_db()
        c = conn.cursor()
        c.execute("""
            CREATE TABLE events (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                event_type TEXT NOT NULL,
                owner_id TEXT NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL,
                time_zone TEXT DEFAULT 'UTC',
                venue_name TEXT,
                venue_address TEXT,
                expected_guest_count INTEGER DEFAULT 100,
                currency TEXT DEFAULT 'USD',
                planned_budget_minor INTEGER NOT NULL,
                status TEXT DEFAULT 'planning',
                theme TEXT,
                dress_code TEXT,
                special_instructions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        conn.close()

        # Update and get when database has no events
        res_update = emt.update_event(event_id="")
        assert res_update["status"] == "error"
        assert "No event found" in res_update["message"]

        res_get = emt.get_event_details(event_id="")
        assert res_get["status"] == "error"
        assert "No events found" in res_get["message"]
