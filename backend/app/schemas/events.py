import enum
from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field
from app.db.base import DataStatusEnum


class EventType(str, enum.Enum):
    VESSEL_POSITION_UPDATED = "vessel.position.updated"
    VESSEL_ETA_PREDICTION_CREATED = "vessel.eta.prediction.created"
    VESSEL_DELAY_RISK_CHANGED = "vessel.delay.risk.changed"
    BERTH_PLAN_PROPOSED = "berth.plan.proposed"
    BERTH_ASSIGNMENT_REVIEWED = "berth.assignment.reviewed"
    EQUIPMENT_STATUS_CHANGED = "equipment.status.changed"
    YARD_OCCUPANCY_FORECAST_UPDATED = "yard.occupancy.forecast.updated"
    SCENARIO_RUN_COMPLETED = "scenario.run.completed"
    OPERATIONAL_ALERT_CREATED = "operational.alert.created"
    INCIDENT_INJECTED = "incident.injected"
    INCIDENT_RESET = "incident.reset"


class EventMessage(BaseModel):
    id: str
    event_type: str
    emitted_at: datetime = Field(default_factory=lambda: datetime.now())
    entity_id: str
    payload_schema_version: str = "1.0.0"
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED
    origin: str = "SYSTEM"
    payload: Dict[str, Any] = Field(default_factory=dict)


class IncidentPreset(BaseModel):
    id: str
    title: str
    description: str
    target_entity: str
    severity: str
    expected_impact: str


class IncidentInjectionRequest(BaseModel):
    incident_type: str = Field(
        default="monsoon_surge_delay",
        description="Type of deterministic incident: monsoon_surge_delay | crane_outage | yard_congestion",
    )
    target_vessel_id: Optional[str] = None
    delay_hours: float = Field(default=6.5, ge=1.0, le=48.0)
    description: Optional[str] = None


class IncidentInjectionResponse(BaseModel):
    incident_id: str
    incident_type: str
    status: str = "INJECTED"
    summary: str
    events_emitted_count: int
    events: List[EventMessage]
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED


class IncidentResetResponse(BaseModel):
    status: str = "RESET_COMPLETED"
    restored_baseline: bool = True
    message: str
    events_emitted_count: int
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED


class EventStreamStatus(BaseModel):
    active_subscribers: int
    total_events_in_buffer: int
    last_event_id: Optional[str] = None
    data_status: DataStatusEnum = DataStatusEnum.SIMULATED
