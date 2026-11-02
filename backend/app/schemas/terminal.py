from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.db.base import DataStatusEnum
from app.models.terminal import BerthStatusEnum, AssignmentStatusEnum


class TerminalRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    code: str
    name: str
    country_code: str
    latitude: float
    longitude: float
    timezone: str
    total_quay_length_m: float
    data_status: DataStatusEnum
    source_name: str


class BerthRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    terminal_id: str
    code: str
    name: str
    length_m: float
    depth_draft_m: float
    max_vessel_loa_m: float
    is_active: bool
    status: BerthStatusEnum
    data_status: DataStatusEnum
    source_name: str


class BerthAssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    berth_id: str
    vessel_call_id: str
    scheduled_start: datetime
    scheduled_end: datetime
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    assigned_quay_start_m: Optional[float] = None
    assigned_quay_end_m: Optional[float] = None
    status: AssignmentStatusEnum
    optimizer_run_id: Optional[str] = None
    advisory_notes: Optional[str] = None
    data_status: DataStatusEnum


class TerminalLayoutRead(BaseModel):
    terminal: TerminalRead
    berths: List[BerthRead]
    quay_length_m: float
    active_berth_count: int

