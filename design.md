# PORTOS AI — Comprehensive Design & UI Architecture Specification

**System:** Port Operations Intelligence System (PORTOS AI)  
**Document:** `design.md`  
**Design Direction:** Minimal Industrial Futurism  
**Target Environment:** River-Port Maritime Intelligence (Chattogram / Karnaphuli Corridor)  
**Revision:** 2.0 (Redesign Blueprint)  
**Last Updated:** November 2026  

---

## 1. Visual Philosophy & Core Directives

PORTOS AI is an advisory decision-support workspace engineered for port controllers, harbour masters, and terminal managers. Its visual foundation is **Minimal Industrial Futurism**:

1. **High-Density, Calm Operational Workspace:**
   - Designed for high-frequency operational scanning, multi-monitor setups, and low cognitive fatigue.
   - Emphasizes tabular metrics, explicit status tagging, spatial awareness, and predictable layout geometry over decorative flourishes.
2. **Zero Gimmicks / Anti-Sci-Fi Standard:**
   - **Strictly Prohibited:** Neon glow gradients, glowing laser grid lines, heavy glassmorphism, spinning decorative particle swarms, or game-like 3D animations.
   - Every pixel, border, and badge must serve an operational purpose (status, threshold, identity, or spatial boundary).
3. **Dual-Canvas Architecture:**
   - **Light Operational Workspace (`#F4F6F8` / `#FFFFFF`):** Used for analytical dashboards, Gantt timelines, tabular fleet directories, and scenario configuration panels.
   - **Dark Spatial Twin Canvas (`#132B3F`):** Dedicated high-contrast viewport reserved for the 3D WebGL Digital Twin and ECDIS Fairway Radar Cartography.
4. **Absolute Operational Truthfulness:**
   - Every operational metric, chart, and schedule item is explicitly tagged with an audit badge: `SIMULATED`, `OBSERVED`, `FORECAST`, `DERIVED`, or `UNAVAILABLE`.
   - Persistent `DEMO ENVIRONMENT` banner remains fixed across all application headers.

---

## 2. Design Tokens & Visual Hierarchy

### 2.1 Color Palette

```
┌───────────────────┬─────────────┬───────────┬────────────────────────────────────────────────────────┐
│ TOKEN NAME        │ VARIABLE    │ HEX VALUE │ USAGE & SEMANTIC PURPOSE                               │
├───────────────────┼─────────────┼───────────┼────────────────────────────────────────────────────────┤
│ Deep Navy         │ --navy-900  │ #102A43   │ Brand anchors, primary headers, sidebar background     │
│ Secondary Navy    │ --navy-700  │ #1E4967   │ Section titles, icon containers, secondary buttons     │
│ Muted Teal        │ --teal-600  │ #16A394   │ Normal operational status, active selection, success   │
│ Warm Amber        │ --amber-500 │ #E5A23B   │ Watch/warning states, tidal gates, demo banners        │
│ Restrained Red    │ --red-500   │ #D95454   │ Critical alerts, schedule conflicts, delay risks       │
│ Main Canvas       │ --bg-main   │ #F4F6F8   │ Application-wide neutral light background              │
│ Surface White     │ --surface   │ #FFFFFF   │ Cards, modal dialogs, slide-out drawers, tables        │
│ Muted Slate       │ --muted-txt │ #667085   │ Secondary captions, metadata labels, units             │
│ Industrial Border │ --border    │ #DCE3EA   │ Card dividers, grid boundaries, input strokes          │
│ Dark Twin Canvas  │ --canvas-3d │ #132B3F   │ Three.js 3D viewport, tactical radar vector backdrop   │
└───────────────────┴─────────────┴───────────┴────────────────────────────────────────────────────────┘
```

### 2.2 Typography Scale
- **Primary Typeface:** `Inter`, `Geist`, system sans-serif.
- **Monospace Typeface:** `GeistMono`, `ui-monospace` (for IMO numbers, timestamps, coordinates, and solver runtimes).
- **Tabular Figures:** All dynamic numerical metrics enforce `font-variant-numeric: tabular-nums` (`tabular-nums` in Tailwind) to eliminate horizontal jitter during live updates.

