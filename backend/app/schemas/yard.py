from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict, Field
from app.db.base import DataStatusEnum
from app.models.yard import YardZoneEnum, YardRiskTierEnum, MovementTypeEnum


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


class ContainerMovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    yard_block_id: str
    timestamp: datetime
    movement_type: MovementTypeEnum
    teu_count: int
    vessel_call_id: Optional[str] = None
    equipment_id: Optional[str] = None
    data_status: DataStatusEnum
    source_name: str


class ExplanatoryFactor(BaseModel):
    factor: str
    impact_teu: float
    direction: str  # "+" or "-"
    description: str


class ForecastHorizonDetail(BaseModel):
    horizon_hrs: int
    predicted_occupied_teu: int
    predicted_occupancy_pct: float
    risk_tier: YardRiskTierEnum
    confidence_lower_pct: float
    confidence_upper_pct: float
    overflow_risk: bool = False
    capped_at_capacity: bool = False
    explanatory_factors: List[ExplanatoryFactor] = Field(default_factory=list)


class YardBlockStatusRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    terminal_id: str
    code: str
    name: str
    zone: YardZoneEnum
    teu_capacity: int
    warning_threshold_pct: float
    critical_threshold_pct: float
    current_occupied_teu: int
    current_occupancy_pct: float
    current_risk_tier: YardRiskTierEnum
    reefer_occupied_count: int
    forecast_6h: ForecastHorizonDetail
    forecast_12h: ForecastHorizonDetail
    forecast_24h: ForecastHorizonDetail
    data_status: DataStatusEnum
    source_name: str
    last_observation_time: Optional[datetime] = None


class YardSummaryResponse(BaseModel):
    terminal_id: str
    total_capacity_teu: int
    total_occupied_teu: int
    overall_occupancy_pct: float
    blocks_normal_count: int
    blocks_watch_count: int
    blocks_high_risk_count: int
    blocks: List[YardBlockStatusRead]
    model_metadata: Dict[str, Any]
    data_status: DataStatusEnum
    timestamp: datetime


class YardBlockDetailResponse(BaseModel):
    block: YardBlockRead
    current_status: YardBlockStatusRead
    history_observations: List[YardOccupancyRead]
    recent_movements: List[ContainerMovementRead]
    model_metadata: Dict[str, Any]
    data_status: DataStatusEnum


class YardCongestionAlert(BaseModel):
    block_id: str
    block_code: str
    zone: YardZoneEnum
    current_pct: float
    peak_forecast_pct: float
    peak_horizon_hrs: int
    risk_tier: YardRiskTierEnum
    title: str
    message: str
    recommended_action: str
    data_status: DataStatusEnum
