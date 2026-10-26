"""PlanCraft Event Planner ADK Agent.

This module initializes the core Google ADK agent equipped with domain tools,
event lifecycle management tools, A2UI rendering callbacks, and tailored
instructions for event planning workflows.
"""

import os
from typing import Any

from .tools.event_tools import (
    calculate_budget_breakdown,
    generate_checklist_tasks,
    recommend_vendors,
    generate_day_of_run_sheet,
    analyze_event_readiness,
)
from .tools.event_management_tools import (
    create_event,
    update_event,
    get_event_details,
    list_events,
    delete_event,
)

# Optional A2UI callback import
try:
    from .a2ui_utils import a2ui_callback
except ImportError:
    a2ui_callback = None

try:
    from dotenv import load_dotenv

    load_dotenv(os.path.join(os.path.dirname(__file__), "../.env"))
    load_dotenv(os.path.join(os.path.dirname(__file__), "../../../.env"))
    load_dotenv()
except ImportError:
    pass

AGENT_NAME = os.getenv("AGENT_NAME", "ec_planner_agent")
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")

AGENT_INSTRUCTION = """
You are PlanCraft AI — a warm, highly organized, and expert event and celebration planning assistant.
You guide individuals and families through planning weddings, birthdays, anniversaries, baby showers,
receptions, and private celebrations.

Your Core Capabilities:
1. Event Lifecycle Management:
   - Create new events (create_event): Set up title, event type, date, budget, guest count, venue, and theme.
   - Modify & Update events (update_event): Change any event field (dates, budgets, guest headcounts, venues, themes, status).
   - Retrieve & Inspect details (get_event_details): Fetch complete event records and countdowns.
   - List all events (list_events): View all scheduled events in the planner.
   - Delete/Archive events (delete_event): Remove cancelled or completed events.
2. Budgeting & Allocation: Break down budgets logically, recommend per-guest targets, and advise on cost savings.
3. Checklists & Milestones: Provide prioritized to-dos by timeline (months out, weeks out, event day).
4. Day-of Run Sheets: Generate smooth, realistic hour-by-hour schedules with buffer times for logistics.
5. Vendor Advice: Provide key interview questions, typical deposit percentages, and contract tips.
6. Readiness & Risk Checks: Evaluate task and RSVP completion to spot bottlenecks early.

Guidelines:
- When the user asks to create, update, modify, schedule, or view an event, ALWAYS invoke the corresponding event management tool.
- When the user asks for budget breakdowns, run sheets, checklist recommendations, or readiness checks, ALWAYS invoke the appropriate planning tool.
- Be clear, practical, encouraging, and structured.
- Highlight urgent actions prominently.
- Format responses with readable Markdown (bullet points, bold highlights, tables).
""".strip()

all_tools = [
    # Event lifecycle tools
    create_event,
    update_event,
    get_event_details,
    list_events,
    delete_event,
    # Event calculation & planning tools
    calculate_budget_breakdown,
    generate_checklist_tasks,
    recommend_vendors,
    generate_day_of_run_sheet,
    analyze_event_readiness,
]

# Initialize ADK Agent if google-adk is present
try:
    from google.adk.agents.llm_agent import Agent

    agent_kwargs: dict[str, Any] = {
        "model": DEFAULT_MODEL,
        "name": AGENT_NAME,
        "description": "Expert Event & Celebration Planning Assistant.",
        "instruction": AGENT_INSTRUCTION,
        "tools": all_tools,
    }

    if a2ui_callback is not None:
        agent_kwargs["after_model_callback"] = a2ui_callback

    root_agent = Agent(**agent_kwargs)

except Exception:
    # Lightweight fallback for local dev / testing before ADK package is synced
    class FallbackAgent:
        def __init__(self, name: str, model: str, instruction: str, tools: list):
            self.name = name
            self.model = model
            self.instruction = instruction
            self.tools = tools

    root_agent = FallbackAgent(
        name=AGENT_NAME,
        model=DEFAULT_MODEL,
        instruction=AGENT_INSTRUCTION,
        tools=all_tools,
    )
