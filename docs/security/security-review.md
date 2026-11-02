# PORTOS AI — Comprehensive Security Review & Threat Model

**System:** Port Operations Intelligence System (PORTOS AI)  
**Document Revision:** 1.0.0 (Milestone 16 Technical QA Audit)  
**Date:** 2026-11-03  
**Overall Verdict:** `VERDICT: PASS`

---

## 1. Executive Security Summary

PORTOS AI has undergone a rigorous architectural, code-level, and operational security hardening audit. The prototype was evaluated against OWASP Top 10 API Security Risks, prompt injection adversarial patterns, file upload attack vectors, and operational safety constraints. All credentials, database connections, and LLM orchestration layers are isolated on the server side with graceful offline demonstration fallback.

---

## 2. Threat Modeling & Mitigation Matrix

| Threat Category | Potential Attack Vector | System Defense & Implementation | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **API Credential Exposure** | Leakage of `GEMINI_API_KEY` or DB credentials in client bundles, logs, or error payloads. | Secrets loaded strictly via server-side `pydantic-settings`. `.env*` files in `.gitignore`. Masked from all API health/status payloads. | Automated test `test_secrets_isolation_no_key_leakage` passes. Zero secrets in browser bundle. |
| **Prompt Injection & LLM Hijacking** | Malicious users or document content attempting "Ignore previous instructions", jailbreaks, or tool misuse. | Dual-tier defense: (1) Regex-based adversarial guard `check_prompt_injection()`; (2) Strict typed `CopilotToolRegistry.ALLOWLIST` (10 tools max); (3) System instruction bounding. | Automated test `test_prompt_injection_refusal_in_copilot` passes (4 test injection payloads blocked). |
| **Safety-Critical Command Issuance** | Requesting automated vessel maneuvering, navigational clearance, or crane actuation. | Explicit safety refusal interceptor `check_safety_critical_refusal()` intercepts commands prior to model or tool invocation. | Automated tests `test_safety_critical_operational_refusal` pass across 5 operational command variations. |
| **SQL Injection** | Manipulated query parameters in search fields or route IDs. | 100% of data access queries use SQLAlchemy 2 ORM with parameterized variable binding. Zero raw SQL string concatenation in API endpoints. | Verified via static code search and database audit tests. |
| **Malicious File Upload** | Path traversal (`../../etc/passwd`), executable payload upload, or zip bomb via Port Data Bridge. | Extension whitelist (`.csv`, `.xlsx`, `.pdf`), magic byte verification (`%PDF`, `PK\x03\x04`), 10MB size ceiling, filename sanitization via `re.sub(r"[^a-zA-Z0-9_.-]", "_", ...)`. | Automated test suite `backend/tests/test_ingestion.py` passes. |
| **Spreadsheet Formula Injection** | CSV/XLSX cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` executing OS commands via Excel DDE. | Automatic single-quote prefix neutralization via `sanitize_cell_value()` before database storage or display. | Automated test `test_sanitize_cell_formula_injection` passes. |
| **Cross-Origin Resource Sharing (CORS)** | Malicious cross-site scripts invoking port APIs from unauthorized origins. | FastAPI `CORSMiddleware` restricted to `settings.frontend_origin` and localhost/127.0.0.1:3000 in development. No wildcard `*` allowed origins. | Verified via `GET /api/v1/system/audit` configuration audit. |
| **Information Leakage via Errors** | Stack traces or database structure leaking to clients on HTTP 500 exceptions. | Global exception handler catches all unhandled exceptions, logs trace with UUID request ID, and returns safe generic error message. | Tested in `main.py` exception handling suite. |
| **Denial of Service (DoS)** | Giant simulation durations or uncontrolled event buffers. | SimPy horizons bounded, event bus uses ring buffer (maximum 200 events), pagination strictly enforced on all list endpoints. | Verified in `test_event_stream.py`. |

---

## 3. Detailed Security Controls

### 3.1 Secrets Management & Environment Isolation
- All secrets are managed through `backend/app/config.py` using `pydantic-settings`.
- Only `.env.example` is committed to version control with sanitized placeholders.
- The platform functions fully in **Offline Demo Mode** when `GEMINI_API_KEY` is omitted, eliminating external dependencies for competition judging.

### 3.2 File Ingestion Security Architecture
```
Uploaded File 
     │
     ▼
[Size Check] ──> Exceeds 10MB? ───────────> HTTP 400 Reject
     │
     ▼
[Format Check] ──> Unrecognized ext? ──────> HTTP 400 Reject
     │
     ▼
[Magic Signature] ─> Header != %PDF/PK? ──> HTTP 400 Reject
     │
     ▼
[Filename Sanitize] ─> Strip ../ and symbols ─> Safe ASCII name
     │
     ▼
[Formula Neutralizer] ─> Escape =, +, -, @ ─> Safe Staging Record
     │
     ▼
[SHA-256 Hasher] ─> Cryptographic Integrity Stamp
```

### 3.3 Copilot Tool Execution Allowlist
The copilot agent cannot invoke arbitrary Python methods, shell scripts, or operating system calls. Only 10 strongly typed methods are registered:
1. `get_terminal_status`
2. `get_vessel_details`
3. `list_vessels_at_risk`
4. `get_berth_availability`
5. `get_berth_plan`
6. `run_berth_optimization`
7. `run_scenario_simulation`
8. `get_yard_risk_summary`
9. `get_emissions_estimate`
10. `get_data_provenance`

Any other tool invocation request immediately triggers an unauthorized tool error response.

---

## 4. Verification Endpoint

System compliance can be verified at any time via the automated technical audit endpoint:
```http
GET /api/v1/system/audit
```
Sample response verified in live session:
```json
{
  "service": "portos-backend",
  "version": "0.1.0",
  "compliance_verdict": "PASS",
  "security": {
    "secrets_isolated_server_side": true,
    "cors_restricted": true,
    "traceback_masked_in_responses": true,
    "file_upload_max_size_bytes": 10485760,
    "formula_injection_defense_active": true,
    "path_traversal_sanitization_active": true,
    "sql_parameterization_enforced": true,
    "prompt_injection_guard_active": true,
    "physical_equipment_control_permitted": false,
    "navigational_clearance_issuance_permitted": false
  }
}
```
