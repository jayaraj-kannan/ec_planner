"""Event and Celebration Planner domain tools for the ADK Agent.

These tools are registered as function tools on the ADK Agent, allowing the LLM
to perform deterministic calculations, checklist generation, run-sheet creation,
and event readiness risk analysis.
"""

from typing import Any


def calculate_budget_breakdown(
    total_budget: float,
    event_type: str = "wedding",
    guest_count: int = 100,
) -> dict[str, Any]:
    """Calculates recommended budget allocation categories based on total budget, event type, and guest count.

    Args:
        total_budget: Total planned budget in currency units (e.g. 10000).
        event_type: Type of event ('wedding', 'birthday', 'anniversary', 'baby_shower', 'reception', 'corporate').
        guest_count: Expected number of guests.

    Returns:
        Dictionary with allocated categories, percentages, estimated per-guest cost, and buffer allocation.
    """
    event_type_lower = event_type.lower()

    # Category distribution templates based on event types
    if "wedding" in event_type_lower or "reception" in event_type_lower:
        distribution = {
            "Venue & Catering": 0.45,
            "Decor, Florals & Lighting": 0.15,
            "Photography & Videography": 0.12,
            "Music, DJ & Entertainment": 0.08,
            "Attire, Hair & Makeup": 0.08,
            "Invitations & Stationery": 0.04,
            "Contingency / Emergency Buffer": 0.08,
        }
    elif "birthday" in event_type_lower:
        distribution = {
            "Venue & Food/Beverages": 0.50,
            "Cake & Desserts": 0.10,
            "Theme Decor & Balloons": 0.15,
            "Entertainment & Games": 0.12,
            "Favors & Party Gifts": 0.05,
            "Contingency Buffer": 0.08,
        }
    elif "baby" in event_type_lower or "shower" in event_type_lower:
        distribution = {
            "Venue & Brunch/Catering": 0.48,
            "Decor & Photo Backdrop": 0.18,
            "Games & Prizes": 0.08,
            "Cake & Sweet Station": 0.10,
            "Favors & Thank You Cards": 0.06,
            "Buffer Fund": 0.10,
        }
    else:  # General / Anniversary / Celebration
        distribution = {
            "Venue & Dining": 0.50,
            "Decor & Ambiance": 0.15,
            "Photography & Keepsakes": 0.10,
            "Entertainment & Audio": 0.10,
            "Favors & Stationery": 0.05,
            "Contingency Buffer": 0.10,
        }

    categories = []
    for cat_name, pct in distribution.items():
        amount = round(total_budget * pct, 2)
        categories.append({
            "category": cat_name,
            "percentage": f"{int(pct * 100)}%",
            "recommended_amount": amount,
        })

    per_guest = round(total_budget / max(1, guest_count), 2)

    return {
        "event_type": event_type,
        "total_budget": total_budget,
        "guest_count": guest_count,
        "per_guest_budget": per_guest,
        "breakdown": categories,
        "advice": (
            f"For {guest_count} guests, venue & catering typically consumes roughly 45-50% "
            f"of total spend (~${round(total_budget * 0.45, 2)}). We always reserve a buffer for last-minute adjustments."
        ),
    }


