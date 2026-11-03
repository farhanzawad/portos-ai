from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class TemporalCVSplitResult(BaseModel):
    """Metrics for an individual temporal cross-validation split."""
    split_index: int = Field(..., description="Fold index (1-based)")
    train_size: int = Field(..., description="Number of historical samples in training set")
    test_size: int = Field(..., description="Number of out-of-time evaluation samples")
    mae_hours: float = Field(..., description="Mean Absolute Error in hours for this fold")
    rmse_hours: float = Field(..., description="Root Mean Squared Error in hours")
    r2_score: float = Field(..., description="Coefficient of determination R²")
    brier_score: float = Field(..., description="Brier Score for delay risk classification")
    accuracy: float = Field(..., description="Classification accuracy")
    f1_score: float = Field(..., description="Classification F1 score")


class CalibrationBin(BaseModel):
    """Reliability curve data bin for probabilistic classification calibration."""
    bin_index: int = Field(..., description="Bin identifier")
    mean_predicted_probability: float = Field(..., description="Average predicted probability for samples in bin")
    fraction_of_positives: float = Field(..., description="Observed empirical frequency of high-risk delay events")
    sample_count: int = Field(..., description="Number of samples allocated to bin")


class ResearchEvaluationReport(BaseModel):
    """Research-grade model evaluation report featuring temporal CV and calibration metrics."""
    model_name: str = "PORTOS GradientBoosting ETA & Delay-Risk Engine"
    model_version: str = "2.1.0-research"
    evaluation_methodology: str = "5-Fold Expanding Window Temporal Cross-Validation (TimeSeriesSplit)"
    total_samples: int = Field(..., description="Total synthetic observations in dataset")
    mean_temporal_mae_hours: float = Field(..., description="Average MAE across temporal folds")
    mean_temporal_rmse_hours: float = Field(..., description="Average RMSE across temporal folds")
    mean_temporal_r2: float = Field(..., description="Average R² score across temporal folds")
    overall_brier_score: float = Field(..., description="Overall Brier score (strictly proper scoring rule)")
    expected_calibration_error: float = Field(..., description="Expected Calibration Error (ECE) across 10 probability bins")
    splits: List[TemporalCVSplitResult] = Field(..., description="Individual temporal split results")
    calibration_bins: List[CalibrationBin] = Field(..., description="Empirical reliability diagram points")
    is_well_calibrated: bool = Field(True, description="Whether ECE < 0.08 indicates reliable probabilistic forecasts")
    generated_at: datetime
    methodology_note: str = Field(
        "Temporal expanding-window splits respect the forward arrow of time. No future voyage observations are leaked into earlier training windows.",
        description="Methodological guarantee"
    )

