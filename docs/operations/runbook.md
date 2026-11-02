# PORTOS AI — Operational Runbook & Deployment Guide

**Document ID:** `OPS-RUN-001`  
**Revision:** 1.0.0 (Milestone 17 Package)  
**Date:** 2026-11-03  
**System:** Port Operations Intelligence System (PORTOS AI)

---

## 1. Quickstart: Docker Compose (Recommended)

The simplest way to start the complete PORTOS AI environment (PostgreSQL/PostGIS, FastAPI backend, and Next.js frontend):

### Step 1: Copy Environment Template
```bash
cp .env.example .env
```

### Step 2: Build & Start All Services
```bash
docker compose up --build -d
```

### Step 3: Verify Running Services
```bash
docker compose ps
```
- **Frontend Workspace:** [http://localhost:3000](http://localhost:3000)
- **FastAPI API & OpenAPI Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint:** [http://localhost:8000/health](http://localhost:8000/health)
- **PostgreSQL / PostGIS:** Port `5432`

### Step 4: Reseed / Reset Demo State
```bash
docker compose exec backend python scripts/reset_demo.py
```

### Step 5: Teardown
```bash
docker compose down -v
```

---

## 2. Quickstart: Local Manual Setup (Without Docker)

If running directly on a developer workstation (Windows PowerShell, macOS, or Linux):

### Prerequisites
- **Python:** 3.11+ (Tested on Python 3.11–3.14)
- **Node.js:** v18.0.0+ (Tested on Node.js v20+)
- **Git**

---

### Step 2.1: Backend Setup & Execution

1. **Navigate to the backend directory and set up a virtual environment:**
   ```powershell
   # Windows PowerShell:
   Set-Location backend
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1

   # Linux / macOS:
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   pip install scikit-learn ortools simpy openpyxl pypdf
   ```

3. **Initialize Database & Seed Baseline Records:**
   ```powershell
   # From the repository root:
   python scripts/seed.py
   ```
   *(Note: If PostgreSQL is not running locally on port 5432, the system automatically falls back to local SQLite `portos.db` for instant zero-dependency demonstration).*

4. **Start the FastAPI backend server:**
   ```powershell
   # From the backend directory:
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   *Verify:* Navigate to [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health). Expected: `{"status": "ok", "service": "portos-backend"}`.

---

### Step 2.2: Frontend Setup & Execution

1. **Install dependencies from repository root:**
   ```bash
   npm --prefix frontend install
   ```

2. **Run static verification checks:**
   ```bash
   npm --prefix frontend run typecheck
   npm --prefix frontend run lint
   ```

3. **Build and start production Next.js application:**
   ```bash
   npm --prefix frontend run build
   npm --prefix frontend run start
   ```
   *(For development mode with hot reloading: `npm --prefix frontend run dev`)*

4. **Access the application:** Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 3. Environment Variables Reference

All system configuration is managed via `.env` in the repository root:

| Variable Name | Required? | Default Value | Description |
| :--- | :---: | :--- | :--- |
| `APP_ENV` | Optional | `development` | Application mode (`development` or `production`). |
| `DEMO_MODE` | Optional | `true` | When `true`, operational records default to `SIMULATED` status. |
| `APP_TIMEZONE` | Optional | `Asia/Dhaka` | Standard operational timezone (BST, UTC+6). |
| `FRONTEND_ORIGIN` | Optional | `http://localhost:3000` | Whitelisted origin for CORS middleware. |
| `DATABASE_URL` | Optional | `postgresql+psycopg://...` | Connection URI for PostgreSQL/PostGIS. Falls back to SQLite if absent. |
| `GEMINI_API_KEY` | Optional | *(Empty)* | Google Gemini API key. If omitted, runs in **Offline Demo Mode**. |
| `GEMINI_MODEL` | Optional | `gemini-2.5-flash` | Target Gemini model identifier for the Port Copilot. |
| `SIMULATION_SEED` | Optional | `42` | Deterministic random seed for SimPy and ML pipelines. |

---

## 4. Operational Maintenance & Reset Commands

### 4.1 Demo Reset Command (Instant Baseline Restoration)
Restores seed records, clears active disruption events, and resets the event bus:
```bash
python scripts/reset_demo.py
```
*Via REST API:*
```bash
curl -X POST http://127.0.0.1:8000/api/v1/events/reset-incident
```

### 4.2 Machine Learning Model Retraining Command
Regenerates ML model binaries and updates evaluation metadata JSON:
```bash
python scripts/train_models.py
```
*Artifacts Generated:*
- `backend/app/ml/artifacts/eta_regressor.joblib`
- `backend/app/ml/artifacts/delay_classifier.joblib`
- `backend/app/ml/artifacts/models_metadata.json`

---

## 5. Automated Verification & Testing Commands

### 5.1 Run Full Backend Test Suite (85 Tests)
```powershell
Set-Location backend
.\.venv\Scripts\python.exe -m pytest -v
```

### 5.2 Run Full End-to-End Browser Test Suite (70 Tests)
```powershell
Set-Location frontend
npx playwright test
```

### 5.3 Run Compliance & Security Audit
```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/system/audit" | ConvertTo-Json -Depth 4
```

---

## 6. Troubleshooting Guide

| Issue / Symptom | Root Cause | Resolution |
| :--- | :--- | :--- |
| **Port 8000 or 3000 already in use** | Another instance or background process is binding the port. | Find process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 8000).OwningProcess` and kill it, or configure `PORT=8001` in `.env`. |
| **PostgreSQL Connection Timeout** | Docker is stopped or PostGIS is not running locally. | Expected behavior: system automatically outputs a notice and engages SQLite fallback `portos.db` with full functionality. |
| **Copilot reports "Offline Demo Mode"** | `GEMINI_API_KEY` is empty or unset in `.env`. | Expected behavior: system uses the built-in deterministic offline briefing engine with full tool execution. Add valid key to `.env` to enable live Gemini. |
| **SSE Stream Pill shows "Connecting..."** | Backend server is not running on port 8000 or CORS is blocked. | Verify backend is active on `http://127.0.0.1:8000/health` and `FRONTEND_ORIGIN` matches frontend URL. |
| **E2E Playwright test timeouts** | Headless browser execution takes longer on low-spec hardware. | Run with increased timeout: `npx playwright test --timeout=60000`. |
