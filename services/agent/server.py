"""FastAPI Server for PlanCraft ADK Agent Service.

Serves the ADK agent over HTTP and SSE endpoints, providing:
- Direct agent chat execution with tool calling (Google GenAI / ADK)
- Event management endpoints (Create, Read, Update, Delete events)
- A2A protocol proxy mode (when AGENT_ENGINE_RESOURCE_NAME is configured)
- Session and conversation persistence
- Full CORS support for the Vue 3 frontend
"""

import json
import os
import sqlite3
import uuid
from typing import Any, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from app.agent import (
    AGENT_INSTRUCTION,
    AGENT_NAME,
    DEFAULT_MODEL,
    all_tools,
    root_agent,
)
from app.tools.event_tools import (
    analyze_event_readiness,
    calculate_budget_breakdown,
    generate_checklist_tasks,
    generate_day_of_run_sheet,
    recommend_vendors,
)
from app.tools.event_management_tools import (
    create_event,
    update_event,
    get_event_details,
    list_events,
    delete_event,
)

# Load environment variables from local services/agent/.env and root .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
load_dotenv(os.path.join(os.path.dirname(__file__), "../../.env"))
load_dotenv()

app = FastAPI(
    title="PlanCraft ADK Agent Service",
    description="Agent Development Kit (ADK) Service for Event and Celebration Planning",
    version="1.1.0",
)

# CORS setup for web frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Local SQLite Database for session tracking
DB_FILE = os.path.join(os.path.dirname(__file__), "adk_sessions.db")


def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT,
            agent_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            role TEXT,
            content TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()


# Models
class ChatRequest(BaseModel):
    message: str
    user_id: Optional[str] = "guest_user"
    session_id: Optional[str] = None
    event_context: Optional[dict[str, Any]] = None


class CreateSessionRequest(BaseModel):
    user_id: Optional[str] = "guest_user"
    agent_name: Optional[str] = AGENT_NAME


class EventCreateRequest(BaseModel):
    name: str
    event_type: str
    start_date: str
    planned_budget: float
    expected_guest_count: int = 100
    venue_name: str = ""
    venue_address: str = ""
    theme: str = ""
    dress_code: str = ""
    special_instructions: str = ""
    currency: str = "USD"


class EventUpdateRequest(BaseModel):
    name: Optional[str] = None
    event_type: Optional[str] = None
    start_date: Optional[str] = None
    planned_budget: Optional[float] = None
    expected_guest_count: Optional[int] = None
    venue_name: Optional[str] = None
    venue_address: Optional[str] = None
    theme: Optional[str] = None
    dress_code: Optional[str] = None
    status: Optional[str] = None
    special_instructions: Optional[str] = None


