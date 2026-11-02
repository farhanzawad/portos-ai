# PORTOS AI — Google Antigravity Build Prompt Pack

**Version:** 1.0  
**Prepared:** 2 November 2026  
**Purpose:** Build a credible, locally runnable competition prototype for the Blue AI Challenge 2026–27.

---

## 0. How to use this pack

This is a sequential build plan for Google Antigravity. It is designed to produce a working prototype, not a static mockup.

1. Create a new, empty project folder named `portos-ai` and open that folder as the Antigravity workspace.
2. Use the main Antigravity agent for the prompts in this document. Do not ask it to execute all prompts at once.
3. Paste **Prompt 00** first. Review the project brief and persistent rules it creates.
4. Then run Prompts **01–17 in order**, one at a time. Do not skip ahead. Each prompt assumes the earlier stage has been completed.
5. At the end of every prompt, inspect the changed files, run the listed checks and ask the agent to fix failed checks before continuing.
6. Commit or create a checkpoint after every successful milestone. Do not allow multiple agents to edit the same files concurrently unless Antigravity has isolated their changes in separate worktrees and you have reviewed the merge.
7. Keep the project in demo mode unless you have verified permission and credentials for an external data source. Never connect to private port systems or attempt to control real equipment.

**Important:** Antigravity is the software-development environment. It is not the AI runtime of PORTOS AI. PORTOS AI's application-side language model is Gemini through the Gemini API. Its predictive models, optimizer and simulator are separate application services.

## 1. Product definition

### Product name

**PORTOS AI**  
**Port Operations Intelligence System**

### One-line product description

A Bangladesh-focused, AI-assisted port operations decision-support platform that combines a transparent operational data layer, a hybrid digital twin, predictive analytics, constrained berth optimization and scenario simulation.

### Initial operating environment

A simplified, Chattogram-inspired container-terminal environment. This is a research and competition proof of concept, not an official or surveyed digital representation of Chattogram Port. The first release must make this distinction visible in the interface and documentation.

### Primary operational workflow

An incoming vessel is represented in the system. The platform estimates its arrival and delay risk, checks berth compatibility, generates a feasible berth plan, lets an operator simulate disruptions, updates the digital-twin view, and explains the resulting trade-offs. A human reviews and approves any proposed schedule change inside the prototype.

### Product differentiators

1. **Port Data Bridge:** Import and standardize public or user-supplied port information with source lineage and manual verification.
2. **Port Operations Decision Lab:** Compare baseline and alternative operational scenarios using a deterministic, explainable simulation and constraint-based optimization.
3. **Hybrid Digital Twin:** Synchronize 3D/2D terminal objects with application data and simulated event streams. Clearly label simulated, observed, forecast, derived and unavailable data.

### Primary modules

- Overview dashboard
- Interactive terminal digital twin
- Vessel intelligence and track view
- Berth planner and optimization
- Scenario Lab / discrete-event simulation
- Yard intelligence and congestion heatmap
- Green Port analytics
- Port Intelligence Copilot
- Port Data Bridge and data provenance centre
- Model and system health / methodology pages

### Competition requirements to preserve

The solution must address a real Bangladesh blue-economy problem; cite data sources; disclose which AI tools were used and what the team did; use free or low-cost tooling where possible; respect privacy and consent; show credible AI contribution; validate model outputs; and communicate limitations honestly. A conventional dashboard or generic chatbot alone is not sufficient.

### Explicit truthfulness rules

- Never describe generated operational data as live CPA data.
- Never present a simulated vessel position, berth status, crane state, yard occupancy or port KPI as an observed fact.
- Never imply that the prototype is connected to CPA, customs, a Terminal Operating System, real crane sensors or a live AIS provider unless a verified integration has been implemented and is shown as such.
- Use `SIMULATED`, `OBSERVED`, `FORECAST`, `DERIVED` and `UNAVAILABLE` labels consistently.
- If a model has only been trained and evaluated on synthetic data, say that its metrics validate the synthetic test pipeline, not real-world performance at Chattogram Port.
- Do not fabricate references, benchmark results, emissions reductions or performance improvements.
- No navigational clearance, vessel movement instruction, equipment control, or safety-critical recommendation may be issued by the prototype.
- All schedule proposals remain advisory and require explicit human review. No external port action is ever executed.

## 2. Locked technology direction

Use the following stack unless a documented technical blocker requires a change. If a change is necessary, explain the reason and update `docs/architecture/decisions.md` before implementation.

### Frontend

- Next.js App Router
- React and TypeScript with strict type checking
- Tailwind CSS
- shadcn/ui primitives, customized to the PORTOS design system
- TanStack Query for API server state
- Zustand only for small cross-page client interaction state where necessary
- Apache ECharts for charts and heatmaps
- Three.js with React Three Fiber and Drei for the terminal scene
- MapLibre GL JS for the geographic vessel view, with an explicitly configured and attributed tile/style provider
- Motion for restrained interface transitions
- Zod for client-side validation of critical forms and API payloads where appropriate

### Backend and analytics

- Python 3.12 or the currently supported stable Python version compatible with the selected dependencies
- FastAPI
- Pydantic v2
- SQLAlchemy 2 and Alembic
- PostgreSQL with PostGIS as the primary database
- pandas and NumPy for data processing
- scikit-learn for baseline ML models
- SimPy for discrete-event simulation
- Google OR-Tools for constrained berth scheduling
- pypdf for text-based PDF extraction; no OCR in the initial version
- openpyxl for Excel import
- pytest for backend, model, optimizer and simulator tests

### Application AI

- Official Google GenAI SDK for Python (`google-genai`)
- Prefer the current Gemini Interactions API for new application-side Gemini integration, after checking the current official documentation and SDK support at implementation time.
- Use a configurable `GEMINI_MODEL` environment variable. Do not hardcode an assumed model identifier in multiple files.
- Use custom function calling for a small allowlist of read-only data tools and controlled simulation/optimization tools.
- Validate tool arguments with Pydantic. Validate outputs before returning them to the model.
- Never expose Gemini API keys in browser code or client-side environment variables.

### Development and delivery

- Git
- Docker Compose for local PostgreSQL and optional full-stack orchestration
- `.env.example` with placeholders only
- Playwright for browser end-to-end tests
- Ruff and mypy (or an equivalent strict type-checking approach) for Python quality
- ESLint and TypeScript checks for frontend quality

### Local development strategy

The application must be usable locally without a Gemini key. Core functions, simulator, ML inference, optimizer and dashboard must work in **Demo Mode**. When `GEMINI_API_KEY` is missing, the copilot should explain that Gemini is not configured and the rest of the application must remain functional. Do not silently substitute a fake AI answer.

The preferred local startup is documented commands for PostgreSQL, backend and frontend. If Docker is available, provide a Compose option. If Docker is unavailable, document the minimum manual setup. Do not make cloud deployment a prerequisite for the prototype.

## 3. Locked design system

### Visual concept

**Minimal Industrial Futurism.** A professional maritime operations product, calm and precise, with a clean enterprise workspace and a darker spatial visualization canvas. The visual direction should feel contemporary, credible and restrained, not like a generic AI dashboard or science-fiction game.

