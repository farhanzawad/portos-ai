# PORTOS AI — Project Brief

**System Name:** PORTOS AI (Port Operations Intelligence System)  
**Version:** 1.0 (Prototype Specification)  
**Date:** November 2026  
**Target Event:** Blue AI Challenge 2026–27 (Bangladesh Blue Economy & Maritime Innovation)

---

## 1. Executive Summary & One-Line Definition

**PORTOS AI** is a Bangladesh-focused, AI-assisted port operations decision-support platform that combines a transparent operational data layer, a hybrid digital twin, predictive machine learning, constrained berth optimization, and discrete-event scenario simulation.

Designed for container terminal operators, port planners, and maritime logistics coordinators, PORTOS AI enables operational teams to forecast vessel arrivals, generate mathematically feasible berth schedules, simulate congestion disruptions, track yard density, and estimate carbon footprints—all governed by strict human-in-the-loop oversight and transparent data provenance.

---

## 2. Problem Statement & Bangladesh Context

### The Challenge
Chattogram Port handles over 90% of Bangladesh’s maritime containerized trade and represents the lifeline of the country's export economy (notably Ready-Made Garments - RMG). However, the port experiences chronic operational friction:
- **Outer Anchorage Waiting Times:** Container feeder vessels historically spend considerable hours or days at the outer anchorage awaiting berth availability and pilotage windows, cascading into demurrage costs, supply-chain delays, and unnecessary marine fuel consumption.
- **Tidal & Draft Constraints:** Navigation along the Karnaphuli River channel is governed by semi-diurnal tides and shifting draft limits, making berth scheduling hypersensitive to minor ETA shifts.
- **Yard Density Bottlenecks:** Container yard congestion regularly limits ship-to-shore (STS) crane productivity, turning quayside operations into landside bottlenecks.
- **Information Fragmentation:** Operations managers lack a unified, explainable decision-support tool that bridges incoming vessel intelligence, berth constraints, yard capacity, and environmental impact under disruption scenarios.

### Target Users
1. **Berth Operations Planners:** Responsible for generating, revising, and validating berth assignment windows against vessel drafts, lengths, crane availability, and tidal windows.
2. **Terminal Operations Controllers:** Monitoring quayside gang productivity, yard block density, crane telemetry, and operational alerts.
3. **Logistics & Sustainability Officers:** Evaluating vessel turnaround times, anchorage delays, and fuel/carbon emission trade-offs.
4. **Competition Evaluators & Technical Reviewers:** Auditing AI models, optimization feasibility, data lineage, and software reliability.

---

## 3. Product Scope & Initial Operating Environment

### Operating Environment
The initial environment is a **simplified, Chattogram-inspired container terminal** (illustrative representation of Karnaphuli River container berths and yard facilities).

> [!IMPORTANT]
> **Research & Prototype Boundary:**
> PORTOS AI is an academic and competition proof of concept. It is **not** an official or surveyed digital twin, **not** an authorized system of the Chattogram Port Authority (CPA), and is **not** connected to live CPA radar, customs systems, TOS, or real-time equipment controls.
> All operational data generated within the platform is explicitly labeled `SIMULATED` in demo mode.

### Out of Scope (Explicit Prohibitions)
- **No Direct Vessel Control or Navigational Clearance:** PORTOS AI never issues navigation orders, helm commands, pilotage clearances, or collision-avoidance instructions.
- **No Equipment Actuation:** No direct control over quay cranes, yard equipment, or gate barriers.
- **No Autonomous Schedule Overwrite:** All optimization schedules are advisory recommendations requiring explicit human review and approval.
- **No Unconsented Personal Data:** Consignee personal details, commercial pricing contracts, and confidential manifests are excluded.

---

## 4. Key Differentiating Capabilities

1. **Port Data Bridge & Data Provenance Centre:**
   - Ingests public reports, user-supplied operational spreadsheets (XLSX/CSV), and text-based documents (PDF).
   - Enforces human-in-the-loop field review, duplicate detection, and schema validation.
   - Retains end-to-end lineage: source origin, document ID/URL, observation timeframe, and transformation history.

2. **Hybrid 3D/2D Terminal Digital Twin:**
   - Procedural Three.js / React Three Fiber interactive scene illustrating berths, vessels, STS cranes, internal roads, and yard blocks.
   - Data-bound visual representation synchronized with backend operational states and simulated event streams.
   - Includes a responsive 2D SVG/canvas fallback for accessibility and low-power hardware.

3. **Predictive Vessel ETA & Delay-Risk ML Pipeline:**
   - Scikit-learn models predicting arrival delays (regression) and categorizing high-risk delays (classification).
   - Benchmarked against transparent historical baselines.
   - Transparent Model Cards detailing synthetic training data, feature importances, and evaluation limitations.