def generate_checklist_tasks(
    event_type: str = "wedding",
    days_until_event: int = 90,
) -> dict[str, Any]:
    """Generates milestone-based checklist tasks tailored to the event type and remaining timeline.

    Args:
        event_type: Type of celebration ('wedding', 'birthday', 'anniversary', 'baby_shower', 'corporate').
        days_until_event: Number of days remaining until the celebration date.

    Returns:
        Structured checklist organized by timeline phase and priority.
    """
    event_type_lower = event_type.lower()
    phases = []

    # Milestone 1: Early Planning
    early_tasks = [
        {"title": "Finalize estimated guest headcount", "priority": "High", "phase": "Planning Phase"},
        {"title": "Set firm overall budget limit", "priority": "High", "phase": "Planning Phase"},
        {"title": "Shortlist and book primary venue", "priority": "Urgent", "phase": "Planning Phase"},
    ]
    if "wedding" in event_type_lower:
        early_tasks.extend([
            {"title": "Book photographer and videographer", "priority": "High", "phase": "Planning Phase"},
            {"title": "Select catering menu and schedule tasting", "priority": "Medium", "phase": "Planning Phase"},
        ])
    phases.append({"timeline": "Early Phase (3+ months out)", "tasks": early_tasks})

    # Milestone 2: Mid Planning (1-2 months out)
    mid_tasks = [
        {"title": "Send out invitations or digital RSVPs", "priority": "High", "phase": "Mid Phase"},
        {"title": "Order decor, centerpieces, and backdrop elements", "priority": "Medium", "phase": "Mid Phase"},
        {"title": "Confirm entertainment / playlist / DJ", "priority": "Medium", "phase": "Mid Phase"},
    ]
    phases.append({"timeline": "Mid Phase (4-8 weeks out)", "tasks": mid_tasks})

    # Milestone 3: Final Countdown (1-2 weeks out)
    final_tasks = [
        {"title": "Follow up with non-responding guests", "priority": "High", "phase": "Countdown"},
        {"title": "Submit final headcount to venue / caterer", "priority": "Urgent", "phase": "Countdown"},
        {"title": "Prepare day-of run sheet and share with collaborators", "priority": "High", "phase": "Countdown"},
        {"title": "Confirm delivery and setup timing with all vendors", "priority": "High", "phase": "Countdown"},
    ]
    phases.append({"timeline": "Countdown (1-2 weeks out)", "tasks": final_tasks})

    # Milestone 4: Event Day
    day_of_tasks = [
        {"title": "Pack emergency essentials kit (chargers, tape, safety pins, pain relievers)", "priority": "Medium", "phase": "Event Day"},
        {"title": "Conduct early morning venue walk-through", "priority": "High", "phase": "Event Day"},
        {"title": "Assign point-of-contact collaborator for vendor arrivals", "priority": "High", "phase": "Event Day"},
    ]
    phases.append({"timeline": "Day of Celebration", "tasks": day_of_tasks})

    urgent_action = "Book venue and confirm date" if days_until_event > 60 else "Lock in headcount and vendor schedules"

    return {
        "event_type": event_type,
        "days_remaining": days_until_event,
        "suggested_immediate_action": urgent_action,
        "milestone_phases": phases,
    }


def recommend_vendors(
    category: str,
    budget_tier: str = "moderate",
    event_type: str = "general",
) -> dict[str, Any]:
    """Provides vendor recommendations, checklist questions to ask, and standard contract payment terms.

    Args:
        category: Vendor category (e.g. 'catering', 'photography', 'decor', 'music', 'venue').
        budget_tier: 'budget', 'moderate', or 'luxury'.
        event_type: Type of event for tailored vendor advice.

    Returns:
        Guidance on vetting criteria, key interview questions, and typical deposit structures.
    """
    category_lower = category.lower()

    criteria = {
        "photography": {
            "key_questions": [
                "How many hours of coverage are included in the package?",
                "Do you provide raw unedited photos or only edited selects?",
                "What is your turnaround time for the digital gallery?",
                "Do you have backup equipment and an assistant shooter?",
            ],
            "typical_deposit": "20% - 30% upfront upon signing, remainder 7 days before event",
            "pro_tip": "Always request a full real event gallery from start to finish, not just curated highlights.",
        },
        "catering": {
            "key_questions": [
                "Does your quote include waitstaff, linens, and tableware?",
                "How do you handle dietary restrictions, allergies, and vegan options?",
                "What are your policies on vendor meals and overtime fees?",
                "Is clean-up and trash removal included in the price?",
            ],
            "typical_deposit": "25% deposit, 50% 30 days prior with final headcount, remainder after service",
            "pro_tip": "Verify whether service charge (gratuity/tax) is included or added to the bill.",
        },
        "decor": {
            "key_questions": [
                "Are setup and late-night breakdown included in the fee?",
                "Can you repurpose ceremony florals/backdrops into the reception area?",
                "What happens if specific flowers/materials are unavailable on event day?",
            ],
            "typical_deposit": "30% non-refundable deposit upon contract signing",
            "pro_tip": "Opt for rental items rather than purchasing single-use decor.",
        },
    }

    info = criteria.get(
        category_lower,
        {
            "key_questions": [
                "What is included in the baseline package vs add-on charges?",
                "What is your cancellation and rescheduling policy?",
                "Have you worked at this venue before?",
                "Can you provide 2 references from recent celebrations?",
            ],
            "typical_deposit": "20% - 30% at booking, final balance 1-2 weeks before event",
            "pro_tip": "Get all deliverables, delivery times, and arrival windows written into the signed contract.",
        },
    )

    return {
        "category": category,
        "budget_tier": budget_tier,
        "event_type": event_type,
        "vetting_questions": info["key_questions"],
        "payment_schedule": info["typical_deposit"],
        "expert_tip": info["pro_tip"],
    }