### Palette

- Deep maritime navy: `#102A43`
- Secondary navy: `#1E4967`
- Muted teal: `#16A394`
- Warm amber: `#E5A23B`
- Restrained danger red: `#D95454`
- Main light background: `#F4F6F8`
- Surface white: `#FFFFFF`
- Muted text: `#667085`
- Border: `#DCE3EA`
- Twin canvas: `#132B3F` or a similarly restrained charcoal-navy

Use semantic colors consistently. Do not use neon gradients, excessive glassmorphism, decorative glow, rainbow charts or bright saturated colors on every card.

### Typography and layout

- Use Geist or Inter, with one type family throughout.
- Use an 8-point spacing system.
- Keep titles compact and information-dense without making the interface cramped.
- Use clear page titles, small section labels, tabular numerals for KPIs, thin borders, restrained shadows and generous whitespace.
- Use Lucide icons with consistent stroke weight.
- Use responsive layouts, keyboard navigation, sufficient contrast and visible focus states.

### Application shell

A persistent left sidebar with:

1. Overview
2. Digital Twin
3. Vessel Intelligence
4. Berth Planner
5. Scenario Lab
6. Yard Intelligence
7. Green Port
8. AI Copilot
9. Data Centre

The top bar should show selected terminal context, Demo Mode/data status, simulation time or last refresh, notification access and a compact user/demo-role menu. A small, persistent `DEMO ENVIRONMENT` indicator must remain visible wherever demo data is displayed.

### Animation language

- Interface transitions: approximately 160–240 ms, easing, no spring overload.
- Page transitions: restrained fade/short translate only where useful.
- Vessels: smooth, time-controlled movement along explicit routes; movement must follow simulated state, not random wandering.
- Cranes: trolley/spreader movement only when an associated operation event is active.
- Yard heatmap: gradual state transitions when forecast data changes.
- Scenario execution: visibly update affected vessels, berths, cranes and KPIs in a causal sequence.
- Alerts: subtle entry and status changes, no flashing loops.
- Support `prefers-reduced-motion` and a user setting that disables nonessential animation.

Every animation must explain a state change or operational process. Do not add background particles, spinning holograms, random scan lines, decorative telemetry or constant pulsing.

### Terminal scene direction

Build a simplified but believable, stylized-realistic container terminal from procedural Three.js geometry rather than using a static image. Include quay edge, water, berth lanes, container stacks, STS cranes, yard cranes, internal roads, gate area and vessels. Use a fixed initial isometric camera with optional user orbit/zoom. Use a restrained palette, believable scale relationships and soft ambient/shadow lighting. The terminal model is illustrative, not surveyed geography. Add a visible “Illustrative terminal layout” label in the twin's information panel.

## 4. Core data conventions

Every operational record must have, where relevant:

- Stable internal ID
- `data_status`: `SIMULATED | OBSERVED | FORECAST | DERIVED | UNAVAILABLE`
- `source_name`
- `source_url` or source-document ID where available
- `observed_at` or source reporting period
- `ingested_at`
- `methodology_note` for derived values
- `model_name` and `model_version` for predictions
- `created_at` and `updated_at`

Use UTC timestamps in storage and explicit timezone conversion in the UI. The default terminal timezone is `Asia/Dhaka`. Display units explicitly: hours, metres, tonnes, TEU, kWh, kg CO2e, knots, metres/second, etc. Never mix units silently.

## 5. Suggested initial demo scenario

Build a deterministic scenario with explicitly synthetic data:

- 12 sample vessels
- 6 illustrative berths
- 5 illustrative STS/yard equipment units in a simplified fleet
- 12 illustrative yard blocks
- A queue of vessels with staggered ETAs
- One temporarily unavailable crane
- A yard block approaching a configurable occupancy threshold
- One vessel whose ETA shifts due to an injected delay event

These counts are demo configuration values, not actual Chattogram Port inventory. Store them in seed/config data so they can be changed without editing UI code.

## 6. Shared acceptance standard

A feature is not complete because it looks correct. It is complete only when:

1. Its user interaction works.
2. Its data comes from the agreed backend/API or a clearly identified static design fixture.
3. It has loading, empty, error and unavailable states.
4. It handles invalid or missing data without crashing.
5. It has tests appropriate to its risk.
6. Its data status and provenance are visible.
7. It does not claim capabilities that have not been implemented.
8. It is visually consistent with this document.

---

# Sequential Antigravity prompts

Paste each prompt separately, in order. Keep the prompt title when sending it so the agent can refer to the milestone.

## Prompt 00 — Establish the project charter and persistent engineering rules

```text
You are the lead product architect and technical lead for PORTOS AI. Before writing application code, establish the persistent project context for this workspace.

Read the complete project concept in this prompt and create these root-level files:
1. AGENTS.md — persistent instructions for all future Antigravity work.
2. PROJECT_BRIEF.md — product purpose, target user, problem, scope, user journey, boundaries and competition requirements.
3. docs/architecture/system-overview.md — proposed system components and data flows.
4. docs/architecture/decisions.md — initial architecture decisions and rationale.
5. docs/data/data-policy.md — observed/simulated/forecast/derived/unavailable classification, provenance rules, source handling and limitations.
6. docs/ai/model-card-template.md — reusable model documentation template.
7. docs/quality/definition-of-done.md — shared acceptance criteria.
8. docs/roadmap.md — all implementation milestones in this build pack.

The application is PORTOS AI, a Bangladesh-focused AI-assisted port operations decision-support prototype. The first operating environment is a simplified Chattogram-inspired container terminal. It is not an official or surveyed digital twin, not a CPA-authorized system and not connected to real port control infrastructure.

Its defining capabilities are:
- Port Data Bridge for importing and standardizing public/user-provided information with provenance.
- Hybrid digital twin for illustrative vessels, berths, cranes and yard blocks.
- Vessel ETA and delay-risk prediction using an actual model pipeline.
- Constraint-based berth allocation using Google OR-Tools.
- Discrete-event scenario simulation using SimPy.
- Yard congestion analysis and heatmap.
- Transparent Green Port estimates using configurable documented factors.
- Gemini-based Port Intelligence Copilot with a strict application-tool allowlist.

Read the supplied competition requirements if they are present in the workspace. Preserve their actual requirements: real-world relevance, evidence, originality, credible AI use, low-cost feasibility and responsible AI. Do not invent additional official rules.

Create AGENTS.md as concise always-on instructions. Include:
- Read PROJECT_BRIEF.md, relevant architecture docs and existing code before changing files.
- Preserve the locked technology and design direction unless a documented blocker is proven.
- Do not fabricate live data, port connections, performance statistics, references, ML accuracy or emissions savings.
- Mark all generated operational data as SIMULATED. Display a persistent DEMO ENVIRONMENT indicator.
- All external source data must retain source, time period, retrieval time and processing method.
- Predictions must include model/version and uncertainty or limitations where available.
- Gemini explains and coordinates; numeric models predict; OR-Tools optimizes; SimPy simulates. Never use an LLM to invent numerical simulation outcomes.
- No real port commands, navigational instructions, equipment control or safety-critical outputs.
- Schedule changes are proposals requiring human review.
- Keep API keys server-side and out of source control.
- Add tests for new business logic and run relevant checks before claiming completion.
- Avoid giant components, fake buttons, placeholder charts presented as real data, excessive visual effects and unrelated refactors.
- Keep the interface minimal, modern, accessible and consistent with Minimal Industrial Futurism.

Do not implement the product yet. Inspect the current workspace, create the documents, identify assumptions that need later validation, and return a concise architecture summary plus a list of unresolved decisions. Do not ask me broad questions; make sensible reversible decisions and record them.
```

