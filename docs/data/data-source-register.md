# PORTOS AI — Operational Data Source Register

**Document ID:** `DATA-REG-001`  
**Revision:** 1.0.0 (Milestone 17 Package)  
**Date:** 2026-11-03  
**Status:** Audited and Verified

---

## 1. Register Overview

This register documents all public datasets, official authority publications, standardized engineering conversion frameworks, and synthetic calibration corpuses utilized by PORTOS AI.

In accordance with Blue AI Challenge governance:
- **Only** data sources and reference standards that were actually ingested or referenced in model formulations are listed.
- Real-world sources provide structural benchmarks, geographic layouts, and emissions factors; all operational movements are labeled `SIMULATED` or `DERIVED`.

---

## 2. Ingested & Referenced Data Sources

### Source 1: Chattogram Port Authority (CPA) Berthing & Tidal Publication
- **Source Identifier:** `SRC-CPA-TIDES-2026`
- **Origin Organization:** Chattogram Port Authority (CPA) / Hydrography Department
- **Source Reference URL:** [https://cpa.gov.bd/site/page/87e07662-3c22-498c-8c0c-7b00bfd21ebc/Tide-Table](https://cpa.gov.bd/site/page/87e07662-3c22-498c-8c0c-7b00bfd21ebc/Tide-Table)
- **Access Terms / License:** Public Government Portal Information (Official Publication)
- **Ingestion Date:** 2026-11-02
- **Fields & Parameters Used:**
  - High-water and low-water datum offsets (meters relative to Chart Datum).
  - Semi-diurnal tidal cycle frequency (~12.4 hours).
  - Maximum permissible fairway draft rules (8.5m – 9.5m draft limits depending on spring/neap tide phase).
  - Berth coordinate benchmarks for CCT (Chattogram Container Terminal) and NCT (New Mooring Container Terminal).

---

### Source 2: Global Logistics Emissions Council (GLEC) Framework v3.0
- **Source Identifier:** `SRC-GLEC-EMISSIONS-2023`
- **Origin Organization:** Smart Freight Centre
- **Source Reference URL:** [https://www.smartfreightcentre.org/en/how-to-implement-glec-framework/](https://www.smartfreightcentre.org/en/how-to-implement-glec-framework/)
- **Access Terms / License:** Open Industry Standard for Freight GHG Accounting
- **Ingestion Date:** 2026-11-02
- **Fields & Parameters Used:**
  - Container feeder marine gas oil (MGO) auxiliary engine fuel consumption rates (MT/day during hoteling).
  - Well-to-Wake (WTW) CO2e emission factors ($3,206\text{ g CO}_2\text{e / kg fuel}$).
  - SOx emission factors ($0.002\text{ kg SO}_x\text{ / kg fuel}$ for 0.10% sulfur MGO).
  - NOx emission factors ($0.057\text{ kg NO}_x\text{ / kg fuel}$ for Tier II marine diesels).
  - Bangladesh national electricity grid carbon intensity factor ($0.612\text{ kg CO}_2\text{e / kWh}$ for STS crane electric consumption).

---

### Source 3: IMO Fourth GHG Study (2020)
- **Source Identifier:** `SRC-IMO-GHG-STUDY4`
- **Origin Organization:** International Maritime Organization (IMO)
- **Source Reference URL:** [https://www.imo.org/en/OurWork/Environment/Pages/Fourth-IMO-GHG-Study-2020.aspx](https://www.imo.org/en/OurWork/Environment/Pages/Fourth-IMO-GHG-Study-2020.aspx)
- **Access Terms / License:** Public Intergovernmental Maritime Report
- **Ingestion Date:** 2026-11-02
- **Fields & Parameters Used:**
  - Container feeder deadweight tonnage (DWT) brackets (5,000 to 25,000 DWT).
  - Auxiliary engine electrical load profiles at berth (hoteling baseline: 450 kW; reefer monitoring load: 2.5 kW/reefer TEU).

---

### Source 4: OpenStreetMap Maritime & Coastal Features
- **Source Identifier:** `SRC-OSM-CHATTOGRAM-COAST`
- **Origin Organization:** OpenStreetMap Foundation
- **Source Reference URL:** [https://www.openstreetmap.org](https://www.openstreetmap.org)
- **Access Terms / License:** Open Database License (ODbL)
- **Attribution Displayed:** `© OpenStreetMap contributors` (prominently credited on MapLibre GL maps)
- **Fields & Parameters Used:**
  - Karnaphuli river fairway shoreline polygons.
  - Kutubdia outer anchorage channel approach geometry.
  - Quayside jetty alignment coordinates.

---

### Source 5: Synthetic Port Calibration Corpus (PORTOS Generator)
- **Source Identifier:** `SRC-SYNTHETIC-CORPUS-SEED42`
- **Generator Script:** `backend/app/ml/synthetic_data.py` & `backend/app/yard/forecaster.py`
- **Random Seed:** `42` (Fixed for complete determinism)
- **Status:** `SIMULATED`
- **Total Records:**
  - 3,000 synthetic vessel voyage records (for ETA regression and classification).
  - 1,200 yard block state observations (for yard density forecasting).
  - 12 baseline vessels, 6 berths, 5 equipment units, and 12 yard blocks.

---

## 3. Disclosed Unused Data Sources

The following sources were considered during preliminary research but are **explicitly excluded** from the prototype:
- Live commercial satellite AIS feeds (e.g., MarineTraffic, Spire, exactEarth) — omitted to ensure zero external subscription costs and complete offline evaluation capability.
- NBR ASYCUDA Customs Database — omitted due to lack of public API access and data confidentiality rules.
- Live CPA TOS databases — omitted in compliance with security guidelines prohibiting unverified network connections.

