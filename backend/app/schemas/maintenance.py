from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.db.base import DataStatusEnum


class TelemetryReading(BaseModel):
    """Sensor telemetry metrics for port cargo handling equipment."""
    vibration_mm_s: float = Field(..., description="Hoist/gantry vibration velocity in mm/s (ISO 10816)")
    hydraulic_temp_c: float = Field(..., description="Hydraulic oil temperature in Celsius")
    power_draw_kw: float = Field(..., description="Instantaneous peak electric power draw in kW")
    hoist_cycle_time_s: float = Field(..., description="Cycle turnaround duration in seconds")
    operating_hours: float = Field(..., description="Cumulative operating hours since last overhaul")


class AnomalyAssessment(BaseModel):
    """Machine learning anomaly detection output for single equipment unit."""
    equipment_id: str = Field(..., description="Equipment database ID")
    equipment_code: str = Field(..., description="Asset display code (e.g. STS-01)")
    equipment_type: str = Field(..., description="Equipment category")
    status: str = Field(..., description="Current operational state")
    is_anomaly: bool = Field(..., description="Whether Isolation Forest flagged anomalous telemetry")
    anomaly_score: float = Field(..., description="Continuous decision function score (-1.0 to +1.0, lower = more abnormal)")
    health_index_pct: float = Field(..., description="Derived overall asset health score (0-100%)")
    risk_level: str = Field(..., description="Risk category: NORMAL, WATCH, or CRITICAL")
    telemetry: TelemetryReading = Field(..., description="Observed or simulated telemetry reading")
    dominant_contributing_feature: str = Field(..., description="Primary sensor parameter driving the anomaly assessment")
    recommended_action: str = Field(..., description="Predictive maintenance recommendation")
    model_version: str = Field("IsolationForest_v1.0 (scikit-learn)", description="ML model identifier")
    data_status: DataStatusEnum = Field(DataStatusEnum.SIMULATED, description="Provenance status")


class MaintenanceOverviewResponse(BaseModel):
    """Complete fleet health overview with predictive maintenance assessments."""
    total_units: int
    operational_units: int
    watch_units: int
    critical_units: int
    mean_health_index: float
    units: List[AnomalyAssessment]
    generated_at: datetime
    disclaimer: str = Field(
        "Predictive maintenance advisory intelligence only. Human physical inspection required before taking equipment offline.",
        description="Advisory notice"
    )