**Checkpoint:** Review `AGENTS.md`, `PROJECT_BRIEF.md` and the architecture documents. Correct any misunderstanding before coding starts.

## Prompt 01 — Plan the monorepo and create the runnable foundation

```text
Implement Milestone 01: create the PORTOS AI repository foundation. First read AGENTS.md, PROJECT_BRIEF.md, docs/architecture/system-overview.md and docs/architecture/decisions.md.

Create a maintainable monorepo with this intended structure (adjust only when justified):
- frontend/ — Next.js App Router, React, TypeScript, Tailwind and shadcn/ui.
- backend/ — FastAPI application, Python package, configuration and tests.
- docs/ — product, architecture, data, AI, testing and deployment documentation.
- scripts/ — repeatable setup, seed, training and validation scripts.
- infra/ — Docker Compose and local infrastructure configuration.

Set up the frontend with strict TypeScript, ESLint, path aliases and a minimal working route. Set up the backend with FastAPI, Pydantic v2, a health endpoint and a clean package structure. Add root-level README.md, .gitignore and .env.example. Add Docker Compose for PostgreSQL with PostGIS if the current stable image is available. Do not place credentials in Compose or commit local .env files.

Before selecting package versions, inspect current official documentation and choose compatible stable releases. Do not blindly install prerelease packages. Ensure the React and React Three Fiber major versions will be compatible later; do not install the 3D stack yet unless needed.

Create one documented command for each service and a clear local startup sequence. Include health checks and helpful failure messages. The backend must start without a Gemini key. The frontend must load without the backend and display a controlled API-unavailable state rather than crashing.

Add a simple `/health` backend endpoint and a frontend connection-status check. Configure CORS only for the local frontend origin during development. Do not add authentication or production hosting yet.

Run dependency installation, lint, type check, backend tests and a production build where feasible. Fix errors. Update docs/roadmap.md and the README with commands that you actually verified.

Do not build the real dashboard or digital twin in this milestone. Report exact commands run, outcomes, and any environment prerequisites.
```

**Checkpoint:** Frontend and backend start independently; `/health` responds; README commands are verified.

## Prompt 02 — Implement the visual design system and application shell

```text
Implement Milestone 02: create the PORTOS AI design system and responsive application shell. Read AGENTS.md and the locked visual system in PROJECT_BRIEF.md / this build pack before styling.

Design direction: Minimal Industrial Futurism. Build a contemporary enterprise maritime operations product. Use a light main workspace, deep navy navigation and a darker spatial workspace reserved for the digital twin. Avoid generic AI-dashboard styling, excessive gradients, glassmorphism, glowing edges, giant decorative headings and random charts.

Use this palette consistently:
- Navy #102A43
- Secondary navy #1E4967
- Muted teal #16A394
- Amber #E5A23B
- Danger #D95454
- Background #F4F6F8
- Surface #FFFFFF
- Muted text #667085
- Border #DCE3EA

Use Geist or Inter. Establish an 8-point spacing scale, compact hierarchy, subtle borders, restrained shadows, tabular numerals, and Lucide icons. Configure Tailwind tokens and CSS variables rather than scattering literal values across components. Use shadcn/ui primitives but customize their appearance to this system.

Create:
- Persistent left sidebar with Overview, Digital Twin, Vessel Intelligence, Berth Planner, Scenario Lab, Yard Intelligence, Green Port, AI Copilot and Data Centre.
- Top header with current terminal context, persistent `DEMO ENVIRONMENT` label, simulated-data status, current simulated time/last refresh, notifications and a demo profile menu.
- Responsive sidebar collapse on tablet/mobile.
- Main content container with consistent page title, subtitle, breadcrumb where needed and action placement.
- Reusable KPI card, status badge, data-status badge, alert row, empty state, loading skeleton, error state, confirmation dialog and page section components.
- Accessible focus states, keyboard navigation, color contrast and reduced-motion support.

Use Motion only for subtle transitions around 160–240 ms. Add a global reduced-motion preference. Do not create fake action buttons. Sidebar links must navigate to real route placeholders with meaningful `Coming in a later milestone` states, not dead clicks.

Create a `docs/design/design-system.md` page documenting color tokens, typography, layout, responsive breakpoints, components and animation rules. Include a few local Storybook-like preview routes or a component gallery page only if this does not add unnecessary dependencies.

Verify the result in the browser at desktop, tablet and mobile widths. Correct overflow, cramped spacing, inconsistent icon sizes and navigation issues. Keep the current page content minimal; functional analytics arrive later.
```

**Checkpoint:** Shell is responsive, navigation works, design tokens are centralized and the demo indicator is persistent.

## Prompt 03 — Design the domain model, database and seed data

```text
Implement Milestone 03: create the operational domain model and PostgreSQL/PostGIS schema. Read the project brief, data policy and current architecture first.

Use SQLAlchemy 2, Pydantic v2 schemas and Alembic migrations. Model the first release around these entities:
- Terminal, Berth, Vessel, VesselCall, VesselPosition, BerthAssignment
- Equipment, EquipmentTelemetry, EquipmentMaintenanceEvent
- YardBlock, YardOccupancyObservation, ContainerMovementEvent (do not store personal consignee data)
- OperationalEvent, Scenario, ScenarioRun, ScenarioResult
- DataSource, ImportedDataset, ImportedRecord, DataQualityIssue
- ModelArtifact, ModelEvaluation, PredictionRecord
- EmissionFactor, EmissionsEstimate
- Recommendation, RecommendationReview

Define relationships and indexes carefully. Use PostGIS geometry/geography only where spatial queries are needed; otherwise use JSON/GeoJSON with clear coordinate reference documentation. Store times in UTC. Make the UI convert to Asia/Dhaka. Store units explicitly or define stable unit conventions in the schema and data dictionary.

Every imported or derived item must retain provenance where applicable: source type/status, source name, source URL or source-document ID, reporting/observation time, ingestion time and transformation note. Predictions must retain model name/version, input feature snapshot or a safe reproducible reference, creation time and confidence/uncertainty fields where meaningful.

Create a deterministic seed dataset for the illustrative terminal: 12 sample vessels, 6 illustrative berths, 5 illustrative equipment units, 12 yard blocks and a set of vessel calls, telemetry readings, yard events and operational alerts. Use obviously fictional names or `DEMO-` identifiers. Configure the count and parameters in seed configuration. All seed rows must be `SIMULATED`.

Add migrations and an idempotent seed command. Add constraints for valid status enums, non-negative capacities, valid timestamps and berth assignment conflicts where feasible at the database layer. Do not make assumptions about actual CPA terminal assets or capacities. Keep all operational capacities clearly synthetic and configurable.

Add schema documentation and an ER diagram in Mermaid under docs/architecture. Write tests for migration/seed repeatability and representative relationship queries. Run migrations against the local database. Do not build application screens in this milestone.
```

