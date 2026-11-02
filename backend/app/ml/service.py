"""Vessel Delay Prediction Inference Service.

Loads trained GradientBoosting models and provides validated predictions
with strict operational transparency and synthetic data notices.
"""

import json
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import joblib
import numpy as np

from app.models.vessel import VesselTypeEnum, DelayRiskStatusEnum
from app.db.base import DataStatusEnum
from app.schemas.ml import VesselPredictionInput, VesselPredictionOutput
from app.ml.train import ARTIFACTS_DIR, train_and_evaluate_models

# Vessel type mapping to numerical code
VESSEL_TYPE_MAP = {
    VesselTypeEnum.CONTAINER_FEEDER: 0,
    VesselTypeEnum.BULK_CARRIER: 1,
    VesselTypeEnum.GENERAL_CARGO: 2,
    VesselTypeEnum.TANKER: 3,
}


class VesselDelayPredictor:
    """Predictive inference engine for vessel arrival delay and risk classification."""

    def __init__(self, artifacts_dir: Path = ARTIFACTS_DIR):
        self.artifacts_dir = artifacts_dir
        self.regressor = None
        self.classifier = None
        self.metadata = None
        self._load_or_train()

    def _load_or_train(self):
        """Load serialized models or trigger automated training if artifacts are missing."""
        reg_path = self.artifacts_dir / "eta_regressor.joblib"
        clf_path = self.artifacts_dir / "delay_classifier.joblib"
        meta_path = self.artifacts_dir / "models_metadata.json"

        if not (reg_path.exists() and clf_path.exists() and meta_path.exists()):
            train_and_evaluate_models(output_dir=self.artifacts_dir)

        self.regressor = joblib.load(reg_path)
        self.classifier = joblib.load(clf_path)

        with open(meta_path, "r", encoding="utf-8") as f:
            self.metadata = json.load(f)

    def predict(self, input_data: VesselPredictionInput) -> VesselPredictionOutput:
        """Compute ETA delay regression and delay risk classification for a vessel."""
        vessel_code = VESSEL_TYPE_MAP.get(input_data.vessel_type, 0)

        # Feature DataFrame matching FEATURE_COLUMNS order with proper feature names
        import pandas as pd
        from app.ml.synthetic_data import FEATURE_COLUMNS

        features = pd.DataFrame(
            [
                [
                    vessel_code,
                    input_data.distance_to_pilot_nm,
                    input_data.speed_knots,
                    input_data.scheduled_hour_of_day,
                    input_data.anchorage_queue_count,
                    input_data.berth_occupancy_ratio,
                    input_data.wind_speed_knots,
                    input_data.visibility_nm,
                    1 if input_data.is_monsoon_season else 0,
                    1 if input_data.tidal_window_favorable else 0,
                    input_data.carrier_historical_delay_mean,
                ]
            ],
            columns=FEATURE_COLUMNS,
        )

        # Predict delay hours
        raw_delay = float(self.regressor.predict(features)[0])
        predicted_delay_hours = round(max(-1.5, raw_delay), 2)

        # Predict delay risk class and probability
        is_high_risk = bool(self.classifier.predict(features)[0])
        risk_proba = float(self.classifier.predict_proba(features)[0][1])

        # Categorical risk tier
        if is_high_risk or risk_proba >= 0.70 or predicted_delay_hours >= 3.0:
            risk_tier = DelayRiskStatusEnum.HIGH_RISK
        elif predicted_delay_hours > 1.5 or risk_proba >= 0.35:
            risk_tier = DelayRiskStatusEnum.WATCH
        else:
            risk_tier = DelayRiskStatusEnum.NORMAL

        return VesselPredictionOutput(
            predicted_delay_hours=predicted_delay_hours,
            is_delayed_high_risk=is_high_risk,
            delay_risk_probability=round(risk_proba, 3),
            delay_risk_tier=risk_tier,
            high_risk_threshold_hours=float(
                self.metadata.get("target_definitions", {}).get(
                    "high_risk_threshold_hours", 3.0
                )
            ),
            model_name=self.metadata.get("model_name", "portos-vessel-delay-ensemble"),
            model_version=self.metadata.get("model_version", "1.0.0"),
            created_at=datetime.now(timezone.utc),
            data_status=DataStatusEnum.SIMULATED,
            operational_notice="Synthetic-data demonstration. Not validated for real Chattogram Port operations.",
        )

    def get_metadata(self) -> Dict[str, Any]:
        """Return model metadata dictionary."""
        return self.metadata

    def get_evaluation_metrics(self) -> Dict[str, Any]:
        """Return model evaluation metrics including MAE, RMSE, and confusion matrix."""
        return {
            "regression_metrics": self.metadata.get("regression_metrics", {}),
            "classification_metrics": self.metadata.get(
                "classification_metrics", {}
            ),
            "feature_importances": self.metadata.get("feature_importances", {}),
            "target_definitions": self.metadata.get("target_definitions", {}),
        }


# Global singleton instance
predictor_instance = VesselDelayPredictor()


def get_predictor() -> VesselDelayPredictor:
    """Dependency injection helper for FastAPI routes."""
    return predictor_instance

