"""ADK Function Tools for Event Lifecycle Management.

Enables the ADK agent to:
- Create new events
- Read/retrieve event details
- Update/modify event details (budget, guest count, venue, dates, status, theme)
- List all scheduled events
- Delete or archive events
"""

import os
import sqlite3
import time
import uuid
from datetime import datetime
from typing import Any, Optional

_default_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
if os.access(_default_dir, os.W_OK):
    DB_FILE = os.getenv("DB_FILE", os.path.join(_default_dir, "adk_sessions.db"))
else:
    DB_FILE = os.getenv("DB_FILE", "/tmp/adk_sessions.db")


def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_events_table():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            event_type TEXT NOT NULL,
            owner_id TEXT DEFAULT 'user-1',
            start_date TEXT NOT NULL,
            end_date TEXT,
            time_zone TEXT DEFAULT 'Asia/Kolkata',
            venue_name TEXT DEFAULT '',
            venue_address TEXT DEFAULT '',
            expected_guest_count INTEGER DEFAULT 100,
            currency TEXT DEFAULT 'USD',
            planned_budget_minor INTEGER DEFAULT 1000000,
            status TEXT DEFAULT 'planning',
            theme TEXT DEFAULT '',
            dress_code TEXT DEFAULT '',
            special_instructions TEXT DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()

    # Seed initial celebration template events if table is empty
    c.execute("SELECT COUNT(*) FROM events")
    count = c.fetchone()[0]
    if count == 0:
        c.execute("""
            INSERT INTO events (
                id, name, event_type, owner_id, start_date, end_date,
                time_zone, venue_name, venue_address, expected_guest_count,
                currency, planned_budget_minor, status, theme, dress_code, special_instructions
            ) VALUES
            (
                'evt-1', 'Priya & Rahul Grand Wedding', 'wedding', 'user-1', '2026-12-08', '2026-12-10',
                'Asia/Kolkata', 'The Taj West End, Grand Ballroom', 'Race Course Road, Bengaluru', 350,
                'USD', 1850000, 'planning', 'Royal Pastel Floral Elegance',
                'Traditional Indian / Indo-Western Pastels', 'Valet parking available at Gate 2.'
            ),
            (
                'evt-2', 'Aarav 1st Birthday Carnival', 'birthday', 'user-1', '2026-11-15', '2026-11-15',
                'Asia/Kolkata', 'Palm Meadows Club Pavilion', 'Whitefield Main Road, Bengaluru', 85,
                'USD', 250000, 'planning', 'Circus Carnival Extravaganza',
                'Fun & Vibrant Casual', 'Kids play zone opens at 4:30 PM.'
            )
        """)
        conn.commit()
    conn.close()


init_events_table()


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    d = dict(row)
    # Include human-readable budget amount in major units
    budget_minor = d.get("planned_budget_minor", 0)
    d["planned_budget"] = round(budget_minor / 100, 2)
    # Calculate days until event
    try:
        sdate = datetime.strptime(d["start_date"][:10], "%Y-%m-%d").date()
        today = datetime.now().date()
        d["days_until"] = (sdate - today).days
    except Exception:
        d["days_until"] = 0
    return d