**Checkpoint:** Migrations run from an empty database; seeding twice does not duplicate records; all seeded operational data is labeled simulated.

## Prompt 04 — Build the FastAPI service layer and API contracts

```text
Implement Milestone 04: build the backend API layer over the domain model. Read the current schema, project rules and architecture docs before coding.

Organize backend code by domain, not by one huge routes file. Separate routers, schemas, services, repositories, configuration and tests. Add API version prefix `/api/v1`.

Implement working endpoints for:
- `/health` and `/api/v1/system/status`
- terminal profile and terminal layout metadata
- list/detail vessels and vessel calls
- vessel positions and recent track history
- berth list, berth occupancy and assignments
- equipment status and telemetry history
- yard blocks and occupancy observations
- operational alerts and event timeline
- baseline KPIs for the selected terminal
- data-source/provenance summaries

Use pagination and filtering consistently. Add sort order where appropriate. Validate all request parameters. Use response schemas rather than returning ORM objects directly. Provide useful 404, 422 and 500 handling without leaking stack traces.

Create an API contract document with example requests and responses, status codes, units, timezone conventions and the meaning of each data-status label. If helpful, expose OpenAPI documentation through FastAPI's built-in docs in development.

Add server-side CORS configuration using environment variables. Add basic request logging with request IDs, but do not log secrets or personal data. Add a rate limit only if a suitable lightweight implementation can be added without destabilizing local development; document it if included.

Test the API using pytest and a test database. Include tests for missing records, invalid filters, date ranges, pagination and simulated-data provenance. Add frontend API client types from the documented contract or generate them from OpenAPI if this is reliable. Do not duplicate incompatible hand-written types across the app.

Run backend tests and verify key endpoints using test requests. Do not use fabricated API examples in documentation; derive them from actual schemas.
```

**Checkpoint:** Core read APIs work and their response types are documented and tested.

## Prompt 05 — Build the Overview dashboard with real backend data

```text
Implement Milestone 05: build the PORTOS AI Overview page using live responses from our local backend seed dataset. Read AGENTS.md and the design system document first.

The dashboard must answer: What is happening in the illustrative terminal now? What needs attention next? Which operational decisions should an operator review?

Create a professional layout with:
1. Page heading: `Port Operations Overview`, selected terminal label and `DEMO ENVIRONMENT` indicator.
2. Compact KPI strip for vessels in system, vessels awaiting berth, occupied/available illustrative berths, active operational alerts and yard blocks above the configured warning threshold.
3. A large central terminal overview preview that links to the full Digital Twin page.
4. Vessel queue / upcoming arrival table with vessel ID, ETA, status, delay-risk state and data-status badge.
5. Operational alerts panel with severity, source and timestamp.
6. Berth utilization summary, using clearly identified demo data.
7. Recent operational event timeline.
8. Contextual AI insight panel that can be populated by deterministic system insights before Gemini is configured. Do not call these insights AI-generated unless they are produced by a configured AI service.

Use TanStack Query for server state. Handle initial loading, stale data, backend unavailable, empty and partial response conditions. Add refresh and an appropriate last-updated display. Do not place hardcoded numbers in KPI components. Map API fields to view models in a clear adapter layer.

Charts must have labeled axes, units, sensible time ranges and accessible legends. Do not use decorative charts with arbitrary values. Use ECharts only where a chart improves understanding; prefer a concise table or status list when it communicates better.

Make the dashboard responsive. At mobile widths, stack content in a logical order and avoid horizontal page overflow. Add Playwright tests for dashboard loading, API-unavailable state, KPI population and navigation to key modules.
```

**Checkpoint:** The overview reads from the API; changing seed records changes the UI; no KPI value is hardcoded in a presentation component.

## Prompt 06 — Build the interactive 3D terminal Digital Twin

```text
Implement Milestone 06: create the interactive PORTOS AI Digital Twin workspace. Read the architecture and design system. This is a core product feature, not a decorative illustration.

Use Three.js with React Three Fiber and Drei, choosing versions compatible with the installed React version. Build the terminal from procedural geometry and code-defined scene objects; do not depend on an external image, generated mockup or unlicensed 3D asset. Do not spend time modelling photorealistic tiny details. Prioritize clear spatial relationships, believable proportions, legible object identity and smooth performance.

Scene composition:
- Quay and berth edge with water surface.
- Six illustrative berth zones with labels.
- Several container vessels with recognizable hull, deck and bridge forms.
- Ship-to-shore cranes with gantry, legs, trolley and spreader geometry.
- Container stacks organized into named yard blocks.
- Yard crane/equipment symbols and internal terminal roads.
- Gate/landside area and simplified approach/anchorage zone.
- Subtle ground grid or coordinate reference, never a glowing sci-fi grid.

Use a restrained maritime palette: navy, charcoal-blue, muted teal, concrete grey, container colors with limited variation and amber/red only for operational states. Use soft ambient lighting, directional shadows where performance permits, restrained reflections and a fixed initial isometric camera. Offer orbit/zoom controls with sensible limits and a Reset View action. Keep labels readable and avoid 3D text overload; use HTML overlays or a side information panel.

Functional requirements:
- Scene objects are generated from terminal layout and operational API data.
- Clicking a vessel opens a detail panel with ID, status, berth/queue state, ETA, predicted ETA if available, data status and source.
- Clicking a berth opens occupancy and assignment details.
- Clicking a crane opens equipment state and telemetry status.
- Selecting an item highlights it and focuses the camera modestly.
- A filter toggles vessels, berths, cranes and yard blocks.
- A legend explains operational colors and data status.
- An illustrative-layout disclaimer is always visible.
- Object states update from API data; never show live-looking movement without a simulated/observed event feed.

Animation requirements:
- Vessel travel along a defined path is enabled only when a simulated track state is active.
- Crane trolley/spreader motion must be linked to an operational task animation/event.
- Use a visible Play/Pause Simulation control and simulation speed selector. The simulation clock must not be confused with wall-clock time.
- Follow reduced-motion preferences and provide a non-animated state view.

Performance requirements:
- Use instancing for repeated containers where practical.
- Lazy-load the 3D bundle and avoid loading it on every dashboard route.
- Provide a 2D terminal schematic fallback for unsupported devices, WebGL failure or reduced-capability mode.
- Avoid expensive post-processing and continuous re-renders when the scene is static.

Add tests for object-to-record mapping and a browser test that selects a vessel and berth. Verify scene responsiveness and console errors in the browser. Do not claim the layout is an accurate CPA survey.
```

**Checkpoint:** Digital twin objects are data-bound, selectable and update from API data; fallback works when WebGL is unavailable.

## Prompt 07 — Build Vessel Intelligence and the geographic track view

