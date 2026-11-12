# PORTOS AI: Comprehensive Technical Audit & Architectural Inspection Report

**System:** Port Operations Intelligence System (PORTOS AI)  
**Target:** Chattogram Port Authority (CPA) / Karnaphuli River Estuary Digital Twin  
**Date:** November 2026  
**Auditor:** Senior Software Architect, GIS Engineer, 3D Geospatial Visualization Specialist & AI Engineer  
**Git Branch:** `feature/real-3d-gis-copilot-reconstruction`

---

## 1. Executive Summary

A comprehensive technical audit of the PORTOS AI repository was conducted to inspect why the 3D Digital Twin appeared toy-like and static, why the geographical map lacked realistic cartographic grounding, and whether the AI Copilot executed real analytical models or mocked scripted responses.

The audit revealed three critical architectural bottlenecks:
1. **3D Digital Twin:** The `frontend/public/` directory did not exist. No GLTF/GLB models or external PBR textures were deployed. The 3D scene relied solely on low-level Three.js box and cylinder primitives with untextured flat materials. Furthermore, spatial overlay pins were detached 2D HTML elements floating over the canvas with hardcoded CSS percentages (`top: 34%`, `left: 22%`) that did not track camera movement.
2. **Geospatial Map:** In `GeospatialPortMap.tsx`, the `OFFLINE_VECTOR_STYLE` had empty sources (`sources: {}`), causing MapLibre GL to render an empty dark background rectangle (`#0d1b2a`) rather than real maritime/satellite tiles. Navigation buoys and fairway corridors lacked real hydrographic depths and IALA Region A markings.
3. **AI Copilot Disconnect:** While the backend (`backend/app/copilot/agent.py` and `tools.py`) contained a complete, production-grade agent with 12 allowlisted analytical tools, safety-critical refusal gates, prompt injection defenses, and fallback execution, the frontend (`CopilotTacticalCockpitView.tsx`) intercepted user submissions using a client-side `setTimeout` mock with string regex matching, completely bypassing the backend.

---

## 2. Component Dependency & Architecture Map

```mermaid
graph TD
    subgraph Frontend [Next.js App Router & Tailwind CSS]
        Nav[Universal Collapsible Sidebar]
        PageCockpit[Executive Cockpit /]
        PageTwin[3D Digital Twin /digital-twin]
        PageVTS[Fairway VTS Radar /vessels]
        PageBerth[Berth Planner /berth-planner]
        PageYard[Yard Stacking /yard]
        PageLab[Decision Lab /scenario-lab]
        PageCopilot[Port Copilot /copilot]
        
        RealCanvas[RealTerminal3DCanvas & TerminalScene3D]
        GISMap[GeospatialPortMap MapLibre GL]
        ApiClient[frontend/src/lib/api-client.ts]
    end

    subgraph Backend [FastAPI & SQLAlchemy 2]
        Router[backend/app/api/v1/router.py]
        EpCopilot[/api/v1/copilot/chat]
        EpGeo[/api/v1/geospatial/port-geojson]
        EpVessels[/api/v1/vessels/calls]
        EpBerths[/api/v1/berths]
        EpYard[/api/v1/yard/blocks]
        EpOptimizer[/api/v1/berth-planner/solve]
        EpScenario[/api/v1/scenarios/run]
        
        CopilotAgent[PortCopilotAgent]
        ToolRegistry[CopilotToolRegistry 12 Tools]
    end

    subgraph AnalyticalEngines [Scientific & Deterministic Engines]
        ORTools[Google OR-Tools CP-SAT v9.8]
        SimPy[SimPy 4.1.2 Discrete-Event Engine]
        Scikit[scikit-learn Gradient Boosting & Isolation Forest]
        Gemini[Google Gemini 2.5 Flash / Pro via google-genai]
        SQLite[PostgreSQL / SQLite Database]
    end

    PageTwin --> RealCanvas
    PageVTS --> GISMap
    PageCopilot --> ApiClient
    ApiClient --> Router
    Router --> EpCopilot
    EpCopilot --> CopilotAgent
    CopilotAgent --> ToolRegistry
    ToolRegistry --> ORTools
    ToolRegistry --> SimPy
    ToolRegistry --> Scikit
    CopilotAgent --> Gemini
    Router --> SQLite
```

---

## 3. Detailed Root Cause Analysis

### 3.1 3D Digital Twin: Why Did It Look Like a Toy?

