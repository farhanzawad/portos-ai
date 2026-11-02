# PORTOS AI — Competition Showcase Pre-Flight Checklist

**Event:** Blue AI Challenge 2026–27  
**System:** Port Operations Intelligence System (PORTOS AI)  
**Target Duration:** 5-Minute Live Demonstration  
**Document Revision:** 1.0.0 (Milestone 17 Package)

---

## 1. Pre-Flight Operational Checklist

Complete this checklist 15 minutes before the competition presentation or recording:

### 1.1 Infrastructure & Environment Readiness
- [ ] **Docker / Local Services Running:**
  - Verify Backend Health: `curl http://127.0.0.1:8000/health` returns `{"status":"ok"}`.
  - Verify Frontend Access: Open [http://localhost:3000](http://localhost:3000) in Chrome/Edge.
- [ ] **Database & Baseline Seed State Clean:**
  - Execute demo reset: `python scripts/reset_demo.py`.
  - Confirm output shows 12 vessels, 6 berths, 5 equipment units, and 12 yard blocks.
- [ ] **Model Artifact Presence:**
  - Verify `backend/app/ml/artifacts/eta_regressor.joblib` exists (297 KB).
  - Verify `backend/app/ml/artifacts/delay_classifier.joblib` exists (246 KB).
  - Verify `backend/app/ml/artifacts/models_metadata.json` exists.
- [ ] **Internet-Offline Fallback Verification:**
  - If venue Wi-Fi is unstable or external Google API is unreachable, PORTOS AI seamlessly engages **Offline Demo Mode**.
  - Verify offline briefing by opening `/copilot` and sending *"What is our terminal status?"* -> deterministic briefing displays without error.

---

### 1.2 Display, Browser & UI Settings
- [ ] **Browser Resolution:** Set display to 1080p (1920 × 1080) at 100% zoom level (no cut-off or text overlap).
- [ ] **Browser Window State:** Full-screen or maximized with bookmarks bar hidden (`F11` or `Ctrl+Shift+B`).
- [ ] **Reduced-Motion Toggle:**
  - Ensure the header toggle displays `Motion: Standard` (or switch to `Motion: Reduced` if presenting to an audience sensitive to animations).
- [ ] **Persistent Header Check:**
  - Verify the top orange `DEMO ENVIRONMENT` banner is visible.
  - Verify the data status badge shows `Data: SIMULATED`.
  - Verify the clock displays `... BST` (Asia/Dhaka time).
- [ ] **Event Stream Pill Check:**
  - Verify the green `SSE Stream Live` pill is pulsing in the header.

---

### 1.3 Feature Verification Walkthrough
- [ ] **Overview (`/`):** KPI strip renders (Berth Occupancy, Queue Count, Air Quality, Tidal Height).
- [ ] **Vessels (`/vessels`):** Vessel table filters by search query; clicking `MV Meghna Pride` opens the Detail Drawer with ETA delay comparisons.
- [ ] **Berth Planner (`/berth-planner`):** OR-Tools Gantt timeline renders without overlapping blocks; solver status shows `OPTIMAL`.
- [ ] **Decision Lab (`/scenario-lab`):** Selecting `Monsoon Fairway Surge` and clicking `Run Simulation` computes trade-off deltas.
- [ ] **Digital Twin (`/digital-twin`):** 3D isometric scene renders procedural berths and vessels; 2D schematic button switches cleanly.
- [ ] **Yard Intelligence (`/yard`):** Top-down grid displays block occupancy percentages; clicking a block opens the forecast drawer.
- [ ] **Green Port (`/green-port`):** Emissions breakdown cards render hoteling vs. crane CO2e estimates.
- [ ] **Copilot (`/copilot`):** Starter prompt responds with grounded structured citations.

---

## 2. Backup & Contingency Plan

| Contingency Scenario | Primary Mitigation | Fallback Action |
| :--- | :--- | :--- |
| **No Venue Internet Connectivity** | The platform is 100% locally self-contained. SQLite fallback and offline demo copilot require zero external internet calls. | Continue demo in offline mode without disruption. |
| **Accidental Database Mutation** | Operator modified data or injected an incident during prior testing. | Run `python scripts/reset_demo.py` or click `Reset to Baseline` in the Event Stream banner (`/events`). |
| **Browser Crash / System Hang** | Restart Chrome with URL tabs pinned. | Open pre-recorded high-definition backup screen recording (`demo_backup_1080p.mp4`). |
| **Port Conflict on 3000 or 8000** | Identify rogue process via `Get-NetTCPConnection`. | Kill conflicting PID or run Docker Compose on mapped alternate ports. |

---

## 3. Five-Minute Cue Card Reference

- **0:00–0:35:** Bangladesh Port Context & Scope (`/`)
- **0:35–1:10:** Overview & 5-Tier Data Status (`/`)
- **1:10–1:55:** Feeder ETA Prediction (`/vessels`)
- **1:55–2:40:** OR-Tools Berth Feasibility (`/berth-planner`)
- **2:40–3:40:** SimPy Disruption Trade-Offs (`/scenario-lab`)
- **3:40–4:20:** Twin & Yard Heatmap (`/digital-twin`, `/yard`)
- **4:20–4:50:** Grounded Copilot & Safety Refusals (`/copilot`)
- **4:50–5:00:** Test Verification & Wrap-Up (Footer)