```text
Implement Milestone 07: build the Vessel Intelligence page and geographic track visualization. Read data policy and map configuration before implementation.

Create a vessel intelligence workspace with:
- Vessel list/table with search, status, vessel type, arrival window and delay risk.
- Geographic map using MapLibre GL JS.
- Vessel detail panel and historical/simulated track timeline.
- Reported ETA versus predicted ETA comparison where a prediction exists.
- Anchorage queue summary and arrival sequence.
- Clear filters for simulated, observed and forecast data.

Use a configurable map style URL and attribution. Do not hardcode an unapproved tile service or assume public OpenStreetMap tiles may be used without limits. For local demo, provide a local schematic/base style or a clearly configured permitted provider. Do not show precise-looking real tracks for fictional vessels. Label demo routes and positions `SIMULATED`.

Build a deterministic simulated vessel event stream on the backend. Position changes must follow plausible routes and speed/time progression, not random coordinate jumps. If an external AIS source is not configured, the UI must show `No live AIS connection — demo track only`. Do not scrape websites or bypass an AIS provider's terms.

The page should support:
- Select vessel from list or map.
- Fit map to selected vessel and route.
- Toggle track history and predicted route separately.
- Display source and timestamp for positions.
- Show stale/unavailable data clearly.
- Switch between map and compact table on narrow screens.

Keep navigation safety outside scope: this page is for operational awareness in a simulation, not navigation or collision avoidance. Add API and frontend tests for vessel filtering, track timestamps, invalid coordinates and the missing-AIS state. Confirm map attribution is visible.
```

**Checkpoint:** A simulated vessel track follows deterministic route data, with a clear no-live-AIS state and visible map attribution.

## Prompt 08 — Implement ETA prediction and delay-risk machine learning

```text
Implement Milestone 08: create the first genuine predictive ML pipeline for vessel ETA and delay risk. Read the data policy and model-card template. Do not claim real port accuracy from synthetic data.

Use Python, pandas, NumPy and scikit-learn. Build a reproducible synthetic-data generator for demonstration and pipeline testing. It must generate plausible relationships among vessel type, distance remaining (when available), speed, reported ETA, anchorage queue, berth availability, weather scenario features and historical schedule deviation. Keep generator assumptions documented and parameters configurable.

Create two distinct model tasks:
1. ETA regression: predict arrival/berthing delay in hours relative to the chosen target definition. Be explicit whether the model predicts port arrival, pilot boarding, berth arrival or commencement of berth service. For the first release, use a well-defined synthetic `arrival_delay_hours` target.
2. Delay classification: classify whether a vessel exceeds a configurable delay threshold. Define the threshold in configuration and include it in the response.

Avoid target leakage. Split synthetic examples by voyage/record group or time so near-duplicate records do not appear in train and test. Compare the trained model against a transparent baseline such as median/naive ETA deviation. Prefer a robust Gradient Boosting or Random Forest model over deep learning. Use only features available at inference time.

Implement:
- Data-generation script with fixed random seed.
- Training script.
- Model artifact versioning and metadata.
- Evaluation report with MAE/RMSE for regression and precision/recall/F1 plus confusion matrix for classification.
- Feature importance or an interpretable explanation method.
- Inference service with input schema validation.
- Unit tests and a model smoke test.
- Model card documenting target, data, limitations, intended use and prohibited claims.

Prediction API responses must include predicted value, model name/version, created timestamp, input data status, uncertainty/limitations and `SIMULATED` status when based on demo records. Do not fabricate confidence percentages. If the training dataset is synthetic, place this warning in the model card and UI: `Synthetic-data demonstration. Not validated for real Chattogram Port operations.`

Show evaluation metrics in the Model Centre, not as promotional claims on the overview page. Add a test proving the model can beat or is compared honestly to its baseline. If it cannot, report that honestly rather than hiding the result.
```

**Checkpoint:** Reproducible model training and inference work; metrics and synthetic-data limitations are visible.

## Prompt 09 — Implement the constraint-based Berth Planner

```text
Implement Milestone 09: build an operationally constrained berth allocation planner using Google OR-Tools. This is an optimization service, not an LLM-generated suggestion.

First define and document the planning problem:
- Inputs: vessel calls, ETA windows, vessel length/draft requirements when available, berth capabilities, berth availability windows, service duration estimates, crane/resource availability and configurable priority.
- Hard constraints: a berth cannot host overlapping vessel calls; vessel/berth compatibility must be satisfied when required data exists; unavailable berths cannot be assigned; time intervals must be valid; required resource limits cannot be exceeded.
- Soft objectives: reduce vessel waiting time, reduce schedule changes, limit unnecessary resource conflicts and respect priority weights.

Use Google OR-Tools CP-SAT or an appropriate OR-Tools scheduling formulation. Record solver status, objective value, run time, constraints applied and any infeasibility explanation. Use integer time units (for example minutes from a planning horizon start) with explicit conversion to timestamps. Keep solver configuration deterministic where possible.

Create:
- Berth planner service and typed request/response schemas.
- Feasibility validator independent of the solver.
- Baseline schedule and optimized schedule outputs.
- Explanation object listing key reasons for each assignment and any trade-offs.
- Infeasible-plan handling with actionable constraint diagnostics.
- Tests for overlap prevention, incompatible vessel/berth pairs, unavailable berths, no feasible berth, and deterministic sample scenario.

Frontend:
- Berth timeline/Gantt-style view with vessel blocks.
- Vessel queue and berth compatibility panel.
- `Generate optimized plan` action.
- Baseline versus optimized view.
- Clear solver status and data-status labels.
- A review drawer showing why a vessel was assigned to a berth.
- `Propose for review` control that records an internal recommendation only. It must not execute any external action or silently overwrite a plan.

Do not let Gemini select the berth. Gemini may explain a schedule returned by the optimizer, but the actual assignment must come from OR-Tools and pass the separate feasibility validator.
```

**Checkpoint:** Optimizer produces feasible schedules and a separate validator catches deliberate invalid assignments.

## Prompt 10 — Implement the SimPy scenario and Decision Lab

```text
Implement Milestone 10: build the PORTOS AI Decision Lab using SimPy for discrete-event simulation. Read the domain model, berth optimizer and model docs first.

The simulation must represent the main operational chain:
Vessel arrival → anchorage queue → berth allocation → crane/resource assignment → cargo-handling service → berth release → vessel departure.

Represent resources explicitly: berths, cranes and configurable service capacity. Use distributions or deterministic parameters that are documented and configurable. The initial demo should be deterministic with a fixed seed; allow repeated runs with controlled seeds to estimate variability. The simulator must not use an LLM to calculate numeric results.

Create baseline and scenario-run APIs. A scenario can modify a limited, explicit set of parameters:
- vessel arrival volume or arrival-time shifts;
- one berth unavailable;
- one crane unavailable or restored;
- crane service-rate change;
- yard capacity or yard-block occupancy threshold;
- configurable weather disruption factor, clearly marked as a scenario assumption.

Calculate outputs including:
- mean, median and 90th-percentile vessel waiting time;
- total simulated vessel waiting hours;
- berth utilization;
- crane utilization/idle time where represented;
- number of vessels served within the horizon;
- queue length over time;
- estimated secondary environmental outputs only where their formula and assumptions are configured.

Ensure baseline and alternative scenarios use equivalent arrival samples and comparable random seeds where possible. Provide repeatable runs and scenario metadata. Clearly distinguish modelled outputs from observed port KPIs.

Frontend Decision Lab:
- Scenario setup panel with sliders/select controls and reset-to-baseline.
- A baseline and alternative comparison layout.
- Run simulation button with progress state.
- Queue and resource utilization charts.
- Summary of trade-offs and constraint warnings.
- Save scenario and compare up to three runs.
- `Use this plan as a recommendation` creates a reviewable internal proposal only.

Add tests for deterministic repeatability, event sequence integrity, resource capacity constraints, no negative waiting times and metric calculation. Include a methodology note with model assumptions and limitations. Never describe simulated outputs as actual reductions achieved at the port.
```

