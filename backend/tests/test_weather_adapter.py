import pytest
from unittest.mock import patch
import httpx
from fastapi.testclient import TestClient

from app.main import app
from app.db.base import DataStatusEnum
from app.weather.adapter import WeatherAdapter, weather_adapter, ATTRIBUTION_OPEN_METEO, ATTRIBUTION_SYNTHETIC
from app.copilot.tools import copilot_tool_registry
from app.db.session import SessionLocal


@pytest.fixture
def client():
    return TestClient(app)


def test_current_weather_schema_and_units():
    """Verify weather context returns standardized units, coordinates, and navigation disclaimer."""
    weather = weather_adapter.get_current_weather(force_refresh=True)

    assert weather.latitude == 22.23
    assert weather.longitude == 91.81
    assert weather.temperature_celsius > -10.0 and weather.temperature_celsius < 50.0
    assert weather.wind_speed_knots >= 0.0
    assert weather.visibility_km >= 0.0
    assert weather.tidal_height_m >= 0.0
    assert weather.tide_phase in ("High Slack / Ebb", "Flood Tide", "Ebb Tide (High Slack)")

    # Units dictionary
    assert weather.units["temperature"] == "°C"
    assert weather.units["wind_speed"] == "knots"
    assert weather.units["wave_height"] == "meters"

    # Mandatory disclaimer
    assert "Not certified for navigational clearance" in weather.navigational_warning
    assert "Contextual marine weather product only" in weather.navigational_warning


def test_weather_attribution_and_license():
    """Verify CC BY 4.0 or synthetic fallback attribution is always present."""
    weather = weather_adapter.get_current_weather()
    assert (
        "Open-Meteo.com under Creative Commons Attribution 4.0 International" in weather.attribution
        or "PORTOS Calibrated Synthetic Estuary Model" in weather.attribution
    )


def test_weather_in_memory_caching():
    """Verify second retrieval returns cached response without redundant HTTP queries."""
    adapter = WeatherAdapter(cache_ttl_seconds=300)
    res1 = adapter.get_current_weather(force_refresh=True)
    assert res1.is_cached is False

    res2 = adapter.get_current_weather(force_refresh=False)
    assert res2.is_cached is True
    assert res2.temperature_celsius == res1.temperature_celsius


def test_provider_failure_deterministic_fallback():
    """Verify graceful deterministic fallback when external API times out or raises an error."""
    adapter = WeatherAdapter(cache_ttl_seconds=300)

    with patch("httpx.Client.get", side_effect=httpx.ConnectTimeout("Connection timed out")):
        fallback = adapter.get_current_weather(force_refresh=True)
        assert fallback.data_status == DataStatusEnum.SIMULATED
        assert fallback.is_live is False
        assert fallback.source == "PORTOS Synthetic Marine Generator"
        assert fallback.attribution == ATTRIBUTION_SYNTHETIC
        assert fallback.temperature_celsius == 29.2
        assert "Not certified for navigational clearance" in fallback.navigational_warning


def test_forecast_hourly_items_and_disclaimer():
    """Verify multi-hour forecast generation returns discrete hourly steps with advisory warning."""
    forecast = weather_adapter.get_forecast(hours=12, force_refresh=True)

    assert len(forecast.forecast_items) == 12
    first_item = forecast.forecast_items[0]
    assert first_item.temperature_celsius > -10.0
    assert first_item.wind_speed_knots >= 0.0
    assert first_item.wind_direction_compass in [
        "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
        "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
    ]
    assert "Not certified for navigational clearance" in forecast.navigational_warning


def test_copilot_tool_get_external_weather():
    """Verify the copilot agent tool 'get_external_weather' dispatches safely."""
    db = SessionLocal()
    try:
        tool_res = copilot_tool_registry.execute_tool("get_external_weather", {"force_refresh": False}, db)
        assert "station" in tool_res
        assert "temperature_c" in tool_res
        assert "wind_speed_knots" in tool_res
        assert "attribution" in tool_res
        assert "advisory_disclaimer" in tool_res
        assert "Not certified for navigational clearance" in tool_res["advisory_disclaimer"]
    finally:
        db.close()


def test_weather_api_endpoints(client: TestClient):
    """Verify REST API /api/v1/weather endpoints return 200 with proper schemas."""
    # Current weather
    curr_res = client.get("/api/v1/weather/current")
    assert curr_res.status_code == 200
    curr_data = curr_res.json()
    assert curr_data["latitude"] == 22.23
    assert curr_data["longitude"] == 91.81
    assert "units" in curr_data
    assert "navigational_warning" in curr_data

    # Forecast weather
    fc_res = client.get("/api/v1/weather/forecast?hours=18")
    assert fc_res.status_code == 200
    fc_data = fc_res.json()
    assert len(fc_data["forecast_items"]) == 18
    assert "navigational_warning" in fc_data
