from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.db.base import DataStatusEnum


class AISVesselMessage(BaseModel):
    """Normalized AIS vessel position report (Class A/B transponder payload)."""
    mmsi: str = Field(..., description="Maritime Mobile Service Identity")
    imo: Optional[str] = Field(None, description="IMO vessel number if resolved")
    ship_name: str = Field(..., description="Vessel broadcast name")
    call_sign: Optional[str] = Field(None, description="Radio callsign")
    latitude: float = Field(..., description="WGS84 latitude")
    longitude: float = Field(..., description="WGS84 longitude")
    speed_over_ground_knots: float = Field(..., description="Speed over ground in knots (SOG)")
    course_over_ground_degrees: float = Field(..., description="Course over ground in degrees (COG)")
    heading_degrees: float = Field(..., description="True heading in degrees")
    navigational_status: str = Field(..., description="Navigational status code string")
    distance_to_pilot_nm: float = Field(..., description="Distance to Chattogram Outer Bar Pilot Station in nautical miles")
    destination: str = Field("CHATTOGRAM", description="Reported destination")
    eta: Optional[datetime] = Field(None, description="Reported arrival timestamp")
    data_status: DataStatusEnum = Field(DataStatusEnum.SIMULATED, description="Data status provenance tag")
    timestamp: datetime = Field(..., description="Observation timestamp")


class AISProviderStatus(BaseModel):
    """Operational status of the live AIS provider connection."""
    provider_name: str = Field("AISStream.io", description="Configured commercial AIS provider name")
    is_connected: bool = Field(False, description="Whether an active connection to the live feed is established")
    api_key_configured: bool = Field(False, description="Whether a valid provider subscription key is present in environment")
    channel_monitored: str = Field(
        "Chattogram Port Approach & Karnaphuli River Fairway",
        description="Geographic maritime corridor monitored"
    )
    bounding_box: List[float] = Field(
        [91.68, 22.12, 91.86, 22.34],
        description="Active spatial filter [min_lon, min_lat, max_lon, max_lat]"
    )
    active_target_count: int = Field(0, description="Number of vessels actively detected in corridor")
    last_message_received_at: Optional[datetime] = Field(None, description="Timestamp of latest AIS telemetry packet")
    data_status: DataStatusEnum = Field(DataStatusEnum.SIMULATED, description="Data status of current feed")
    disclaimer: str = Field(
        "Contextual decision support telemetry only. NOT CERTIFIED FOR REAL-TIME COLLISION AVOIDANCE, "
        "NAVIGATIONAL CLEARANCE, OR SAFETY-OF-LIFE-AT-SEA (SOLAS) OPERATIONS.",
        description="Mandatory maritime safety disclaimer"
    )
    audit_note: str = Field(
        "No live commercial AIS subscription key configured (AIS_STREAM_API_KEY). Operating in synthetic hydrographic replay mode.",
        description="Operational truthfulness audit message"
    )


class AISFeedResponse(BaseModel):
    """Complete AIS feed response with provider diagnostics and target tracking array."""
    provider_status: AISProviderStatus
    targets: List[AISVesselMessage]
    total_targets: int
    generated_at: datetime

