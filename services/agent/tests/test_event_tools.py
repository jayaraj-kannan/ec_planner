"""Unit tests for ADK domain calculation and planning tools.

Tests deterministic domain functions for budget breakdown, day-of run sheet,
checklist generation, vendor vetting recommendations, and readiness analysis.
"""

import pytest
from app.tools.event_tools import (
    calculate_budget_breakdown,
    generate_day_of_run_sheet,
    generate_checklist_tasks,
    recommend_vendors,
    analyze_event_readiness,
)


class TestCalculateBudgetBreakdown:
    """Test suite for calculate_budget_breakdown tool."""

    def test_wedding_budget_allocation(self):
        result = calculate_budget_breakdown(
            total_budget=20000.0,
            event_type="wedding",
            guest_count=100,
        )

        assert result["total_budget"] == 20000.0
        assert result["event_type"] == "wedding"
        assert result["guest_count"] == 100
        assert result["per_guest_budget"] == 200.0
        assert len(result["breakdown"]) > 0

        # Verify sum of allocated amounts matches total budget
        total_allocated = sum(item["recommended_amount"] for item in result["breakdown"])
        assert pytest.approx(total_allocated, 0.01) == 20000.0

        # Check critical categories exist
        categories = [item["category"] for item in result["breakdown"]]
        assert "Venue & Catering" in categories
        assert "Photography & Videography" in categories
        assert "Contingency / Emergency Buffer" in categories

    def test_birthday_budget_allocation(self):
        result = calculate_budget_breakdown(
            total_budget=5000.0,
            event_type="birthday",
            guest_count=50,
        )

        assert result["per_guest_budget"] == 100.0
        categories = [item["category"] for item in result["breakdown"]]
        assert "Cake & Desserts" in categories
        assert "Theme Decor & Balloons" in categories

    def test_zero_guest_count_handling(self):
        result = calculate_budget_breakdown(
            total_budget=10000.0,
            event_type="corporate",
            guest_count=0,
        )
        # Should gracefully avoid ZeroDivisionError
        assert result["per_guest_budget"] == 10000.0


class TestGenerateDayOfRunSheet:
    """Test suite for generate_day_of_run_sheet tool."""

    def test_standard_wedding_run_sheet(self):
        result = generate_day_of_run_sheet(
            event_type="wedding",
            start_time="10:00",
            duration_hours=6,
        )

        assert result["event_type"] == "wedding"
        assert len(result["timeline"]) >= 6
        assert result["schedule_count"] == len(result["timeline"])

        # Check slot structure
        first_slot = result["timeline"][0]
        assert "time" in first_slot
        assert "activity" in first_slot
        assert "owner" in first_slot
        assert "notes" in first_slot

    def test_invalid_time_format_graceful_fallback(self):
        result = generate_day_of_run_sheet(
            event_type="party",
            start_time="invalid-time",
            duration_hours=4,
        )
        assert len(result["timeline"]) >= 4


class TestGenerateChecklistTasks:
    """Test suite for generate_checklist_tasks tool."""

    def test_far_out_event_checklist(self):
        result = generate_checklist_tasks(
            event_type="wedding",
            days_until_event=90,
        )

        assert result["event_type"] == "wedding"
        assert result["days_remaining"] == 90
        assert "Book venue" in result["suggested_immediate_action"]
        assert len(result["milestone_phases"]) > 0

        # Check phase tasks
        for phase in result["milestone_phases"]:
            assert "timeline" in phase
            assert len(phase["tasks"]) > 0
            for task in phase["tasks"]:
                assert "title" in task
                assert task["priority"] in ["Urgent", "High", "Medium", "Low"]

    def test_imminent_event_checklist(self):
        result = generate_checklist_tasks(
            event_type="anniversary",
            days_until_event=15,
        )
        assert "Lock in headcount" in result["suggested_immediate_action"]


class TestRecommendVendors:
    """Test suite for recommend_vendors tool."""

    def test_photography_vendor_guidance(self):
        result = recommend_vendors(category="photography", budget_tier="moderate")
        assert result["category"] == "photography"
        assert len(result["vetting_questions"]) >= 4
        assert "turnaround time" in " ".join(result["vetting_questions"]).lower()
        assert len(result["payment_schedule"]) > 0
        assert result["expert_tip"] != ""

    def test_catering_vendor_guidance(self):
        result = recommend_vendors(category="catering", budget_tier="luxury")
        assert result["category"] == "catering"
        assert any("dietary" in q.lower() for q in result["vetting_questions"])

    def test_fallback_category_guidance(self):
        result = recommend_vendors(category="custom_lighting")
        assert len(result["vetting_questions"]) >= 3
        assert "expert_tip" in result


class TestAnalyzeEventReadiness:
    """Test suite for analyze_event_readiness tool."""

    def test_high_readiness_event(self):
        result = analyze_event_readiness(
            completed_tasks=20,
            total_tasks=20,
            confirmed_guests=100,
            total_invited=100,
            spent_amount=10000.0,
            budget_amount=12000.0,
        )

        assert result["readiness_score"] >= 90
        assert result["status_label"] == "On Track & Prepared"
        assert result["status_color"] == "green"
        assert len(result["critical_risks"]) == 0

    def test_critical_risk_detection(self):
        # Over budget, low RSVPs, low tasks
        result = analyze_event_readiness(
            completed_tasks=2,
            total_tasks=20,
            confirmed_guests=10,
            total_invited=100,
            spent_amount=15000.0,
            budget_amount=10000.0,
        )

        assert result["readiness_score"] < 60
        assert result["status_color"] in ["amber", "red"]
        assert len(result["critical_risks"]) >= 2
        alerts = " ".join(result["critical_risks"]).lower()
        assert "budget" in alerts
        assert "rsvp" in alerts or "tasks" in alerts