def create_event(
    name: str,
    event_type: str,
    start_date: str,
    planned_budget: float,
    expected_guest_count: int = 100,
    venue_name: str = "",
    venue_address: str = "",
    theme: str = "",
    dress_code: str = "",
    special_instructions: str = "",
    currency: str = "USD",
) -> dict[str, Any]:
    """Creates a new event or celebration and saves it in the planner database.

    Args:
        name: Name or title of the event (e.g. 'Sarah & John 25th Silver Jubilee').
        event_type: Type of celebration ('wedding', 'reception', 'birthday', 'anniversary', 'engagement', 'baby_shower', 'corporate', 'festival', 'custom').
        start_date: Event date in YYYY-MM-DD format (e.g. '2026-11-20').
        planned_budget: Total planned budget amount in currency units (e.g. 15000.0).
        expected_guest_count: Number of guests expected to attend.
        venue_name: Optional name of the venue or location.
        venue_address: Optional physical address of the venue.
        theme: Optional aesthetic or thematic direction (e.g. 'Silver Elegance', 'Boho Chic').
        dress_code: Optional dress code guidelines for guests.
        special_instructions: Optional logistics or notes.
        currency: Currency code (default 'USD').

    Returns:
        Structured details of the newly created event and confirmation message.
    """
    if not name or not name.strip():
        return {"status": "error", "message": "Event name cannot be empty."}
    if planned_budget <= 0:
        return {"status": "error", "message": "Planned budget must be greater than zero."}
    if expected_guest_count <= 0:
        return {"status": "error", "message": "Expected guest count must be at least 1."}

    event_id = f"evt-{int(time.time() * 1000)}-{uuid.uuid4().hex[:6]}"
    budget_minor = int(planned_budget * 100)

    conn = get_db()
    c = conn.cursor()
    c.execute(
        """
        INSERT INTO events (
            id, name, event_type, owner_id, start_date, end_date,
            time_zone, venue_name, venue_address, expected_guest_count,
            currency, planned_budget_minor, status, theme, dress_code, special_instructions
        ) VALUES (?, ?, ?, 'user-1', ?, ?, 'UTC', ?, ?, ?, ?, ?, 'planning', ?, ?, ?)
        """,
        (
            event_id,
            name,
            event_type.lower(),
            start_date,
            start_date,
            venue_name,
            venue_address,
            expected_guest_count,
            currency,
            budget_minor,
            theme,
            dress_code,
            special_instructions,
        ),
    )
    conn.commit()

    c.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    row = c.fetchone()
    conn.close()

    event_data = row_to_dict(row)
    
    # Generate tailored checklist for the newly created event
    try:
        from .event_tools import generate_checklist_tasks
        days_until = event_data.get("days_until", 90)
        checklist_data = generate_checklist_tasks(
            event_type=event_type,
            days_until_event=days_until,
            event_id=event_id,
            event_name=name,
        )
    except Exception as ce:
        checklist_data = {"event_type": event_type, "milestone_phases": []}

    return {
        "status": "success",
        "action": "created",
        "message": f"Successfully created event '{name}' (ID: {event_id}) scheduled for {start_date}.",
        "event": event_data,
        "checklist": checklist_data,
    }


def update_event(
    event_id: str = "",
    name: Optional[str] = None,
    event_type: Optional[str] = None,
    start_date: Optional[str] = None,
    planned_budget: Optional[float] = None,
    expected_guest_count: Optional[int] = None,
    venue_name: Optional[str] = None,
    venue_address: Optional[str] = None,
    theme: Optional[str] = None,
    dress_code: Optional[str] = None,
    status: Optional[str] = None,
    special_instructions: Optional[str] = None,
) -> dict[str, Any]:
    """Modifies or updates details of an existing event.

    Args:
        event_id: ID of the event to modify (e.g. 'evt-1'). If empty, updates the most recent event.
        name: New title of the event (optional).
        event_type: Updated event type ('wedding', 'birthday', etc.) (optional).
        start_date: New date in YYYY-MM-DD format (optional).
        planned_budget: Updated budget amount (optional).
        expected_guest_count: Updated expected guest count (optional).
        venue_name: Updated venue name (optional).
        venue_address: Updated venue location (optional).
        theme: Updated theme/styling (optional).
        dress_code: Updated dress code (optional).
        status: Event status ('planning', 'confirmed', 'in_progress', 'completed', 'archived') (optional).
        special_instructions: Updated notes/instructions (optional).

    Returns:
        Structured details of the updated event and confirmation message.
    """
    conn = get_db()
    c = conn.cursor()

    # Find the target event
    target_row = None
    if event_id:
        c.execute("SELECT * FROM events WHERE id = ? OR name LIKE ?", (event_id, f"%{event_id}%"))
        target_row = c.fetchone()
        if not target_row:
            conn.close()
            return {"status": "error", "message": f"Event '{event_id}' not found to update."}
    else:
        # Fall back to latest active event
        c.execute("SELECT * FROM events ORDER BY created_at DESC LIMIT 1")
        target_row = c.fetchone()

    if not target_row:
        conn.close()
        return {"status": "error", "message": "No event found to update."}

    actual_id = target_row["id"]
    updates = []
    params = []

    if name is not None and name.strip():
        updates.append("name = ?")
        params.append(name.strip())
    if event_type is not None and event_type.strip():
        updates.append("event_type = ?")
        params.append(event_type.strip().lower())
    if start_date is not None and start_date.strip():
        updates.append("start_date = ?")
        params.append(start_date.strip())
        updates.append("end_date = ?")
        params.append(start_date.strip())
    if planned_budget is not None and planned_budget > 0:
        updates.append("planned_budget_minor = ?")
        params.append(int(planned_budget * 100))
    if expected_guest_count is not None and expected_guest_count > 0:
        updates.append("expected_guest_count = ?")
        params.append(expected_guest_count)
    if venue_name is not None:
        updates.append("venue_name = ?")
        params.append(venue_name.strip())
    if venue_address is not None:
        updates.append("venue_address = ?")
        params.append(venue_address.strip())
    if theme is not None:
        updates.append("theme = ?")
        params.append(theme.strip())
    if dress_code is not None:
        updates.append("dress_code = ?")
        params.append(dress_code.strip())
    if status is not None and status.strip():
        updates.append("status = ?")
        params.append(status.strip().lower())
    if special_instructions is not None:
        updates.append("special_instructions = ?")
        params.append(special_instructions.strip())

    if not updates:
        conn.close()
        return {
            "status": "warning",
            "message": "No fields were specified to update.",
            "event": row_to_dict(target_row),
        }

    updates.append("updated_at = CURRENT_TIMESTAMP")
    sql = f"UPDATE events SET {', '.join(updates)} WHERE id = ?"
    params.append(actual_id)

    c.execute(sql, params)
    conn.commit()

    c.execute("SELECT * FROM events WHERE id = ?", (actual_id,))
    updated_row = c.fetchone()
    conn.close()

    updated_data = row_to_dict(updated_row)
    return {
        "status": "success",
        "action": "updated",
        "message": f"Successfully updated event '{updated_data['name']}' (ID: {actual_id}).",
        "event": updated_data,
    }


