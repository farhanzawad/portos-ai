# PORTOS AI — System Architecture & Data Flow

**Document ID:** `ARCH-FLOW-001`  
**Revision:** 1.0.0 (Milestone 17 Package)  
**Date:** 2026-11-03

---

## 1. High-Level Component Architecture

```mermaid
graph TB
    subgraph Frontend ["Frontend Tier (Next.js 14 App Router)"]
        UI["Minimal Industrial Futurism Workspace"]
        Twin["Digital Twin (Three.js / 2D Canvas)"]
        Gantt["Berth Gantt & Proposal Modal"]
        LabUI["Decision Lab & Trade-Off Cards"]
        CopilotUI["Port Intelligence Copilot Chat"]
        StreamCtx["EventStreamContext (SSE Client)"]
    end

    subgraph Backend ["Backend Tier (FastAPI Service Layer)"]
        Router["API v1 Router (/api/v1/...)"]
        Bus["InMemoryEventBus (SSE Monotonic IDs)"]
        IncMgr["IncidentManager (Rollback Stashing)"]
        CopilotAgent["PortCopilotAgent (Tool Allowlist)"]
    end

    subgraph AnalyticalEngines ["Deterministic Analytical & ML Tier"]
        ORTools["Google OR-Tools CP-SAT (Berth Scheduler)"]
        SimPyEngine["SimPy Engine (Discrete-Event Simulator)"]
        SKLearnETA["scikit-learn ETA Regressor & Classifier"]
        SKLearnYard["scikit-learn Yard Forecaster"]
        GreenCalc["Green Port GLEC Calculator"]
        Parser["Document Parser & Formula Neutralizer"]
    end

    subgraph Storage ["Persistence Tier"]
        DB[("PostgreSQL 16 + PostGIS / SQLite Fallback")]
        Artifacts[("Committed ML Models (.joblib)")]
    end

    UI --> Router
    Twin --> Router
    Gantt --> Router
    LabUI --> Router
    CopilotUI --> Router
    StreamCtx <==|"Server-Sent Events (/api/v1/events/stream)"| Bus

    Router --> Bus
    Router --> IncMgr
    Router --> CopilotAgent

    IncMgr --> Bus
    IncMgr --> DB

    Router --> ORTools
    Router --> SimPyEngine
    Router --> SKLearnETA
    Router --> SKLearnYard
    Router --> GreenCalc
    Router --> Parser

    CopilotAgent -.->|"Strict Tool Allowlist"| Router
    SKLearnETA <--> Artifacts
    Parser --> DB
    Router --> DB
```

---

## 2. Cross-Module Incident & Workflow Synchronization Data Flow

This diagram illustrates what happens when an operator or automated scenario triggers an operational disruption (e.g., Monsoon Surge):

```mermaid
sequenceDiagram
    autonumber
    actor Operator as Terminal Operator
    participant EventBanner as Incident Control (/events)
    participant FastAPIEvents as FastAPI Event Stream
    participant IncMgr as Incident Manager
    participant DB as Terminal Database
    participant Bus as InMemoryEventBus
    participant Dashboard as Overview & Vessels UI
    participant Planner as Berth Allocation (OR-Tools)
    participant SimLab as Decision Lab (SimPy)
    participant Copilot as Port Copilot (Gemini)

    Operator->>EventBanner: Injects "Monsoon Fairway Surge (+6.5h)"
    EventBanner->>FastAPIEvents: POST /api/v1/events/inject-incident
    FastAPIEvents->>IncMgr: inject_preset("monsoon_surge_delay")
    
    rect rgb(240, 248, 255)
    Note over IncMgr,DB: Deterministic Mutation & Stash
    IncMgr->>IncMgr: Stash baseline values in-memory
    IncMgr->>DB: Mutate Meghna Star delay risk to HIGH_RISK (+6.5h)
    IncMgr->>DB: Insert OperationalEvent (CRITICAL)
    IncMgr->>Bus: Publish incident.injected (ID: 101)
    IncMgr->>Bus: Publish vessel.delay.risk.changed (ID: 102)
    IncMgr->>Bus: Publish operational.alert.created (ID: 103)
    end

    Bus-->>Dashboard: SSE Event Stream Broadcast
    Dashboard->>Dashboard: Render Critical Fairway Alert & update vessel queue

    Operator->>Planner: Request Feasible Schedule Proposal
    Planner->>DB: Read updated vessel arrival windows & tidal tables
    Planner->>Planner: OR-Tools CP-SAT solves non-overlapping berth intervals
    Planner-->>Operator: Displays feasible rescheduled Gantt proposal

    Operator->>SimLab: Compare Disruption vs Baseline
    SimLab->>SimLab: SimPy runs discrete-event scenario (Seed 42)
    SimLab-->>Operator: Displays trade-off (+4.8h wait vs +0.9 MT CO2e)

    Operator->>Copilot: "Explain impact of monsoon surge on Berth CCT-1"
    Copilot->>Copilot: Match tool "get_vessel_details" & "run_scenario_simulation"
    Copilot-->>Operator: Structured briefing grounded in tool outputs

    opt Deterministic Rollback
    Operator->>EventBanner: Click "Reset to Baseline"
    EventBanner->>IncMgr: POST /api/v1/events/reset-incident
    IncMgr->>DB: Restore stashed attributes and delete injected event rows
    IncMgr->>Bus: Publish incident.reset (ID: 104)
    Bus-->>Dashboard: Return UI to clean initial seed baseline
    end
```

---

## 3. Document Ingestion & Provenance Data Flow

```mermaid
flowchart TD
    Doc["Uploaded File (CSV, XLSX, PDF)"] --> SizeCheck{"Size <= 10MB?"}
    SizeCheck -- No --> RejectSize["HTTP 400: Exceeds 10MB limit"]
    SizeCheck -- Yes --> ExtCheck{"Extension in [.csv, .xlsx, .pdf]?"}
    ExtCheck -- No --> RejectExt["HTTP 400: Unsupported format"]
    ExtCheck -- Yes --> MagicCheck{"Magic Signature Valid (%PDF, PK)?"}
    MagicCheck -- No --> RejectSig["HTTP 400: Corrupted signature"]
    MagicCheck -- Yes --> TraversalCheck["sanitize_filename() (Strip ../)"]
    TraversalCheck --> FormulaCheck["sanitize_cell_value() (Escape =, +, -, @)"]
    FormulaCheck --> SHA["Compute Cryptographic SHA-256 Hash"]
    SHA --> Staging["Store in ImportedDataset & ImportedRecords (STAGED)"]
    Staging --> HITL["Operator Human-in-the-Loop Review (/data-centre)"]
    HITL --> Decision{"Operator Action?"}
    Decision -- "Edit Cell" --> Correct["Apply Correction with Audit Note"]
    Decision -- "Reject Row" --> RejectRow["Mark Record as REJECTED"]
    Decision -- "Commit Dataset" --> Commit["Commit Valid Records to Terminal State"]
```