# Helper to run local tool logic when offline or direct matching is needed
def execute_matching_tool(message: str, event_ctx: Optional[dict[str, Any]] = None) -> Optional[dict[str, Any]]:
    msg = message.lower()
    ctx = event_ctx or {}

    # Event creation matching
    if any(k in msg for k in ["create event", "create a event", "create an event", "schedule event", "new celebration"]):
        etype = "wedding" if "wedding" in msg else ("birthday" if "birthday" in msg else "celebration")
        name = "New Celebration Event"
        budget = 10000.0
        date = "2026-12-15"
        for token in message.split():
            clean_token = token.replace("$", "").replace(",", "")
            if clean_token.isdigit() and int(clean_token) > 500:
                budget = float(clean_token)
            if "-" in token and len(token) == 10 and token[:4].isdigit():
                date = token
        res = create_event(name=name, event_type=etype, start_date=date, planned_budget=budget, expected_guest_count=100)
        return {"tool": "create_event", "result": res}

    # Event update matching
    if any(k in msg for k in ["update event", "modify event", "change budget", "change guest", "set budget", "set date"]):
        eid = ctx.get("eventId", "")
        budget = None
        guests = None
        for token in message.split():
            clean_token = token.replace("$", "").replace(",", "")
            if clean_token.isdigit():
                val = int(clean_token)
                if val > 1000:
                    budget = float(val)
                elif val < 1000:
                    guests = val
        res = update_event(event_id=eid, planned_budget=budget, expected_guest_count=guests)
        return {"tool": "update_event", "result": res}

    # Event listing matching
    if any(k in msg for k in ["list events", "show events", "my events", "all events", "list the events", "view events", "listed result", "list all events", "show all events", "events list"]):
        res = list_events()
        return {"tool": "list_events", "result": res}

    # Budget tool matching
    if any(k in msg for k in ["budget", "allocation", "spend", "cost breakdown", "calculate budget"]):
        budget = ctx.get("budget", 15000.0)
        etype = ctx.get("eventType", "wedding")
        guests = ctx.get("guestCount", 100)
        for token in message.split():
            clean_token = token.replace("$", "").replace(",", "").replace("k", "000")
            if clean_token.isdigit() and int(clean_token) > 500:
                budget = float(clean_token)
                break
        res = calculate_budget_breakdown(total_budget=budget, event_type=etype, guest_count=guests)
        return {"tool": "calculate_budget_breakdown", "result": res}

    # Run-sheet timeline matching
    if any(k in msg for k in ["run sheet", "run-sheet", "schedule", "timeline", "day of", "hourly schedule"]):
        etype = ctx.get("eventType", "wedding")
        start_time = "10:00"
        res = generate_day_of_run_sheet(event_type=etype, start_time=start_time, duration_hours=6)
        return {"tool": "generate_day_of_run_sheet", "result": res}

    # Checklist matching
    if any(k in msg for k in ["checklist", "tasks", "to do", "to-do", "what should i do", "next steps"]):
        etype = ctx.get("eventType", "wedding")
        res = generate_checklist_tasks(event_type=etype, days_until_event=60)
        return {"tool": "generate_checklist_tasks", "result": res}

    # Vendor matching
    if any(k in msg for k in ["vendor", "photographer", "caterer", "catering", "decor", "dj", "questions to ask"]):
        cat = "photography" if "photo" in msg else ("catering" if "cater" in msg else "decor")
        res = recommend_vendors(category=cat, budget_tier="moderate")
        return {"tool": "recommend_vendors", "result": res}

    # Readiness matching
    if any(k in msg for k in ["readiness", "prepared", "ready", "score", "risk"]):
        res = analyze_event_readiness(
            completed_tasks=ctx.get("completedTasks", 14),
            total_tasks=ctx.get("totalTasks", 22),
            confirmed_guests=ctx.get("confirmedGuests", 68),
            total_invited=ctx.get("totalInvited", 90),
            spent_amount=ctx.get("spentAmount", 11200.0),
            budget_amount=ctx.get("budget", 15000.0),
        )
        return {"tool": "analyze_event_readiness", "result": res}

    return None


@app.get("/")
@app.get("/health")
@app.get("/ping")
async def health():
    """Service health and capabilities status."""
    return {
        "status": "healthy",
        "service": "PlanCraft ADK Agent Service",
        "agent": AGENT_NAME,
        "model": DEFAULT_MODEL,
        "tools_count": len(all_tools),
        "a2a_configured": bool(os.getenv("AGENT_ENGINE_RESOURCE_NAME")),
    }


@app.get("/api/tools")
async def get_tools_list():
    """List registered ADK domain and management tools."""
    return {
        "tools": [
            {
                "name": "create_event",
                "description": "Creates a new celebration/event with budget, date, guest count, and venue in planner DB.",
            },
            {
                "name": "update_event",
                "description": "Modifies any detail of an existing event (budget, guests, venue, theme, dates, status).",
            },
            {
                "name": "get_event_details",
                "description": "Retrieves comprehensive event record, countdown, and parameters.",
            },
            {
                "name": "list_events",
                "description": "Lists all events currently managed in the planner.",
            },
            {
                "name": "delete_event",
                "description": "Deletes or archives an event by ID.",
            },
            {
                "name": "calculate_budget_breakdown",
                "description": "Calculates recommended budget allocation categories based on budget, event type, and guest count.",
            },
            {
                "name": "generate_checklist_tasks",
                "description": "Generates milestone-based checklist tasks tailored to timeline and event type.",
            },
            {
                "name": "recommend_vendors",
                "description": "Provides vendor vetting criteria, key interview questions, and deposit terms.",
            },
            {
                "name": "generate_day_of_run_sheet",
                "description": "Generates hour-by-hour run sheet with owner assignments and buffer periods.",
            },
            {
                "name": "analyze_event_readiness",
                "description": "Assesses event readiness score (0-100), budget health, and flags urgent risks.",
            },
        ]
    }


# ==============================================================================
# REST Endpoints for Events Lifecycle
# ==============================================================================


@app.get("/api/events")
async def get_all_events():
    """Retrieve all managed events."""
    return list_events()


