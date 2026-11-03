# Public Bangladesh Government & Chattogram Port Authority (CPA) Datasets

**Provenance Reference:** `GOV-DATA-PUB-2026`  
**Applicability:** PORTOS AI Decision Support System & Port Data Bridge Integration  
**Legal Classification:** Public Administrative Reports & Official Maritime Authority Publications  

---

## 1. Summary of Public Datasets

| File Name | Official Source / Origin Authority | Primary Purpose | Status Tag |
| :--- | :--- | :--- | :--- |
| `cpa_tide_circular_2026.csv` | **Chattogram Port Authority (CPA)** — Hydrography Department | Official 30-day tide tables, Karnaphuli fairway astronomical heights, and permissible draft limits (8.5m – 9.5m). | `OBSERVED` / `DERIVED` |
| `cpa_berth_specifications_2026.csv` | **Chattogram Port Authority (CPA)** — Traffic & Marine Operations | Official container berth dimensions, design depths, crane rail gauge, and LOA boundaries for CCT & NCT. | `OBSERVED` |
| `bmd_patenga_marine_bulletin_2026.csv` | **Bangladesh Meteorological Department (BMD)** — Storm Warning Centre | Patenga coastal weather bulletins, maritime warning signals (Signal 1–10), and port operations impact levels. | `OBSERVED` |
| `cpa_annual_statistics_2025.csv` | **Chattogram Port Authority (CPA)** — Planning & Statistics Department | Historical annual container throughput (TEU), turnaround times, and berth productivity benchmarks. | `OBSERVED` |
| `cpa_sample_berthing_log.csv` | **CPA Operational Shipping Lineup Format** | Verified operational feed sample for Port Data Bridge staging, data cleansing, and human review. | `DERIVED` |

---

## 2. Navigational Rules & Operational Constraints Grounded in CPA Circulars

1. **Gupta Bend & Outer Bar Limits:**
   - Vessels with length overall (LOA) exceeding $175.0\text{ m}$ or draft exceeding $8.50\text{ m}$ are restricted to daylight high water slack navigation with authorized CPA pilotage.
   - Spring tides permit maximum drafts up to $9.50\text{ m}$; neap tides restrict drafts to $8.50\text{ m} - 8.80\text{ m}$.
2. **Berth Rail Gauge Compatibility:**
   - CCT (Berths 1–3) and NCT (Berths 1–5) feature standard $30.48\text{ m}$ crane rail gauges equipped for ship-to-shore (STS) gantry operations.
   - General Cargo Berths (GCB) rely on vessel geared cranes or mobile harbor equipment.
3. **BMD Maritime Warning Response:**
   - Hoisting of BMD Local Cautionary Signal No. 3 or higher mandates immediate suspension of outer anchorage lighterage operations at Kutubdia and Karnaphuli approaches.

---

## 3. Disclaimers & Advisory Role

- These datasets represent published government benchmarks and circular standards.
- In compliance with PORTOS AI operational truthfulness guidelines, PORTOS AI acts solely in an advisory decision-support capacity. No real-world navigational clearances or physical control actions are executed.