```
┌──────────────┬─────────────┬────────────┬─────────────┬──────────────────────────────────────────────┐
│ STYLE ROLE   │ SIZE        │ WEIGHT     │ LINE HEIGHT │ APPLIED CONTEXT                              │
├──────────────┼─────────────┼────────────┼─────────────┼──────────────────────────────────────────────┤
│ Display Lg   │ 30px (1.875)│ Extra-Bold │ 36px        │ Module Titles (e.g. Intelligent Berth Planner)│
│ Header Md    │ 20px (1.25) │ Bold (700) │ 28px        │ Section Headers, Card Titles                 │
│ Section Sm   │ 14px (0.875)│ Semi-Bold  │ 20px        │ Sub-headers, Table Header Columns            │
│ Body Regular │ 13px (0.812)│ Medium(500)│ 18px        │ Default table content, operational notes     │
│ KPI Big Num  │ 24px (1.5)  │ Bold (700) │ 32px        │ Primary KPI Metric displays                  │
│ Micro Label  │ 11px (0.687)│ Bold (700) │ 14px        │ Field labels, uppercase metadata, status pills│
└──────────────┴─────────────┴────────────┴─────────────┴──────────────────────────────────────────────┘
```

### 2.3 8-Point Spacing Grid & Radius Scale
All layouts, internal paddings, and component margins align strictly with multiples of 4px and 8px:
- `space-1` (4px): Badge icon gaps, inline pill spacing.
- `space-2` (8px): Button padding (vertical), list item gaps.
- `space-3` (12px): Compact card inner padding, input field height offsets.
- `space-4` (16px): Standard card body padding, table cell horizontal padding.
- `space-6` (24px): Grid gaps between dashboard widgets.
- `space-8` (32px): Major page section breaks, header margin-bottom.

**Corner Radii:**
- Badges & Chips: `rounded-full` (9999px)
- Buttons & Form Inputs: `rounded-xl` (12px)
- Cards, Modals & Viewports: `rounded-2xl` (16px) or `rounded-3xl` (24px) for master view containers.

---

## 3. Application Shell & Layout System

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ PERSISTENT HEADER: Logo | DEMO BANNER | Corridor Status | High-Tide Gate | UTC+6 Clock | Backend │
├──────────────┬───────────────────────────────────────────────────────────────────────────────────┤
│ SIDEBAR      │ MAIN OPERATIONAL WORKSPACE (Scrollable / Responsive 8-pt Grid)                    │
│ 11 Modules   │ ┌───────────────────────────────────────────────────────────────────────────────┐ │
│ Navigation   │ │ PAGE HEADER: Module Icon + Title + Audit Badge + Quick Filter Controls        │ │
│ - Overview   │ ├───────────────────────────────────────────────────────────────────────────────┤ │
│ - Berths     │ │ METRIC STRIP: 4 to 5 High-Density KPI Cards with Tabular Figures & Status Tags│ │
│ - DigitalTwin│ ├───────────────────────────────────────────────────────────────────────────────┤ │
│ - Vessels    │ │ PRIMARY WORKSPACE: Split-view or Full Canvas (Gantt, 3D WebGL, Radar GIS)     │ │
│ - Scenarios  │ ├───────────────────────────────────────────────────────────────────────────────┤ │
│ - Yard       │ │ SECONDARY ANALYTICS: Comparison Tables, Queues, Event Logs                    │ │
│ - GreenPort  │ └───────────────────────────────────────────────────────────────────────────────┘ │
│ - Copilot    ├───────────────────────────────────────────────────────────────────────────────────┤
│ - DataCentre │ PERSISTENT FOOTER: Truthfulness Disclaimer | Audit Provenance Links | Version     │
└──────────────┴───────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Module-by-Module Component & Element Inventory

### 4.1 Overview Cockpit (`/`)
- **Purpose:** 30-second executive operational health check for port management.
- **Key UI Elements:**
  - `OverviewKPIStrip`: 4 cards displaying Vessels in System, Berth Occupancy %, Mean Anchorage Wait (hours), and Active Congestion Alerts.
  - `TerminalOverviewPreview`: Interactive quayside overview widget with quick-switch toggles.
  - `BerthUtilizationChart`: Horizontal stacked occupancy bars for CCT-1 through NCT-4.
  - `VesselQueueTable`: Tabular incoming queue showing Vessel Name, Draft, TEU, Tidal Gate Eligibility, and ETA.
  - `OperationalAlertsTimeline`: Chronological alert feed with severity color indicators.
  - `ContextualInsightPanel`: Automated synthesis chips identifying immediate bottleneck risks.

