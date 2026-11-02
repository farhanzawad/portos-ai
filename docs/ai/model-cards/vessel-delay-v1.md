# Model Card: PORTOS AI Vessel Delay & ETA Ensemble (v1.0.0)

> **Mandatory Operational Disclaimer:**  
> **Synthetic-data demonstration. Not validated for real Chattogram Port operations.**  
> All training data and evaluation records were generated parametrically to simulate Karnaphuli river approach dynamics. Model outputs are strictly advisory decision-support proposals and must never be used for navigational safety or autonomous vessel piloting.

---

## Model Summary

- **Model Identifier:** `portos-vessel-delay-ensemble`
- **Model Version:** `1.0.0`
- **Creation Date:** `2026-11-03`
- **Maintainer / Author:** `PORTOS AI Engineering Team`
- **Framework & Dependencies:** `scikit-learn 1.9.1`, `NumPy 2.5.4`, `pandas 3.1.0`, `Python 3.14`
- **Model Architectures:**
  1. **ETA Delay Regressor:** `GradientBoostingRegressor(n_estimators=120, max_depth=4, learning_rate=0.08)`
  2. **High-Risk Delay Classifier:** `GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.08)`
- **Artifact Locations:**
  - `backend/app/ml/artifacts/eta_regressor.joblib`
  - `backend/app/ml/artifacts/delay_classifier.joblib`
  - `backend/app/ml/artifacts/models_metadata.json`

---

## 1. Intended Use & Operational Scope

### Primary Intended Use
- **Task Description:** Estimates vessel arrival delay in decimal hours relative to declared carrier ETA (`arrival_delay_hours`) and classifies whether a vessel will encounter critical delay exceeding the 3.0-hour threshold (`is_delayed_high_risk`).
- **Target Users:** Terminal berth planners, traffic coordinators, and optimization algorithms (Google OR-Tools CP-SAT scheduler).
- **Deployment Context:** Integrated into the PORTOS AI Decision Lab, Vessel Intelligence, and Berth Planner APIs to flag high-risk feeder delays before allocating tidal berths.

### Out-of-Scope & Prohibited Uses
- **No Navigational Clearance:** This model must never authorize vessel maneuvering, pilot boarding, or channel entry.
- **No Real-World CPA Operating Claims:** Predictions must not be represented as verified for real Chattogram Port Authority (CPA) assets without certified real AIS/TOS integrations.
- **No Autonomous Action:** Model outputs are purely advisory proposals requiring human confirmation.

---

## 2. Factors, Features & Input Schema

### Input Features
| Feature Name | Data Type | Physical Unit | Description | Ingestion Source |
| :--- | :--- | :--- | :--- | :--- |
| `vessel_type_code` | Integer (0-3) | Categorical | 0: Feeder, 1: Bulk, 2: General Cargo, 3: Tanker | Vessel Manifest |
| `distance_to_pilot_nm` | Float | Nautical Miles | Distance remaining to Karnaphuli pilot station | Simulated AIS Track |
| `speed_knots` | Float | Knots | Current speed over ground | Simulated AIS Track |
| `scheduled_hour_of_day` | Integer (0-23) | Hours (BST) | Scheduled hour of arrival in Asia/Dhaka time | Carrier ETA Notice |
| `anchorage_queue_count` | Integer | Vessels | Current count of vessels awaiting in outer anchorage | Port Telemetry State |
| `berth_occupancy_ratio` | Float | Ratio [0-1] | Current terminal berth occupancy ratio | Terminal Layout State |
| `wind_speed_knots` | Float | Knots | Local Karnaphuli approach wind speed | Weather Observation |
| `visibility_nm` | Float | Nautical Miles | Local atmospheric visibility | Weather Observation |
| `is_monsoon_season` | Integer (0/1) | Boolean Flag | 1 if arrival falls in June–September | Temporal Feature |
| `tidal_window_favorable` | Integer (0/1) | Boolean Flag | 1 if arrival coincides with high-water tidal window | Hydrographic Table |
| `carrier_historical_delay_mean` | Float | Hours | Carrier line schedule reliability historical deviation | Historical Database |

### Target Definitions
1. **Regression Target (`arrival_delay_hours`):** Continuous delay in decimal hours relative to declared carrier ETA.
2. **Classification Target (`is_delayed_high_risk`):** Binary label (`1` if `arrival_delay_hours >= 3.0` hours, else `0`).

---

## 3. Training & Evaluation Datasets

### Data Provenance
- **Dataset Nature:** `SYNTHETIC GENERATED`
- **Synthetic Data Generator:** `backend/app/ml/synthetic_data.py`
- **Random Seed:** `42` (Fixed for full reproducibility)
- **Total Record Count:** 3,000 synthetic voyage records (2,400 train, 600 test)
- **Train/Test Splitting:** Stratified 80/20 train/test split preventing data leakage across voyage groups.

---

## 4. Quantitative Evaluation & Baseline Comparison

### Regression Performance (ETA Delay Hours)
| Model | MAE (hours) | RMSE (hours) | $R^2$ Score | MAE Improvement vs Baseline |
| :--- | :---: | :---: | :---: | :---: |
| **Naive Median Baseline** | 2.737 | 3.245 | -0.002 | — (Reference) |
| **PORTOS Gradient Boosting** | **0.846** | **1.090** | **0.887** | **+69.1% Reduction** |

### Classification Performance (High-Risk Delay $\ge 3.0$ Hours)
| Metric | Naive Majority Baseline | PORTOS Gradient Boosting |
| :--- | :---: | :---: |
| **Accuracy** | 0.820 | **0.922** |
| **Precision** | 0.000 (No minority pred) | **0.941** |
| **Recall** | 0.000 | **0.965** |
| **F1 Score** | 0.000 | **0.953** |

### Confusion Matrix (600 Held-Out Test Samples)
- **True Negatives (TN):** 78
- **False Positives (FP):** 30
- **False Negatives (FN):** 17
- **True Positives (TP):** 475

### Top Feature Importances
1. `tidal_window_favorable`: **55.0%** (Primary driver of draft constraint waiting in Chattogram)
2. `vessel_type_code`: **14.6%** (Bulk carriers vs. container feeder draft variance)
3. `anchorage_queue_count`: **10.1%** (Outer anchorage congestion queue backlog)
4. `carrier_historical_delay_mean`: **7.9%** (Carrier schedule fidelity)
5. `speed_knots`: **6.7%** (Speed deficit relative to transit plan)

---

## 5. Limitations & Ethical Considerations

- **Synthetic Domain Adaptation Gap:** While relationships reflect actual Karnaphuli hydrography (shallow draft depths, semidiurnal tides, monsoon squalls), model coefficients are calibrated on synthetic distributions and must be re-fitted on certified CPA historical manifests prior to operational pilot trials.
- **Uncertainty Reporting:** Predictions include confidence tier classifications (`NORMAL`, `WATCH`, `HIGH_RISK`) based on ensemble class probabilities.
- **Data Status Label:** Every output from this model carries an explicit `SIMULATED` tag and the disclaimer banner.

