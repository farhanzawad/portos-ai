import time
import math
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
import httpx

from app.db.base import DataStatusEnum
from app.schemas.weather import (
    WeatherContextRead,
    WeatherForecastHourlyItem,
    WeatherForecastResponse,
)

logger = logging.getLogger("portos-weather")

OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=22.23&longitude=91.81"
    "&current=temperature_2m,wind_speed_10m,wind_direction_10m,visibility"
    "&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,visibility"
    "&wind_speed_unit=kn&forecast_days=2&timezone=Asia%2FDhaka"
)

ATTRIBUTION_OPEN_METEO = "Weather data by Open-Meteo.com under Creative Commons Attribution 4.0 International (CC BY 4.0)"
ATTRIBUTION_SYNTHETIC = "PORTOS Calibrated Synthetic Estuary Model (Fallback Demonstration Baseline)"

COMPASS_DIRECTIONS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
]


def degrees_to_compass(deg: float) -> str:
    """Convert meteorological wind direction in degrees to 16-point compass string."""
    idx = int((deg + 11.25) / 22.5) % 16
    return COMPASS_DIRECTIONS[idx]


def evaluate_sea_condition(wind_knots: float) -> str:
    """Derive indicative Karnaphuli approach sea state from wind speed (Beaufort mapping)."""
    if wind_knots < 7.0:
        return "Calm (Smooth)"
    elif wind_knots < 12.0:
        return "Smooth to Slight"
    elif wind_knots < 18.0:
        return "Slight to Moderate"
    elif wind_knots < 25.0:
        return "Moderate to Rough"
    else:
        return "Rough (Swell Advisory)"