### 4.2 Intelligent Berth Planner (`/berth-planner`)
- **Purpose:** Google OR-Tools CP-SAT mathematical schedule optimization and manual override.
- **Key UI Elements:**
  - `SolverMetricsBar`: Solved status badge (`OPTIMAL` in $32\text{ms}$), Baseline Wait (12.0h FIFO) vs. Optimized Wait (2.2h, -81.7%), Quay Utilization %, Zero Hard Violations badge, **"Re-solve Model"** and **"Propose"** action buttons.
  - `BerthGanttTimeline`: 72-hour continuous timeline across 6 container berths. Draggable blocks with inline $\pm 1\text{h}$ shift controls, duration stretch handles, berth reassignment dropdown, pin/lock toggles, and live red overlap collision warning banners.
  - `BerthMapSplitView`: Synchronized Port GIS Map with 3 basemap modes (`Nautical Dark`, `Satellite`, `Tactical Radar`), rendering CCT/NCT quayside, STS crane outreach spans, moored ships with mooring lines, and lateral navigation buoys.
  - `VesselQueuePanel`: Slide-out unassigned vessel call pool at anchorage.
  - `ManualAssignModal`: Explicit assignment dialog with draft and crane reach validation.
  - `ScheduleVersionsModal`: Historical version comparison and rollback manager.
  - `AssignmentReviewDrawer`: Comprehensive side-sheet with vessel telemetry and crane gang assignment.

### 4.3 3D & 2D Terminal Digital Twin (`/digital-twin`)
- **Purpose:** Real-time spatial terminal twin for equipment tracking, berth inspection, and yard density.
- **Key UI Elements:**
  - `TerminalCanvas`: Master WebGL wrapper with auto-fallback to 2D isometric schematic.
  - `TerminalScene3D`: Three.js procedural scene with dynamic Karnaphuli river water shader, daylight/night sun angles, quayside concrete textures, and STS gantry cranes with working trolley animations.
  - `ProceduralVessel3D`: Procedural ship hulls with colored TEU container stacks and draft waterline sinking.
  - `TerminalSchematic2D`: High-speed 2D top-down vector schematic for low-power or mobile devices.
  - `TwinHeaderControls`: Mode switcher (3D / 2D / Split GIS), camera preset buttons (Overview, Berths, Fairway, Cranes), and day/night toggle.
  - `MapNavControl`: Zoom in / out controls with strict height clamps (preventing ground clipping or orbit disorientation).
  - `FreeRoamHud`: WASD drone navigation HUD with altitude readout and speed boost indicator.
  - `EntityInspectorDrawer`: Slide-out panel inspecting clicked vessel, crane, or yard block.
  - `EquipmentMaintenanceModal`: Anomaly detection scores (Isolation Forest) and simulated crane derating.

### 4.4 Vessel Intelligence & Fairway Radar (`/vessels`)
- **Purpose:** Karnaphuli navigational channel radar tracking and ML arrival delay forecasting.
- **Key UI Elements:**
  - `GeospatialPortMap`: Full-fairway vector/satellite map from Bay of Bengal Outer Anchorage to upstream port berths.
  - `VesselTrackerMarker`: Directional ECDIS vessel chevrons with heading vectors, draft risk color borders, and speed labels.
  - `CorridorRadarView`: Range rings (1 NM, 2 NM, 5 NM), sweep line animation, and high-tide tidal window gate banner.
  - `FleetDirectoryTable`: Searchable and filterable table with IMO, MMSI, LOA, Beam, Draft, and Speed.
  - `VesselDetailDrawer`: Deep-dive vessel dossier with historical track replay, ML delay prediction gauge ($\pm 0.85\text{h}$ MAE), tidal clearance margin, and engine fuel specs.
  - `AISDiagnosticsModal`: Transponder latency indicator and simulated AIS replay toggles.

