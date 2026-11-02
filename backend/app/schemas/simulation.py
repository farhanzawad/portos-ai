import enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.db.base import DataStatusEnum


class TimeSeriesSample(BaseModel):
    hour: float
    timestamp_iso: str
    value: float


class VesselSimulationLog(BaseModel):
    vessel_id: str
    vessel_name: str
    call_number: str
    arrival_hour: float
    berth_hour: Optional[float] = None
    departure_hour: Optional[float] = None
    waiting_time_hours: float
    service_duration_hours: float
    status: str  # "SERVED", "WAITING", "OPERATING"


class SimulationMetrics(BaseModel):
    mean_waiting_time_hours: float
    median_waiting_time_hours: float
    p90_waiting_time_hours: float
    total_waiting_hours: float
    berth_utilization_pct: float
    crane_utilization_pct: float
    vessels_served_count: int
    vessels_remaining_queue: int
    estimated_secondary_co2_tonnes: float


class ScenarioParameters(BaseModel):
    scenario_code: str = "custom_scenario"
    scenario_name: str = "Custom Disruption Scenario"
    description: Optional[str] = "Simulated operational disruption parameters."
    is_baseline: bool = False
    random_seed: int = Field(default=42, description="Controlled integer seed for repeatable runs")
    duration_hours: float = Field(default=72.0, ge=12.0, le=168.0)
    vessel_arrival_multiplier: float = Field(default=1.0, ge=0.5, le=2.0)
    berth_outage_count: int = Field(default=0, ge=0, le=3)
    crane_outage_count: int = Field(default=0, ge=0, le=3)
    crane_service_rate_multiplier: float = Field(default=1.0, ge=0.5, le=1.5)
    weather_disruption_factor: float = Field(default=1.0, ge=1.0, le=2.0)
    yard_congestion_threshold_pct: float = Field(default=85.0, ge=50.0, le=100.0)


class SimulationRunResponse(BaseModel):
    run_id: str
    scenario_code: str
    scenario_name: str
    is_baseline: bool
    random_seed: int
    duration_hours: float
    parameters: ScenarioParameters
    metrics: SimulationMetrics
    queue_length_series: List[TimeSeriesSample]
    berth_occupancy_series: List[TimeSeriesSample]
    vessel_logs: List[VesselSimulationLog]
    methodology_notes: List[str]
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED
    operational_notice: str = (
        "Synthetic-data demonstration. Discrete-event simulation for decision support only — not validated for live CPA operations."
    )


class ScenarioComparisonRequest(BaseModel):
    baseline_parameters: Optional[ScenarioParameters] = None
    alternative_scenarios: List[ScenarioParameters] = Field(..., min_length=1, max_length=3)


class MetricDelta(BaseModel):
    baseline_value: float
    alternative_value: float
    absolute_delta: float
    percentage_delta: float


class ScenarioComparisonResponse(BaseModel):
    baseline_run: SimulationRunResponse
    alternative_runs: List[SimulationRunResponse]
    comparisons: Dict[str, Dict[str, MetricDelta]]
    trade_off_summary: List[str]
    operational_notice: str = (
        "Synthetic-data demonstration. Decision Lab simulations reflect discrete-event model assumptions only."
    )
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED


class ProposeScenarioRequest(BaseModel):
    run_id: str
    scenario_code: str
    scenario_name: str
    advisory_notes: str
    metrics: SimulationMetrics


class ProposeScenarioResponse(BaseModel):
    proposal_id: str
    status: str = "PROPOSED"
    created_at: datetime
    message: str
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED

