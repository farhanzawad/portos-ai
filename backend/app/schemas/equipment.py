from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.db.base import DataStatusEnum
from app.models.equipment import EquipmentTypeEnum, EquipmentStatusEnum, MaintenanceTypeEnum


class EquipmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    terminal_id: str
    code: str
    equipment_type: EquipmentTypeEnum
    status: EquipmentStatusEnum
    rated_capacity_tonnes: float
    rated_moves_per_hour: float
    assigned_berth_id: Optional[str] = None
    data_status: DataStatusEnum
    source_name: str


class EquipmentTelemetryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    equipment_id: str
    timestamp: datetime
    moves_per_hour_actual: float
    power_consumption_kwh: float
    operating_hours_total: float
    trolley_position_m: Optional[float] = None
    hoist_speed_mps: Optional[float] = None
    active_load_tonnes: Optional[float] = None
    fault_code: Optional[str] = None
    data_status: DataStatusEnum


class EquipmentMaintenanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    equipment_id: str
    maintenance_type: MaintenanceTypeEnum
    started_at: datetime
    expected_end_at: datetime
    actual_end_at: Optional[datetime] = None
    description: str
    is_simulated_disruption: bool
    data_status: DataStatusEnum

