# AI Use Disclosure & Provenance Declaration

**Project Title:** Port Operations Intelligence System (PORTOS AI)  
**Competition:** Blue AI Challenge 2026–27  
**Submission Category:** AI-Assisted Maritime Logistics & Port Decision Support  
**Date of Declaration:** 2026-11-03  
**Status:** Completed and Verified for Milestone 16 Technical QA

---

## 1. Executive Summary & Purpose

This disclosure document formally records the roles, methodologies, and boundaries of Artificial Intelligence (AI) technologies utilized both **during the engineering and development of PORTOS AI** and **as operational analytical engines within the running software platform**.

In accordance with Blue AI Challenge competition rules and Responsible-AI standards:
- All automated assistance used in software development is fully declared.
- All machine learning, mathematical optimization, and large language model components in the application are explicitly attributed to their respective open-source or commercial engines.
- The separation between generative language synthesis and deterministic analytical calculation is rigorously documented.

---

## 2. AI Technologies Used in Application Architecture

PORTOS AI employs a multi-tiered hybrid intelligence architecture. No single "black box" model makes untraceable operational decisions:

| Component Name | Technical Engine | Architectural Role | Autonomy Level | Deterministic? |
| :--- | :--- | :--- | :--- | :---: |
| **Port Intelligence Copilot** | Google Gemini 2.5 Flash (via official `google-genai` SDK) / Deterministic Fallback Engine | Natural language query understanding, operational briefing synthesis, explaining optimization results via strict tool outputs. | Advisory Only (Read-Only Tools) | Non-deterministic (bounded by strict allowlist) |
| **Vessel ETA Regressor** | scikit-learn `GradientBoostingRegressor` | Estimates numerical arrival delays (hours) relative to declared ETA under tidal and queue constraints. | Advisory Only | Deterministic |
| **Vessel Delay Classifier** | scikit-learn `GradientBoostingClassifier` | Predicts binary high-risk delay status ($\ge 3.0$ hours) for tidal window prioritization. | Advisory Only | Deterministic |
| **Yard Congestion Forecaster** | scikit-learn `GradientBoostingRegressor` | Projects container block slot occupancy across 6h, 12h, and 24h operational horizons. | Advisory Only | Deterministic |
| **Berth Allocation Scheduler** | Google OR-Tools CP-SAT | Combinatorial optimization solver allocating quayside berths respecting physical constraints (draft, length, tides, outreach). | Advisory Proposal (Requires Human Approval) | Deterministic |
| **Terminal Disruption Simulator** | SimPy 4 (Discrete-Event Engine) | Models queue buildup, tidal delays, and crane productivity during operational disruption scenarios. | Simulation Experimentation | Deterministic (Random Seed 42) |

---

## 3. Role of AI Coding Assistants in Development

During the design and implementation of the PORTOS AI prototype, **Google Antigravity** (Advanced Agentic Coding Assistant) was utilized as an engineering pair-programmer.

### Specific Scope of Antigravity Assistance:
1. **Codebase Scaffolding & Module Implementation:**
   - Generated initial boilerplate for FastAPI REST routers, Pydantic schemas, and SQLAlchemy 2 ORM models.
   - Built Next.js 14 App Router UI pages, TypeScript component hierarchies, and Tailwind CSS styling following the **Minimal Industrial Futurism** design system.
   - Implemented scikit-learn training pipelines (`backend/app/ml/train.py`), OR-Tools CP-SAT formulation, and SimPy simulation presets.
2. **Automated Testing & QA Hardening:**
   - Authored comprehensive backend unit/integration tests with `pytest` (85 tests passing).
   - Authored end-to-end browser automation suites with `Playwright` (70 tests passing).
3. **Refactoring & Bug Fixing:**
   - Applied the strict **Gravitas Protocol** to diagnose and repair runtime errors, hydration mismatches, schema alignments, and event bus ordering.

### Human Team Responsibilities & Code Ownership:
- **Domain Modeling & Architectural Design:** Defining Bangladesh-specific port operational challenges (Karnaphuli fairway draft constraints, semi-diurnal tides, off-dock ICD transfers, monsoon surges).
- **Mathematical Formulations:** Formulating the berth allocation CP-SAT constraint equations (non-overlapping berth space-time intervals, tidal draft feasibility, crane assignment limits).
- **Review & Verification:** Inspecting test runs, validating operational realism, reviewing code diffs, and verifying truthfulness disclaimers.

---

## 4. Verification & Testing Evidence

All machine learning models and analytical solvers within PORTOS AI are covered by automated verification suites executed in the deployment environment:

| Analytical Engine | Test Suite | Pass Count | Status |
| :--- | :--- | :---: | :---: |
| **scikit-learn ML Pipelines** | `backend/tests/test_ml_pipeline.py` | 4 / 4 | PASS |
| **Yard Occupancy ML** | `backend/tests/test_yard_forecasting.py` | 8 / 8 | PASS |
| **Google OR-Tools CP-SAT** | `backend/tests/test_berth_optimizer.py` | 9 / 9 | PASS |
| **SimPy Simulation Engine** | `backend/tests/test_simulation_engine.py` | 9 / 9 | PASS |
| **Port Intelligence Copilot** | `backend/tests/test_copilot.py` | 6 / 6 | PASS |
| **Security & Technical QA** | `backend/tests/test_audit_security.py` | 8 / 8 | PASS |
| **Full Backend Suite** | `backend/tests/` (all modules) | 85 / 85 | PASS |
| **Playwright E2E Suite** | `frontend/e2e/` (all modules) | 70 / 70 | PASS |

---

## 5. Known Operational Limitations & Boundaries

1. **Synthetic Data Demonstration:** All vessel trajectories, terminal states, crane sensor telemetry, and container yard blocks are synthetically generated for demonstration. The system is **not** integrated with Chattogram Port Authority (CPA) live networks.
2. **Strict Human Review:** No navigational clearance, pilot dispatch, vessel maneuvering order, or physical crane movement can be issued by the software. All schedule proposals require explicit human confirmation.
3. **Offline Demo Mode:** When external Google Gemini API credentials are absent, the platform automatically degrades gracefully to an offline deterministic analytical briefing engine without functional loss.

---

## 6. Team Attestation & Declarations

*(To be signed / confirmed by the competition project team during final submission)*

- [x] **Truthfulness Attestation:** We declare that all synthetic data, simulations, and models are accurately disclosed and not misrepresented as real-world operational facts.
- [x] **Attribution Attestation:** We declare that all open-source libraries, optimization solvers, and AI assistant tools used in this project have been fully credited.
- [x] **Safety Attestation:** We declare that PORTOS AI operates strictly in an advisory capacity and includes hard-coded safety refusals against autonomous physical port equipment control.

**Team Members:**  
1. *[Team Member Name / Lead Developer]* — System Architecture, Optimization Modeling & Integration  
2. *[Team Member Name / Maritime Domain Specialist]* — Port Operations Workflow, Hydrographic & Tidal Verification  
3. *[Team Member Name / Data & AI Engineer]* — Machine Learning Pipelines, Security Hardening & Evaluation  

