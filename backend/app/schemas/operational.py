from datetime import datetime
from typing import Dict, Any, List
from pydantic import BaseModel, ConfigDict
from app.db.base import DataStatusEnum
from app.models.scenario import EventSeverityEnum, EventTypeEnum


class OperationalEventRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    terminal_id: str
    timestamp: datetime
    event_type: EventTypeEnum
    severity: EventSeverityEnum
    title: str
    description: str
    payload_json: Dict[str, Any]
    data_status: DataStatusEnum
    source_name: str


class BaselineKPIsResponse(BaseModel):
    terminal_id: str
    terminal_code: str
    timestamp: datetime
    vessels_in_system: int
    vessels_at_berth: int
    vessels_in_queue: int
    berth_occupancy_pct: float
    total_berths: int
    occupied_berths: int
    active_alerts_count: int
    yard_blocks_above_warning: int
    mean_anchorage_delay_hours: float
    data_status: DataStatusEnum

