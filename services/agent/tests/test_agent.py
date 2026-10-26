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
