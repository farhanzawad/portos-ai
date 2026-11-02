# PORTOS AI — Port Operations Intelligence System

**Prototype Version:** 0.1.0  
**Competition:** Blue AI Challenge 2026–27 (Bangladesh Blue Economy Track)  
**Design System:** Minimal Industrial Futurism

---

## 1. Overview

**PORTOS AI** is an AI-assisted port operations decision-support system designed for container terminal logistics in Bangladesh (inspired by the Chattogram maritime corridor). The system integrates:
- **Port Data Bridge:** Transparent ingestion and provenance tracking for operational records.
- **Hybrid Digital Twin:** Procedural 3D/2D spatial terminal representation.
- **Predictive Analytics:** Vessel arrival delay regression and classification (`scikit-learn`).
- **Berth Optimization:** Deterministic constraint-based berth scheduler (`Google OR-Tools`).
- **Decision Lab:** Discrete-event terminal simulation (`SimPy`).
- **Green Port Analytics:** Auditable auxiliary engine and equipment carbon estimations.
- **Port Intelligence Copilot:** Grounded operational reasoning with strict function calling (`Google GenAI SDK`).

> [!IMPORTANT]
> **Operational Truthfulness Disclaimer:**
> PORTOS AI is an illustrative academic and competition research prototype. It is **not** connected to live Chattogram Port Authority (CPA) systems, radar, customs, or real-world equipment controls. All demo records are tagged `SIMULATED`.

---

## 2. Repository Architecture

```text
portos-ai/
├── frontend/        # Next.js App Router, React 18, TypeScript, Tailwind CSS
├── backend/         # FastAPI, Pydantic v2, Python 3.12+ analytics services
├── docs/            # Architecture, data governance, model cards, QA
│   ├── architecture/ # System overview, ADRs (ADR-001 - ADR-010)
│   ├── data/        # Data classification policy & provenance schema
│   ├── ai/          # Reusable model card template
│   └── quality/     # Definition of Done & acceptance criteria
├── infra/           # Docker Compose for PostgreSQL 16 + PostGIS
├── scripts/         # Repeatable seed, setup, and model training scripts
├── .env.example     # Central environment variable template
├── .gitignore       # Monorepo git ignore rules
└── AGENTS.md        # Persistent engineering directives for coding agents
```

---

## 3. Local Startup & Verification Commands

### Prerequisites
- **Node.js:** v18.0.0+ (Tested on v24.19)
- **Python:** 3.11+ (Tested on Python 3.14)
- **Docker:** Optional (Required for local PostgreSQL + PostGIS container)

---

### Step 1: Environment Setup
Copy the environment template:
```bash
cp .env.example .env
```

---

### Step 2: Backend Service Setup & Run

1. Create a Python virtual environment:
   ```bash
   python -m venv backend/.venv
   ```

2. Activate virtual environment:
   - **Windows (PowerShell):** `.\backend\.venv\Scripts\Activate.ps1`
   - **Linux / macOS:** `source backend/.venv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

4. Run backend tests:
   ```bash
   pytest backend/tests
   ```

5. Start the backend server (FastAPI):
   ```bash
   # From root repository directory:
   .\backend\.venv\Scripts\uvicorn.exe app.main:app --app-dir backend --reload --port 8000
   ```
   *Health endpoint:* [http://localhost:8000/health](http://localhost:8000/health)  
   *Interactive API Docs:* [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Step 3: Frontend Application Setup & Run

1. Install frontend dependencies:
   ```bash
   npm install --prefix frontend
   ```

2. Verify TypeScript and Linting:
   ```bash
   npm run --prefix frontend typecheck
   npm run --prefix frontend lint
   ```

3. Build production bundle:
   ```bash
   npm run --prefix frontend build
   ```

4. Start frontend development server:
   ```bash
   npm run --prefix frontend dev
   ```
   *Frontend Application:* [http://localhost:3000](http://localhost:3000)

> [!NOTE]
> **Resilient Demo Mode:** The frontend loads and runs independently without crashing if the backend is stopped. The frontend connection card displays a controlled, informative `Backend Disconnected (UNAVAILABLE)` state.

---

### Step 4: Local Database (Optional Docker Compose)
If Docker is installed on your workstation, spin up the local PostgreSQL container with PostGIS:
```bash
docker compose -f infra/docker-compose.yml up -d
```

---

## 4. Verification Checkpoint (Milestone 01)

| Check | Target | Status |
| :--- | :--- | :--- |
| **Backend Unit Tests** | `pytest backend/tests` | **3 passed** |
| **Backend Health Check** | `GET http://localhost:8000/health` | **HTTP 200 OK** |
| **Frontend Typecheck** | `tsc --noEmit` in `frontend/` | **Verified** |
| **Frontend Production Build** | `next build` in `frontend/` | **Verified** |
| **Resilient Offline State** | Frontend loads when backend is offline | **Verified** |

