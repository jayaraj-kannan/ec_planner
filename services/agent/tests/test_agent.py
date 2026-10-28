"""Unit tests for agent definition and root_agent configuration."""

import pytest
from app.agent import (
    AGENT_NAME,
    DEFAULT_MODEL,
    AGENT_INSTRUCTION,
    all_tools,
    root_agent,
)


class TestAgentConfiguration:
    """Test suite for agent initialization and tools binding."""

    def test_agent_attributes(self):
        assert root_agent is not None
        assert root_agent.name == AGENT_NAME
        assert root_agent.model == DEFAULT_MODEL
        assert root_agent.instruction == AGENT_INSTRUCTION
        assert len(root_agent.tools) == 10
        assert root_agent.tools == all_tools

    def test_all_tools_registration(self):
        tool_names = [getattr(t, "__name__", str(t)) for t in all_tools]
        expected_tools = [
            "create_event",
            "update_event",
            "get_event_details",
            "list_events",
            "delete_event",
            "calculate_budget_breakdown",
            "generate_checklist_tasks",
            "recommend_vendors",
            "generate_day_of_run_sheet",
            "analyze_event_readiness",
        ]
        for expected in expected_tools:
            assert expected in tool_names

    def test_mocked_google_adk_agent_init(self, monkeypatch):
        import sys
        import types

        class MockADKAgent:
            def __init__(self, **kwargs):
                self.kwargs = kwargs

        mock_module = types.ModuleType("google.adk.agents.llm_agent")
        mock_module.Agent = MockADKAgent

        import app.agent as ag
        agent_kwargs = {
            "model": ag.DEFAULT_MODEL,
            "name": ag.AGENT_NAME,
            "instruction": ag.AGENT_INSTRUCTION,
            "tools": ag.all_tools,
        }
        if ag.a2ui_callback is not None:
            agent_kwargs["after_model_callback"] = ag.a2ui_callback

        adk_inst = MockADKAgent(**agent_kwargs)
        assert adk_inst.kwargs["name"] == ag.AGENT_NAME
        assert len(adk_inst.kwargs["tools"]) == 10

    def test_adk_instruction_contains_event_creation_requirements(self):
        assert "MANDATORY INFORMATION GATHERING" in AGENT_INSTRUCTION
        assert "Planned Budget" in AGENT_INSTRUCTION
        assert "Guest List / Headcount" in AGENT_INSTRUCTION
        assert "Food & Catering Needs" in AGENT_INSTRUCTION
        assert "CREATING THE EVENT WITH CHECKLIST" in AGENT_INSTRUCTION

    def test_create_event_tool_generates_and_bundles_checklist(self):
        from app.tools.event_management_tools import create_event
        res = create_event(
            name="Rohit & Neha Wedding",
            event_type="wedding",
            start_date="2026-12-25",
            planned_budget=25000.0,
            expected_guest_count=180,
            venue_name="Grand Palace",
            special_instructions="Catering required: Vegetarian buffet with mocktail bar",
        )
        assert res["status"] == "success"
        assert res["event"]["name"] == "Rohit & Neha Wedding"
        assert "checklist" in res
        assert "milestone_phases" in res["checklist"]
        assert len(res["checklist"]["milestone_phases"]) > 0

    def test_execute_matching_tool_inquiry_and_creation_flow(self):
        from server import execute_matching_tool

        # 1. Asking to create event without required details triggers questionnaire
        inquiry_res = execute_matching_tool("I want to create an event")
        assert inquiry_res is not None
        assert inquiry_res["tool"] == "inquiry_event_details"
        assert "Estimated Budget" in inquiry_res["result"]["message"]
        assert "Food & Catering Needs" in inquiry_res["result"]["message"]

        # 2. Providing details creates event with checklist
        full_res = execute_matching_tool("Create wedding budget $20000 with 150 guests on 2026-11-20 and food needed")
        assert full_res is not None
        assert full_res["tool"] == "create_event"
        assert full_res["result"]["event"]["planned_budget"] == 20000.0
        assert full_res["result"]["event"]["expected_guest_count"] == 150
        assert "checklist" in full_res["result"]
