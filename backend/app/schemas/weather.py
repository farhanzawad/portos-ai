from datetime import datetime, timezone
from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.db.base import DataStatusEnum


class WeatherContextRead(BaseModel):
    """Operational weather and maritime environmental telemetry for the Chattogram corridor."""

    station_name: str = Field(default="Karnaphuli River Estuary Station / Patenga Marine Approach")
    latitude: float = Field(default=22.23, description="Chattogram approach latitude")
    longitude: float = Field(default=91.81, description="Chattogram approach longitude")
    retrieval_timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp when telemetry was retrieved",
    )
    forecast_timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Forecast validity epoch",
    )
    source: str = Field(..., description="Data provider or fallback generator")
    attribution: str = Field(..., description="Mandatory license / source attribution")
    units: Dict[str, str] = Field(
        default_factory=lambda: {
            "temperature": "°C",
            "wind_speed": "knots",
            "wind_direction": "degrees",
            "visibility": "km",
            "wave_height": "meters",
            "tidal_height": "meters",
        }
    )
    temperature_celsius: float
    wind_speed_knots: float
    wind_direction_deg: float
    wind_direction_compass: str
    visibility_km: float
    wave_height_m: Optional[float] = None
    sea_condition: str = Field(default="Slight")
    tidal_height_m: float = Field(default=3.4)
    tide_phase: str = Field(default="Ebb Tide (High Slack)")
    is_cached: bool = Field(default=False)
    is_live: bool = Field(default=True)
    data_status: DataStatusEnum = Field(default=DataStatusEnum.OBSERVED)
    navigational_warning: str = Field(
        default=(
            "Contextual marine weather product only. Not certified for navigational clearance, "
            "vessel pilotage, or berth maneuvering safety decisions."
        )
    )


class WeatherForecastHourlyItem(BaseModel):
    """Hourly forecasted maritime weather condition."""

    time: str
    temperature_celsius: float
    wind_speed_knots: float
    wind_direction_compass: str
    visibility_km: float
    wave_height_m: Optional[float] = None


class WeatherForecastResponse(BaseModel):
    """Multi-hour marine weather outlook for Chattogram fairway approach."""

    location: str = "Chattogram Fairway (22.23°N, 91.81°E)"
    latitude: float = 22.23
    longitude: float = 91.81
    source: str
    attribution: str
    forecast_items: List[WeatherForecastHourlyItem]
    data_status: DataStatusEnum
    navigational_warning: str
