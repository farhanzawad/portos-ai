# AGENTS.md — PORTOS AI Agent Instructions & Operating Rules

**Repository:** `portos-ai`  
**System:** Port Operations Intelligence System (PORTOS AI)  
**Applicability:** All Google Antigravity agents, subagents, and automated coding tasks in this repository.

---

## 1. Prime Directives

1. **Read Before Editing:** Inspect `PROJECT_BRIEF.md`, relevant architecture documents (`docs/architecture/`), and existing code before creating or modifying files. Never act on assumed file state or speculate without checking existing code first.
2. **Preserve Locked Stack & Design:** Adhere strictly to the locked technology stack (Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, FastAPI, SQLAlchemy 2, Alembic, PostgreSQL/PostGIS, OR-Tools, SimPy, scikit-learn, official `google-genai` SDK) and the **Minimal Industrial Futurism** design system. Any modification to locked choices requires an approved Architecture Decision Record in `docs/architecture/decisions.md`.
3. **Absolute Operational Truthfulness:**
   - **Never** claim or imply that the prototype is connected to Chattogram Port Authority (CPA), customs, a live Terminal Operating System (TOS), physical crane/berth IoT sensors, or a real-time AIS feed unless an explicitly configured and verified integration exists.
   - **Never** present simulated vessel positions, berth statuses, crane states, yard occupancy, or operational KPIs as observed real-world facts.
   - **Always** tag operational records with an explicit `data_status`: `SIMULATED`, `OBSERVED`, `FORECAST`, `DERIVED`, or `UNAVAILABLE`.
   - Maintain a persistent `DEMO ENVIRONMENT` banner/indicator across all demo interface views.
4. **Advisory Role Only — No Real-World Control:**
   - The platform provides decision support and simulation for human evaluation.
   - **No** navigational clearance, vessel maneuvering command, equipment movement, or safety-critical operational action may ever be executed or issued by the software.
   - All schedule recommendations are advisory proposals requiring explicit human review and approval.
5. **Separation of Analytical Roles:**
   - **Gemini (LLM):** Explains, synthesizes, drafts briefings, and coordinates user intent through a strict function-calling allowlist.
   - **scikit-learn:** Performs numerical ETA regression, delay-risk classification, and yard occupancy forecasting.
   - **Google OR-Tools:** Solves constrained berth allocation and scheduling problems deterministically.
   - **SimPy:** Simulates discrete-event terminal dynamics and disruption scenarios deterministically.
   - **Rule:** Never use an LLM to invent, hallucinate, or estimate numerical simulation outcomes or optimization schedules.
6. **Data Provenance & Auditability:**
   - Every operational, analytical, or imported record must preserve: source name, source URL or document ID, observation timestamp/reporting period, ingestion timestamp, and processing/derivation methodology note.
   - Predictions must include `model_name`, `model_version`, input feature reference, and uncertainty/limitations metadata.
7. **Security & Credential Isolation:**
   - Store all credentials (including `GEMINI_API_KEY`) strictly in server-side environment variables.
   - Never commit `.env` files or expose API keys in browser bundles, client-side code, logs, or error responses.
   - Ensure the system degrades gracefully in **Demo Mode** when external API keys are absent. Core features, simulation, optimization, and dashboards must remain fully functional without external keys.
8. **Code Quality & Verification Standard:**
   - Ground changes before mutating; write tests for new business logic, domain models, and API endpoints.
   - Execute verification commands (linters, type checks, test runners) before reporting task completion.
   - Report actual terminal command outputs and exit codes, not assumed success.

---

## 2. UI & Design System Guidelines

- **Visual Concept:** Minimal Industrial Futurism. A professional, calm, high-density maritime operations workspace.
- **Color Palette:**
  - Navy (Primary): `#102A43`
  - Secondary Navy: `#1E4967`
  - Muted Teal (Accent / Normal): `#16A394`
  - Amber (Watch / Warning): `#E5A23B`
  - Red (Risk / Danger): `#D95454`
  - Main Background: `#F4F6F8`
  - Surface White: `#FFFFFF`
  - Muted Text: `#667085`
  - Border: `#DCE3EA`
  - Twin Canvas: `#132B3F`
- **Prohibitions:** No neon gradients, excessive glassmorphism, decorative glow lines, rainbow telemetry charts, or game-like particles.
- **Typography & Layout:** Single type family (Geist or Inter); 8-point spacing grid; tabular figures for numbers/KPIs; thin borders; clear page headers; Lucide icons with uniform stroke.
- **Motion:** Restrained transitions (160–240 ms); support `prefers-reduced-motion` and include a toggle to disable nonessential animations.
- **No Mock Traps:** Do not create non-functional buttons, dead placeholder charts, or unhandled errors. If a capability belongs to a future milestone, render a clear, styled "Coming in Milestone XX" placeholder state.

---

## 3. Gravitas Debugging & Verification Protocol

When diagnosing bugs, refactoring, or modifying existing features:
1. **Ground Before Mutating:** Inspect target code, callers, and tests.
2. **Evidence-Backed Verification:** Verify fixes with fresh, executable evidence (passing tests, compiler/linter output). Stale evidence or self-review does not count.
3. **No Exact-Retry:** If a fix fails, diagnose the root cause and alter the strategy.
4. **Structured Summary:** For non-trivial code modifications, state:
   - **What Changed:** Files modified and behavioral delta.
   - **Evidence:** Actual execution output and exit codes.
   - **Why:** Rationale for the change.
   - **Verdict:** `VERDICT: PASS` or `VERDICT: FAIL -- [reason]`.

---

## 4. Milestone Execution Protocol

- Build sequentially from Prompt 00 through Prompt 17.
- Complete one milestone fully, run its checks, verify acceptance criteria, and update `docs/roadmap.md` before moving to the next.
- Keep components modular; avoid monolithic files (>350 lines should be split into domain-focused submodules).

