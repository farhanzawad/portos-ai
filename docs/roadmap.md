# Implementation Roadmap — PORTOS AI

**Project:** PORTOS AI (Port Operations Intelligence System)  
**Lifecycle:** Sequential Prototype Build (Prompts 00–17 + Optional A–D)  
**Tracking Status:** All Core Milestones 00–17 Complete (Ready for Showcase)

---

## Milestone Progress Summary

| Stage | Milestone | Title | Focus Area | Status | Verified Date |
| :---: | :---: | :--- | :--- | :---: | :---: |
| **0** | **00** | Project Charter & Persistent Engineering Rules | Governance & Charter Docs | **COMPLETE** | 2026-11-02 |
| **1** | **01** | Monorepo & Runnable Foundation | Next.js, FastAPI, Docker | **COMPLETE** | 2026-11-02 |
| **2** | **02** | Visual Design System & Application Shell | Minimal Industrial Futurism | **COMPLETE** | 2026-11-02 |
| **3** | **03** | Domain Model, Database & Seed Data | PostgreSQL/PostGIS, Alembic | **COMPLETE** | 2026-11-02 |
| **4** | **04** | FastAPI Service Layer & API Contracts | REST API, OpenAPI, Pydantic | **COMPLETE** | 2026-11-02 |
| **5** | **05** | Overview Dashboard with Real Backend Data | TanStack Query, ECharts, KPIs | **COMPLETE** | 2026-11-03 |
| **6** | **06** | Interactive 3D Terminal Digital Twin | Three.js / R3F, 2D Fallback | **COMPLETE** | 2026-11-03 |
| **7** | **07** | Vessel Intelligence & Geographic Track View | MapLibre GL JS, Anchorage | **COMPLETE** | 2026-11-03 |
| **8** | **08** | Vessel ETA & Delay-Risk ML Pipeline | scikit-learn, Model Cards | **COMPLETE** | 2026-11-03 |
| **9** | **09** | Constraint-Based Berth Planner | Google OR-Tools CP-SAT | **COMPLETE** | 2026-11-03 |
| **10**| **10** | SimPy Scenario Simulation & Decision Lab | Discrete-Event Engine | **COMPLETE** | 2026-11-03 |
| **11**| **11** | Yard Intelligence & Congestion Forecasting | Yard Heatmap, Capacity Watch | **COMPLETE** | 2026-11-03 |
| **12**| **12** | Green Port Analytics & Auditable Estimates | Emission Factors, Scope | **COMPLETE** | 2026-11-03 |
| **13**| **13** | Port Data Bridge & Document Ingestion | CSV, XLSX, Text PDF Upload | **COMPLETE** | 2026-11-03 |
| **14**| **14** | Gemini Port Intelligence Copilot | Google GenAI SDK, Tool Allowlist | **COMPLETE** | 2026-11-03 |
| **15**| **15** | Unified Event Stream & Workflow Sync | WebSockets/SSE, Cross-module | **COMPLETE** | 2026-11-03 |
| **16**| **16** | Responsible AI, Security & Accessibility QA | Hardening, Audit, Disclosure | **COMPLETE** | 2026-11-03 |
| **17**| **17** | Competition Package, Runbook & Demo Script | 5-Minute Showcase, Local Setup | **COMPLETE** | 2026-11-03 |
| **Opt**| **A**  | External Weather Integration | Open-Meteo Adapter, Fairway Sea State | **COMPLETE** | 2026-11-03 |

---

## Detailed Milestone Descriptions

### Milestone 00 — Project Charter & Persistent Engineering Rules
- **Deliverables:** `AGENTS.md`, `PROJECT_BRIEF.md`, `docs/architecture/system-overview.md`, `docs/architecture/decisions.md`, `docs/data/data-policy.md`, `docs/ai/model-card-template.md`, `docs/quality/definition-of-done.md`, `docs/roadmap.md`.
- **Target Outcome:** Persistent project context established for all future Antigravity coding agents; clear boundaries, data status definitions, and architectural decisions recorded.

### Milestone 01 — Monorepo & Runnable Foundation
- **Deliverables:** Monorepo scaffold (`frontend/`, `backend/`, `infra/`, `scripts/`, `docs/`), root `README.md`, `.gitignore`, `.env.example`, Docker Compose for PostgreSQL/PostGIS. Health endpoint `/health` operational and tested.
- **Target Outcome:** Frontend and backend start independently and verify health without external API keys.

### Milestone 02 — Visual Design System & Application Shell
- **Deliverables:** Design tokens, Tailwind configuration, shadcn/ui customization, persistent sidebar (9 core sections), header with `DEMO ENVIRONMENT` banner, responsive navigation, `docs/design/design-system.md`.
- **Target Outcome:** Shell renders responsively across desktop, tablet, and mobile; transitions are subtle (160–240 ms); reduced-motion respected.

### Milestone 03 — Domain Model, Database & Seed Data
- **Deliverables:** SQLAlchemy 2 models (Terminal, Berth, Vessel, Equipment, YardBlock, Scenarios, Provenance), Alembic migrations, idempotent seed script (`scripts/seed.py`) with 12 vessels, 6 berths, 5 equipment units, and 12 yard blocks labeled `SIMULATED`.
- **Target Outcome:** Database migrates cleanly from empty state; seed script is idempotent.

### Milestone 04 — FastAPI Service Layer & API Contracts
- **Deliverables:** Modular FastAPI routes (`/api/v1/...`), Pydantic v2 request/response schemas, API contract documentation, error handling (404, 422, 500), unit tests.
- **Target Outcome:** All core domain read endpoints operational, tested, and documented.

