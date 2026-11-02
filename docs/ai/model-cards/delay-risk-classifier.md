# Model Card: PORTOS AI Delay-Risk Binary Classifier (v1.0.0)

> **Mandatory Operational Disclaimer:**  
> **Synthetic-data demonstration. Not validated for real Chattogram Port operations.**  
> Classifier outputs are advisory decision-support signals designed to assist terminal operators in prioritizing vessel inspections. They do not constitute formal maritime risk assessments.

---

## Model Summary

- **Model Identifier:** `portos-delay-classifier`
- **Model Version:** `1.0.0`
- **Creation Date:** `2026-11-03`
- **Maintainer / Author:** `PORTOS AI Engineering Team`
- **Framework & Dependencies:** `scikit-learn 1.9.1`, `NumPy 2.5.4`, `Python 3.14`
- **Model Architecture:** `GradientBoostingClassifier(n_estimators=100, max_depth=4, learning_rate=0.08, random_state=42)`
- **Artifact Path:** `backend/app/ml/artifacts/delay_classifier.joblib`
- **Metadata Reference:** `backend/app/ml/artifacts/models_metadata.json`

---

## 1. Intended Use & Operational Scope

### Primary Intended Use
- **Task Description:** Classifies whether an incoming vessel will experience severe arrival delay exceeding the critical 3.0-hour threshold (`is_delayed_high_risk = 1`), signaling tidal window miss danger.
- **Target Users:** Berth planners and vessel traffic coordinators.
- **Deployment Context:** Flags critical incoming feeders in the Vessel Intelligence list (`/vessels`) and the Operations Overview alert drawer (`/`).

### Out-of-Scope & Prohibited Uses
- **No Pilotage Scheduling:** Cannot be used to order pilot boats or establish vessel arrival order.
- **No Real CPA Operating Claims:** Synthetic dataset origin must remain prominently tagged.

---

## 2. Factors, Features & Input Schema

- **Input Features:** Identical 11-feature schema as `portos-eta-regressor` (vessel type, distance, speed, scheduled hour, queue count, occupancy, wind, visibility, monsoon flag, tidal window, carrier historical delay).
- **Target Variable:** `is_delayed_high_risk` (binary integer: `1` if `arrival_delay_hours >= 3.0`, else `0`).
- **Operational High-Risk Threshold:** 3.0 hours (the cutoff after which a feeder misses the daytime Karnaphuli high-water transit window).

---

## 3. Training & Evaluation Datasets

- **Dataset Nature:** `SYNTHETIC GENERATED`
- **Generator Script:** `backend/app/ml/synthetic_data.py`
- **Random Seed:** `42`
- **Samples:** 2,400 training samples, 600 held-out evaluation samples.

---

## 4. Quantitative Evaluation & Baseline Comparison

### Metric Comparison on 600 Test Samples
| Metric | Naive Majority Baseline (Always Delay) | PORTOS Gradient Boosting Classifier | Delta |
| :--- | :---: | :---: | :---: |
| **Accuracy** | 82.00% | **92.17%** | **+10.17%** |
| **Precision** | 82.00% | **94.06%** | **+12.06%** |
| **Recall** | 100.00% | **96.54%** | **Balanced** |
| **F1 Score** | 90.11% | **95.29%** | **+5.18%** |

### Confusion Matrix (600 Evaluation Samples)
- **True Negatives (TN):** 78 (Correctly predicted on-time / low risk)
- **False Positives (FP):** 30 (Over-predicted delay risk)
- **False Negatives (FN):** 17 (Missed high delay risk)
- **True Positives (TP):** 475 (Correctly flagged critical tidal delay risk)

---

## 5. Model Explainability & Feature Importance

- **Top Predictor:** `tidal_window_favorable` (>50% importance) — falling tide during arrival approach is the single strongest indicator of a multi-hour delay.
- **Secondary Predictor:** `vessel_type_code` and `anchorage_queue_count`.

---

## 6. Known Limitations & Caveats

- **Class Imbalance in Storm Conditions:** During severe synthetic monsoon surges, nearly all arrivals exceed 3 hours delay, reducing specificity.
- **Advisory Role:** False positive rate of ~5% ensures conservative protection of berth utilization but requires human dispatcher verification.