class WeatherAdapter:
    """Configurable external weather context provider with caching and deterministic fallback."""

    def __init__(self, cache_ttl_seconds: int = 900):  # 15 minutes TTL
        self.cache_ttl_seconds = cache_ttl_seconds
        self._cached_current: Optional[WeatherContextRead] = None
        self._cached_current_epoch: float = 0.0
        self._cached_forecast_items: List[WeatherForecastHourlyItem] = []
        self._cached_forecast_source: str = ""
        self._cached_forecast_attribution: str = ""
        self._cached_forecast_status: DataStatusEnum = DataStatusEnum.FORECAST
        self._cached_forecast_epoch: float = 0.0

    def get_current_weather(self, force_refresh: bool = False) -> WeatherContextRead:
        """Retrieve current weather context, utilizing cache, live Open-Meteo API, or fallback."""
        now_epoch = time.time()

        # 1. Check valid cache
        if (
            not force_refresh
            and self._cached_current is not None
            and (now_epoch - self._cached_current_epoch) < self.cache_ttl_seconds
        ):
            # Return copy with is_cached = True
            cached = self._cached_current.model_copy()
            cached.is_cached = True
            return cached

        # 2. Attempt live query to Open-Meteo
        try:
            with httpx.Client(timeout=3.5) as client:
                resp = client.get(OPEN_METEO_URL)
                if resp.status_code == 200:
                    data = resp.json()
                    curr = data.get("current", {})

                    temp_c = float(curr.get("temperature_2m", 28.5))
                    wind_kn = float(curr.get("wind_speed_10m", 12.0))
                    wind_deg = float(curr.get("wind_direction_10m", 195.0))
                    vis_m = float(curr.get("visibility", 10000.0))
                    vis_km = round(vis_m / 1000.0, 1)

                    compass = degrees_to_compass(wind_deg)
                    sea_state = evaluate_sea_condition(wind_kn)

                    # Estimate tidal height using Karnaphuli semi-diurnal sinusoidal model
                    now_utc = datetime.now(timezone.utc)
                    hour_float = now_utc.hour + now_utc.minute / 60.0
                    tide_m = round(2.5 + 1.4 * math.sin(hour_float * math.pi / 6.2), 2)
                    tide_phase = "High Slack / Ebb" if tide_m > 3.0 else "Flood Tide"

                    obs_weather = WeatherContextRead(
                        station_name="Karnaphuli River Estuary Station / Patenga Marine Approach",
                        latitude=22.23,
                        longitude=91.81,
                        retrieval_timestamp=now_utc,
                        forecast_timestamp=now_utc,
                        source="Open-Meteo Marine & Weather API",
                        attribution=ATTRIBUTION_OPEN_METEO,
                        temperature_celsius=temp_c,
                        wind_speed_knots=wind_kn,
                        wind_direction_deg=wind_deg,
                        wind_direction_compass=f"{compass} ({int(wind_deg)}°)",
                        visibility_km=vis_km,
                        wave_height_m=round(0.4 + (wind_kn * 0.05), 1),
                        sea_condition=sea_state,
                        tidal_height_m=tide_m,
                        tide_phase=tide_phase,
                        is_cached=False,
                        is_live=True,
                        data_status=DataStatusEnum.OBSERVED,
                    )

                    # Update in-memory cache
                    self._cached_current = obs_weather
                    self._cached_current_epoch = now_epoch
                    return obs_weather

        except Exception as e:
            logger.warning("External weather API unavailable (%s); falling back to deterministic baseline.", str(e))

        # 3. Deterministic Fallback if network or API fails
        return self._get_deterministic_fallback()

    def get_forecast(self, hours: int = 24, force_refresh: bool = False) -> WeatherForecastResponse:
        """Retrieve multi-hour forecasted weather outlook for planning horizons."""
        now_epoch = time.time()
        if (
            not force_refresh
            and self._cached_forecast_items
            and (now_epoch - self._cached_forecast_epoch) < self.cache_ttl_seconds
        ):
            return WeatherForecastResponse(
                location="Chattogram Fairway & Outer Anchorage (22.23°N, 91.81°E)",
                latitude=22.23,
                longitude=91.81,
                source=self._cached_forecast_source,
                attribution=self._cached_forecast_attribution,
                forecast_items=self._cached_forecast_items[:hours],
                data_status=self._cached_forecast_status,
                navigational_warning=(
                    "Contextual marine forecast product only. Not certified for navigational clearance, "
                    "vessel pilotage, or berth maneuvering safety decisions."
                ),
            )

        try:
            with httpx.Client(timeout=3.5) as client:
                resp = client.get(OPEN_METEO_URL)
                if resp.status_code == 200:
                    data = resp.json()
                    hourly = data.get("hourly", {})
                    times = hourly.get("time", [])
                    temps = hourly.get("temperature_2m", [])
                    winds = hourly.get("wind_speed_10m", [])
                    dirs = hourly.get("wind_direction_10m", [])
                    viss = hourly.get("visibility", [])

                    items: List[WeatherForecastHourlyItem] = []
                    for t, tmp, wnd, d, v in zip(times, temps, winds, dirs, viss):
                        wnd_val = float(wnd)
                        d_val = float(d)
                        items.append(
                            WeatherForecastHourlyItem(
                                time=str(t),
                                temperature_celsius=float(tmp),
                                wind_speed_knots=round(wnd_val, 1),
                                wind_direction_compass=degrees_to_compass(d_val),
                                visibility_km=round(float(v) / 1000.0, 1),
                                wave_height_m=round(0.3 + (wnd_val * 0.04), 1),
                            )
                        )

                    self._cached_forecast_items = items
                    self._cached_forecast_source = "Open-Meteo Marine & Weather API"
                    self._cached_forecast_attribution = ATTRIBUTION_OPEN_METEO
                    self._cached_forecast_status = DataStatusEnum.FORECAST
                    self._cached_forecast_epoch = now_epoch

                    return WeatherForecastResponse(
                        location="Chattogram Fairway & Outer Anchorage (22.23°N, 91.81°E)",
                        latitude=22.23,
                        longitude=91.81,
                        source="Open-Meteo Marine & Weather API",
                        attribution=ATTRIBUTION_OPEN_METEO,
                        forecast_items=items[:hours],
                        data_status=DataStatusEnum.FORECAST,
                        navigational_warning=(
                            "Contextual marine forecast product only. Not certified for navigational clearance, "
                            "vessel pilotage, or berth maneuvering safety decisions."
                        ),
                    )

        except Exception as e:
            logger.warning("Forecast API query failed (%s); generating synthetic deterministic forecast.", str(e))

        # Synthetic Fallback Forecast
        return self._generate_synthetic_forecast(hours)

    def _get_deterministic_fallback(self) -> WeatherContextRead:
        """Deterministic, grounded fallback mimicking realistic Karnaphuli meteorological baseline."""
        now_utc = datetime.now(timezone.utc)
        return WeatherContextRead(
            station_name="Karnaphuli River Estuary Station / Patenga (Synthetic Fallback)",
            latitude=22.23,
            longitude=91.81,
            retrieval_timestamp=now_utc,
            forecast_timestamp=now_utc,
            source="PORTOS Synthetic Marine Generator",
            attribution=ATTRIBUTION_SYNTHETIC,
            temperature_celsius=29.2,
            wind_speed_knots=14.5,
            wind_direction_deg=205.0,
            wind_direction_compass="SSW (205°)",
            visibility_km=8.5,
            wave_height_m=1.1,
            sea_condition="Slight to Moderate",
            tidal_height_m=3.42,
            tide_phase="Ebb Tide (High Slack)",
            is_cached=False,
            is_live=False,
            data_status=DataStatusEnum.SIMULATED,
        )

    def _generate_synthetic_forecast(self, hours: int) -> WeatherForecastResponse:
        """Deterministic 24h forecast curve when network is offline."""
        now = datetime.now(timezone.utc)
        items: List[WeatherForecastHourlyItem] = []
        for i in range(hours):
            t_dt = now + timedelta(hours=i)
            # Diurnal temperature curve
            temp = round(26.0 + 5.0 * math.sin((t_dt.hour - 4) * math.pi / 12.0), 1)
            # Wind speed variation
            wind = round(11.0 + 4.5 * math.cos((t_dt.hour - 2) * math.pi / 8.0), 1)
            items.append(
                WeatherForecastHourlyItem(
                    time=t_dt.strftime("%Y-%m-%dT%H:00"),
                    temperature_celsius=temp,
                    wind_speed_knots=wind,
                    wind_direction_compass="SSW",
                    visibility_km=9.0,
                    wave_height_m=round(0.5 + wind * 0.04, 1),
                )
            )

        return WeatherForecastResponse(
            location="Chattogram Fairway & Outer Anchorage (Synthetic Calibration)",
            latitude=22.23,
            longitude=91.81,
            source="PORTOS Synthetic Marine Generator",
            attribution=ATTRIBUTION_SYNTHETIC,
            forecast_items=items,
            data_status=DataStatusEnum.SIMULATED,
            navigational_warning=(
                "Contextual marine forecast product only. Not certified for navigational clearance, "
                "vessel pilotage, or berth maneuvering safety decisions."
            ),
        )


weather_adapter = WeatherAdapter()