def generate_day_of_run_sheet(
    event_type: str = "wedding",
    start_time: str = "10:00",
    duration_hours: int = 6,
) -> dict[str, Any]:
    """Generates an hour-by-hour run sheet and activity timeline for the day of the event.

    Args:
        event_type: Celebration type ('wedding', 'birthday', 'anniversary', 'reception', 'party').
        start_time: Event start time in 24hr format ('HH:MM', e.g. '11:00').
        duration_hours: Event duration in hours (e.g. 5).

    Returns:
        Structured hourly run sheet with owner assignments and buffer periods.
    """
    event_type_lower = event_type.lower()
    slots = []

    try:
        sh, sm = map(int, start_time.split(":"))
    except Exception:
        sh, sm = 10, 0

    def fmt_time(h: int, m: int) -> str:
        period = "AM" if h < 12 or h == 24 else "PM"
        display_h = h % 12
        if display_h == 0:
            display_h = 12
        return f"{display_h}:{m:02d} {period}"

    # Pre-event setup (2 hours prior)
    setup_start = max(0, sh - 2)
    slots.append({
        "time": fmt_time(setup_start, 0),
        "activity": "Venue Access & Decor Setup Begins",
        "owner": "Decor Team & Venue Lead",
        "notes": "Ensure tables, chairs, audio equipment, and floral backdrops are positioned.",
    })
    slots.append({
        "time": fmt_time(sh - 1, 0),
        "activity": "Vendor Arrival & Sound Check",
        "owner": "DJ / Caterer / Lead Planner",
        "notes": "Verify microphone, background music, beverage stations, and refrigeration.",
    })
    slots.append({
        "time": fmt_time(sh, 0),
        "activity": "Guest Arrival & Welcome Refreshments",
        "owner": "Greeting Hosts / Greeters",
        "notes": "Welcome drink station opens, guest book signing table active.",
    })

    if "wedding" in event_type_lower:
        slots.append({
            "time": fmt_time(sh + 1, 0),
            "activity": "Main Ceremony / Rituals",
            "owner": "Officiant & Wedding Party",
            "notes": "Processional starts promptly, photography team captures key moments.",
        })
        slots.append({
            "time": fmt_time(sh + 2, 0),
            "activity": "Family & Group Portraits / Cocktail Social",
            "owner": "Photographer & Coordinator",
            "notes": "Pre-listed family portrait groupings called out to keep flow smooth.",
        })
        slots.append({
            "time": fmt_time(sh + 3, 0),
            "activity": "Grand Reception Entrance & Speeches",
            "owner": "MC & Hosts",
            "notes": "Welcome speech, best wishes toasts, highlight montage.",
        })
        slots.append({
            "time": fmt_time(sh + 3, 45),
            "activity": "Dinner Buffet / Banquet Service",
            "owner": "Catering Lead",
            "notes": "Dinner service begins, soft ambient background music.",
        })
        slots.append({
            "time": fmt_time(sh + 4, 45),
            "activity": "Cake Cutting, Dessert Station & First Dance",
            "owner": "MC & Couple",
            "notes": "Cake cutting photo-op followed immediately by dance floor opening.",
        })
    else:
        slots.append({
            "time": fmt_time(sh + 1, 0),
            "activity": "Welcome Opening & Ice-Breaker Games",
            "owner": "Event Host / MC",
            "notes": "Interactive games and mingling for guests.",
        })
        slots.append({
            "time": fmt_time(sh + 2, 0),
            "activity": "Ceremonial Toast & Cake Cutting",
            "owner": "Celebrant & Hosts",
            "notes": "Group gathering around celebrant, photos and sing-along.",
        })
        slots.append({
            "time": fmt_time(sh + 2, 30),
            "activity": "Meal & Buffet Service Open",
            "owner": "Catering Lead",
            "notes": "Main meal service opens.",
        })
        slots.append({
            "time": fmt_time(sh + 3, 45),
            "activity": "Music, Dancing & Entertainment",
            "owner": "DJ / Entertainer",
            "notes": "Open dance floor and celebration highlights.",
        })

    end_hour = min(23, sh + duration_hours)
    slots.append({
        "time": fmt_time(end_hour, 0),
        "activity": "Warm Farewell & Favor Distribution",
        "owner": "Hosts",
        "notes": "Thanking guests as they depart, hand out personalized celebration favors.",
    })
    slots.append({
        "time": fmt_time(end_hour + 1, 0),
        "activity": "Venue Clean-up & Final Pack-Down",
        "owner": "Family Coordinators & Vendors",
        "notes": "Collect personal items, settle final vendor tips, verify venue handover.",
    })

    return {
        "event_type": event_type,
        "schedule_count": len(slots),
        "timeline": slots,
    }


