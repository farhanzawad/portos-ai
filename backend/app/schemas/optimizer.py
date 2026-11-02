import enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.db.base import DataStatusEnum


class SolverStatusEnum(str, enum.Enum):
    OPTIMAL = "OPTIMAL"
    FEASIBLE = "FEASIBLE"
    INFEASIBLE = "INFEASIBLE"
    MODEL_INVALID = "MODEL_INVALID"
    UNKNOWN = "UNKNOWN"


class BerthSpec(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    length_m: float
    depth_draft_m: float
    max_vessel_loa_m: float
    is_active: bool = True
    status: str = "AVAILABLE"
    available_from: Optional[datetime] = None
    available_to: Optional[datetime] = None


class VesselCallSpec(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    call_number: str
    vessel_name: str
    vessel_type: str = "CONTAINER_FEEDER"
    length_overall_m: float
    max_draft_m: float
    reported_eta: datetime
    predicted_eta: Optional[datetime] = None
    service_duration_hours: float = 18.0
    priority: int = Field(default=1, ge=1, le=5, description="1=Standard, 5=Urgent Express")
    current_berth_id: Optional[str] = None
    delay_risk_status: Optional[str] = "NORMAL"


class OptimizerConstraintSettings(BaseModel):
    enforce_loa_limit: bool = True
    enforce_draft_limit: bool = True
    enforce_no_overlap: bool = True
    enforce_berth_availability: bool = True
    waiting_time_weight: float = 1.0
    schedule_deviation_weight: float = 0.5
    max_solver_duration_seconds: float = 10.0


class OptimizerRequest(BaseModel):
    terminal_id: Optional[str] = None
    planning_horizon_hours: int = Field(default=72, ge=12, le=168)
    time_granularity_minutes: int = Field(default=15, ge=5, le=60)
    calls: Optional[List[VesselCallSpec]] = None
    berths: Optional[List[BerthSpec]] = None
    settings: Optional[OptimizerConstraintSettings] = None


class ScheduledAssignment(BaseModel):
    vessel_call_id: str
    vessel_name: str
    call_number: str
    berth_id: str
    berth_code: str
    berth_name: str
    scheduled_start: datetime
    scheduled_end: datetime
    service_duration_hours: float
    waiting_time_hours: float
    assigned_quay_start_m: float
    assigned_quay_end_m: float
    is_feasible: bool = True
    assignment_explanation: str
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED


class ConstraintViolation(BaseModel):
    violation_type: str
    vessel_call_id: str
    berth_id: str
    description: str
    severity: str = "HARD_CONSTRAINT_VIOLATION"


class FeasibilityValidationResult(BaseModel):
    is_feasible: bool
    total_assignments_checked: int
    violations_count: int
    violations: List[ConstraintViolation] = []
    summary: str
    validator_name: str = "PORTOS Independent Feasibility Validator v1"


class ScheduleComparisonMetrics(BaseModel):
    baseline_total_waiting_hours: float
    optimized_total_waiting_hours: float
    waiting_hours_saved: float
    waiting_time_reduction_pct: float
    berth_utilization_pct: float
    vessels_scheduled_count: int
    vessels_unassigned_count: int


class OptimizerResponse(BaseModel):
    solver_status: SolverStatusEnum
    solve_time_ms: float
    objective_value: Optional[float] = None
    planning_start: datetime
    planning_end: datetime
    baseline_schedule: List[ScheduledAssignment]
    optimized_schedule: List[ScheduledAssignment]
    unassigned_vessels: List[str] = []
    feasibility_validation: FeasibilityValidationResult
    comparison_metrics: ScheduleComparisonMetrics
    infeasibility_diagnostics: List[str] = []
    operational_notice: str = (
        "Synthetic-data demonstration. Advisory decision support only — not validated for live Chattogram Port operations."
    )
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED


class ValidateScheduleRequest(BaseModel):
    assignments: List[ScheduledAssignment]
    berths: Optional[List[BerthSpec]] = None
    calls: Optional[List[VesselCallSpec]] = None


class ProposeScheduleRequest(BaseModel):
    optimizer_run_id: str
    assignments: List[ScheduledAssignment]
    advisory_notes: Optional[str] = None


class ProposeScheduleResponse(BaseModel):
    proposal_id: str
    status: str = "PROPOSED"
    created_at: datetime
    records_created: int
    message: str
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED

