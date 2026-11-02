"""Model Training and Evaluation Pipeline for PORTOS AI.

Trains:
1. ETA Regression Model (GradientBoostingRegressor) predicting arrival_delay_hours.
2. Delay Risk Classification Model (GradientBoostingClassifier) predicting is_delayed_high_risk.

Compares against transparent baselines:
- Regression: Median delay baseline
- Classification: Majority class baseline
"""

import os
import json
from datetime import datetime, timezone
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.dummy import DummyRegressor, DummyClassifier
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix,
)

from app.ml.synthetic_data import (
    generate_synthetic_vessel_data,
    FEATURE_COLUMNS,
    TARGET_REGRESSION,
    TARGET_CLASSIFICATION,
    HIGH_RISK_DELAY_THRESHOLD_HOURS,
)

ARTIFACTS_DIR = Path(__file__).resolve().parent / "artifacts"


def train_and_evaluate_models(
    n_samples: int = 3000,
    random_seed: int = 42,
    output_dir: Path = ARTIFACTS_DIR,
) -> dict:
    """Train regression and classification models, calculate metrics, and save artifacts."""
    output_dir.mkdir(parents=True, exist_ok=True)

    # 1. Generate Synthetic Grounded Dataset
    df = generate_synthetic_vessel_data(n_samples=n_samples, random_seed=random_seed)

    X = df[FEATURE_COLUMNS]
    y_reg = df[TARGET_REGRESSION]
    y_clf = df[TARGET_CLASSIFICATION]

    # 2. Train/Test Split (80% Train, 20% Held-out Test)
    X_train, X_test, y_reg_train, y_reg_test, y_clf_train, y_clf_test = train_test_split(
        X, y_reg, y_clf, test_size=0.20, random_state=random_seed, stratify=y_clf
    )

    # -------------------------------------------------------------
    # 3. Model 1: ETA Regression (GradientBoostingRegressor)
    # -------------------------------------------------------------
    # Baseline: Median Delay Dummy Regressor
    baseline_reg = DummyRegressor(strategy="median")
    baseline_reg.fit(X_train, y_reg_train)
    baseline_reg_preds = baseline_reg.predict(X_test)
    baseline_mae = float(mean_absolute_error(y_reg_test, baseline_reg_preds))
    baseline_rmse = float(root_mean_squared_error(y_reg_test, baseline_reg_preds))

    # Candidate Model: GradientBoostingRegressor
    model_reg = GradientBoostingRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        random_state=random_seed,
    )
    model_reg.fit(X_train, y_reg_train)
    reg_preds = model_reg.predict(X_test)

    reg_mae = float(mean_absolute_error(y_reg_test, reg_preds))
    reg_rmse = float(root_mean_squared_error(y_reg_test, reg_preds))
    reg_r2 = float(r2_score(y_reg_test, reg_preds))
    mae_improvement_pct = round(((baseline_mae - reg_mae) / baseline_mae) * 100, 2)

    # -------------------------------------------------------------
    # 4. Model 2: Delay Risk Classification (GradientBoostingClassifier)
    # -------------------------------------------------------------
    # Baseline: Majority Class Classifier
    baseline_clf = DummyClassifier(strategy="most_frequent")
    baseline_clf.fit(X_train, y_clf_train)
    baseline_clf_preds = baseline_clf.predict(X_test)
    baseline_acc = float(accuracy_score(y_clf_test, baseline_clf_preds))

    # Candidate Model: GradientBoostingClassifier
    model_clf = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.08,
        random_state=random_seed,
    )
    model_clf.fit(X_train, y_clf_train)
    clf_preds = model_clf.predict(X_test)
    clf_probs = model_clf.predict_proba(X_test)[:, 1]

    clf_acc = float(accuracy_score(y_clf_test, clf_preds))
    clf_prec = float(precision_score(y_clf_test, clf_preds, zero_division=0))
    clf_rec = float(recall_score(y_clf_test, clf_preds, zero_division=0))
    clf_f1 = float(f1_score(y_clf_test, clf_preds, zero_division=0))
    cm = confusion_matrix(y_clf_test, clf_preds).tolist()

    # 5. Feature Importances
    reg_importances = dict(
        zip(FEATURE_COLUMNS, [round(float(x), 4) for x in model_reg.feature_importances_])
    )
    clf_importances = dict(
        zip(FEATURE_COLUMNS, [round(float(x), 4) for x in model_clf.feature_importances_])
    )

    # Sort importances descending
    sorted_reg_importances = dict(sorted(reg_importances.items(), key=lambda item: item[1], reverse=True))

    # 6. Save Model Artifacts
    reg_path = output_dir / "eta_regressor.joblib"
    clf_path = output_dir / "delay_classifier.joblib"
    joblib.dump(model_reg, reg_path)
    joblib.dump(model_clf, clf_path)

    # 7. Compile Comprehensive Metadata Report
    metadata = {
        "model_name": "portos-vessel-delay-ensemble",
        "model_version": "1.0.0",
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "random_seed": random_seed,
        "n_train_samples": len(X_train),
        "n_test_samples": len(X_test),
        "target_definitions": {
            "regression_target": TARGET_REGRESSION,
            "classification_target": TARGET_CLASSIFICATION,
            "high_risk_threshold_hours": HIGH_RISK_DELAY_THRESHOLD_HOURS,
        },
        "feature_columns": FEATURE_COLUMNS,
        "regression_metrics": {
            "model_type": "GradientBoostingRegressor",
            "mae_hours": round(reg_mae, 3),
            "rmse_hours": round(reg_rmse, 3),
            "r2_score": round(reg_r2, 3),
            "baseline_median_mae_hours": round(baseline_mae, 3),
            "mae_improvement_pct": mae_improvement_pct,
            "beats_baseline": reg_mae < baseline_mae,
        },
        "classification_metrics": {
            "model_type": "GradientBoostingClassifier",
            "accuracy": round(clf_acc, 3),
            "precision": round(clf_prec, 3),
            "recall": round(clf_rec, 3),
            "f1_score": round(clf_f1, 3),
            "baseline_accuracy": round(baseline_acc, 3),
            "confusion_matrix": {
                "tn": cm[0][0],
                "fp": cm[0][1],
                "fn": cm[1][0],
                "tp": cm[1][1],
            },
            "beats_baseline": clf_acc > baseline_acc,
        },
        "feature_importances": sorted_reg_importances,
        "operational_notice": "Synthetic-data demonstration. Not validated for real Chattogram Port operations.",
        "data_status": "SIMULATED",
    }

    metadata_path = output_dir / "models_metadata.json"
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    return metadata


if __name__ == "__main__":
    print("Training PORTOS AI vessel delay and ETA models...")
    res = train_and_evaluate_models()
    print("Training complete!")
    print(f"Regression MAE: {res['regression_metrics']['mae_hours']} hrs (Baseline: {res['regression_metrics']['baseline_median_mae_hours']} hrs)")
    print(f"Classification F1: {res['classification_metrics']['f1_score']} (Accuracy: {res['classification_metrics']['accuracy']})")
    print(f"Beats baseline: Regression={res['regression_metrics']['beats_baseline']}, Classification={res['classification_metrics']['beats_baseline']}")