### 4.5 Scenario Decision Lab (`/scenario-lab`)
- **Purpose:** Discrete-event simulation (SimPy 4.1.2) of weather delays, equipment failures, and surge events.
- **Key UI Elements:**
  - `ScenarioHeader` & `ScenarioConfigPanel`: Disruption preset selector (Monsoon Storm Surge, Crane Electrical Fault, Silt Shoaling).
  - `ScenarioMacroLevers`: Interactive sliders for wind velocity, tidal drop, crane capacity derate (%), and vessel arrival volume.
  - `ScenarioKpiDashboard`: Side-by-side delta cards (Mean Delay Delta, Berth Throughput Delta, Quay Utilization Delta).
  - `QueueDynamicsChart`: ECharts time-series chart showing 72-hour simulated queue dynamics (Baseline vs. Scenario).
  - `ScenarioComparisonTable`: Detailed numerical comparison across all operational KPIs.
  - `SimulationGisMap`: Spatial map displaying congestion hotspots and queue accumulation points under scenario.
  - `VesselEventLogsTable`: Step-by-step discrete-event log (*Arrived $\to$ Anchored $\to$ Berthing $\to$ Working $\to$ Departed*).

### 4.6 Yard Intelligence & Congestion Forecasting (`/yard`)
- **Purpose:** Container yard block density projections across 6h, 12h, and 24h horizons.
- **Key UI Elements:**
  - `YardKpiMetricsBar`: Total TEU capacity, current occupancy %, critical blocks count, mean dwell time (days).
  - `YardControlsBar`: Horizon selector tabs (`Current`, `+6h Forecast`, `+12h Forecast`, `+24h Forecast`).
  - `YardHeatmapGrid`: Visual matrix of container blocks (A1 through D4) with color-coded congestion gradients (Green $<70\%$, Amber $70-85\%$, Red $>85\%$).
  - `YardBlockDetailDrawer`: Granular breakdown of import vs. export TEUs, reefer plug usage, and assigned Rubber-Tired Gantry (RTG) cranes.
  - `YardAlertStrip`: Active congestion warnings with recommended diversion blocks.

### 4.7 Green Port & Emissions Accounting (`/green-port`)
- **Purpose:** Auditable maritime fuel burn and greenhouse gas accounting under GLEC Framework v3.0.
- **Key UI Elements:**
  - `GreenPortKpiBar`: Total $\text{CO}_2\text{e}$ emissions, hotelling emissions at anchorage, quay crane electrical emissions, clean energy share.
  - `ScopeBoundaryBanner`: Transparent disclosure of Scope 1 / Scope 2 accounting boundaries.
  - `EmissionsCategoryCards`: Categorical breakdowns (Vessel Auxiliary Generators, Quayside Cranes, Yard Terminal Tractors).
  - `EnvironmentalContextCard`: Local air quality indicators ($\text{NO}_x$, $\text{SO}_x$, $\text{PM}_{2.5}$) along riverbank communities.
  - `ScenarioEmissionsComparePanel`: Verified carbon reduction resulting from optimized berth scheduling.
  - `AssumptionFactorDrawer`: Mathematical formula viewer with transparent fuel consumption coefficients.

### 4.8 Port Data Bridge & Ingestion (`/data-centre`)
- **Purpose:** Secure multi-format document ingestion, schema mapping, and data provenance auditing.
- **Key UI Elements:**
  - `DocumentUploadCard`: Drag-and-drop file uploader supporting CSV, XLSX, and text-based PDF manifests. Includes client-side formula sanitization.
  - `DatasetReviewTable`: Tabular staging preview with column-mapping dropdowns and anomaly highlighting.
  - `ImportSummaryReportCard`: Audit summary showing accepted rows, rejected cells, and data lineage IDs.
  - `DatasetCommitModal`: Formal confirmation modal committing validated records to the database.
  - `GovtDataCentreView`: Official CPA tide tables, bathymetric survey reports, and meteorological bulletins.