### Milestone 05 — Overview Dashboard with Real Backend Data
- **Deliverables:** Port Operations Overview page, KPI strip, incoming vessel queue table, operational alerts panel, berth utilization widget, TanStack Query integration, loading/error states.
- **Target Outcome:** Overview renders live data from seed database; zero hardcoded KPI numbers.

### Milestone 06 — Interactive 3D Terminal Digital Twin
- **Deliverables:** Procedural Three.js scene (React Three Fiber / Drei), 6 berth zones, procedural vessels, STS cranes, container stacks, isometric camera, entity selection panel, 2D terminal schematic fallback.
- **Target Outcome:** Objects bind to API data, click selection focuses objects, 2D fallback engages if WebGL fails.

### Milestone 07 — Vessel Intelligence & Geographic Track View
- **Deliverables:** MapLibre GL JS map with maritime attribution, anchorage queue view, simulated track timeline, search/filtering, missing AIS feed indicator.
- **Target Outcome:** Simulated track follows realistic channel path; no-live-AIS disclaimer visible.

### Milestone 08 — Vessel ETA & Delay-Risk ML Pipeline
- **Deliverables:** Synthetic data generator, scikit-learn regression (delay hours) & classification (delay risk), Model Card (`docs/ai/model-cards/`), inference API, baseline comparison report.
- **Target Outcome:** Reproducible ML training pipeline with documented metrics and synthetic-data limitations.

### Milestone 09 — Constraint-Based Berth Planner
- **Deliverables:** Google OR-Tools CP-SAT scheduler, independent constraint feasibility validator, Gantt-style timeline UI, assignment explanation drawer, advisory proposal workflow.
- **Target Outcome:** Generates mathematically feasible, conflict-free berth plans with human-in-the-loop review.

### Milestone 10 — SimPy Scenario Simulation & Decision Lab
- **Deliverables:** SimPy discrete-event simulation service (*Arrival → Anchor → Berth → Crane → Departure*), disruption parameter controls, baseline vs. alternative scenario comparison, reproducible seeds.
- **Target Outcome:** Deterministic scenario simulations with verifiable queue and waiting-time trade-offs.

### Milestone 11 — Yard Intelligence & Congestion Forecasting
- **Deliverables:** YardBlock occupancy forecast service (6h, 12h, 24h horizons), visual grid heatmap, capacity threshold warnings, digital twin highlighting integration.
- **Target Outcome:** Dynamic yard block heatmap linked to twin selection and forecast models.

### Milestone 12 — Green Port Analytics & Auditable Estimates
- **Deliverables:** Traceable emission factor models, auxiliary engine waiting emissions formulas, crane energy consumption models, baseline vs. scenario emissions comparison.
- **Target Outcome:** Inspectable emissions math with explicit factors and scope boundaries.

### Milestone 13 — Port Data Bridge & Document Ingestion
- **Deliverables:** File upload endpoint (CSV, XLSX, text-based PDF via `pypdf`), sanitization against directory traversal & formula injection, column mapping preview, human-in-the-loop commit.
- **Target Outcome:** Safe upload, review, and import of operational records with full provenance metadata.

### Milestone 14 — Gemini Port Intelligence Copilot
- **Deliverables:** Official `google-genai` Python SDK integration, strict typed Function Calling allowlist (read-only queries & safe simulation triggers), citation chips, offline Demo Mode fallback.
- **Target Outcome:** Grounded operational explanations without hallucinated statistics; graceful degradation without API key.

### Milestone 15 — Unified Event Stream & Workflow Sync
- **Deliverables:** WebSocket or SSE event publisher/subscriber, synchronized multi-module incident workflow (*Delay injected → Alert → Prediction → OR-Tools Plan → SimPy Run → Twin Update → Copilot Explanation*).
- **Target Outcome:** Single incident propagates consistently across all views with full deterministic rewind.

### Milestone 16 — Responsible AI, Security & Accessibility QA
- **Deliverables:** End-to-end security audit, prompt injection defense, accessibility pass (WCAG 2.1 AA, reduced-motion), `AI_USE_DISCLOSURE.md`, completed Model Cards, test report.
- **Target Outcome:** Zero critical security or accessibility defects; full compliance with Blue AI Challenge guidelines.

### Milestone 17 — Competition Package, Runbook & Demo Script
- **Deliverables:** Clean Docker Compose orchestration, `.env.example`, demo reset script, operational runbook, data-source register, 5-minute showcase demo script, `SHOWCASE_CHECKLIST.md`.
- **Target Outcome:** System starts cleanly on any developer machine; ready for live competition presentation.

---

## Optional Extension Milestones (Post-Prompt 17)

### Optional A — External Weather Integration (COMPLETE — 2026-11-03)
- **Deliverables:** Open-Meteo API maritime integration (`22.23°N, 91.81°E` Karnaphuli approach), 15-minute in-memory caching, graceful timeout recovery, deterministic fallback (`PORTOS Synthetic Marine Generator`), REST endpoints (`/api/v1/weather/current`, `/api/v1/weather/forecast`), typed Copilot tool allowlist integration (`get_external_weather`), mandatory CC BY 4.0 license attribution, and prominent safety disclaimer: *"Contextual marine weather product only. Not certified for navigational clearance, vessel pilotage, or berth maneuvering safety decisions."*
- **Target Outcome:** Auditable, low-cost external weather contextualization adhering to all maritime safety boundaries.

- **Optional B:** Live AIS Provider Adapter (behind licensed provider key flag).
- **Optional C:** Advanced Equipment Maintenance Anomaly Demo (synthetic telemetry & Isolation Forest).
- **Optional D:** Research-Grade Model Evaluation (temporal cross-validation and calibration analysis).
