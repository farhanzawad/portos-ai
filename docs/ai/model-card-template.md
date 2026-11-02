# Model Card Template — PORTOS AI

> **Instructions:** Use this standardized template to document all machine learning and statistical models developed or deployed within PORTOS AI (e.g., Vessel ETA Regression, Delay-Risk Classifier, Yard Occupancy Forecaster). Every deployed model artifact must have a completed model card in `docs/ai/model-cards/<model_name>_v<version>.md`.

---

# Model Card: [Model Name]

**Model Identifier:** `[e.g., eta_regression_gradient_boosting]`  
**Model Version:** `[e.g., 1.0.0]`  
**Creation Date:** `[YYYY-MM-DD]`  
**Maintainer / Author:** `[PORTOS AI Team]`  
**Framework & Dependencies:** `[e.g., scikit-learn 1.5, NumPy, pandas, Python 3.12]`  
**Model Architecture:** `[e.g., HistGradientBoostingRegressor / RandomForestClassifier]`  
**Artifact Location:** `[e.g., backend/app/models/artifacts/eta_gb_v1.0.0.joblib]`

---

## 1. Intended Use & Operational Scope

### Primary Intended Use
- **Task Description:** [Concise statement of what the model predicts, e.g., "Predicts outer anchorage arrival delay in hours relative to declared carrier ETA."]
- **Target Users:** [e.g., Terminal berth planners, traffic coordinators, and decision-support algorithms.]
- **Deployment Context:** [e.g., Integrated into the PORTOS AI Decision Lab and Berth Planner API to flag high-risk vessel delays prior to scheduling.]

### Out-of-Scope & Prohibited Uses
- **No Navigational Clearance:** This model must never be used to authorize vessel navigation, pilot boarding, channel entry, or maritime safety decisions.
- **No Real-World CPA Operating Claims:** Predictions generated from synthetic training datasets must not be represented as validated for real Chattogram Port Authority (CPA) operations.
- **No Autonomous Scheduling:** Model outputs are purely advisory and require human operator review.

---

## 2. Factors, Features & Input Schema

### Input Features
| Feature Name | Data Type | Physical Unit | Description | Ingestion Source |
| :--- | :--- | :--- | :--- | :--- |
| `vessel_type` | Categorical | N/A | Container feeder, general cargo, etc. | Vessel Manifest |
| `distance_to_pilot_nm` | Float | Nautical Miles | Estimated distance remaining to pilot station | AIS / Track Stream |
| `reported_speed_kn` | Float | Knots | Current speed over ground | AIS / Track Stream |
| `historical_carrier_delay_avg` | Float | Hours | Historical average delay for carrier line | Historical Database |
| `outer_anchorage_queue_len` | Integer | Vessels | Count of vessels waiting at anchorage | Terminal State |
| `berth_congestion_factor` | Float | Ratio [0-1] | Current berth occupancy index | Terminal State |
| `weather_severity_index` | Float | Scale [0-5] | Wind/swell disruption score | Scenario Parameter |

### Target Definition & Ground Truth
- **Target Variable:** `[e.g., arrival_delay_hours (continuous float)]`
- **Definition:** `actual_pilot_arrival_timestamp - declared_eta_timestamp` in decimal hours. Negative values indicate early arrivals; positive values indicate delays.

---

## 3. Training & Evaluation Datasets

### Data Provenance
- **Dataset Nature:** `[SYNTHETIC GENERATED | HISTORICAL OBSERVED | HYBRID]`
- **Synthetic Data Generator:** `[e.g., scripts/generate_synthetic_vessel_data.py]`
- **Generator Random Seed:** `[e.g., 42]`
- **Total Record Count:** `[e.g., 5,000 synthetic voyage records]`

### Data Splitting & Leakage Prevention
- **Split Methodology:** Grouped by Voyage / Vessel Call (or chronological train/test split) to prevent voyage-level feature leakage.
- **Training Set:** `[e.g., 70% (3,500 records)]`
- **Validation / Test Set:** `[e.g., 30% (1,500 records)]`

---

## 4. Quantitative Evaluation & Baseline Comparison

### Evaluation Metrics
| Metric | Baseline Model (Median Deviation) | PORTOS AI Model ([Architecture]) | Target Threshold |
| :--- | :--- | :--- | :--- |
| **Mean Absolute Error (MAE)** | `[e.g., 4.82 hrs]` | `[e.g., 1.45 hrs]` | `< 2.0 hrs` |
| **Root Mean Squared Error (RMSE)**| `[e.g., 6.10 hrs]` | `[e.g., 2.12 hrs]` | `< 3.0 hrs` |
| **Coefficient of Determination (R²)**| `[e.g., 0.12]` | `[e.g., 0.81]` | `> 0.75` |
| **Classification Precision (if applicable)**| `[N/A]` | `[e.g., 88.4%]` | `> 80.0%` |
| **Classification Recall (if applicable)**| `[N/A]` | `[e.g., 84.1%]` | `> 80.0%` |

*Evaluation date:* `[YYYY-MM-DD]`  
*Execution environment:* `[Local CPU, Python 3.12, scikit-learn 1.5]`

---

## 5. Model Explainability & Feature Importance

- **Top Predictors:**
  1. `[e.g., outer_anchorage_queue_len (34% relative importance)]`
  2. `[e.g., weather_severity_index (28% relative importance)]`
  3. `[e.g., reported_speed_kn (18% relative importance)]`
- **Method:** `[e.g., Permutation Feature Importance / Tree MDI]`

---

## 6. Known Limitations & Caveats

> [!WARNING]
> **Synthetic Validation Caveat:**
> This model was trained and evaluated solely on synthetic scenario data. Its evaluation metrics validate the integrity of the data and machine learning pipeline, **not** real-world operational performance at Chattogram Port.

- **Sensitivity to Weather Spikes:** Extreme weather shocks outside the training range can lead to underestimation of delays.
- **Tidal Discontinuities:** Feeder arrivals requiring specific tidal heights may exhibit step-function delays not fully captured by linear feature interactions.
- **Cold-Start for New Carriers:** Carriers without historical delay records revert to fleet-wide median defaults.

---

## 7. Ethical, Operational & Safety Safeguards

1. **Human-in-the-Loop:** All schedule modifications suggested from this model must be approved by an authorized terminal planner.
2. **Transparent Confidence Intervals:** When displaying predictions, the UI must show standard error margins (e.g., `± 1.2 hrs`) and link directly to this Model Card.
3. **Audit Trail:** Inferences are permanently stamped with `model_name`, `model_version`, and `SIMULATED` status.

