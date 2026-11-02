# Model Card: PORTOS AI Vessel ETA Delay Regressor (v1.0.0)

> **Mandatory Operational Disclaimer:**  
> **Synthetic-data demonstration. Not validated for real Chattogram Port operations.**  
> All training and validation datasets were synthetically generated to model Karnaphuli river approach dynamics. Model outputs are strictly advisory decision-support proposals and must never be used for navigational clearance, pilot dispatch, or autonomous maneuvering.

---

## Model Summary

- **Model Identifier:** `portos-eta-regressor`
- **Model Version:** `1.0.0`
- **Creation Date:** `2026-11-03`
- **Maintainer / Author:** `PORTOS AI Engineering Team`
- **Framework & Dependencies:** `scikit-learn 1.9.1`, `NumPy 2.5.4`, `Python 3.14`
- **Model Architecture:** `GradientBoostingRegressor(n_estimators=120, max_depth=4, learning_rate=0.08, random_state=42)`
- **Artifact Path:** `backend/app/ml/artifacts/eta_regressor.joblib`
- **Metadata Reference:** `backend/app/ml/artifacts/models_metadata.json`

---

## 1. Intended Use & Operational Scope

### Primary Intended Use
- **Task Description:** Estimates continuous vessel arrival delay in decimal hours relative to declared carrier ETA (`arrival_delay_hours`).
- **Target Users:** Terminal berth planners, traffic coordinators, and optimization algorithms (Google OR-Tools CP-SAT).
- **Deployment Context:** Integrated into the Vessel Intelligence (`/vessels`), Decision Lab (`/scenario-lab`), and Berth Planner (`/berth-planner`) to flag arrivals vulnerable to tidal window closures before assigning berths.

### Out-of-Scope & Prohibited Uses
- **No Navigational Clearance:** Never authorize vessel movement, channel entry, or fairway transit.
- **No Real CPA Operating Claims:** Predictions must not be cited as verified for actual Chattogram Port operations without certified live TOS/AIS integrations.
- **No Autonomous Action:** Outputs are strictly advisory and require human confirmation.

---

## 2. Factors, Features & Input Schema

### Input Features
| Feature Name | Data Type | Physical Unit | Description | Ingestion Source |
| :--- | :--- | :--- | :--- | :--- |
| `vessel_type_code` | Integer (0–3) | Categorical | 0: Feeder, 1: Bulk, 2: General Cargo, 3: Tanker | Vessel Manifest |
| `distance_to_pilot_nm` | Float | Nautical Miles | Estimated distance remaining to pilot station | AIS Track Stream |
| `speed_knots` | Float | Knots | Speed over ground | AIS Track Stream |
| `scheduled_hour_of_day` | Integer (0–23) | Hours (BST) | Scheduled arrival hour in Asia/Dhaka time | Carrier ETA Notice |
| `anchorage_queue_count` | Integer | Vessels | Count of vessels waiting at Kutubdia/Outer Anchorage | Port Telemetry State |
| `berth_occupancy_ratio` | Float | Ratio [0–1] | Current terminal berth occupancy index | Terminal Layout State |
| `wind_speed_knots` | Float | Knots | Karnaphuli approach wind speed | Meteorological Sensor |
| `visibility_nm` | Float | Nautical Miles | Atmospheric visibility | Meteorological Sensor |
| `is_monsoon_season` | Integer (0/1) | Boolean | 1 if arrival falls between June and September | Temporal Calendar |
| `tidal_window_favorable` | Integer (0/1) | Boolean | 1 if arrival coincides with high-water fairway window | Hydrographic Table |
| `carrier_historical_delay_mean` | Float | Hours | Carrier line schedule reliability historical deviation | Historical Database |

### Target Definition
- **Target Variable:** `arrival_delay_hours` (continuous float).
- **Definition:** `actual_pilot_arrival_timestamp - declared_carrier_eta_timestamp` in decimal hours.

---

## 3. Training & Evaluation Datasets

- **Dataset Nature:** `SYNTHETIC GENERATED`
- **Generator Script:** `backend/app/ml/synthetic_data.py`
- **Deterministic Seed:** `42`
- **Sample Distribution:** 3,000 synthetic voyage records (2,400 training samples, 600 held-out evaluation samples).
- **Splitting Strategy:** Stratified 80/20 train/test split.

---

## 4. Quantitative Evaluation & Baseline Comparison

| Metric | Naive Median Baseline | PORTOS Gradient Boosting Regressor | Delta / Improvement |
| :--- | :---: | :---: | :---: |
| **Mean Absolute Error (MAE)** | 2.737 hrs | **0.846 hrs** | **-69.08% Error Reduction** |
| **Root Mean Squared Error (RMSE)** | 3.245 hrs | **1.090 hrs** | **-66.41% Error Reduction** |
| **$R^2$ Score** | -0.002 | **0.887** | **+0.889 Variance Explained** |

---

## 5. Model Explainability & Feature Importance

1. `tidal_window_favorable`: **54.97%** (Dominant factor: draft-constrained vessels must hold at outer anchorage for high tide)
2. `vessel_type_code`: **14.57%** (Feeder drafts allow broader transit windows than deep-draft bulkers)
3. `anchorage_queue_count`: **10.05%** (Pilotage bottleneck during high-tide entry convoys)
4. `carrier_historical_delay_mean`: **7.86%** (Liner reliability variance)
5. `speed_knots`: **6.68%** (Transit time compensation capacity)

---

## 6. Known Limitations & Caveats

- **Synthetic Calibration:** Trained on synthetic parametric equations; real Chittagong tidal currents and monsoon cyclonic depressions exhibit higher non-linear variances.
- **Fairway Draft Step Function:** Extreme low-water spring tides cause non-continuous wait times that linear tree splits approximate piecewise.
- **Advisory Role:** Decisions based on these predictions must be confirmed by human berthing officers.