4. **Constraint-Based Berth Optimization (Google OR-Tools):**
   - Mathematical formulation using CP-SAT to solve berth allocation and scheduling problems.
   - Strict hard constraints (no overlapping vessels at the same berth, length/draft compatibility, crane limit bounds).
   - Soft objectives (minimizing total waiting hours, schedule disruption, and idle berth gaps).
   - Independent validator verifying schedule feasibility before presentation.

5. **Discrete-Event Simulation Decision Lab (SimPy):**
   - Deterministic event simulation modeling the complete vessel lifecycle: *Arrival → Anchorage Waiting → Berthing → Crane Operations → Yard Handover → Unberthing*.
   - Enables operators to test "what-if" scenarios: crane breakdown, weather delay, berth closure, or surge volumes.
   - Compares baseline vs. scenario KPIs (mean waiting time, queue lengths, equipment utilization).

6. **Yard Intelligence & Congestion Heatmap:**
   - Top-down visual grid of container yard blocks with configurable warning thresholds.
   - Time-horizon occupancy forecasts (6h, 12h, 24h) identifying upcoming bottlenecks.

7. **Auditable Green Port Analytics:**
   - Operational carbon and pollutant estimates derived from vessel hoteling, auxiliary engine usage during anchorage delays, and crane energy consumption.
   - Transparent formulas and documented emission factors labeled with source lineage or `ILLUSTRATIVE ASSUMPTION`.

8. **Port Intelligence Copilot (Gemini Interactions API):**
   - Natural-language reasoning and operational synthesis powered by the official Google GenAI SDK.
   - Strictly confined to a typed read-only and simulation tool allowlist.
   - Explains mathematical schedules, summarizes scenario trade-offs, and audits data provenance without inventing numerical statistics.
   - Functions in an honest, decoupled fallback state when `GEMINI_API_KEY` is not present.

---

## 5. Primary Operational User Journey

```
1. Vessel Ingestion / Track View
   └── Vessel appears in queue with reported ETA and position (SIMULATED / OBSERVED)
2. Predictive Intelligence
   └── ML models estimate ETA deviation and delay risk; display risk badge & model card
3. Constrained Berth Optimization
   └── Operator requests optimized allocation; OR-Tools computes feasible schedule
4. Disruption & Scenario Modeling (Decision Lab)
   └── SimPy simulates scenario (e.g., crane outage, weather surge) comparing KPIs
5. Spatial Inspection (Digital Twin)
   └── Operator reviews berths, yard blocks, and vessel queues in 3D/2D space
6. Human Review & Proposal Approval
   └── Operator audits schedule trade-offs and formally approves advisory recommendation
7. Green Port & Yard Impact Review
   └── System computes estimated fuel/emission variances and yard occupancy impacts
8. Grounded AI Copilot Inquiry
   └── Operator asks Gemini Copilot to explain decisions; assistant cites tool outputs
```

---

## 6. Blue AI Challenge 2026–27 Alignment

| Challenge Criterion | PORTOS AI Implementation & Evidence |
| :--- | :--- |
| **Real-World Relevance** | Directly tackles outer anchorage demurrage, vessel turnaround delays, and yard congestion in Bangladesh's primary maritime corridor (Chattogram). |
| **Evidence-Backed Validation** | Machine learning pipelines benchmarked against transparent baselines; berth schedules validated by independent constraint checkers; SimPy simulation outputs verifiable via deterministic seeds. |
| **Originality & Innovation** | Blends hybrid procedural digital twin with operations-research constraint solving (OR-Tools) and discrete-event simulation (SimPy), coordinated by Gemini tool-calling. |
| **Credible AI & Analytics** | Clear division of labor: ML predicts, OR-Tools optimizes, SimPy simulates, Gemini explains. No LLM-hallucinated numerical outputs. |
| **Low-Cost / Accessible** | Open-source stack (FastAPI, Next.js, PostgreSQL/PostGIS, SimPy, OR-Tools, Three.js); operates locally on standard developer hardware with zero paid cloud prerequisites. |
| **Responsible AI & Ethics** | Explicit `SIMULATED` data labels, `DEMO ENVIRONMENT` banner, traceable provenance, model cards, human-in-the-loop approvals, and full disclosure of AI development tooling in `AI_USE_DISCLOSURE.md`. |

---

## 7. Data Classification Taxonomy

To prevent misinterpretation, all operational records in PORTOS AI carry one of five standardized labels:
- **`SIMULATED`**: Artificially generated by seed scripts, deterministic event generators, or SimPy runs.
- **`OBSERVED`**: Real-world public or user-uploaded records verified against source documentation.
- **`FORECAST`**: Generated by statistical or machine learning inference models.
- **`DERIVED`**: Mathematically computed from formulas or aggregations (e.g., emissions = hours × factor).
- **`UNAVAILABLE`**: Missing, unmonitored, or disconnected data streams (explicitly shown; never filled with fake data).

