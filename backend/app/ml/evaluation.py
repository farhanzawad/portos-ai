import numpy as np
import pandas as pd
from datetime import datetime, timezone
from typing import Dict, Any, List
from sklearn.model_selection import TimeSeriesSplit
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    mean_absolute_error,
    root_mean_squared_error,
    r2_score,
    brier_score_loss,
    accuracy_score,
    f1_score,
)

from app.ml.synthetic_data import (
    generate_synthetic_vessel_data,
    FEATURE_COLUMNS,
    TARGET_REGRESSION,
    TARGET_CLASSIFICATION,
)
from app.schemas.model_evaluation import (
    TemporalCVSplitResult,
    CalibrationBin,
    ResearchEvaluationReport,
)


def compute_research_evaluation(n_samples: int = 2500, n_splits: int = 5) -> ResearchEvaluationReport:
    """Executes time-series expanding-window cross-validation and probabilistic calibration analysis."""
    df = generate_synthetic_vessel_data(n_samples=n_samples, random_seed=42)

    X = df[FEATURE_COLUMNS].values
    y_reg = df[TARGET_REGRESSION].values
    y_clf = df[TARGET_CLASSIFICATION].values

    tscv = TimeSeriesSplit(n_splits=n_splits)

    splits: List[TemporalCVSplitResult] = []
    mae_list: List[float] = []
    rmse_list: List[float] = []
    r2_list: List[float] = []
    brier_list: List[float] = []

    all_y_true: List[int] = []
    all_y_prob: List[float] = []

    split_idx = 1
    for train_index, test_index in tscv.split(X):
        X_train, X_test = X[train_index], X[test_index]
        y_reg_train, y_reg_test = y_reg[train_index], y_reg[test_index]
        y_clf_train, y_clf_test = y_clf[train_index], y_clf[test_index]

        # Train regressor on historical window
        reg = GradientBoostingRegressor(n_estimators=50, max_depth=4, random_state=42)
        reg.fit(X_train, y_reg_train)
        pred_reg = reg.predict(X_test)

        # Train classifier on historical window
        clf = GradientBoostingClassifier(n_estimators=50, max_depth=4, random_state=42)
        clf.fit(X_train, y_clf_train)
        pred_clf = clf.predict(X_test)
        prob_clf = clf.predict_proba(X_test)[:, 1]

        mae = float(mean_absolute_error(y_reg_test, pred_reg))
        rmse = float(root_mean_squared_error(y_reg_test, pred_reg))
        r2 = float(r2_score(y_reg_test, pred_reg))
        brier = float(brier_score_loss(y_clf_test, prob_clf))
        acc = float(accuracy_score(y_clf_test, pred_clf))
        f1 = float(f1_score(y_clf_test, pred_clf, zero_division=0))

        splits.append(
            TemporalCVSplitResult(
                split_index=split_idx,
                train_size=len(train_index),
                test_size=len(test_index),
                mae_hours=round(mae, 3),
                rmse_hours=round(rmse, 3),
                r2_score=round(r2, 3),
                brier_score=round(brier, 4),
                accuracy=round(acc, 3),
                f1_score=round(f1, 3),
            )
        )

        mae_list.append(mae)
        rmse_list.append(rmse)
        r2_list.append(r2)
        brier_list.append(brier)

        all_y_true.extend(y_clf_test.tolist())
        all_y_prob.extend(prob_clf.tolist())

        split_idx += 1

    # Calibration Curve & Expected Calibration Error (ECE)
    prob_true, prob_pred = calibration_curve(all_y_true, all_y_prob, n_bins=10, strategy="uniform")

    # Compute bin counts and ECE
    bin_edges = np.linspace(0.0, 1.0, 11)
    all_y_prob_arr = np.array(all_y_prob)
    all_y_true_arr = np.array(all_y_true)
    
    calibration_bins: List[CalibrationBin] = []
    total_eval_samples = len(all_y_true)
    ece_accumulator = 0.0

    for i in range(len(prob_true)):
        lower, upper = bin_edges[i], bin_edges[i+1]
        in_bin = (all_y_prob_arr >= lower) & (all_y_prob_arr < upper) if i < len(prob_true) - 1 else (all_y_prob_arr >= lower) & (all_y_prob_arr <= upper)
        bin_count = int(np.sum(in_bin))

        p_pred = float(prob_pred[i])
        p_true = float(prob_true[i])
        
        if bin_count > 0:
            ece_accumulator += (bin_count / total_eval_samples) * abs(p_true - p_pred)

        calibration_bins.append(
            CalibrationBin(
                bin_index=i + 1,
                mean_predicted_probability=round(p_pred, 3),
                fraction_of_positives=round(p_true, 3),
                sample_count=bin_count,
            )
        )

    mean_mae = round(float(np.mean(mae_list)), 3)
    mean_rmse = round(float(np.mean(rmse_list)), 3)
    mean_r2 = round(float(np.mean(r2_list)), 3)
    overall_brier = round(float(np.mean(brier_list)), 4)
    ece = round(float(ece_accumulator), 4)

    return ResearchEvaluationReport(
        total_samples=n_samples,
        mean_temporal_mae_hours=mean_mae,
        mean_temporal_rmse_hours=mean_rmse,
        mean_temporal_r2=mean_r2,
        overall_brier_score=overall_brier,
        expected_calibration_error=ece,
        splits=splits,
        calibration_bins=calibration_bins,
        is_well_calibrated=(ece < 0.08),
        generated_at=datetime.now(timezone.utc),
    )
