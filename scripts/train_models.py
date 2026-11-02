#!/usr/bin/env python3
"""PORTOS AI — Machine Learning Model Training & Artifact Generation.

Trains:
1. Vessel ETA Delay Regressor (GradientBoostingRegressor)
2. Vessel Delay-Risk Classifier (GradientBoostingClassifier)
3. Evaluates models against baselines and writes metadata to JSON.
"""

import sys
import os

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.ml.train import train_and_evaluate_models


def main():
    print("=" * 60)
    print("  PORTOS AI — ML Training & Evaluation Pipeline")
    print("=" * 60)
    print("Training synthetic models with random_seed=42...")

    results = train_and_evaluate_models()

    print("\n--- Regression Results (Target: arrival_delay_hours) ---")
    reg = results.get("regression_metrics", {})
    print(f"  • Model Type: {reg.get('model_type')}")
    print(f"  • MAE: {reg.get('mae_hours')} hrs (Baseline: {reg.get('baseline_median_mae_hours')} hrs)")
    print(f"  • RMSE: {reg.get('rmse_hours')} hrs")
    print(f"  • R² Score: {reg.get('r2_score')}")
    print(f"  • Beats Baseline: {reg.get('beats_baseline')}")

    print("\n--- Classification Results (Target: is_delayed_high_risk) ---")
    clf = results.get("classification_metrics", {})
    print(f"  • Model Type: {clf.get('model_type')}")
    print(f"  • Accuracy: {clf.get('accuracy') * 100:.1f}% (Baseline: {clf.get('baseline_accuracy') * 100:.1f}%)")
    print(f"  • Precision: {clf.get('precision') * 100:.1f}%")
    print(f"  • Recall: {clf.get('recall') * 100:.1f}%")
    print(f"  • F1 Score: {clf.get('f1_score') * 100:.1f}%")
    print(f"  • Beats Baseline: {clf.get('beats_baseline')}")

    print("\n" + "=" * 60)
    print("  Artifacts generated in backend/app/ml/artifacts/")
    print("=" * 60)


if __name__ == "__main__":
    main()