@app.get("/api/events/{event_id}")
async def get_single_event(event_id: str):
    """Retrieve details for a specific event."""
    res = get_event_details(event_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res


@app.post("/api/events")
async def create_new_event(req: EventCreateRequest):
    """Create a new event via REST."""
    return create_event(
        name=req.name,
        event_type=req.event_type,
        start_date=req.start_date,
        planned_budget=req.planned_budget,
        expected_guest_count=req.expected_guest_count,
        venue_name=req.venue_name,
        venue_address=req.venue_address,
        theme=req.theme,
        dress_code=req.dress_code,
        special_instructions=req.special_instructions,
        currency=req.currency,
    )


@app.put("/api/events/{event_id}")
async def update_single_event(event_id: str, req: EventUpdateRequest):
    """Update an existing event via REST."""
    res = update_event(
        event_id=event_id,
        name=req.name,
        event_type=req.event_type,
        start_date=req.start_date,
        planned_budget=req.planned_budget,
        expected_guest_count=req.expected_guest_count,
        venue_name=req.venue_name,
        venue_address=req.venue_address,
        theme=req.theme,
        dress_code=req.dress_code,
        status=req.status,
        special_instructions=req.special_instructions,
    )
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res


@app.delete("/api/events/{event_id}")
async def delete_single_event(event_id: str):
    """Delete an event by ID."""
    res = delete_event(event_id)
    if res.get("status") == "error":
        raise HTTPException(status_code=404, detail=res["message"])
    return res


# ==============================================================================
# Chat & Agent Invocation Endpoint
# ==============================================================================


@app.post("/create_session")
@app.post("/api/sessions")
async def create_session(req: CreateSessionRequest):
    """Initializes a new chat session."""
    session_id = f"sess_{uuid.uuid4().hex[:10]}"
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO sessions (session_id, user_id, agent_name) VALUES (?, ?, ?)",
        (session_id, req.user_id, req.agent_name),
    )
    conn.commit()
    conn.close()

    return {
        "session_id": session_id,
        "user_id": req.user_id,
        "agent_name": req.agent_name,
        "status": "created",
    }


