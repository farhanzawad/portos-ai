from fastapi import APIRouter, Query
from app.weather.adapter import weather_adapter
from app.schemas.weather import WeatherContextRead, WeatherForecastResponse

router = APIRouter(prefix="/weather", tags=["External Weather & Maritime Environment"])


@router.get("/current", response_model=WeatherContextRead)
def get_current_weather(
    refresh: bool = Query(False, description="Force bypass in-memory cache and query provider"),
) -> WeatherContextRead:
    """Retrieve current contextual marine weather telemetry for the Chattogram fairway.
    
    Provides live observations via Open-Meteo with attribution and automatic fallback to 
    calibrated synthetic models if offline.
    """
    return weather_adapter.get_current_weather(force_refresh=refresh)


@router.get("/forecast", response_model=WeatherForecastResponse)
def get_weather_forecast(
    hours: int = Query(24, ge=6, le=48, description="Forecast horizon in hours"),
    refresh: bool = Query(False, description="Force bypass cache"),
) -> WeatherForecastResponse:
    """Retrieve multi-hour contextual marine weather and sea condition forecast."""
    return weather_adapter.get_forecast(hours=hours, force_refresh=refresh)