def get_event_details(event_id: str = "") -> dict[str, Any]:
    """Retrieves full information and planning metrics for a specific event.

    Args:
        event_id: ID or name of the event. If empty, retrieves the active/current event.

    Returns:
        Complete event record with countdown days, venue details, and budget.
    """
    conn = get_db()
    c = conn.cursor()

    row = None
    if event_id:
        c.execute("SELECT * FROM events WHERE id = ? OR name LIKE ?", (event_id, f"%{event_id}%"))
        row = c.fetchone()
        if not row:
            conn.close()
            return {"status": "error", "message": f"Event '{event_id}' not found."}
    else:
        c.execute("SELECT * FROM events ORDER BY created_at DESC LIMIT 1")
        row = c.fetchone()

    conn.close()

    if not row:
        return {"status": "error", "message": "No events found in planner."}

    data = row_to_dict(row)
    return {
        "status": "success",
        "event": data,
        "summary": (
            f"Event '{data['name']}' ({data['event_type'].title()}) is scheduled for {data['start_date']} "
            f"({data['days_until']} days away). Planned budget: ${data['planned_budget']:,.2f} for {data['expected_guest_count']} guests."
        ),
    }


def list_events() -> dict[str, Any]:
    """Lists all events currently managed in the event planner.

    Returns:
        List of all events with their ID, name, date, budget, and status.
    """
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM events ORDER BY start_date ASC")
    rows = c.fetchall()
    conn.close()

    events_list = [row_to_dict(r) for r in rows]
    return {
        "status": "success",
        "count": len(events_list),
        "events": events_list,
    }


def delete_event(event_id: str) -> dict[str, Any]:
    """Deletes or archives an event from the planner.

    Args:
        event_id: The ID of the event to delete.

    Returns:
        Confirmation of deletion.
    """
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    row = c.fetchone()

    if not row:
        conn.close()
        return {"status": "error", "message": f"Event with ID '{event_id}' does not exist."}

    name = row["name"]
    c.execute("DELETE FROM events WHERE id = ?", (event_id,))
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "action": "deleted",
        "deleted_event_id": event_id,
        "message": f"Event '{name}' ({event_id}) has been removed from your planner.",
    }
