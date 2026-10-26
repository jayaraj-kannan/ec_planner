# PlanCraft ADK Agent Service

Intelligent Event and Celebration Planning Assistant built with **Google ADK (Agent Development Kit)** and **Gemini 2.5**.

This service provides domain-specific agent reasoning, tool execution, session persistence, and A2UI card generation for the PlanCraft frontend application.

---

## 🚀 Features

- **ADK Core Agent:** Pre-configured with domain prompt, instructions, and callbacks.
- **5 Custom Function Tools:**
  1. `calculate_budget_breakdown`: Computes category percentages, per-guest targets, and contingency buffers.
  2. `generate_checklist_tasks`: Produces phased, milestone-based checklist to-dos.
  3. `recommend_vendors`: Delivers vetting questions, standard contracts, and payment schedules.
  4. `generate_day_of_run_sheet`: Crafts hour-by-hour day-of schedules with assigned owners and buffers.
  5. `analyze_event_readiness`: Calculates a 0–100 readiness score and highlights critical planning risks.
- **Dual Runtime Support:**
  - **Local Direct Mode:** Runs using `server.py` (FastAPI) or `uv run adk web`.
  - **A2A Protocol Proxy Mode:** Supports deployed Agent Runtime / Cloud Run targets.
- **Session Persistence:** Lightweight SQLite session history (`adk_sessions.db`).
- **CORS Enabled:** Ready for communication with the Vue 3 frontend (`http://localhost:5173`).

---

## 🛠️ Quick Start (Local Development)

### 1. Prerequisites
- Python 3.11+
- [`uv`](https://docs.astral.sh/uv/) (recommended) or standard `pip`

### 2. Configure Environment
Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` to supply your `GOOGLE_API_KEY` (from [Google AI Studio](https://aistudio.google.com/)).

### 3. Run the Service
Using `uv`:
```bash
# Start the FastAPI service on port 8000
uv run uvicorn server:app --reload --port 8000
```
Or with `adk web` development UI:
```bash
uv run adk web --port 8080 --allow_origins "*" --reload_agents
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check & capabilities status |
| `GET` | `/api/tools` | List registered ADK domain tools |
| `POST` | `/chat` | Main conversational endpoint (JSON) |
| `POST` | `/create_session` | Initialize a new session ID |

### Example Chat Request:
```bash
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Calculate budget breakdown for a $15,000 wedding with 120 guests",
    "user_id": "user_123"
  }'
```

---

## ☁️ Deploy to Google Cloud Run

Build and deploy the container image directly to Cloud Run:
```bash
gcloud run deploy ec-planner-agent \
  --source . \
  --region us-central1 \
  --set-env-vars="GOOGLE_API_KEY=$GOOGLE_API_KEY,GEMINI_MODEL=gemini-2.5-flash" \
  --allow-unauthenticated
```
