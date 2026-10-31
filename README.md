# 🎊 PlanCraft — Intelligent Event & Celebration Planner

> A modern, AI-powered celebration management platform combining **Vue 3**, **Google ADK (Agent Development Kit)**, **Gemini 2.5**, and **Firebase/Firestore** to make wedding, milestone, and celebration planning effortless.

[![Live App](https://img.shields.io/badge/Live%20App-Cloud%20Run-brightgreen?logo=google-cloud&logoColor=white)](https://ec-planner-28908034002.us-central1.run.app)
[![Frontend Unit Tests](https://img.shields.io/badge/Frontend%20Tests-208%20Passed-brightgreen)](https://github.com)
[![Line Coverage](https://img.shields.io/badge/Coverage-100%25%20Component%20Lines-success)](https://github.com)
[![Agent Pytest](https://img.shields.io/badge/Agent%20Tests-59%20Passed-blue)](https://github.com)
[![Vue 3](https://img.shields.io/badge/Vue-3.5%20%2B%20TypeScript-42b883)](https://vuejs.org/)
[![Google ADK](https://img.shields.io/badge/Google%20ADK-Agent%20Engine%20%2B%20A2UI-4285F4)](https://cloud.google.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-FFA611)](https://firebase.google.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🌐 Live Production Deployment

PlanCraft is deployed live on **Google Cloud Run** in a unified serverless architecture:

- 🔗 **Deployed App URL:** [https://ec-planner-28908034002.us-central1.run.app](https://ec-planner-28908034002.us-central1.run.app)
- 📍 **GCP Region:** `us-central1`
- ⚡ **Architecture:** Unified Serverless Container on Cloud Run hosting the Vue 3 SPA client, FastAPI proxy, and real-time WebSocket broadcast hub
- 🤖 **AI Copilot:** Google Vertex AI Reasoning Engine (`gemini-3.8-flash` / `gemini-2.5` ADK agent) communicating via A2A & rendering rich A2UI cards
- ⏱️ **Real-Time Run Sheet:** WebSocket broadcast providing instant cross-device synchronization and public attendee hash URLs

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

## 🧠 Gen AI Services & Architecture

PlanCraft is powered by a multi-layered Google Generative AI architecture combining foundation models, agent frameworks, managed runtimes, and rich UI protocols:

| Gen AI Layer / Service | Technology & Version | Purpose in PlanCraft |
|---|---|---|
| **Foundation LLM** | **Google Gemini** (`gemini-3.8-flash` & `gemini-2.5-flash`) via `google-genai` SDK v2.33.0 | Multi-turn reasoning, intent classification, natural language dialogue, and parameter extraction. |
| **Agent Framework** | **Google ADK** (Agent Development Kit v2.13.0) | Declarative agent definition (`Agent`), system prompt lifecycle, and deterministic function tool calling. |
| **Cloud Agent Runtime** | **Google Vertex AI Reasoning Engine** (`projects/28908034002/locations/us-central1/reasoningEngines/5372119530191454208`) | Managed, serverless execution of the ADK agent on Google Cloud Vertex AI Agent Engine. |
| **UI Protocol** | **Google A2UI (Agent-to-UI v0.8)** via `a2ui-agent-sdk` | Middleware callback (`a2ui_callback`) translating model outputs into structured interactive display cards. |
| **Agent Protocol** | **Google A2A (Agent-to-Agent)** | SSE streaming protocol connecting the client frontend and FastAPI proxy to the agent runtime. |
| **Session Memory** | **ADK Multi-Turn Session Persistence** (SQLite / Vertex Memory) | Maintains conversation history across inquiries, refining event parameters and recalling past turns. |
| **Local Dev Playground** | **Google ADK Web** (`adk web`) | Dedicated developer sandbox on port 8080 for real-time prompt engineering and tool inspection. |

---

## 🎯 AI-Powered Features & Capabilities

PlanCraft provides end-to-end event planning assistance through 10 registered function tools and conversational intelligence:

### 1. 📋 Guided Event Creation Questionnaire
- When users express intent to plan an event, the AI avoids premature database writes and initiates an intuitive, structured questionnaire:
  - **Event Name & Type** (Wedding, 1st Birthday, 25th Anniversary, Reception, Corporate Summit)
  - **Date & Venue Location**
  - **Budget Limit & Currency**
  - **Expected Guest Headcount**
  - **Food & Catering Needs** (Buffet, plated dinner, cocktail bar, dietary preferences)
  - **Aesthetic Theme & Special Instructions**
- Upon gathering details, the AI simultaneously executes `create_event` and `generate_checklist_tasks` to initialize the celebration with an actionable roadmap.

### 2. ⚡ Autonomous Event Lifecycle Management (5 Tools)
- **`create_event`**: Initializes celebrations in the database with dates, budgets, headcount, and catering instructions.
- **`update_event`**: Dynamically modifies event parameters (dates, budgets, guest headcounts, venues, themes, status).
- **`get_event_details`**: Retrieves full event parameters, venue details, and live day countdowns.
- **`list_events`**: Fetches all active celebrations and displays them as selectable cards.
- **`delete_event`**: Safely archives or deletes completed celebrations.

### 3. 💰 Intelligent Budget Allocation (`calculate_budget_breakdown`)
- Automatically divides total planned budgets across event-specific categories:
  - **Weddings / Receptions**: 45% Venue & Catering, 15% Decor & Florals, 12% Photography, 8% Music/DJ, 8% Attire, 4% Stationery, 8% Buffer.
  - **Birthdays / Anniversaries / Baby Showers**: Customized percentage distributions.
- Computes per-guest target spend and reserves emergency buffers for last-minute adjustments.

### 4. 📅 Timeline-Adaptive Milestone Checklist (`generate_checklist_tasks`)
- Generates prioritized to-dos categorized by time remaining until the big day:
  - **Early Phase** (Vendor vetting, venue deposits, theme selection)
  - **Mid Phase** (Invitations, menu tastings, attire fittings)
  - **Countdown Phase** (RSVP finalization, seating charts, final vendor confirmations)
  - **Event Day** (Emergency kit prep, vendor cue checks, run sheet sync)

### 5. ⏱️ Day-Of Run Sheet & Ceremony Sequencer (`generate_day_of_run_sheet`)
- Generates minute-by-minute schedules with assigned lead persons, location cues, and buffer intervals.
- Directly feeds into the real-time WebSocket run sheet broadcast and public attendee view.

### 6. 🤝 Vendor Vetting & Guidance (`recommend_vendors`)
- Delivers category-specific interview questions, typical deposit percentages, and contract protection tips for photographers, caterers, florists, and DJs.

### 7. 🎯 Automated Event Readiness & Risk Analyzer (`analyze_event_readiness`)
- Computes an **Event Readiness Score (0–100%)** factoring:
  - Task completion velocity vs. remaining timeline
  - Guest RSVP response rates and dietary confirmations
  - Budget spend pacing vs. allocated category caps
- Flags critical bottlenecks (e.g. unbooked vendors or overdue high-priority milestones).

### 8. 🎴 A2UI Interactive Rich Cards
- Tool outputs render directly as interactive UI surfaces inside the chat modal:
  - Clickable event cards that switch the active workspace
  - Schedule slot chips that trigger instant timing adjustments
  - Visual budget breakdown progress bars and readiness meters

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
- **Frontend**: 19 test suites · **208 / 208 tests passing** · **100% Component Line Coverage**.
- **Backend Agent**: 6 test suites · **59 / 59 tests passing**.
- **Type Checking**: Strict TypeScript validation (`vue-tsc -b`) passing with **0 errors**.

---

## 🔐 Authentication Options
PlanCraft supports two flexible authentication modes:
- **Google Sign-In**: Instant one-click authentication via Google OAuth popup.
- **Email & Password**: Account registration and login with input sanitization and password visibility toggle.
- **Local Fallback**: The app operates smoothly offline with celebration templates and local persistence even without active cloud connectivity.

---

## 👥 Credits & Authors

**PlanCraft** was designed and developed by:
- **Jayaraj Kannan** ([@jayarajkannan95](https://github.com/jayarajkannan95)) — *Architecture, Full-Stack Engineering & ADK Agent Development*
- **Email**: [jayarajkannan95@gmail.com](mailto:jayarajkannan95@gmail.com)

### 🌟 Acknowledgements & Ecosystem
- **Google Cloud & Vertex AI**: For Google ADK (Agent Development Kit), Gemini 2.5 & 3.8 Flash models, and Vertex AI Reasoning Engine runtime.
- **Google Cloud Run**: Serverless container infrastructure hosting the production deployment.
- **Firebase**: Realtime Auth and Firestore hierarchical database.
- **Vue.js**: Vue 3 Composition API & Vite tooling.
- **Lucide Icons**: Beautiful, accessible icon library.

---

## 📜 MIT License

```text
MIT License

Copyright (c) 2026 Jayaraj Kannan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