**Checkpoint:** A user can change scenario inputs, run SimPy, compare results and reproduce the same run with the same seed.

## Prompt 11 — Build Yard Intelligence and congestion forecasting

```text
Implement Milestone 11: build the Yard Intelligence module and data-bound occupancy heatmap.

Use the existing YardBlock and occupancy models. Extend the deterministic simulator/seed generator only where necessary to create time-stamped occupancy and container movement records. Keep these records labeled `SIMULATED`.

Build a yard forecasting service that predicts block occupancy over selectable horizons such as 6, 12 and 24 simulated hours. Start with a transparent baseline such as persistence/rolling average. Add a scikit-learn model only if the available synthetic training set supports a reproducible comparison and the model provides a defensible improvement. Do not build a model solely to increase the number of AI components.

The API should return, per block:
- current occupancy and capacity;
- forecast occupancy by horizon;
- threshold state (normal, watch, high risk);
- source/data status;
- forecast model/version and uncertainty/limitations;
- explanatory features or factors where supported.

Frontend:
- Top-down yard grid with clearly labeled block IDs.
- Configurable capacity threshold.
- Status colors consistent with the global palette: teal/green for normal, amber for watch, restrained red for high risk.
- Selectable forecast horizon.
- Clicking a block opens occupancy history, forecast and data provenance.
- Filter by risk state and sort by forecast occupancy.
- Do not make the heatmap look like a live sensor feed unless the source is live.

Integrate yard state with the digital twin so the selected block highlights in the 3D scene. Add tests for capacity boundaries, missing observations, forecasts that exceed capacity and UI status mapping. Make empty and unavailable states explicit.
```

**Checkpoint:** Yard heatmap and forecast panel use API outputs and selecting a block highlights the matching twin object.

## Prompt 12 — Build Green Port analytics with auditable estimates

```text
Implement Milestone 12: create Green Port analytics focused on transparent, assumption-driven operational emissions estimates.

Do not claim actual port-wide emissions or measured carbon reductions. The initial module estimates only the activities represented in the demo model. It must expose formulas, factors, source documentation and uncertainty.

Create an EmissionFactor configuration/data model with:
- pollutant or gas and unit;
- activity/fuel type;
- factor value;
- factor unit;
- source name/URL/publication date where available;
- scope and applicability notes;
- factor status (verified source versus illustrative demo assumption).

Create formula services that can estimate relevant emissions from modelled vessel waiting/berth time and equipment energy/fuel activity. Use transparent formulas. For example, an activity estimate should be based on activity quantity multiplied by an applicable documented factor, with unit conversions tested. If no defensible factor exists for an activity, show `Not configured` rather than inventing one. Use configurable demo factors only when labeled `ILLUSTRATIVE ASSUMPTION`.

Show comparisons between baseline and simulated scenarios only when both are calculated using the same factor set and scope. Display absolute value, unit, factor source, calculation method and assumptions. Do not imply that a simulated scenario proves a real emissions reduction.

Frontend:
- Green Port overview for modelled scope.
- Estimated emissions by activity category.
- Baseline versus scenario comparison.
- Assumption/factor drawer.
- Data provenance and scope warning.
- Optional environmental context from a configured public weather source, but weather must not be used for navigation decisions.

Add unit tests for conversions, factor application, missing factors and comparison integrity. Document what is and is not included (scope boundary). Do not use generic SDG icons as a substitute for environmental analysis.
```

**Checkpoint:** Emission estimates can be traced to factors and equations; unconfigured values are not guessed.

## Prompt 13 — Implement Port Data Bridge and document ingestion

```text
Implement Milestone 13: build Port Data Bridge so users can import public or authorized port information and convert it into reviewable operational records.

Initial supported formats:
- CSV
- XLSX
- text-based PDF (using pypdf)

Do not implement OCR in this milestone. For scanned PDFs with no extractable text, show a clear message that manual entry or a future OCR workflow is required. Do not silently claim the scanned content was read.

Build a safe ingestion pipeline:
1. Upload with file type, size and content validation.
2. Store the source document metadata and checksum.
3. Extract text/tables where supported.
4. Detect candidate fields and reporting periods using explicit parsers and/or Gemini structured extraction only if Gemini is configured.
5. Present a human review screen before committing extracted records.
6. Validate units, dates, ranges, duplicate rows and required fields.
7. Save normalized records with provenance back to the original file and page/sheet/row where possible.
8. Produce an import report with accepted, rejected, duplicate and review-required counts.

Use temporary or controlled storage for uploaded files. Prevent path traversal, unsafe file names, oversized files and formula injection in exported CSV/XLSX. Treat all document contents as untrusted data, not instructions to the application or LLM. Do not execute macros or embedded scripts. Keep secrets out of imported content and logs.

The review interface should show extracted candidate value, unit, source location, validation status and an editable correction field. A human must confirm before importing. Add a way to mark a record as rejected with a reason.

Add example templates for supported CSV/XLSX imports and a small clearly synthetic sample file for testing. Do not bundle copyrighted CPA reports without permission. Create tests for each file type, invalid files, scanned PDF handling, duplicate detection, unit inconsistency, provenance and upload security.
```

**Checkpoint:** User can import a test CSV/XLSX, review fields, correct them and confirm a traceable dataset. Text PDF extraction works only when text exists.

## Prompt 14 — Build the Gemini Port Intelligence Copilot

