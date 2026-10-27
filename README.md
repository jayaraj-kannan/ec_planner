# 🎊 PlanCraft — Intelligent Event & Celebration Planner

> A modern, AI-powered celebration management platform combining **Vue 3**, **Google ADK (Agent Development Kit)**, **Gemini 2.5**, and **Firebase/Firestore** to make wedding, milestone, and celebration planning effortless.

[![Frontend Unit Tests](https://img.shields.io/badge/Frontend%20Tests-136%20Passed-brightgreen)](https://github.com)
[![Line Coverage](https://img.shields.io/badge/Coverage-100%25%20Component%20Lines-success)](https://github.com)
[![Agent Pytest](https://img.shields.io/badge/Agent%20Tests-46%20Passed-blue)](https://github.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.5%20%2B%20TypeScript-42b883)](https://vuejs.org/)
[![Google ADK](https://img.shields.io/badge/Google%20ADK-Agent%20Engine%20%2B%20A2UI-4285F4)](https://cloud.google.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFA611)](https://firebase.google.com/)

---

## ✨ Why PlanCraft?

Event planning usually means fragmented spreadsheets, lost vendor quotes, missed deadlines, and last-minute panic. **PlanCraft** answers 5 essential questions in real time:

1. **What should I do next?** Priority-ranked checklist with deadline alerts.
2. **How is my budget holding up?** Multi-currency expense tracker with minor-unit accuracy and category caps.
3. **Who is attending?** RSVP manager tracking dietary requirements (Veg, Non-Veg, Jain, Vegan) and hotel allocations.
4. **How will event-day unfold?** Interactive live run sheet with minute-by-minute delay propagation.
5. **Am I ready for the big day?** An automated **Event Readiness Score (0–100%)** factoring tasks, budgets, vendor contracts, and guest attendance.

---

## 🏛️ System Architecture

```
ec_planner/
├── frontend/                     # Vue 3 + TypeScript Client App (Vite, Pinia-style store)
│   ├── src/
│   │   ├── components/           # Dashboard, Checklist, Budget, Guests, Vendors, Run Sheet
│   │   ├── components/auth/      # AuthModal (Google Sign-In + Email/Password)
│   │   ├── services/             # Firebase Auth & Firestore hierarchical subcollections
│   │   └── stores/               # eventStore & authStore reactive state
│   └── vite.config.ts
│
├── services/agent/               # Google ADK Python Agent Service (FastAPI)
│   ├── app/
│   │   ├── agent.py              # Gemini 2.5 Agent with domain prompts
│   │   ├── a2ui_utils.py         # Google A2UI card renderer
│   │   └── tools/                # Specialized function tools (budget, checklist, vendors, run sheet)
│   ├── server.py                 # FastAPI service (/chat, /health, /api/tools)
│   └── tests/                    # Pytest test suite
│
└── package.json                  # Unified root workspace scripts
```

---

## 🗄️ Firestore Document Structure

PlanCraft utilizes a clean, hierarchical subcollection design that isolates event-specific data, prevents document size bloating, and ensures fine-grained security rules:

```
users/{userId}                    # User profile, role, avatar, and provider metadata
events/{eventId}                  # Main event record (dates, venue, budget, status)
  ├── categories/{categoryId}     # Budget allocation buckets
  ├── tasks/{taskId}              # Event milestones & checklist tasks
  ├── expenses/{expenseId}        # Receipts, payment status & vendor links
  ├── guests/{guestId}            # RSVP status, dietary preferences & rooms
  ├── vendors/{vendorId}          # Contracts, quoted prices & contact details
  ├── schedule/{activityId}       # Run sheet activities, timing & delay minutes
  ├── arrangements/{itemId}       # Day-of arrangements (lighting, audio, decor)
  └── documents/{documentId}      # Contracts, floor plans, and run-sheet PDFs
```

---

## ⚡ Quick Start

### 1. Prerequisites
- **Node.js** (v18+) and **npm**
- **Python** (3.10+) and [**uv**](https://github.com/astral-sh/uv) (or `python -m venv`)

### 2. Environment Configuration
Create your environment files:
```bash
# Frontend environment (Firebase credentials)
cp frontend/.env.example frontend/.env

# Agent environment (Gemini API Key)
cp services/agent/.env.example services/agent/.env
```

Add your Gemini API Key in `services/agent/.env`:
```ini
GOOGLE_API_KEY=your_gemini_api_key_here
```

### 3. Install Dependencies
```bash
# Install frontend packages
cd frontend && npm install && cd ..

# Install Python agent dependencies via uv
npm run install:agent
```

---

## 🚀 Running the Services

| Service | Command | Port | Description |
|---|---|---|---|
| **Frontend Web App** | `npm run dev:frontend` | `5173` | Vue 3 UI at `http://localhost:5173` |
| **ADK AI Agent** | `npm run dev:agent` | `8000` | FastAPI server at `http://localhost:8000` |
| **ADK Web UI (Optional)** | `npm run dev:adk-web` | `8080` | Native ADK Playground at `http://localhost:8080` |

> **Tip:** You can stop all running services at any time with:
> ```bash
> lsof -ti :5173 -ti :8000 | xargs kill -9
> ```

---

## 🤖 Google ADK Copilot & A2UI

PlanCraft includes an embedded AI Event Planner Copilot that communicates via the **Agent-to-Agent (A2A)** and **A2UI** protocol:
- **Natural Language Orchestration**: Ask *"Create a wedding checklist"*, *"Calculate my catering budget"*, or *"What is my event readiness score?"*.
- **A2UI Rich Cards**: Emits structured interactive cards for instant review and execution inside the chat modal.
- **Dual-Surface Compatibility**: Works seamlessly both inside the PlanCraft frontend and inside Google ADK Web (`adk web`).

---

## 🧪 Testing & Code Quality

PlanCraft follows strict engineering practices with 100% component line coverage on the frontend and complete unit test coverage on the agent.

```bash
# 🧪 Run all test suites across the stack:
npm test

# 📊 Generate complete test coverage reports:
npm run test:coverage

# 🎯 Frontend-only tests (Vitest):
npm run test:frontend

# 🐍 Backend-only tests (Pytest):
npm run test:agent
```

### Test Summary
- **Frontend**: 16 test suites · **136 / 136 tests passing** · **100% Component Line Coverage**.
- **Backend Agent**: 5 test suites · **46 / 46 tests passing**.
- **Type Checking**: Strict TypeScript validation (`vue-tsc -b`) passing with **0 errors**.

---

## 🔐 Authentication Options
PlanCraft supports two flexible authentication modes:
- **Google Sign-In**: Instant one-click authentication via Google OAuth popup.
- **Email & Password**: Account registration and login with input sanitization and password visibility toggle.
- **Local Fallback**: The app operates smoothly offline with mock celebration datasets even without active cloud connectivity.

---

## 📜 License
Built for hackathons and production event management. Distributed under the **MIT License**.
