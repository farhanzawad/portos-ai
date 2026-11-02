"""Preset benchmark scenarios and comparative evaluation helpers for Decision Lab."""

from typing import List, Dict, Any
from app.schemas.simulation import (
    ScenarioParameters,
    SimulationRunResponse,
    ScenarioComparisonResponse,
    MetricDelta,
)


def get_preset_scenarios() -> List[ScenarioParameters]:
    """Return standard benchmark disruption scenarios for Decision Lab."""
    return [
        ScenarioParameters(
            scenario_code="baseline_normal",
            scenario_name="Standard Baseline Terminal Operations",
            description="All 6 berths active, 5 STS cranes operational, normal monsoon sea state, nominal arrival volume.",
            is_baseline=True,
            random_seed=42,
            duration_hours=72.0,
            vessel_arrival_multiplier=1.0,
            berth_outage_count=0,
            crane_outage_count=0,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
        ),
        ScenarioParameters(
            scenario_code="monsoon_weather_squall",
            scenario_name="Monsoon Weather Squall & Rough Sea",
            description="High swells and squalls in the Bay of Bengal approach corridor: 35% service slowdown and 15% degraded crane handling rate.",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            vessel_arrival_multiplier=1.0,
            berth_outage_count=0,
            crane_outage_count=0,
            crane_service_rate_multiplier=0.85,
            weather_disruption_factor=1.35,
        ),
        ScenarioParameters(
            scenario_code="berth_cct2_closure",
            scenario_name="Berth CCT-2 Quay Maintenance Outage",
            description="Berth CCT-2 closed for urgent quay slab repairs: terminal reduced to 5 operational berths for the 72-hour window.",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            vessel_arrival_multiplier=1.0,
            berth_outage_count=1,
            crane_outage_count=0,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
        ),
        ScenarioParameters(
            scenario_code="inbound_feeder_surge",
            scenario_name="Pre-Eid Inbound Feeder Surge (+30%)",
            description="Seasonal transshipment cargo surge from Colombo/Singapore: 30% increase in feeder arrivals.",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            vessel_arrival_multiplier=1.30,
            berth_outage_count=0,
            crane_outage_count=0,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
        ),
        ScenarioParameters(
            scenario_code="sts_crane_breakdown",
            scenario_name="Quayside Dual STS Crane Outage",
            description="Electrical power converter fault takes 2 STS gantry cranes offline (3 operational cranes remaining).",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            vessel_arrival_multiplier=1.0,
            berth_outage_count=0,
            crane_outage_count=2,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
        ),
    ]


def build_scenario_comparison(
    baseline_run: SimulationRunResponse,
    alternative_runs: List[SimulationRunResponse],
) -> ScenarioComparisonResponse:
    """Compute mathematical deltas and trade-offs between baseline and alternative runs."""
    comparisons: Dict[str, Dict[str, MetricDelta]] = {}
    trade_off_summary: List[str] = []

    base_m = baseline_run.metrics

    for alt in alternative_runs:
        alt_m = alt.metrics
        alt_code = alt.scenario_code

        # Metric deltas
        def calc_delta(b_val: float, a_val: float) -> MetricDelta:
            diff = round(a_val - b_val, 2)
            pct = round((diff / b_val * 100) if b_val != 0 else 0.0, 1)
            return MetricDelta(
                baseline_value=b_val,
                alternative_value=a_val,
                absolute_delta=diff,
                percentage_delta=pct,
            )

        deltas = {
            "mean_waiting_time_hours": calc_delta(base_m.mean_waiting_time_hours, alt_m.mean_waiting_time_hours),
            "total_waiting_hours": calc_delta(base_m.total_waiting_hours, alt_m.total_waiting_hours),
            "berth_utilization_pct": calc_delta(base_m.berth_utilization_pct, alt_m.berth_utilization_pct),
            "vessels_served_count": calc_delta(float(base_m.vessels_served_count), float(alt_m.vessels_served_count)),
            "vessels_remaining_queue": calc_delta(float(base_m.vessels_remaining_queue), float(alt_m.vessels_remaining_queue)),
            "estimated_secondary_co2_tonnes": calc_delta(base_m.estimated_secondary_co2_tonnes, alt_m.estimated_secondary_co2_tonnes),
        }
        comparisons[alt_code] = deltas

        # Generate human-readable trade-off statement
        wait_diff = deltas["mean_waiting_time_hours"]
        co2_diff = deltas["estimated_secondary_co2_tonnes"]
        served_diff = deltas["vessels_served_count"]

        wait_word = "increases" if wait_diff.absolute_delta >= 0 else "reduces"
        co2_word = "additional" if co2_diff.absolute_delta >= 0 else "reduced"

        statement = (
            f"Scenario '{alt.scenario_name}' {wait_word} average queue waiting time by "
            f"{abs(wait_diff.absolute_delta)}h ({'+' if wait_diff.percentage_delta >= 0 else ''}{wait_diff.percentage_delta}%), "
            f"serves {int(alt_m.vessels_served_count)} calls ({'+' if served_diff.absolute_delta >= 0 else ''}{int(served_diff.absolute_delta)} vs baseline), "
            f"and generates an estimated {abs(co2_diff.absolute_delta)}t of {co2_word} anchorage auxiliary CO2 emissions."
        )
        trade_off_summary.append(statement)

    return ScenarioComparisonResponse(
        baseline_run=baseline_run,
        alternative_runs=alternative_runs,
        comparisons=comparisons,
        trade_off_summary=trade_off_summary,
    )