def analyze_event_readiness(
    completed_tasks: int,
    total_tasks: int,
    confirmed_guests: int,
    total_invited: int,
    spent_amount: float,
    budget_amount: float,
) -> dict[str, Any]:
    """Assesses event planning readiness, budget health, and flags urgent risks.

    Args:
        completed_tasks: Number of finished checklist tasks.
        total_tasks: Total number of tasks on the checklist.
        confirmed_guests: Number of guests who confirmed YES.
        total_invited: Total number of guests sent invitations.
        spent_amount: Total money committed or spent so far.
        budget_amount: Total approved event budget.

    Returns:
        Readiness score (0-100), health badges, budget remaining, and high-priority action items.
    """
    task_pct = (completed_tasks / max(1, total_tasks)) * 100
    rsvp_pct = (confirmed_guests / max(1, total_invited)) * 100
    budget_used_pct = (spent_amount / max(1.0, budget_amount)) * 100
    budget_remaining = max(0.0, budget_amount - spent_amount)

    # Calculate weighted readiness score
    # 40% task progress, 30% RSVP clarity, 30% budget control
    budget_health_factor = 100 if budget_used_pct <= 100 else max(0, 100 - (budget_used_pct - 100) * 2)
    readiness_score = int(task_pct * 0.4 + rsvp_pct * 0.3 + budget_health_factor * 0.3)

    risks = []
    if budget_used_pct > 95:
        risks.append(f"Budget Alert: You have used {budget_used_pct:.1f}% of your budget (${spent_amount:,.2f} of ${budget_amount:,.2f}).")
    if rsvp_pct < 50 and total_invited > 10:
        risks.append(f"RSVP Alert: Only {rsvp_pct:.1f}% of guests have responded ({confirmed_guests} of {total_invited}). Send a reminder.")
    if task_pct < 60:
        risks.append(f"Checklist Alert: Only {completed_tasks} of {total_tasks} tasks are marked done ({task_pct:.1f}%).")

    if readiness_score >= 80:
        status_label = "On Track & Prepared"
        status_color = "green"
    elif readiness_score >= 50:
        status_label = "In Progress - Attention Needed"
        status_color = "amber"
    else:
        status_label = "Critical Action Required"
        status_color = "red"

    return {
        "readiness_score": readiness_score,
        "status_label": status_label,
        "status_color": status_color,
        "budget_summary": {
            "spent": spent_amount,
            "budget": budget_amount,
            "remaining": budget_remaining,
            "percent_used": f"{budget_used_pct:.1f}%",
            "is_over_budget": spent_amount > budget_amount,
        },
        "tasks_summary": {
            "completed": completed_tasks,
            "total": total_tasks,
            "completion_rate": f"{task_pct:.1f}%",
        },
        "guests_summary": {
            "confirmed": confirmed_guests,
            "invited": total_invited,
            "response_rate": f"{rsvp_pct:.1f}%",
        },
        "critical_risks": risks,
    }
