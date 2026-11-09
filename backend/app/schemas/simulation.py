"""Pydantic schemas for PORTOS AI Decision Lab & SimPy Discrete-Event Simulation.

Encompasses simulation parameterization (macro levers, arrival surges, berth outages,
crane breakdowns, weather squalls, yard congestion, and cargo demand), time-series
projections, GIS timeline frames, green port emissions accounting, and AI Scenario Analyst.
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
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
    assigned_berth: Optional[str] = "BERTH_01"
    assigned_cranes: int = 1
    cargo_moves: int = 500
    status: str  # "SERVED", "WAITING", "OPERATING"


class VesselPositionSnapshot(BaseModel):
    vessel_id: str
    vessel_name: str
    state: str  # "ANCHORAGE_WAITING", "INWARD_TRANSIT", "BERTHED_WORKING", "OUTWARD_TRANSIT"
    lat: float
    lon: float
    heading: float
    speed_knots: float
    berth_code: Optional[str] = None
    waiting_hours: float = 0.0
    cargo_progress_pct: float = 0.0


class SimulationTimelineFrame(BaseModel):
    hour: float
    timestamp_iso: str
    vessels: List[VesselPositionSnapshot]
    active_berths: int
    occupied_berths: int
    active_cranes: int
    anchorage_queue_count: int
    yard_occupancy_pct: float


class SimulationMetrics(BaseModel):
    mean_waiting_time_hours: float
    median_waiting_time_hours: float
    p90_waiting_time_hours: float
    total_waiting_hours: float
    average_turnaround_hours: float = 24.5
    berth_utilization_pct: float
    crane_utilization_pct: float
    peak_yard_occupancy_pct: float = 68.0
    vessels_served_count: int
    vessels_remaining_queue: int
    total_teus_handled: int = 12500
    reliability_compliance_pct: float = 85.0
    scheduling_conflicts_count: int = 0
    primary_bottleneck: str = "NONE"
    bottleneck_severity: str = "LOW"
    # Green Port Environmental Metrics
    estimated_secondary_co2_tonnes: float
    idle_fuel_burn_liters: float = 0.0
    crane_power_kwh: float = 0.0
    total_co2e_tonnes: float = 0.0
    nox_emissions_kg: float = 0.0
    sox_emissions_kg: float = 0.0


class ScenarioParameters(BaseModel):
    scenario_code: str = "custom_scenario"
    scenario_name: str = "Custom Disruption Scenario"
    description: Optional[str] = "Simulated operational disruption parameters."
    is_baseline: bool = False
    random_seed: int = Field(default=42, description="Controlled integer seed for repeatable runs")
    duration_hours: float = Field(default=72.0, ge=12.0, le=168.0)
    target_reliability_pct: float = Field(default=80.0, ge=40.0, le=100.0)
    delay_threshold_hours: float = Field(default=3.0, ge=1.0, le=12.0)

    # Scenario A: Vessel Arrival Surge
    vessel_arrival_multiplier: float = Field(default=1.0, ge=0.5, le=2.5)
    arrival_surge_pct: float = Field(default=0.0, ge=0.0, le=100.0)
    arrival_concentration: str = Field(default="UNIFORM", description="UNIFORM | MORNING_PEAK | TIDAL_WINDOW")

    # Scenario B: Berth Unavailability
    berth_outage_count: int = Field(default=0, ge=0, le=4)
    closed_berth_ids: List[str] = Field(default_factory=list)
    berth_closure_start_hour: float = Field(default=0.0, ge=0.0, le=168.0)
    berth_closure_duration_hours: float = Field(default=72.0, ge=1.0, le=168.0)
    berth_closure_reason: str = Field(default="MAINTENANCE", description="MAINTENANCE | FENDER_REPAIR | DREDGING | WEATHER_CLOSURE | MANUAL")

    # Scenario C: Crane Failure
    crane_outage_count: int = Field(default=0, ge=0, le=4)
    failed_crane_ids: List[str] = Field(default_factory=list)
    crane_failure_start_hour: float = Field(default=0.0, ge=0.0, le=168.0)
    crane_repair_duration_hours: float = Field(default=24.0, ge=1.0, le=168.0)
    crane_service_rate_multiplier: float = Field(default=1.0, ge=0.4, le=1.6)

    # Scenario D: Weather Disruption
    weather_disruption_factor: float = Field(default=1.0, ge=1.0, le=2.5)
    wind_speed_knots: float = Field(default=14.0, ge=0.0, le=70.0)
    wave_height_meters: float = Field(default=1.2, ge=0.2, le=6.0)
    visibility_km: float = Field(default=10.0, ge=0.1, le=25.0)
    weather_start_hour: float = Field(default=0.0, ge=0.0, le=168.0)
    weather_duration_hours: float = Field(default=0.0, ge=0.0, le=168.0)

    # Scenario E: Yard Congestion
    yard_initial_occupancy_pct: float = Field(default=65.0, ge=30.0, le=98.0)
    yard_dwell_time_multiplier: float = Field(default=1.0, ge=0.5, le=2.5)
    gate_throughput_reduction_pct: float = Field(default=0.0, ge=0.0, le=60.0)
    yard_congestion_threshold_pct: float = Field(default=85.0, ge=50.0, le=100.0)

    # Scenario F: Cargo Handling Demand
    cargo_moves_multiplier: float = Field(default=1.0, ge=0.7, le=2.0)
    reefer_container_pct: float = Field(default=12.0, ge=0.0, le=50.0)


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
    yard_occupancy_series: List[TimeSeriesSample] = Field(default_factory=list)
    vessel_logs: List[VesselSimulationLog]
    timeline_frames: List[SimulationTimelineFrame] = Field(default_factory=list)
    methodology_notes: List[str]
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED
    operational_notice: str = (
        "Synthetic-data demonstration. Discrete-event simulation for decision support only — not validated for live CPA operations."
    )


class MetricDelta(BaseModel):
    baseline_value: float
    alternative_value: float
    absolute_delta: float
    percentage_delta: float


class ScenarioComparisonRequest(BaseModel):
    baseline_parameters: Optional[ScenarioParameters] = None
    alternative_scenarios: List[ScenarioParameters] = Field(..., min_length=1, max_length=5)


class ScenarioComparisonResponse(BaseModel):
    baseline_run: SimulationRunResponse
    alternative_runs: List[SimulationRunResponse]
    comparisons: Dict[str, Dict[str, MetricDelta]]
    trade_off_summary: List[str]
    operational_notice: str = (
        "Synthetic-data demonstration. Decision Lab simulations reflect discrete-event model assumptions only."
    )
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED


class ScenarioCreateRequest(BaseModel):
    code: str
    name: str
    description: str
    parameters: ScenarioParameters


class ScenarioUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parameters: Optional[ScenarioParameters] = None


class ScenarioRead(BaseModel):
    id: str
    code: str
    name: str
    description: str
    is_baseline: bool
    parameters: ScenarioParameters
    created_at: datetime
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


class ScenarioAnalystRequest(BaseModel):
    scenario_code: str
    baseline_run: SimulationRunResponse
    scenario_run: SimulationRunResponse
    operator_query: Optional[str] = None


class ScenarioAnalystResponse(BaseModel):
    scenario_code: str
    executive_summary: str
    bottleneck_diagnosis: str
    optimal_path_recommendation: str
    cascading_benefits: List[str]
    identified_trade_offs: List[str]
    suggested_action_items: List[str]
    model_name: str
    is_demo_mode: bool
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED
