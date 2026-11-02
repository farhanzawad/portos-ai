# PORTOS AI — Quality Assurance & Test Plan

**Document ID:** `QUAL-PLAN-001`  
**Revision:** 1.0.0 (Milestone 16 Technical QA Audit)  
**Date:** 2026-11-03  
**System:** Port Operations Intelligence System (PORTOS AI)

---

## 1. Test Strategy & Scope

The testing strategy for PORTOS AI ensures end-to-end reliability, mathematical determinism, operational safety, and full compliance with Blue AI Challenge acceptance criteria. The test suite spans multiple automated testing tiers:

```
┌────────────────────────────────────────────────────────┐
│             Tier 4: Playwright E2E Tests               │
│   (70 browser tests: all routes, modals, incident sync)│
├────────────────────────────────────────────────────────┤
│          Tier 3: Backend Integration Tests             │
│   (API endpoints, SSE streaming, file ingestion, CORS) │
├────────────────────────────────────────────────────────┤
│       Tier 2: ML & Deterministic Solver Tests          │
│   (scikit-learn MAE/F1, OR-Tools CP-SAT, SimPy runs)   │
├────────────────────────────────────────────────────────┤
│             Tier 1: Unit & Security Tests              │
│   (ORM models, prompt injection guard, formula escape) │
└────────────────────────────────────────────────────────┘
```

---

## 2. Test Execution Tiers & Commands

### 2.1 Backend Unit & Integration Tests (pytest)
- **Framework:** `pytest 9.2.0`, `pytest-asyncio 0.23.0`, `httpx` / FastAPI `TestClient`
- **Execution Command:**
  ```powershell
  Set-Location backend
  .\.venv\Scripts\python.exe -m pytest -v
  ```
- **Coverage Scope:**
  - `test_api_v1.py`: Core REST endpoints (terminals, berths, vessels, yard, KPIs, provenance)
  - `test_domain_models.py`: SQLAlchemy 2 ORM schema invariants and relationships
  - `test_health.py`: Top-level `/health` and `/system/status` endpoints
  - `test_ml_pipeline.py`: ETA Regressor and Delay-Risk Classifier reproducibility and baseline beating
  - `test_berth_optimizer.py`: Google OR-Tools CP-SAT berth schedule feasibility and draft constraint checking
  - `test_simulation_engine.py`: SimPy discrete-event terminal simulation presets (monsoon, crane outage)
  - `test_yard_forecasting.py`: Block-level yard density projection, baseline improvement, and risk tiering
  - `test_sustainability.py`: Green Port GLEC framework emissions factor calculations
  - `test_ingestion.py`: Port Data Bridge upload security, path traversal, and formula injection defense
  - `test_copilot.py`: Gemini Port Intelligence Copilot strict tool allowlist and safety refusal
  - `test_event_stream.py`: SSE monotonic IDs, ring buffer history, and incident injection rollback
  - `test_audit_security.py`: Milestone 16 Responsible-AI, prompt injection, CORS, and audit compliance

### 2.2 Frontend Static Analysis & Type Checking
- **TypeScript Typecheck:**
  ```powershell
  npm --prefix frontend run typecheck
  ```
  *Threshold:* Zero TypeScript compiler errors (`tsc --noEmit`).
- **ESLint Code Quality:**
  ```powershell
  npm --prefix frontend run lint
  ```
  *Threshold:* Zero ESLint warnings or errors (`next lint`).
- **Production Build:**
  ```powershell
  npm --prefix frontend run build
  ```
  *Threshold:* Clean static generation across all 14 application routes with zero fatal errors.

### 2.3 End-to-End Browser Automation (Playwright)
- **Framework:** `@playwright/test 1.64.1` on Chromium headless
- **Execution Command:**
  ```powershell
  Set-Location frontend
  npx playwright test
  ```
- **Coverage Scope:**
  - `overview.spec.ts`: Operational overview dashboard, KPI strip, vessel queue, and error recovery states
  - `vessels.spec.ts`: Vessel intelligence, fairway corridor metrics, detail drawer, and MapLibre attribution
  - `digital-twin.spec.ts`: 2D schematic plan view, entity inspector, simulation controls, and spatial telemetry
  - `berth-planner.spec.ts`: OR-Tools Gantt timeline, CP-SAT solver telemetry, view modes, and advisory review modal
  - `scenario-lab.spec.ts`: Decision lab, parameter sliders, comparative KPI deltas, trade-off callout, and recovery plan
  - `yard.spec.ts`: Yard congestion heatmap, sector capacity gauges, forecast horizon switching, and detail inspection
  - `green-port.spec.ts`: Emissions scope boundary banner, formula inspection, and factor dictionary drawer
  - `data-bridge.spec.ts`: Document upload dropzone, SHA-256 stamp, candidate row editing, and provenance report
  - `copilot.spec.ts`: Port Copilot briefing, tool allowlist inspection, starter prompts, and safety-critical refusal
  - `workflow-sync.spec.ts`: Real-time SSE live pill, incident injection, cross-module propagation, and baseline rollback
  - `accessibility-disclosure.spec.ts`: DEMO ENVIRONMENT banner, global disclosure footer, reduced motion toggle, tabular numbers, and 0 console error audit

---

## 3. Pass / Fail Acceptance Criteria

| Category | Requirement | Pass Threshold |
| :--- | :--- | :--- |
| **Backend Unit Tests** | All domain, API, and optimization tests pass | 100% (85/85 tests) |
| **Frontend Typecheck** | Strict TypeScript compilation | 0 errors |
| **Frontend Lint** | Next.js ESLint rules | 0 warnings / 0 errors |
| **Production Build** | Next.js SSG / SSR build | 14/14 routes compiled |
| **Playwright E2E** | Full end-to-end user journeys pass | 100% (70/70 tests) |
| **Security Audit** | Safe errors, isolated keys, upload security, prompt injection defense | `compliance_verdict: PASS` |
| **Responsible-AI** | 5-tier status tagging, advisory disclaimer, human review | Verified across all views |
| **Console Errors** | Navigation across all operational routes | 0 uncaught runtime exceptions |
| **Accessibility** | Reduced motion toggle, tabular figures, WCAG 2.1 AA | Verified and operational |
