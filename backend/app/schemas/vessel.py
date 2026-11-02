from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.db.base import DataStatusEnum
from app.models.vessel import VesselTypeEnum, CallStatusEnum, DelayRiskStatusEnum


class VesselRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    imo_number: str
    name: str
    call_sign: str
    flag_country: str
    vessel_type: VesselTypeEnum
    length_overall_m: float
    beam_m: float
    max_draft_m: float
    teu_capacity: int
    dwt_tonnes: float
    data_status: DataStatusEnum
    source_name: str


class VesselPositionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    vessel_call_id: str
    timestamp: datetime
    latitude: float
    longitude: float
    speed_knots: float
    heading_degrees: float
    navigational_status: str
    distance_to_pilot_nm: float
    data_status: DataStatusEnum


class VesselCallRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    vessel_id: str
    terminal_id: str
    call_number: str
    voyage_number: str
    reported_eta: datetime
    predicted_eta: Optional[datetime] = None
    actual_pilot_arrival: Optional[datetime] = None
    actual_berth_time: Optional[datetime] = None
    actual_departure_time: Optional[datetime] = None
    status: CallStatusEnum
    delay_risk_status: DelayRiskStatusEnum
    delay_risk_score: float
    predicted_delay_hours: float
    inbound_teu: int
    outbound_teu: int
    data_status: DataStatusEnum
    source_name: str
    vessel: Optional[VesselRead] = None


class VesselTrackResponse(BaseModel):
    call_id: str
    vessel_name: str
    call_number: str
    status: CallStatusEnum
    reported_eta: datetime
    predicted_eta: Optional[datetime] = None
    predicted_delay_hours: float
    positions: List[VesselPositionRead]

