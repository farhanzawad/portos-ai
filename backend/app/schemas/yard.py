from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from app.db.base import DataStatusEnum
from app.models.yard import YardZoneEnum, YardRiskTierEnum


class YardBlockRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    terminal_id: str
    code: str
    name: str
    zone: YardZoneEnum
    teu_capacity: int
    warning_threshold_pct: float
    critical_threshold_pct: float
    data_status: DataStatusEnum
    source_name: str


class YardOccupancyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    yard_block_id: str
    timestamp: datetime
    occupied_teu: int
    occupancy_pct: float
    reefer_occupied_count: int
    risk_tier: YardRiskTierEnum
    forecast_horizon_hrs: Optional[int] = None
    data_status: DataStatusEnum

