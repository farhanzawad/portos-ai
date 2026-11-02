# Architecture Decision Records (ADRs) — PORTOS AI

**Project:** PORTOS AI (Port Operations Intelligence System)  
**Maintained by:** System Architect & Engineering Leads

---

## Index of Decisions

- [ADR-001: Monorepo Repository Structure](#adr-001-monorepo-repository-structure)
- [ADR-002: Frontend Framework — Next.js App Router with TypeScript](#adr-002-frontend-framework--nextjs-app-router-with-typescript)
- [ADR-003: Backend Framework — FastAPI with Python 3.12 and SQLAlchemy 2](#adr-003-backend-framework--fastapi-with-python-312-and-sqlalchemy-2)
- [ADR-004: Strict Separation of Analytical Engines from Generative AI](#adr-004-strict-separation-of-analytical-engines-from-generative-ai)
- [ADR-005: Procedural Three.js / React Three Fiber Digital Twin with 2D Fallback](#adr-005-procedural-threejs--react-three-fiber-digital-twin-with-2d-fallback)
- [ADR-006: Geographic Visualization using MapLibre GL JS with Explicit Attribution](#adr-006-geographic-visualization-using-maplibre-gl-js-with-explicit-attribution)
- [ADR-007: Application AI Integration using Official Google GenAI SDK and Tool Allowlist](#adr-007-application-ai-integration-using-official-google-genai-sdk-and-tool-allowlist)
- [ADR-008: Local-First Demo Mode without Mandatory Cloud Credentials](#adr-008-local-first-demo-mode-without-mandatory-cloud-credentials)
- [ADR-009: Standardized 5-Tier Data Status Tagging & Advisory-Only Action Model](#adr-009-standardized-5-tier-data-status-tagging--advisory-only-action-model)
- [ADR-010: UTC Storage with Asia/Dhaka Local Presentation](#adr-010-utc-storage-with-asiadhaka-local-presentation)

---

### ADR-001: Monorepo Repository Structure
- **Status:** Accepted
- **Context:** PORTOS AI comprises a frontend dashboard, a spatial digital twin, a Python analytical backend, database migrations, setup scripts, and architectural documentation.
- **Decision:** Use a single monorepo structured into:
  - `frontend/` (Next.js, TypeScript, Tailwind)
  - `backend/` (FastAPI, analytics modules, tests)
  - `docs/` (Architecture, data policies, model cards, roadmap)
  - `scripts/` (Setup, seed, reproducible model training)
  - `infra/` (Docker Compose for PostgreSQL/PostGIS)
- **Rationale:** Simplifies local orchestration, keeps schema and client types closely synchronized, ensures cohesive versioning for competition judges, and avoids multi-repository synchronization overhead.
- **Consequences:** Tooling must handle multi-language linting and testing independently.

---

### ADR-002: Frontend Framework — Next.js App Router with TypeScript
- **Status:** Accepted
- **Context:** The application needs a high-density, accessible interface capable of handling real-time data visualisations, interactive 3D rendering, and client-side chart reactivity.
- **Decision:** Adopt Next.js (App Router) with React, strict TypeScript, Tailwind CSS, and shadcn/ui primitives.
- **Rationale:** React has standard ecosystem support for Three.js (via React Three Fiber) and ECharts. Next.js App Router provides structured routing, optimal client/server code separation, and efficient bundle splitting.
- **Consequences:** 3D rendering components must be client-rendered (`'use client'`) and dynamically loaded to avoid SSR canvas initialization errors.

---

### ADR-003: Backend Framework — FastAPI with Python 3.12 and SQLAlchemy 2
- **Status:** Accepted
- **Context:** The analytical backend requires first-class integration with Python scientific libraries (scikit-learn, SimPy, OR-Tools, pandas) and asynchronous API endpoints for WebSocket/SSE event streaming.
- **Decision:** Build the backend on Python 3.12, FastAPI, Pydantic v2, and SQLAlchemy 2 with Alembic.
- **Rationale:** FastAPI provides native async performance, automatic OpenAPI schema generation, and strict Pydantic validation. Python is the native ecosystem for optimization and machine learning.
- **Consequences:** Backend and frontend must maintain explicit API contracts to prevent schema drift.

---

### ADR-004: Strict Separation of Analytical Engines from Generative AI
- **Status:** Accepted
- **Context:** LLMs frequently produce convincing but inaccurate hallucinations when tasked with combinatorial scheduling or mathematical simulations.
- **Decision:** Strictly isolate computational tasks into specialized engines:
  - **Predictive Modeling:** scikit-learn (Gradient Boosting / Random Forest).
  - **Berth Allocation & Scheduling:** Google OR-Tools CP-SAT.
  - **Scenario Simulation:** SimPy discrete-event simulation engine.
  - **Language Synthesis & Coordination:** Google Gemini via official SDK.
- **Rationale:** Guarantees deterministic, reproducible, and verifiable operational numbers. The LLM only interprets and coordinates outputs produced by specialized solvers.
- **Consequences:** Requires clean API endpoints and schemas connecting the backend service layer to each discrete engine.

---

### ADR-005: Procedural Three.js / React Three Fiber Digital Twin with 2D Fallback
- **Status:** Accepted
- **Context:** A high-fidelity digital twin is required to visualize berth occupancies, vessel positions, crane states, and yard stacks. However, external 3D asset downloads can be brittle, large, or unlicensed.
- **Decision:** Construct the digital twin using procedural Three.js geometry in React Three Fiber (`@react-three/fiber` / `@react-three/drei`) with an automatic 2D SVG/canvas fallback for low-power devices.
- **Rationale:** Eliminates external 3D model dependencies, keeps bundle sizes minimal, ensures deterministic geometric coordinate mapping, and provides full accessibility when WebGL fails.
- **Consequences:** Geometry is simplified and illustrative rather than photorealistic CAD geometry.

---

### ADR-006: Geographic Visualization using MapLibre GL JS with Explicit Attribution
- **Status:** Accepted
- **Context:** Outer anchorage queues and approach channels require geographic representation on a maritime map.
- **Decision:** Use MapLibre GL JS with an open, explicitly attributed vector/raster tile provider or a local GeoJSON schematic fallback.
- **Rationale:** MapLibre is an open-source, vendor-neutral web mapping library without proprietary API lock-in.
- **Consequences:** Tile service usage policies must be strictly observed, with attribution clearly displayed on the UI.

---

### ADR-007: Application AI Integration using Official Google GenAI SDK and Tool Allowlist
- **Status:** Accepted
- **Context:** An intelligent copilot is needed to brief operators and answer operational queries, but safety and groundedness are critical.
- **Decision:** Integrate the official `google-genai` Python SDK using the Gemini Interactions API with custom Function Calling bound to a strictly typed, read-only and simulation-only allowlist.
- **Rationale:** Prevents arbitrary SQL execution, unauthorized record mutations, or hallucinated facts. Validates inputs and outputs via Pydantic schemas.
- **Consequences:** Tool handlers must be maintained and tested against potential prompt injections.

---

### ADR-008: Local-First Demo Mode without Mandatory Cloud Credentials
- **Status:** Accepted
- **Context:** Competition judges, evaluators, and peer developers must be able to run and test PORTOS AI without setting up paid third-party accounts or cloud infrastructure.
- **Decision:** Design the entire platform to operate seamlessly in **Demo Mode** using a deterministic synthetic seed dataset and local execution. When `GEMINI_API_KEY` is absent, the copilot reports that it is in offline mode while all other modules (simulation, optimization, ML inference, digital twin) run normally.
- **Rationale:** Ensures zero friction during evaluation and satisfies the low-cost/accessible competition criteria.
- **Consequences:** Demo seed data and offline responses must be maintained and verified.

---

### ADR-009: Standardized 5-Tier Data Status Tagging & Advisory-Only Action Model
- **Status:** Accepted
- **Context:** Avoid confusing simulated demo data with live real-world observations, and avoid dangerous automated actions.
- **Decision:**
  1. Every record displays one of five explicit statuses: `SIMULATED`, `OBSERVED`, `FORECAST`, `DERIVED`, `UNAVAILABLE`.
  2. All algorithmic outputs (berth schedules, disruption recovery) are advisory proposals requiring explicit human review and approval. No external command execution exists.
- **Rationale:** Ensures absolute truthfulness, transparency, and safety compliance with competition rules.
- **Consequences:** The UI must render status badges across tables, cards, and tooltips.

---

### ADR-010: UTC Storage with Asia/Dhaka Local Presentation
- **Status:** Accepted
- **Context:** Maritime systems must manage timestamps across voyages, but local port operations in Bangladesh run on Bangladesh Standard Time (`UTC+6`).
- **Decision:** Store all timestamps in the database and API payloads in UTC (ISO 8601). Convert and display all operational schedules in the frontend localized to `Asia/Dhaka` with explicit timezone labeling.
- **Rationale:** Prevents timezone ambiguities and daylight saving confusion while matching the operational reality of Chattogram Port.
- **Consequences:** Date formatting utilities must strictly enforce the `Asia/Dhaka` locale.