| Factor | Finding & Code Evidence | Technical Root Cause | Corrective Action |
|---|---|---|---|
| **A. Primitive Geometries** | `STSCrane3D.tsx` and `ProceduralVessel3D.tsx` use pure `boxGeometry` and `cylinderGeometry`. | Lack of modular structural framing, cross-bracing lattices, and realistic hull forms. | Build high-fidelity parametric components with authentic Neo-Panamax proportions, bulbous bow, cellular container guides, and realistic gantry bogies. |
| **B. Absence of Assets** | `frontend/public/` directory was non-existent. | No 3D GLTF models or external texture maps were packaged into the build. | Construct `frontend/public/` directory with verified GeoJSON, environment data, and realistic PBR assets. |
| **C. PBR Materials & Coating** | Flat hex colors (`#0284c7`, `#eab308`) with basic roughness. | Synthetic look resembling plastic toys without metallic sheen, rust staining, or Fresnel water reflection. | Implement procedural high-resolution PBR textures with normal maps, ambient occlusion, metalness/roughness gradients, and corrugated container sidings. |
| **D. Detached Spatial Overlays** | `SpatialViewportPins.tsx` used fixed CSS percentage coordinates (`top-[34%] left-[22%]`). | Overlays were 2D screen-space DOM elements floating above WebGL rather than anchored to 3D world space. | Migrate pins to `@react-three/drei` `<Html>` components anchored directly to 3D object positions (`mesh.position`), tracking camera pan/tilt/zoom. |
| **E. Lighting & Shadows** | Single directional light without soft shadow cascades or environmental radiance. | Harsh shadows and washed-out specular highlights created miniature toy appearance. | Configure ACESFilmicToneMapping, multi-point atmospheric hemisphere lighting, soft PCF shadow maps, and twilight/golden-hour presets. |

### 3.2 Geospatial Map: Why Was It Unrealistic?

| Factor | Finding & Code Evidence | Technical Root Cause | Corrective Action |
|---|---|---|---|
| **A. Missing Map Tiles** | `OFFLINE_VECTOR_STYLE` in `GeospatialPortMap.tsx` line 113 had `sources: {}`. | MapLibre had no raster or vector tile sources configured for offline/online rendering, showing a flat `#0d1b2a` canvas. | Integrate robust, keyless open maritime tile providers (CARTO Dark Matter, CARTO Voyager, OSM Standard, Esri Ocean Basemap) with graceful offline fallbacks. |
| **B. Channel Coordinates** | Synthetic range rings without real dredged bathymetric fairway contours. | Incomplete fairway representation between Bay of Bengal Outer Anchorage and Karnaphuli berths. | Export verified WGS84 GeoJSON from `backend/app/geospatial/service.py` to `frontend/public/data/` with navigation buoys, Gupta Bend, and depth contours. |
| **C. Vessel Position Sync** | Hardcoded positions in some UI markers. | AIS coordinates were not consistently bound to backend `VesselPosition` records. | Bind live vessel markers directly to `getVesselCalls()` and `getPortGeoJSON()` API responses. |

### 3.3 AI Copilot: Scripted Demonstration vs. Model Execution

| Factor | Finding & Code Evidence | Technical Root Cause | Corrective Action |
|---|---|---|---|
| **A. Frontend Interception** | `CopilotTacticalCockpitView.tsx` lines 114–130 used a local `setTimeout()` with keyword checking (`isReeferQuery`, `isBerthQuery`). | The UI completely bypassed the API client to display hardcoded markdown text. | Connect `handleSendMessage()` directly to `sendCopilotMessage()` in `frontend/src/lib/api-client.ts`. |
| **B. Backend Capability** | `backend/app/copilot/agent.py` contains full `PortCopilotAgent` with 12 tools. | Backend was fully functional with OR-Tools, SimPy, and scikit-learn integrations, but sat idle due to the frontend disconnect. | Wire frontend message loop to backend `/api/v1/copilot/chat` and render real returned facts, model predictions, simulation results, and limitations. |
| **C. Tool Telemetry Display** | Static tool list showed "ACTIVE ALLOWLIST (10/10)" without execution metrics. | No visibility into real tool execution latencies or parameters. | Display actual `tool_calls` returned in `CopilotChatResponse` with millisecond timings and parameter inspectability. |

---

## 4. Technical Audit Matrix

| Module | Current Condition | Root Cause | Evidence | Required Correction |
|---|---|---|---|---|
| **Geographical Map** | Partially functional MapLibre without real tile sources (`sources: {}`). | Lack of base tile provider and static fallback. | `GeospatialPortMap.tsx:113` | Add CARTO Dark Matter / Esri tiles + real Karnaphuli fairway GeoJSON. |
| **3D Terminal** | Low-poly procedural primitives; missing `frontend/public/`; 2D detached pins. | No PBR textures, no GLTF assets, detached CSS pin overlay. | `SpatialViewportPins.tsx:15`, `public/` missing | Upgrade to Drei `<Html>` 3D anchors, PBR water shader, and industrial-grade vessel/crane meshes. |
| **Vessel Tracking** | AIS markers functional but need direct geo-synchronization. | Disconnect between VTS radar view and 3D coordinate space. | `VesselTrackerMarker.ts` | Synchronize ENU-to-WGS84 transformations with backend `/geospatial/transform`. |
| **AI Copilot** | Frontend hardcoded mock (`setTimeout`) bypassing real backend. | Frontend developer left mock logic in `CopilotTacticalCockpitView.tsx`. | `CopilotTacticalCockpitView.tsx:114` | Wire `sendCopilotMessage()`, show real facts, model predictions, and tool execution audit. |
| **Dashboard UI** | Modern Pro Max design but needs seamless link between Map and 3D. | Independent view states without camera sync. | `app/digital-twin/page.tsx` | Add synchronized split view and camera focus transitions. |
| **Backend** | Fully functional FastAPI services with OR-Tools, SimPy, scikit-learn (120/120 tests pass). | Under-utilized by frontend. | `pytest backend/tests` | Maintain 100% test coverage while integrating frontend consumers. |
