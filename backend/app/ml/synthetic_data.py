"""Synthetic Data Generator for Vessel ETA and Delay-Risk Modeling.

Generates reproducible, operationally grounded synthetic vessel arrival observations
for the Chattogram Port Karnaphuli approach channel.

Assumptions & Parametric Relationships:
- Vessel Types: CONTAINER_FEEDER, BULK_CARRIER, GENERAL_CARGO, TANKER
- Deep draft vessels (>8.5m draft) depend on high-tide windows; missing the tidal window
  adds 6.0 to 12.0 hours of waiting time at outer anchorage.
- Anchorage congestion: each additional vessel awaiting in outer anchorage adds 0.25 to 0.5 hours
  of pilotage queue delay.
- Monsoon season (June-September) increases wind and sea state, elevating schedule variance.
- High berth occupancy (>80%) significantly increases waiting time for berths.
"""

from typing import Tuple
import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "vessel_type_code",
    "distance_to_pilot_nm",
    "speed_knots",
    "scheduled_hour_of_day",
    "anchorage_queue_count",
    "berth_occupancy_ratio",
    "wind_speed_knots",
    "visibility_nm",
    "is_monsoon_season",
    "tidal_window_favorable",
    "carrier_historical_delay_mean",
]

TARGET_REGRESSION = "arrival_delay_hours"
TARGET_CLASSIFICATION = "is_delayed_high_risk"
HIGH_RISK_DELAY_THRESHOLD_HOURS = 3.0


def generate_synthetic_vessel_data(
    n_samples: int = 2500,
    random_seed: int = 42,
) -> pd.DataFrame:
    """Generate reproducible synthetic vessel voyages with ground-truth delay outcomes."""
    rng = np.random.default_rng(random_seed)

    # 1. Vessel Type: 0: CONTAINER_FEEDER (60%), 1: BULK_CARRIER (20%), 2: GENERAL_CARGO (15%), 3: TANKER (5%)
    vessel_type_codes = rng.choice(
        [0, 1, 2, 3],
        size=n_samples,
        p=[0.60, 0.20, 0.15, 0.05],
    )

    # 2. Distance to Pilot Station Remaining (NM): 5 to 140 NM
    distances = rng.uniform(5.0, 140.0, size=n_samples)

    # 3. Current Operating Speed (Knots): 8 to 17 knots
    base_speeds = np.where(vessel_type_codes == 0, 13.5, 11.0)
    speeds = np.clip(rng.normal(base_speeds, 1.8), 6.0, 19.0)

    # 4. Scheduled Arrival Hour of Day (0 to 23)
    scheduled_hours = rng.integers(0, 24, size=n_samples)

    # 5. Anchorage Queue Density (number of vessels currently at outer anchorage): 1 to 18
    anchorage_queues = rng.poisson(lam=6.5, size=n_samples)
    anchorage_queues = np.clip(anchorage_queues, 0, 22)

    # 6. Current Berth Occupancy Ratio (0.2 to 1.0)
    berth_occupancies = np.clip(rng.beta(a=5, b=2, size=n_samples), 0.2, 1.0)

    # 7. Monsoon Season Flag (1 for June-September, ~33% of the year)
    is_monsoon = rng.choice([0, 1], size=n_samples, p=[0.67, 0.33])

    # 8. Wind Speed (Knots) - higher during monsoon
    wind_mean = np.where(is_monsoon == 1, 18.0, 9.0)
    winds = np.clip(rng.normal(wind_mean, 5.0), 2.0, 42.0)

    # 9. Visibility (NM) - reduced during heavy monsoon rain or winter haze
    vis_mean = np.where(is_monsoon == 1, 5.5, 9.5)
    visibilities = np.clip(rng.normal(vis_mean, 2.0), 1.0, 15.0)

    # 10. Tidal Window Favorable for Karnaphuli transit (1 if favorable high water, 0 if low water)
    # Chattogram has semidiurnal tides; ~50% of arrival times align directly with the high tide window
    tidal_favorable = rng.choice([0, 1], size=n_samples, p=[0.45, 0.55])

    # 11. Carrier Historical Average Delay (hours)
    carrier_delays = np.clip(rng.normal(1.2, 1.5, size=n_samples), -1.0, 6.0)

    # -------------------------------------------------------------
    # Synthesize Target: Arrival Delay Hours (Mechanistic + Noise)
    # -------------------------------------------------------------
    # Speed/Distance transit variance
    nominal_transit_time = distances / np.maximum(speeds, 5.0)
    scheduled_buffer = distances / 12.0
    transit_deficit = np.maximum(0.0, nominal_transit_time - scheduled_buffer)

    # Queue delay contribution: ~0.35h per awaiting vessel in outer anchorage
    queue_delay = anchorage_queues * 0.38

    # Berth congestion contribution: non-linear spike when occupancy > 80%
    berth_delay = np.where(berth_occupancies > 0.80, (berth_occupancies - 0.80) * 8.0, 0.0)

    # Tidal delay contribution: if unfavorable and deep draft (bulk or laden feeder)
    tidal_delay = np.where(
        (tidal_favorable == 0) & (vessel_type_codes != 2),
        rng.uniform(3.5, 7.5, size=n_samples),
        0.0,
    )

    # Weather delay contribution: strong winds (>22 kts) or low visibility (<3 NM) suspend pilotage
    weather_delay = np.where(winds > 22.0, (winds - 22.0) * 0.18, 0.0) + np.where(
        visibilities < 3.0, (3.0 - visibilities) * 1.2, 0.0
    )

    # Carrier schedule bias
    carrier_effect = np.maximum(-0.5, carrier_delays * 0.6)

    # Residual stochastic Gaussian noise
    noise = rng.normal(0.0, 0.65, size=n_samples)

    raw_delay = (
        transit_deficit
        + queue_delay
        + berth_delay
        + tidal_delay
        + weather_delay
        + carrier_effect
        + noise
    )

    # Delay cannot be physically less than -1.5h (early arrival cap)
    delay_hours = np.round(np.clip(raw_delay, -1.5, 24.0), 2)

    # Binary high risk classification target (delay >= 3.0 hours)
    is_high_risk = (delay_hours >= HIGH_RISK_DELAY_THRESHOLD_HOURS).astype(int)

    # Unique voyage ID for grouped cross-validation / splitting
    voyage_ids = [f"VOY-SYNTH-{i:05d}" for i in range(1, n_samples + 1)]

    df = pd.DataFrame(
        {
            "voyage_id": voyage_ids,
            "vessel_type_code": vessel_type_codes,
            "distance_to_pilot_nm": np.round(distances, 1),
            "speed_knots": np.round(speeds, 1),
            "scheduled_hour_of_day": scheduled_hours,
            "anchorage_queue_count": anchorage_queues,
            "berth_occupancy_ratio": np.round(berth_occupancies, 2),
            "wind_speed_knots": np.round(winds, 1),
            "visibility_nm": np.round(visibilities, 1),
            "is_monsoon_season": is_monsoon,
            "tidal_window_favorable": tidal_favorable,
            "carrier_historical_delay_mean": np.round(carrier_delays, 2),
            TARGET_REGRESSION: delay_hours,
            TARGET_CLASSIFICATION: is_high_risk,
        }
    )

    return df