```text
Implement Milestone 14: integrate Gemini as a controlled operational explanation assistant. Read the current official Gemini API documentation before choosing the exact SDK method and model identifier. New Gemini projects should use the currently recommended Interactions API if supported by the installed official Google GenAI SDK. Put the model name in GEMINI_MODEL and do not scatter model IDs in source code.

Install and use the official Python Google GenAI SDK. The Gemini key must be read only by the backend from GEMINI_API_KEY. Do not expose it to the frontend, browser bundle, logs or API responses. The whole product must remain usable when Gemini is not configured.

The assistant's responsibilities:
- answer questions about current application records;
- explain ETA/delay predictions and their limitations;
- explain optimizer schedule outputs;
- summarize scenario results;
- summarize yard congestion risks;
- explain emissions calculations and assumptions;
- prepare a concise operational briefing from retrieved records.

Create a strict tool allowlist with typed schemas. Include tools such as:
- get_terminal_status
- get_vessel_details
- list_vessels_at_risk
- get_berth_availability
- get_berth_plan
- run_berth_optimization (simulation/optimization only; returns a proposal, no external action)
- run_scenario_simulation
- get_yard_risk_summary
- get_emissions_estimate
- get_data_provenance

The model may call only declared tools. Validate every argument and response. Apply reasonable date/time and result limits. Do not give Gemini arbitrary SQL access, filesystem access, shell access, unrestricted web access or direct write access to operational records.

Every answer should clearly separate:
- retrieved facts;
- model predictions;
- simulated scenario results;
- derived estimates;
- assumptions and missing data.

When the answer includes a numerical claim, its value must come from a tool response or a documented calculation. Include source/time/model references where available. If the application has no relevant data, the assistant must say so instead of guessing. If the user asks for navigational instructions, equipment control or safety-critical decisions, refuse that action and point to qualified human procedures.

Use structured outputs for the final answer where helpful, with fields such as summary, evidence, recommendation, limitations and references. Validate the response schema server-side. Use short, operationally clear wording. The assistant must not claim to have executed an action that was only proposed.

Frontend:
- Copilot panel with suggested operational questions.
- Message stream and typing/processing state.
- Tool activity indicator showing which application function was called, not hidden model reasoning.
- Evidence/source chips and links to relevant vessel, berth, scenario or data records.
- Clear Gemini unavailable/configuration state.
- Conversation error and retry handling.

Add tests with a mocked Gemini client. Verify missing-key behavior, invalid tool arguments, unavailable data, prompt-injection text inside imported documents and no fabricated tool results. Do not make the test suite depend on a paid live Gemini request.
```

**Checkpoint:** Copilot can answer grounded questions using application tools; without a key it degrades honestly and does not affect the rest of the app.

## Prompt 15 — Connect the event stream, digital twin and cross-module workflows

```text
Implement Milestone 15: integrate the application's modules into one synchronized operational workflow.

Review existing APIs, simulation, optimizer, ML and frontend state before making changes. Do not rewrite working modules. Create a typed event contract and a clear backend event publisher/subscriber mechanism. Use FastAPI WebSockets or Server-Sent Events, choosing the simpler reliable option for local prototype needs. Do not add Kafka or a distributed event platform.

The event stream should support events such as:
- vessel.position.updated (SIMULATED in demo mode)
- vessel.eta.prediction.created
- vessel.delay.risk.changed
- berth.plan.proposed
- berth.assignment.reviewed
- equipment.status.changed
- yard.occupancy.forecast.updated
- scenario.run.completed
- operational.alert.created

All events must include event ID, event type, emitted time, entity ID, payload schema version and data status. Make events idempotent where possible. Include reconnect behavior and last-event recovery or a safe full refresh if event history is unavailable.

Demonstrate one end-to-end workflow:
1. A deterministic vessel delay event is injected.
2. The vessel position/status and prediction update.
3. The overview displays the alert.
4. The berth planner can generate a new feasible proposal.
5. The operator opens Decision Lab and compares a baseline with the proposed plan.
6. The digital twin updates the vessel/berth states for the selected scenario.
7. The copilot can explain the new result from tool outputs.
8. The recommendation remains pending until a human reviews it.

Keep simulated clock and actual wall-clock separate. A user must be able to pause/reset the demo scenario and return to baseline deterministically. Add an event log page or panel showing timestamps and event origin.

Write integration tests for the sequence above and a Playwright test covering the main user journey. Verify that stale data and reconnect conditions are visible. Do not create a fake real-time label for polling or static data.
```

**Checkpoint:** A single deterministic incident propagates across the dashboard, prediction, planner, simulator, twin and copilot without inconsistent states.

## Prompt 16 — Perform responsible-AI, security, accessibility and technical QA

```text
Implement Milestone 16: perform a full quality, security, responsible-AI and accessibility hardening pass. Do not redesign the product or add new feature scope unless a defect requires it.

Audit:
- frontend TypeScript/lint/build;
- backend typing/lint/tests;
- database migrations and seed repeatability;
- API validation, authorization assumptions and error handling;
- file upload validation and storage;
- Gemini key handling and tool allowlist;
- model reproducibility and evaluation;
- berth constraint feasibility;
- simulator reproducibility and metric correctness;
- digital twin-to-database mapping;
- event ordering and reconnect behavior;
- unit/timezone handling;
- accessibility, mobile behavior and reduced motion;
- console errors, slow rendering and memory leaks.

Security requirements:
- Keep secrets in server environment variables.
- Commit only `.env.example`, never real keys.
- Validate file uploads by extension, MIME and actual content where practical; enforce size limits and safe filenames.
- Treat imported files and model output as untrusted.
- Prevent prompt injection in documents from becoming tool instructions.
- Use parameterized queries/ORM; do not construct SQL from user strings.
- Restrict CORS to configured origins.
- Add safe error messages and do not expose tracebacks in production mode.
- Do not log personal/sensitive information or API keys.
- No external port command or equipment-control capability exists.

Responsible-AI requirements:
- Display data-status labels and provenance.
- Show model name/version and evaluation limitations.
- Make synthetic-data limitations prominent.
- Provide human review before accepting proposed schedule changes.
- Keep emissions factors and formulas inspectable.
- Do not imply actual CPA integration or real-world validation.
- Add `AI_USE_DISCLOSURE.md` documenting Antigravity's role in development, Gemini's application role, ML libraries, code written/tested by the team and limitations. Leave fields for the team to complete honestly; do not claim work the team has not done.

Create:
- `docs/quality/test-plan.md`
- `docs/quality/test-results.md` with actual results and date
- `docs/ai/model-cards/` for ETA, delay and yard model cards
- `docs/ai/limitations.md`
- `docs/security/security-review.md`
- `AI_USE_DISCLOSURE.md`

Run all available tests, production builds, browser tests and static checks. Fix failures. If a check cannot be run because of missing infrastructure or secrets, report it clearly and provide the exact manual verification step. Never mark a test passed unless it ran successfully.
```

**Checkpoint:** Test results and limitations are documented; no critical errors remain; unavailable checks are disclosed.

## Prompt 17 — Package the prototype, deployment instructions and competition demo

