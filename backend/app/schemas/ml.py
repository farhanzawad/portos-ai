"""Pydantic v2 schemas for Machine Learning Prediction and Model Centre."""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict
from app.db.base import DataStatusEnum
from app.models.vessel import VesselTypeEnum, DelayRiskStatusEnum


class VesselPredictionInput(BaseModel):
    """Input features required for vessel arrival delay and risk prediction."""
    vessel_type: VesselTypeEnum = Field(..., description="Vessel category")
    distance_to_pilot_nm: float = Field(..., ge=0.0, le=500.0, description="Distance remaining to pilot station in nautical miles")
    speed_knots: float = Field(..., ge=0.0, le=40.0, description="Current operating speed in knots")
    scheduled_hour_of_day: int = Field(..., ge=0, le=23, description="Hour of scheduled arrival in Asia/Dhaka (0-23)")
    anchorage_queue_count: int = Field(..., ge=0, le=100, description="Number of vessels currently awaiting at outer anchorage")
    berth_occupancy_ratio: float = Field(..., ge=0.0, le=1.0, description="Terminal berth occupancy ratio (0.0 to 1.0)")
    wind_speed_knots: float = Field(10.0, ge=0.0, le=80.0, description="Local channel wind speed in knots")
    visibility_nm: float = Field(10.0, ge=0.0, le=30.0, description="Atmospheric visibility in nautical miles")
    is_monsoon_season: bool = Field(False, description="Whether current observation is in Bangladesh monsoon season (Jun-Sep)")
    tidal_window_favorable: bool = Field(True, description="Whether scheduled arrival coincides with Karnaphuli high tide window")
    carrier_historical_delay_mean: float = Field(0.0, ge=-10.0, le=50.0, description="Historical carrier schedule delay deviation in hours")


class VesselPredictionOutput(BaseModel):
    """Validated prediction output from the trained ML pipeline."""
    predicted_delay_hours: float = Field(..., description="Estimated arrival delay in hours relative to reported ETA")
    is_delayed_high_risk: bool = Field(..., description="Binary classification: whether delay exceeds configured threshold")
    delay_risk_probability: float = Field(..., ge=0.0, le=1.0, description="Probability of exceeding delay threshold")
    delay_risk_tier: DelayRiskStatusEnum = Field(..., description="Categorical operational risk tier")
    high_risk_threshold_hours: float = Field(3.0, description="Threshold defining high-risk delay status")
    model_name: str
    model_version: str
    created_at: datetime
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED
    operational_notice: str = "Synthetic-data demonstration. Not validated for real Chattogram Port operations."


class ModelMetricsResponse(BaseModel):
    """Detailed evaluation metrics for a trained model."""
    regression_metrics: Dict[str, Any]
    classification_metrics: Dict[str, Any]
    feature_importances: Dict[str, float]
    target_definitions: Dict[str, Any]


class ModelMetadataResponse(BaseModel):
    """Registry metadata for the vessel delay prediction model."""
    model_name: str
    model_version: str
    trained_at: str
    random_seed: int
    n_train_samples: int
    n_test_samples: int
    feature_columns: List[str]
    operational_notice: str
    data_status: DataStatusEnum

