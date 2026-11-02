# Model Card: PORTOS AI Yard Occupancy & Congestion Forecaster (v1.0.0)

> **Mandatory Operational Disclaimer:**  
> **Synthetic-data demonstration. Not validated for real Chattogram Port operations.**  
> Container yard dwell times, gate transactions, and block densities are modeled parametrically. Yard occupancy forecasts are advisory and intended for spatial decision support.

---

## Model Summary

- **Model Identifier:** `portos-yard-forecaster`
- **Model Version:** `1.0.0`
- **Creation Date:** `2026-11-03`
- **Maintainer / Author:** `PORTOS AI Engineering Team`
- **Framework & Dependencies:** `scikit-learn 1.9.1`, `NumPy 2.5.4`, `Python 3.14`
- **Model Architecture:** `GradientBoostingRegressor(n_estimators=65, learning_rate=0.08, max_depth=3, random_state=42)`
- **Service Integration:** `backend/app/yard/forecaster.py` (`YardOccupancyMLPipeline`)
- **API Endpoint:** `GET /api/v1/yard/blocks/{block_id}/forecast` & `GET /api/v1/yard/summary`

---

## 1. Intended Use & Operational Scope

### Primary Intended Use
- **Task Description:** Projects block-level container yard density (`occupancy_pct`) across 6-hour, 12-hour, and 24-hour planning horizons.
- **Target Users:** Terminal yard planners, gate supervisors, and equipment dispatchers.
- **Deployment Context:** Drives the Yard Intelligence Congestion Heatmap (`/yard`), highlighting blocks trending toward the 85% congestion threshold before bottlenecks paralyze quayside crane transfer.

### Out-of-Scope & Prohibited Uses
- **No Autonomous Equipment Dispatch:** Does not issue automated movement instructions to rubber-tyred gantry (RTG) cranes or reach stackers.
- **No Real CPA Operating Claims:** Synthetic dwell time models do not reflect actual Chattogram customs clearance delays or auction container backlogs.

---

## 2. Factors, Features & Input Schema

### Input Features
| Feature Index | Feature Name | Data Type | Physical Unit | Description | Ingestion Source |
| :---: | :--- | :--- | :--- | :--- | :--- |
| 0 | `current_occupancy_pct` | Float | Percentage (0–100%) | Current container slot utilization ratio | Yard Inventory / Digital Twin |
| 1 | `zone_code` | Integer (0–3) | Categorical | 0: IMPORT, 1: EXPORT, 2: REEFER, 3: EMPTY | Terminal Yard Layout |
| 2 | `horizon_hrs` | Integer (6, 12, 24) | Hours | Forecast projection window | Dispatcher Query Parameter |
| 3 | `hour_of_day` | Integer (0–23) | Hours (BST) | Target time of day in Asia/Dhaka time | System Clock |
| 4 | `recent_trend_slope` | Float | TEU / Hour | Derivative of TEU changes over last 4 observation cycles | Telemetry Rolling Window |
| 5 | `scheduled_vessel_moves` | Integer (0–80) | Moves / Hour | Expected crane discharges/loadings targeting this sector | Berth Allocation Schedule |

### Target Definition
- **Target Variable:** `future_occupancy_pct` (continuous float, bounded $[5.0\%, 99.5\%]$).
- **Definition:** Expected percentage capacity utilization of the yard block at $T + \Delta H$ hours.

---

## 3. Training & Evaluation Datasets

- **Dataset Nature:** `SYNTHETIC GENERATED`
- **Generator Method:** `YardOccupancyMLPipeline._generate_synthetic_training_corpus()`
- **Deterministic Seed:** `42`
- **Corpus Size:** 1,200 synthetic terminal transition cycles simulating diurnal gate pickup cycles, pre-cutoff export aggregation, and reefer holding dwell times.
- **Split:** 80/20 train/test evaluation split.

---

## 4. Quantitative Evaluation & Baseline Comparison

| Metric | Persistence Baseline (No Change) | PORTOS Gradient Boosting Forecaster | Delta / Improvement |
| :--- | :---: | :---: | :---: |
| **Mean Absolute Error (MAE)** | 6.46% | **2.59%** | **-59.9% Error Reduction** |
| **Evaluation Date** | 2026-11-03 | 2026-11-03 | Measured in live session |

---

## 5. Model Explainability & Dynamics

1. **Gate Diurnal Curve:** Heavy gate pickup between 08:00 and 18:00 drives steady import block reduction.
2. **Vessel Inflow Impact:** Quayside discharge moves disproportionately load Import and Reefer sectors.
3. **Reefer Dwell Elasticity:** Reefer cargo has slower gate clearance cycles (customs inspection friction), leading to higher persistent density.
4. **Mean-Reverting Constraint:** Physical block capacity limits prevent unrealistic runaway stacking beyond 100%.

---

## 6. Known Limitations & Caveats

- **Off-Dock Depot Dynamics:** In real Chattogram operations, empty containers and certain import boxes are transferred to 19+ Inland Container Depots (ICDs). The current prototype models only quayside and main terminal blocks.
- **Customs Holds:** Unannounced regulatory customs freezes are treated as synthetic noise rather than explicit policy events.
- **Advisory Decision Support:** Recommended block diversions require operator review.