@app.post("/chat")
@app.post("/api/chat")
async def chat(req: ChatRequest):
    """Processes chat messages using the ADK Agent, function tools, or A2A proxy."""
    session_id = req.session_id or f"sess_{uuid.uuid4().hex[:10]}"
    user_id = req.user_id or "web-user"

    # Save user message to DB
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT OR IGNORE INTO sessions (session_id, user_id, agent_name) VALUES (?, ?, ?)",
        (session_id, user_id, AGENT_NAME),
    )
    c.execute(
        "INSERT INTO messages (session_id, role, content) VALUES (?, 'user', ?)",
        (session_id, req.message),
    )
    conn.commit()
    conn.close()

    parts: list[dict[str, Any]] = []

    # Check if Google GenAI API Key is provided
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")

    if api_key:
        try:
            from google import genai

            client = genai.Client(api_key=api_key)
            response = client.models.generate_content(
                model=DEFAULT_MODEL,
                contents=req.message,
                config={
                    "system_instruction": AGENT_INSTRUCTION,
                    "tools": all_tools,
                },
            )
            reply_text = response.text or "I have processed your request."
            parts.append({"kind": "text", "text": reply_text})

            # Check if matching tool result can accompany the response as an A2UI card
            tool_res = execute_matching_tool(req.message, req.event_context)
            if tool_res:
                parts.append({"kind": "a2ui", "data": {"type": tool_res["tool"], "payload": tool_res["result"]}})

        except Exception as e:
            # Fallback to local tool invocation
            tool_res = execute_matching_tool(req.message, req.event_context)
            if tool_res:
                reply_text = f"Here is the calculated guidance for your celebration:\n\n```json\n{json.dumps(tool_res['result'], indent=2)}\n```"
                parts.append({"kind": "text", "text": reply_text})
                parts.append({"kind": "a2ui", "data": {"type": tool_res["tool"], "payload": tool_res["result"]}})
            else:
                reply_text = f"I received your request: '{req.message}'. (Note: {str(e)} — running in offline planner mode)."
                parts.append({"kind": "text", "text": reply_text})
    else:
        # Offline intelligent planner mode utilizing the ADK domain tools
        tool_res = execute_matching_tool(req.message, req.event_context)
        if tool_res:
            tname = tool_res["tool"]
            data = tool_res["result"]

            if tname == "create_event":
                evt = data.get("event", {})
                reply = (
                    f"### 🎉 Event Created Successfully!\n"
                    f"- **Event Name:** {evt.get('name')}\n"
                    f"- **ID:** `{evt.get('id')}`\n"
                    f"- **Date:** {evt.get('start_date')} ({evt.get('days_until', 0)} days away)\n"
                    f"- **Planned Budget:** ${evt.get('planned_budget', 0):,.2f}\n"
                    f"- **Guests:** {evt.get('expected_guest_count', 0)}\n"
                    f"- **Venue:** {evt.get('venue_name') or 'To be decided'}\n"
                )
            elif tname == "update_event":
                evt = data.get("event", {})
                reply = (
                    f"### ✏️ Event Updated Successfully!\n"
                    f"- **Event Name:** {evt.get('name')}\n"
                    f"- **Planned Budget:** ${evt.get('planned_budget', 0):,.2f}\n"
                    f"- **Guests:** {evt.get('expected_guest_count', 0)}\n"
                    f"- **Status:** {evt.get('status')}\n"
                )
            elif tname == "list_events":
                reply = f"### 📅 Managed Events ({data.get('count', 0)} total):\n"
                for e in data.get("events", []):
                    reply += f"- **{e['name']}** (`{e['id']}`) — {e['start_date']} | Budget: ${e['planned_budget']:,.2f} | Guests: {e['expected_guest_count']}\n"
            elif tname == "calculate_budget_breakdown":
                reply = (
                    f"### 💰 Recommended Budget Breakdown for {data['event_type'].title()}\n"
                    f"- **Total Budget:** ${data['total_budget']:,.2f}\n"
                    f"- **Guest Count:** {data['guest_count']} (~${data['per_guest_budget']:,.2f} per guest)\n\n"
                    f"**Allocations:**\n"
                )
                for item in data["breakdown"]:
                    reply += f"- **{item['category']}:** ${item['recommended_amount']:,.2f} ({item['percentage']})\n"
                reply += f"\n💡 *Expert Advice:* {data['advice']}"
            elif tname == "generate_day_of_run_sheet":
                reply = f"### ⏱️ Day-Of Run Sheet ({data['event_type'].title()})\n\n"
                for slot in data["timeline"]:
                    reply += f"- **{slot['time']}** — **{slot['activity']}**\n  *Owner:* {slot['owner']} | *Notes:* {slot['notes']}\n"
            elif tname == "generate_checklist_tasks":
                reply = (
                    f"### 📋 Prioritized Checklist for {data['event_type'].title()}\n"
                    f"⚡ **Immediate Action:** {data['suggested_immediate_action']}\n\n"
                )
                for phase in data["milestone_phases"]:
                    reply += f"**{phase['timeline']}**\n"
                    for t in phase["tasks"]:
                        reply += f"- [{t['priority']}] {t['title']}\n"
                    reply += "\n"
            elif tname == "recommend_vendors":
                reply = (
                    f"### 🤝 Vendor Guidance: {data['category'].title()}\n"
                    f"- **Payment Schedule:** {data['payment_schedule']}\n"
                    f"- **Expert Tip:** {data['expert_tip']}\n\n"
                    f"**Questions you should ask before signing:**\n"
                )
                for q in data["vetting_questions"]:
                    reply += f"1. {q}\n"
            elif tname == "analyze_event_readiness":
                reply = (
                    f"### 🎯 Event Readiness Report: **{data['readiness_score']}/100** ({data['status_label']})\n"
                    f"- **Tasks Completed:** {data['tasks_summary']['completed']} / {data['tasks_summary']['total']} ({data['tasks_summary']['completion_rate']})\n"
                    f"- **RSVPs Confirmed:** {data['guests_summary']['confirmed']} / {data['guests_summary']['invited']} ({data['guests_summary']['response_rate']})\n"
                    f"- **Budget Remaining:** ${data['budget_summary']['remaining']:,.2f} ({data['budget_summary']['percent_used']} used)\n"
                )
                if data["critical_risks"]:
                    reply += "\n⚠️ **Alerts:**\n"
                    for r in data["critical_risks"]:
                        reply += f"- {r}\n"
            else:
                reply = f"Result from {tname}: {json.dumps(data)}"

            parts.append({"kind": "text", "text": reply})
            parts.append({"kind": "a2ui", "data": {"type": tname, "payload": data}})
        else:
            default_reply = (
                f"Hello! I am PlanCraft AI, your dedicated celebration and event planning assistant. "
                f"I can help you with:\n"
                f"- **Create/Update Events** (e.g., 'Create a birthday party for Aarav on 2026-11-15 with $3,000 budget')\n"
                f"- **Budget Allocation** (e.g., 'Break down a $15,000 wedding budget')\n"
                f"- **Checklists** (e.g., 'What tasks should I do 2 months out?')\n"
                f"- **Day-of Run Sheet** (e.g., 'Generate an hourly schedule for event day')\n"
                f"- **Vendor Vetting** (e.g., 'Questions to ask a wedding photographer')\n"
                f"- **Readiness Score** (e.g., 'Check my event readiness')\n\n"
                f"How can I assist your planning today?"
            )
            parts.append({"kind": "text", "text": default_reply})

    # Save assistant message to DB
    combined_text = "\n".join(p["text"] for p in parts if p.get("kind") == "text")
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute(
        "INSERT INTO messages (session_id, role, content) VALUES (?, 'assistant', ?)",
        (session_id, combined_text),
    )
    conn.commit()
    conn.close()

    return {
        "status": "ok",
        "session_id": session_id,
        "parts": parts,
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=True)