```text
Implement Milestone 17: prepare PORTOS AI for a reliable local demonstration and the Blue AI Challenge showcase. Do not add new major product features.

First verify the entire application from a clean setup. Provide a documented quick-start path using Docker Compose where available and a manual fallback. The application must run without a Gemini API key in Demo Mode. If a Gemini key is present, the copilot should use it through the backend. Never put secrets in source control.

Complete:
1. Docker Compose for PostgreSQL/PostGIS, backend and frontend where practical, with health checks and persistent local database volume.
2. `.env.example` containing safe placeholder values and explanations.
3. database migration and deterministic seed commands.
4. model training/artifact generation command, or documented committed demo artifact policy if model binaries are too large.
5. demo reset command that restores seed data and resets simulation state safely.
6. operational runbook: start, stop, reset, troubleshoot and run tests.
7. data-source register with source URLs, access terms/permissions and the fields actually used. Do not include sources that were not used.
8. system architecture and data-flow diagrams.
9. API documentation and model cards.
10. a five-minute competition demo script.

The five-minute demo should follow this sequence:
- 0:00–0:35: Bangladesh port problem and prototype scope, with explicit note that this is an illustrative hybrid digital-twin proof of concept.
- 0:35–1:10: Overview and data-status/provenance.
- 1:10–1:55: Select an incoming vessel and inspect ETA/delay prediction.
- 1:55–2:40: Generate a feasible berth plan and inspect constraints.
- 2:40–3:40: Run a disruption scenario in Decision Lab and compare calculated outputs.
- 3:40–4:20: Watch the twin reflect the selected scenario and inspect yard/green impacts.
- 4:20–4:50: Ask the Gemini Copilot to explain the actual result, if configured; otherwise show the grounded demo-mode fallback state.
- 4:50–5:00: State measurable prototype validation, limitations and next steps.

Create a one-page `SHOWCASE_CHECKLIST.md` including internet-offline fallback, database reset, model artifact presence, browser size, reduced-motion considerations, API health, seeded records and a backup screen recording plan.

Run the app from a clean state and execute the five-minute workflow. Fix broken links, empty charts, console errors, unhandled API failures, loading dead ends and confusing labels. Verify that all displayed metrics are reproducible and sourced. Do not add fake real-world statistics to make the demo look stronger.

At the end, provide:
- exact local startup commands;
- exact demo reset commands;
- exact test commands and pass/fail summary;
- environment variables required and optional;
- known limitations;
- a short list of next technical improvements beyond the competition prototype.
```

**Final checkpoint:** A team member who did not build the application can follow the README, start the system, reset the demo and complete the main five-minute workflow.

---

## 7. Optional follow-up prompts (use only if the core build is stable)

These are not part of the required 18-prompt path. Add them only after Prompt 17 is complete.

### Optional A — External weather integration

```text
Add a configurable, low-cost external weather context provider for the Chattogram region. First review the provider's current official API documentation, terms, attribution and rate limits. Keep the provider behind a backend adapter and store retrieval timestamp, forecast time, source and units. Add caching and a deterministic fallback. Clearly state that marine forecast products are contextual only and are not suitable for navigational clearance. Do not use weather values to authorize vessel movement or berth safety decisions. Add tests for provider failure, stale data, units and attribution.
```

### Optional B — Real AIS provider adapter

```text
Design an optional AIS adapter but do not activate it without a valid licensed provider, API key and permission. Review the provider's current terms, rate limits, data rights and field definitions. Keep all provider secrets server-side. Preserve source and observation timestamps. If no licensed feed is configured, continue using the demo event stream and display `No live AIS connection`. Do not scrape AIS web pages or represent generated positions as live.
```

### Optional C — Advanced maintenance anomaly demo

```text
Add an equipment anomaly-detection demonstration using synthetic telemetry only. Generate documented temperature/vibration/current signals for a small illustrative equipment fleet. Compare a transparent rule-based baseline with an Isolation Forest or other defensible anomaly detector. Show the measured signal, detection time, model version, false-positive limitations and simulated status. Do not claim a real crane failure probability or issue maintenance instructions for actual equipment.
```

### Optional D — Research-grade model evaluation

```text
Review the ETA, delay and yard models as a research evaluator. Check temporal leakage, group leakage, class imbalance, baseline choice, calibration, missingness, drift sensitivity and reproducibility. Produce a rigorous evaluation report with confidence intervals where statistically justified. Explicitly distinguish synthetic-data development evidence from future real-port validation requirements. Do not optimize metrics by changing the test set or concealing weak results.
```

---

## 8. Suggested terminal commands and environment variables

The exact commands may vary depending on the generated project. The agent must confirm the actual package scripts and Python entry points and update the README. Do not copy commands blindly if the scaffold differs.

### Environment variables

```env
# Application
APP_ENV=development
DEMO_MODE=true
APP_TIMEZONE=Asia/Dhaka
FRONTEND_ORIGIN=http://localhost:3000

# Database
DATABASE_URL=postgresql+psycopg://portos:portos_dev_password@localhost:5432/portos

# Gemini. Optional for local Demo Mode.
GEMINI_API_KEY=
GEMINI_MODEL=

# Map. Optional; use only a provider/style with acceptable terms and attribution.
NEXT_PUBLIC_MAP_STYLE_URL=
MAP_ATTRIBUTION=

# Simulation
SIMULATION_SEED=42
SIMULATION_SPEED=1
```

Never use the example database password in a publicly accessible deployment. Never add a real Gemini or map-provider key to a `NEXT_PUBLIC_` variable.

## 9. Official documentation references to consult during implementation

These are starting points, not substitutes for checking the documentation for the exact installed version.

- [Google Antigravity documentation](https://antigravity.google/docs/home/)
- [Google Antigravity agent capabilities](https://antigravity.google/docs/agent/)
- [Google Antigravity persistent rules](https://antigravity.google/docs/rules/)
- [Google Antigravity agent skills](https://antigravity.google/docs/skills/)
- [Google Gemini API](https://ai.google.dev/gemini-api/docs)
- [Gemini Interactions API overview](https://ai.google.dev/gemini-api/docs/interactions-overview)
- [Gemini function calling](https://ai.google.dev/gemini-api/docs/function-calling)
- [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Three Fiber](https://r3f.docs.pmnd.rs/)
- [FastAPI SQL database guidance](https://fastapi.tiangolo.com/tutorial/sql-databases/)
- [Google OR-Tools](https://developers.google.com/optimization)
- [SimPy documentation](https://simpy.readthedocs.io/)

**Current Gemini API note:** Google's current documentation recommends the Interactions API for new projects. Confirm that the chosen model and the official `google-genai` SDK version support the exact function-calling flow before implementing it. Keep the model configurable.  
**Current Antigravity note:** Antigravity supports persistent workspace rules such as `AGENTS.md` and agent skills. Prompt 00 creates `AGENTS.md` so architecture and safety constraints persist beyond a single conversation.

## 10. Definition of a successful competition prototype

PORTOS AI is ready to showcase when all of the following are true:

- It starts locally from documented instructions.
- Demo data is deterministic and visibly labeled.
- The dashboard is populated from backend data, not arbitrary hardcoded KPI values.
- A user can select and inspect a vessel.
- ETA/delay prediction runs through a trained, versioned model and displays its synthetic-data limitation.
- The berth optimizer creates schedules that pass an independent hard-constraint validator.
- The user can run a SimPy scenario and compare actual computed outputs.
- The digital twin reflects the selected operational state.
- Yard risk and emissions estimates are traceable to inputs and assumptions.
- Port Data Bridge can ingest at least one supported CSV/XLSX file and preserve provenance after human review.
- Gemini Copilot, when configured, calls only approved application functions and grounds numerical statements in returned data.
- The product remains usable without Gemini credentials.
- No screen falsely implies live CPA/AIS/IoT integration.
- Tests, limitations, AI-use disclosure and source register are available.
- A team member can complete the five-minute scenario without developer intervention.

**Build principle:** A smaller end-to-end workflow that works, can be tested and can be explained is more valuable than a large interface full of nonfunctional features.