### 4.9 Port Intelligence Copilot (`/copilot`)
- **Purpose:** Natural language operational reasoning powered by Google Gemini 2.5 Flash via a strict 10-tool allowlist.
- **Key UI Elements:**
  - `CopilotChatView`: Chat workspace with conversation history and Markdown response rendering.
  - `CopilotStatusBanner`: AI status pill (`GEMINI 2.5 FLASH ONLINE` or `OFFLINE DEMO MODE`).
  - `SuggestedPromptsBar`: One-click operational prompt pills (Tidal gate feasibility, crane failure impact, morning briefing).
  - `ToolActivityCard`: Expandable card displaying exact tool function calls, input arguments, and solver responses.
  - `EvidenceReferenceChips`: Clickable citation pills linking directly to database records and model cards.

### 4.10 Unified Events & Operational Bus (`/events`)
- **Purpose:** Real-time Server-Sent Events (SSE) stream synchronizing incidents and state across all modules.
- **Key UI Elements:**
  - `EventStreamPill`: Live WebSocket/SSE connection status with green pulse animation.
  - `IncidentControlBanner`: One-click disruption injection buttons for live demonstrations.
  - `WorkflowProgressionCard`: Visual state machine tracker showing end-to-end maritime workflow stages.
  - `EventLogTable`: Filterable real-time event log with timestamps, severity levels, and origin modules.

---

## 5. Standard Component Library & Design Rules

### 5.1 The 5-Tier Data Status Audit System
Every operational record must render its corresponding status badge:
1. `SIMULATED` (Blue/Slate): Synthetically generated for training and demonstration.
2. `OBSERVED` (Green/Teal): Verified historical or empirical operational records.
3. `FORECAST` (Indigo/Purple): Predictive output generated by ML models.
4. `DERIVED` (Amber): Mathematically calculated from underlying parameters.
5. `UNAVAILABLE` (Muted Grey): External live feed disconnected or not provisioned.

### 5.2 Micro-Interactions & Animation Rules
- **Duration:** 160ms to 240ms.
- **Easing:** `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out standard).
- **Reduced Motion:** Respects `prefers-reduced-motion: reduce` by disabling non-essential transitions.
- **Hover Feedback:** Subtle border color transitions (`border-slate-200` to `border-sky-500`) and slight elevation increase without bouncy scale animations.

---

## 6. Comprehensive Redesign Roadmap & Blueprint

This section establishes the specific targets for the upcoming redesign phase:

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   UPCOMING REDESIGN OBJECTIVES                                   │
├─────────────────────────┬──────────────────────────┬─────────────────────────────┬───────────────┤
│ 1. VISUAL REFINEMENT    │ 2. DENSITY & HIERARCHY   │ 3. SPATIAL UNIFICATION      │ 4. RESPONSIVE │
├─────────────────────────┼──────────────────────────┼─────────────────────────────┼───────────────┤
│ Upgrade all cards to    │ Add collapsible drawers  │ Harmonize light workspace   │ Optimize split│
│ crisp thin borders,     │ and secondary tabs to    │ borders with dark 3D/radar  │ views for     │
│ unified 8-pt spacing,   │ reduce clutter in Gantt  │ viewports with seamless     │ laptop, tablet│
│ and Inter typography.   │ and Vessels directories. │ token bridging.             │ & ultrawide.  │
└─────────────────────────┴──────────────────────────┴─────────────────────────────┴───────────────┘
```

### Planned Redesign Priorities:
1. **Berth Planner Overhaul:**
   - Implement collapsible side panels for the vessel queue to expand the active Gantt matrix canvas.
   - Refine the Gantt bar styling with subtle progress gradients and clearer lock pin indicators.
   - Enhance the Synchronized GIS Map with smooth viewport zoom transitions and high-contrast vessel labels.
2. **Vessels Fairway View Overhaul:**
   - Integrate the fleet table and fairway radar into an adjustable split layout.
   - Upgrade the AIS telemetry dossier into a multi-tabbed slide-out drawer (Overview, ML Predictor, Specs, Telemetry).
3. **Digital Twin Viewport Overhaul:**
   - Add a floating translucent HUD overlay for quick camera angle presets.
   - Implement smooth camera transitions between berth zones when clicking vessels or cranes.
4. **Unified Top Bar & Navigation:**
   - Streamline the persistent header into a single-row status strip.
   - Ensure seamless theme coherence between the light UI workspace and dark spatial canvases.

---
*End of Design Specification (`design.md`). Use this document as the single source of truth for all styling, layout structure, and component redesigns.*
