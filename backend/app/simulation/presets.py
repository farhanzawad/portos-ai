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
            description="All 6 berths active, 5 STS/RTG cranes operational, nominal monsoon sea state, 65% initial yard occupancy.",
            is_baseline=True,
            random_seed=42,
            duration_hours=72.0,
            target_reliability_pct=85.0,
            delay_threshold_hours=3.0,
            vessel_arrival_multiplier=1.0,
            arrival_surge_pct=0.0,
            arrival_concentration="UNIFORM",
            berth_outage_count=0,
            crane_outage_count=0,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
            wind_speed_knots=12.0,
            wave_height_meters=1.1,
            visibility_km=10.0,
            yard_initial_occupancy_pct=65.0,
            yard_dwell_time_multiplier=1.0,
            gate_throughput_reduction_pct=0.0,
            cargo_moves_multiplier=1.0,
        ),
        ScenarioParameters(
            scenario_code="monsoon_weather_squall",
            scenario_name="Monsoon Weather Squall & Rough Sea",
            description="High swells and tropical squalls in the Bay of Bengal approach corridor: 35% service slowdown and 15% degraded crane handling rate.",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            target_reliability_pct=65.0,
            delay_threshold_hours=6.0,
            vessel_arrival_multiplier=1.0,
            arrival_surge_pct=0.0,
            arrival_concentration="TIDAL_WINDOW",
            berth_outage_count=0,
            crane_outage_count=0,
            crane_service_rate_multiplier=0.85,
            weather_disruption_factor=1.35,
            wind_speed_knots=34.0,
            wave_height_meters=2.6,
            visibility_km=3.5,
            weather_start_hour=8.0,
            weather_duration_hours=36.0,
            yard_initial_occupancy_pct=65.0,
            cargo_moves_multiplier=1.0,
        ),
        ScenarioParameters(
            scenario_code="inbound_feeder_surge",
            scenario_name="Pre-Eid Inbound Feeder Surge (+30%)",
            description="Seasonal transshipment cargo surge from Colombo/Singapore: 30% increase in feeder arrivals with morning concentration.",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            target_reliability_pct=80.0,
            delay_threshold_hours=4.0,
            vessel_arrival_multiplier=1.30,
            arrival_surge_pct=30.0,
            arrival_concentration="MORNING_PEAK",
            berth_outage_count=0,
            crane_outage_count=0,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
            wind_speed_knots=14.0,
            wave_height_meters=1.2,
            visibility_km=10.0,
            yard_initial_occupancy_pct=72.0,
            yard_dwell_time_multiplier=1.1,
            gate_throughput_reduction_pct=5.0,
            cargo_moves_multiplier=1.05,
        ),
        ScenarioParameters(
            scenario_code="berth_cct2_closure",
            scenario_name="Berth CCT-2 Quay Maintenance Outage",
            description="Berth CCT-2 closed for urgent quay slab and fender repairs: terminal reduced to 5 operational berths for the 72-hour window.",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            target_reliability_pct=75.0,
            delay_threshold_hours=4.0,
            vessel_arrival_multiplier=1.0,
            arrival_surge_pct=0.0,
            arrival_concentration="UNIFORM",
            berth_outage_count=1,
            closed_berth_ids=["BERTH_02"],
            berth_closure_start_hour=0.0,
            berth_closure_duration_hours=72.0,
            berth_closure_reason="MAINTENANCE",
            crane_outage_count=0,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
            yard_initial_occupancy_pct=65.0,
            cargo_moves_multiplier=1.0,
        ),
        ScenarioParameters(
            scenario_code="sts_crane_breakdown",
            scenario_name="Quayside Dual STS Crane Outage",
            description="Electrical power converter fault takes 2 STS gantry cranes offline (3 operational cranes remaining across quayside).",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            target_reliability_pct=70.0,
            delay_threshold_hours=5.0,
            vessel_arrival_multiplier=1.0,
            arrival_surge_pct=0.0,
            arrival_concentration="UNIFORM",
            berth_outage_count=0,
            crane_outage_count=2,
            failed_crane_ids=["STS_02", "STS_03"],
            crane_failure_start_hour=12.0,
            crane_repair_duration_hours=48.0,
            crane_service_rate_multiplier=0.90,
            weather_disruption_factor=1.0,
            yard_initial_occupancy_pct=68.0,
            cargo_moves_multiplier=1.0,
        ),
        ScenarioParameters(
            scenario_code="yard_capacity_bottleneck",
            scenario_name="Yard Congestion & Gate Bottleneck",
            description="Container yard stacks operating at 90%+ capacity: prolonged dwell times and gate bottleneck trigger terminal tractor delays.",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            target_reliability_pct=70.0,
            delay_threshold_hours=4.5,
            vessel_arrival_multiplier=1.10,
            arrival_surge_pct=10.0,
            arrival_concentration="UNIFORM",
            berth_outage_count=0,
            crane_outage_count=0,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
            yard_initial_occupancy_pct=88.0,
            yard_dwell_time_multiplier=1.45,
            gate_throughput_reduction_pct=35.0,
            yard_congestion_threshold_pct=82.0,
            cargo_moves_multiplier=1.10,
        ),
        ScenarioParameters(
            scenario_code="increased_cargo_demand",
            scenario_name="High-Density Cargo Handling Demand (+40%)",
            description="Major regional export surge: average container moves per vessel increase by 40% (mean ~770 moves per feeder call).",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            target_reliability_pct=75.0,
            delay_threshold_hours=4.0,
            vessel_arrival_multiplier=1.0,
            arrival_surge_pct=0.0,
            arrival_concentration="UNIFORM",
            berth_outage_count=0,
            crane_outage_count=0,
            crane_service_rate_multiplier=1.0,
            weather_disruption_factor=1.0,
            yard_initial_occupancy_pct=70.0,
            cargo_moves_multiplier=1.40,
            reefer_container_pct=18.0,
        ),
        ScenarioParameters(
            scenario_code="compound_disruption",
            scenario_name="Compound Monsoon Storm & Surge Disruption",
            description="Combined operational shock: Monsoon weather squall + 25% feeder arrival surge + 1 STS crane breakdown.",
            is_baseline=False,
            random_seed=42,
            duration_hours=72.0,
            target_reliability_pct=50.0,
            delay_threshold_hours=8.0,
            vessel_arrival_multiplier=1.25,
            arrival_surge_pct=25.0,
            arrival_concentration="TIDAL_WINDOW",
            berth_outage_count=0,
            crane_outage_count=1,
            failed_crane_ids=["STS_01"],
            crane_service_rate_multiplier=0.85,
            weather_disruption_factor=1.30,
            wind_speed_knots=32.0,
            wave_height_meters=2.4,
            visibility_km=4.0,
            yard_initial_occupancy_pct=78.0,
            cargo_moves_multiplier=1.15,
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

    def calc_delta(b_val: float, a_val: float) -> MetricDelta:
        diff = round(a_val - b_val, 2)
        pct = round((diff / b_val * 100) if b_val != 0 else 0.0, 1)
        return MetricDelta(
            baseline_value=b_val,
            alternative_value=a_val,
            absolute_delta=diff,
            percentage_delta=pct,
        )

    for alt in alternative_runs:
        alt_m = alt.metrics
        alt_code = alt.scenario_code

        deltas = {
            "mean_waiting_time_hours": calc_delta(base_m.mean_waiting_time_hours, alt_m.mean_waiting_time_hours),
            "median_waiting_time_hours": calc_delta(base_m.median_waiting_time_hours, alt_m.median_waiting_time_hours),
            "p90_waiting_time_hours": calc_delta(base_m.p90_waiting_time_hours, alt_m.p90_waiting_time_hours),
            "total_waiting_hours": calc_delta(base_m.total_waiting_hours, alt_m.total_waiting_hours),
            "average_turnaround_hours": calc_delta(base_m.average_turnaround_hours, alt_m.average_turnaround_hours),
            "berth_utilization_pct": calc_delta(base_m.berth_utilization_pct, alt_m.berth_utilization_pct),
            "crane_utilization_pct": calc_delta(base_m.crane_utilization_pct, alt_m.crane_utilization_pct),
            "peak_yard_occupancy_pct": calc_delta(base_m.peak_yard_occupancy_pct, alt_m.peak_yard_occupancy_pct),
            "vessels_served_count": calc_delta(float(base_m.vessels_served_count), float(alt_m.vessels_served_count)),
            "vessels_remaining_queue": calc_delta(float(base_m.vessels_remaining_queue), float(alt_m.vessels_remaining_queue)),
            "total_teus_handled": calc_delta(float(base_m.total_teus_handled), float(alt_m.total_teus_handled)),
            "reliability_compliance_pct": calc_delta(base_m.reliability_compliance_pct, alt_m.reliability_compliance_pct),
            "estimated_secondary_co2_tonnes": calc_delta(base_m.estimated_secondary_co2_tonnes, alt_m.estimated_secondary_co2_tonnes),
            "idle_fuel_burn_liters": calc_delta(base_m.idle_fuel_burn_liters, alt_m.idle_fuel_burn_liters),
            "total_co2e_tonnes": calc_delta(base_m.total_co2e_tonnes, alt_m.total_co2e_tonnes),
        }
        comparisons[alt_code] = deltas

        # Generate structured synthesis summary
        wait_diff = deltas["mean_waiting_time_hours"]
        co2_diff = deltas["total_co2e_tonnes"]
        served_diff = deltas["vessels_served_count"]
        yard_diff = deltas["peak_yard_occupancy_pct"]

        wait_word = "increases" if wait_diff.absolute_delta >= 0 else "reduces"
        co2_word = "additional" if co2_diff.absolute_delta >= 0 else "reduced"

        statement = (
            f"Scenario '{alt.scenario_name}' {wait_word} average anchorage waiting time by "
            f"{abs(wait_diff.absolute_delta)}h ({'+' if wait_diff.percentage_delta >= 0 else ''}{wait_diff.percentage_delta}%), "
            f"serves {int(alt_m.vessels_served_count)} calls ({'+' if served_diff.absolute_delta >= 0 else ''}{int(served_diff.absolute_delta)} vs baseline), "
            f"drives peak yard stack to {alt_m.peak_yard_occupancy_pct}% ({'+' if yard_diff.absolute_delta >= 0 else ''}{yard_diff.absolute_delta}%), "
            f"and generates an estimated {abs(co2_diff.absolute_delta)}t of {co2_word} auxiliary CO2e emissions. "
            f"Primary identified bottleneck: {alt_m.primary_bottleneck} ({alt_m.bottleneck_severity})."
        )
        trade_off_summary.append(statement)

    return ScenarioComparisonResponse(
        baseline_run=baseline_run,
        alternative_runs=alternative_runs,
        comparisons=comparisons,
        trade_off_summary=trade_off_summary,
    )
