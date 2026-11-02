# PORTOS AI — Port Operations Intelligence System

[![Prototype Status](https://img.shields.io/badge/status-complete-16A394.svg)](docs/roadmap.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Design System](https://img.shields.io/badge/design-Minimal_Industrial_Futurism-102A43.svg)](docs/design/design-system.md)
[![Tests Passed](https://img.shields.io/badge/tests-85%20backend%20%7C%2070%20E2E%20passed-success.svg)](docs/quality/test-results.md)

**Prototype Version:** 0.1.0  
**Competition:** Blue AI Challenge 2026–27 (Bangladesh Blue Economy & Maritime Logistics)  
**Target Environment:** Chattogram-Inspired Container Terminal Corridor (Karnaphuli Approach)

---

## 1. System Overview

**PORTOS AI** is an AI-assisted port operations decision-support system designed to address the unique hydrographic and operational bottlenecks of container terminals in Bangladesh. 

Unlike deep-water ports, the Port of Chattogram operates along a narrow river channel (the Karnaphuli Fairway) with semi-diurnal tides where draft restrictions limit vessel transit to specific high-water windows. A single uncoordinated delay cascades into anchorage queuing, missed berthing windows, and terminal yard congestion.

PORTOS AI unifies mathematical optimization, discrete-event simulation, machine learning, and generative reasoning into an integrated operational workspace:

```
┌─────────────────────────────────────────────────────────────────────────┐
│               PORTOS AI HYBRID INTELLIGENCE ARCHITECTURE               │
├───────────────────┬───────────────────────┬─────────────────────────────┤
│ ANALYTICAL ROLE   │ ENGINE / TECHNOLOGY   │ OPERATIONAL PURPOSE         │
├───────────────────┼───────────────────────┼─────────────────────────────┤
│ Berth Allocation  │ Google OR-Tools CP-SAT│ Solves constrained, feasible│
│ Optimization      │ (Deterministic Solver)│ berthing schedules (draft/  │
│                   │                       │ tides/length/crane reach).  │
├───────────────────┼───────────────────────┼─────────────────────────────┤
│ Scenario          │ SimPy Discrete-Event  │ Simulates weather delays,   │
│ Simulation        │ Simulation Engine     │ crane faults, and anchorage │
│                   │                       │ queue trade-offs.           │
├───────────────────┼───────────────────────┼─────────────────────────────┤
│ Predictive        │ scikit-learn Gradient │ Forecasts continuous arrival│
│ Delay Analytics   │ Boosting Regressor &  │ delays and classifies       │
│                   │ Binary Classifier     │ tidal miss risk.            │
├───────────────────┼───────────────────────┼─────────────────────────────┤
│ Yard Congestion   │ scikit-learn Gradient │ Projects block density      │
│ Forecasting       │ Boosting Pipeline     │ across 6h, 12h, 24h horizons│
├───────────────────┼───────────────────────┼─────────────────────────────┤
│ Carbon & Fuel     │ GLEC Framework v3.0   │ Calculates auditable hotel- │
│ Accounting        │ Calculation Engine    │ ing & crane CO2e emissions. │
├───────────────────┼───────────────────────┼─────────────────────────────┤
│ Operational       │ Google Gemini 2.5     │ Synthesizes briefings via a │
│ Copilot           │ Flash / Offline Demo  │ strict 10-tool allowlist    │
│                   │ Mode Fallback         │ with safety-critical refusal│
├───────────────────┼───────────────────────┼─────────────────────────────┤
│ Event Bus &       │ FastAPI Server-Sent   │ Synchronizes incidents and  │
│ Workflow Sync     │ Events (SSE)          │ state across all 8 modules. │
└───────────────────┴───────────────────────┴─────────────────────────────┘
```

> [!IMPORTANT]
> **Operational Truthfulness Disclaimer:**  
> PORTOS AI is an illustrative research and competition prototype. It is **not** connected to Chattogram Port Authority (CPA) live networks, customs, or physical crane equipment. All demonstration records are tagged `SIMULATED`, and all recommendations are strictly advisory decision-support proposals requiring human review.

---

## 2. Quickstart: Docker Compose (Single Command)

The fastest way to experience PORTOS AI is using Docker Compose:

```bash
# 1. Clone and copy environment variables
git clone https://github.com/your-org/portos-ai.git
cd portos-ai
cp .env.example .env

# 2. Build and start all services
docker compose up --build -d

# 3. Verify running containers
docker compose ps
```

- **Frontend Operational Workspace:** [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend & Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **System Compliance Audit:** [http://localhost:8000/api/v1/system/audit](http://localhost:8000/api/v1/system/audit)

To stop and remove containers:
```bash
docker compose down -v
```

---

## 3. Quickstart: Local Workstation Setup (Without Docker)

### Prerequisites
- **Python:** 3.11+ (Tested on Python 3.11–3.14)
- **Node.js:** v18.0.0+ (Tested on Node.js v20+)
- **Git**

### Step 3.1: Backend Setup
```powershell
# 1. Navigate to backend and create virtual environment
cd backend
python -m venv .venv

# Activate environment:
# Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# Linux / macOS:
# source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt
pip install scikit-learn ortools simpy openpyxl pypdf

# 3. Seed baseline operational records (uses SQLite portos.db fallback if PostgreSQL is not active)
cd ..
python scripts/seed.py

# 4. Start the FastAPI server
cd backend
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 3.2: Frontend Setup
```powershell
# 1. Install frontend dependencies
npm --prefix frontend install

# 2. Build production assets
npm --prefix frontend run build

# 3. Start Next.js production server
npm --prefix frontend run start
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Operational Demo Reset & ML Retraining

### 4.1 Instant Demo State Reset
To restore the database to baseline seed records and clear injected incidents:
```bash
python scripts/reset_demo.py
```
*Via REST API:* `POST http://127.0.0.1:8000/api/v1/events/reset-incident`

### 4.2 Machine Learning Model Retraining
To regenerate synthetic training sets and retrain the scikit-learn models:
```bash
python scripts/train_models.py
```
*Outputs:*
- `backend/app/ml/artifacts/eta_regressor.joblib` (MAE: 0.85h vs baseline 2.74h, -69.1% error reduction)
- `backend/app/ml/artifacts/delay_classifier.joblib` (92.2% Accuracy, 94.1% Precision, 96.5% Recall)
- `backend/app/ml/artifacts/models_metadata.json`

---

## 5. Automated Verification & Test Results

PORTOS AI enforces the strict **Gravitas Protocol** requiring executable evidence for all code modifications:

```
══════════════════════════════════════════════════════════════════
  VERIFICATION EVIDENCE SUMMARY (MILESTONES 00–17)
══════════════════════════════════════════════════════════════════
  Backend pytest Unit/Integration:    85 / 85 PASSED (100%)
  Frontend Playwright E2E Tests:      70 / 70 PASSED (100%)
  TypeScript Strict Typecheck:        0 ERRORS (tsc --noEmit)
  ESLint Code Quality Check:          0 WARNINGS / 0 ERRORS
  Next.js Production Build:           14 / 14 ROUTES COMPILED
  Security & Responsible-AI Audit:    VERDICT: PASS
══════════════════════════════════════════════════════════════════
```

### Run Tests Locally:
```bash
# Backend pytest suite:
cd backend && pytest -v

# Frontend Playwright E2E browser suite:
cd frontend && npx playwright test
```

---

## 6. Five-Minute Showcase Walkthrough

Follow this sequence for the official Blue AI Challenge presentation:

| Time | Action | What to Inspect |
| :---: | :--- | :--- |
| **0:00–0:35** | **Problem & Scope (`/`)** | Bangladesh tidal river bottleneck context; persistent `DEMO ENVIRONMENT` banner. |
| **0:35–1:10** | **Overview & Provenance (`/`)** | Live KPI strip; 5-tier status tagging (`SIMULATED`); Data Lineage footer links. |
| **1:10–1:55** | **Vessel Intelligence (`/vessels`)** | Select `MV Meghna Pride`; inspect draft vs. falling tide; view ML delay prediction (+3.4h). |
| **1:55–2:40** | **Berth Planning (`/berth-planner`)** | Google OR-Tools CP-SAT Gantt matrix; mathematical draft/outreach constraints; advisory review modal. |
| **2:40–3:40** | **Decision Lab (`/scenario-lab`)** | Inject Monsoon Surge; run SimPy discrete-event simulation; compare queue trade-offs. |
| **3:40–4:20** | **Digital Twin & Yard (`/digital-twin`, `/yard`)** | 3D/2D isometric twin sync; block-level yard congestion heatmap; GLEC carbon accounting. |
| **4:20–4:50** | **Port Copilot (`/copilot`)** | Gemini operational query briefing via 10-tool allowlist; adversarial prompt injection refusal. |
| **4:50–5:00** | **Validation & Wrap-Up** | 85 backend + 70 E2E tests verified; Responsible-AI boundaries; technical roadmap. |

See [`docs/demo/five-minute-demo-script.md`](docs/demo/five-minute-demo-script.md) for the verbatim spoken script and [`SHOWCASE_CHECKLIST.md`](SHOWCASE_CHECKLIST.md) for pre-flight setup.

---

## 7. Environment Variables Reference

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `APP_ENV` | `development` | Operating environment (`development` / `production`). |
| `DEMO_MODE` | `true` | Enforces `SIMULATED` operational status labels. |
| `APP_TIMEZONE` | `Asia/Dhaka` | Operational timezone (BST, UTC+6). |
| `FRONTEND_ORIGIN` | `http://localhost:3000` | Whitelisted origin for CORS middleware. |
| `DATABASE_URL` | `postgresql+psycopg://...` | PostgreSQL URI. Falls back cleanly to SQLite `portos.db` if unreachable. |
| `GEMINI_API_KEY` | *(Empty)* | Optional Google Gemini key. Runs in **Offline Demo Mode** if omitted. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Target model for Gemini Port Copilot. |
| `SIMULATION_SEED` | `42` | Deterministic random seed for SimPy and ML pipelines. |

---

## 8. Responsible AI & Operational Boundaries

1. **Separation of Analytical Roles:** Google Gemini synthesizes briefings and explains outputs; it never invents schedule times, arrival delays, or simulation statistics. OR-Tools and SimPy solve schedules and simulations deterministically.
2. **Advisory Decision Support:** The platform never issues vessel maneuvering orders, navigational clearances, or crane movement commands. All schedules require human review.
3. **Dual-Tier Security:** Regex sanitization and strict function-calling allowlists neutralize adversarial prompt injection attempts and enforce 10MB limits with spreadsheet formula neutralization on all uploaded operational logs.
4. **Offline Resilience:** Functions 100% locally in offline demonstration environments without requiring external cloud API keys or commercial data feeds.

---

## 9. Post-Competition Technical Roadmap

- **Hydrographic Sensor Fusion:** Calibrate river draft windows with live Karnaphuli acoustic Doppler current profiler (ADCP) telemetry.
- **Off-Dock ICD Depot Integration:** Extend yard congestion models to incorporate the 19+ private Inland Container Depots across Chittagong.
- **Vessel Emissions Decarbonization:** Model shore power (cold ironing) retrofits on berths CCT-1 through CCT-3 to simulate particulate matter reduction.

---

## 10. License & Attributions

- **License:** MIT License.
- **Map Data:** © [OpenStreetMap](https://www.openstreetmap.org) contributors.
- **Emissions Standard:** Global Logistics Emissions Council (GLEC) Framework v3.0.
- **AI Tooling Disclosure:** Detailed in [`AI_USE_DISCLOSURE.md`](AI_USE_DISCLOSURE.md).
