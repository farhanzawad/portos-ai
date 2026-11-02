"""SimPy Discrete-Event Simulation Engine for PORTOS AI Decision Lab.

Models the operational terminal chain:
Vessel arrival → anchorage queue → berth allocation → crane assignment → cargo handling → berth release → vessel departure.
"""

from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, timedelta, timezone
import random
import numpy as np
import simpy

from app.schemas.simulation import (
    ScenarioParameters,
    SimulationMetrics,
    SimulationRunResponse,
    TimeSeriesSample,
    VesselSimulationLog,
)
from app.db.base import DataStatusEnum


class PortSimulationEngine:
    """Deterministic discrete-event simulation runtime powered by SimPy."""

    # Default Chattogram-inspired terminal configuration
    TOTAL_BERTHS_BASELINE = 6
    TOTAL_CRANES_BASELINE = 5
    MEAN_CONTAINER_MOVES = 550
    BASE_CRANE_MOVES_PER_HOUR = 28.0

    def __init__(self, ref_start: Optional[datetime] = None):
        self.ref_start = ref_start or datetime(2026, 11, 3, 0, 0, 0, tzinfo=timezone.utc)
        if self.ref_start.tzinfo is None:
            self.ref_start = self.ref_start.replace(tzinfo=timezone.utc)

    def run(self, params: ScenarioParameters) -> SimulationRunResponse:
        """Execute a deterministic discrete-event simulation run."""
        # 1. Initialize RNG with specified random_seed for exact reproducibility
        rng = np.random.default_rng(params.random_seed)

        # 2. Determine resource capacities
        effective_berths = max(1, self.TOTAL_BERTHS_BASELINE - params.berth_outage_count)
        effective_cranes = max(1, self.TOTAL_CRANES_BASELINE - params.crane_outage_count)

        # 3. Setup SimPy Environment & Resources
        env = simpy.Environment()
        berths_resource = simpy.Resource(env, capacity=effective_berths)
        cranes_resource = simpy.Resource(env, capacity=effective_cranes)

        # Tracking state
        vessel_logs: List[VesselSimulationLog] = []
        queue_samples: List[Tuple[float, int]] = []
        berth_samples: List[Tuple[float, int]] = []

        total_berth_busy_hours = 0.0
        total_crane_busy_hours = 0.0

        # Periodic hourly monitor process
        def monitor_process():
            while True:
                # Number of vessels waiting in queue for a berth
                q_len = len(berths_resource.queue)
                # Number of occupied berths
                b_occ = berths_resource.count
                queue_samples.append((env.now, q_len))
                berth_samples.append((env.now, b_occ))
                yield env.timeout(1.0)

        # Individual vessel operational lifecycle process
        def vessel_process(v_id: str, v_name: str, c_num: str, arr_time: float, moves: int):
            nonlocal total_berth_busy_hours, total_crane_busy_hours

            # Step 1: Wait until vessel arrival time
            yield env.timeout(arr_time)
            arrival_epoch = env.now

            # Step 2: Enter Outer Anchorage queue and request Berth
            berth_req = berths_resource.request()
            yield berth_req

            berth_epoch = env.now
            waiting_time = max(0.0, berth_epoch - arrival_epoch)

            # Step 3: Request Crane capacity (typically 1 or 2 cranes based on vessel size)
            crane_count = 2 if moves > 600 and effective_cranes >= 2 else 1
            crane_req = cranes_resource.request()
            yield crane_req

            # Step 4: Cargo handling service
            # Base service duration = moves / (crane_moves_per_hr * crane_count)
            effective_rate = (
                self.BASE_CRANE_MOVES_PER_HOUR
                * params.crane_service_rate_multiplier
                * crane_count
            )
            base_duration = moves / effective_rate
            # Apply weather disruption factor
            service_duration = round(base_duration * params.weather_disruption_factor, 2)

            yield env.timeout(service_duration)

            total_crane_busy_hours += service_duration * crane_count
            cranes_resource.release(crane_req)

            # Step 5: Unberthing maneuver & release berth (0.5 hour turnaround)
            yield env.timeout(0.5)
            departure_epoch = env.now

            total_berth_busy_hours += (departure_epoch - berth_epoch)
            berths_resource.release(berth_req)

            # Record completed vessel log
            vessel_logs.append(
                VesselSimulationLog(
                    vessel_id=v_id,
                    vessel_name=v_name,
                    call_number=c_num,
                    arrival_hour=round(arrival_epoch, 2),
                    berth_hour=round(berth_epoch, 2),
                    departure_hour=round(departure_epoch, 2),
                    waiting_time_hours=round(waiting_time, 2),
                    service_duration_hours=service_duration,
                    status="SERVED",
                )
            )

        # 4. Generate Vessel Arrivals
        # Base inter-arrival: exponential distribution with mean ~ 4.5 hours
        # Multiplied by vessel_arrival_multiplier
        mean_inter_arrival = 4.5 / max(0.1, params.vessel_arrival_multiplier)

        current_time = 0.5
        vessel_counter = 1
        feeder_names = [
            "MV Karnaphuli Pioneer", "MV Bay Feeder Express", "MV Padma Bridge Star",
            "MV Karnaphuli Express", "MV Bengal Pearl", "MV Meghna Carrier",
            "MV Sundarban Pride", "MV Karnaphuli Voyager", "MV Chittagong Trader",
            "MV Shitalakshya Wave", "MV Rupsha Hope", "MV Jamuna Horizon",
            "MV Meghna Feeder", "MV Surma Star", "MV Buriganga Pride",
            "MV Teesta Express", "MV Turag Voyager", "MV Modhumoti Carrier",
        ]

        while current_time < params.duration_hours:
            v_id = f"vsl_sim_{vessel_counter:03d}"
            name_idx = (vessel_counter - 1) % len(feeder_names)
            v_name = f"{feeder_names[name_idx]} [Run #{vessel_counter}]"
            c_num = f"CALL-SIM-{vessel_counter:03d}"
            moves = int(rng.normal(self.MEAN_CONTAINER_MOVES, 80))
            moves = max(250, min(900, moves))

            env.process(vessel_process(v_id, v_name, c_num, current_time, moves))

            # Sample next arrival
            delta = float(rng.exponential(mean_inter_arrival))
            current_time += delta
            vessel_counter += 1

        # Start periodic monitor
        env.process(monitor_process())

        # 5. Run SimPy Simulation Horizon
        env.run(until=params.duration_hours)

        # 6. Aggregate Unserved Vessels in Queue or at Berth
        served_count = len(vessel_logs)
        served_ids = {v.vessel_id for v in vessel_logs}

        # Any vessel that arrived before duration_hours but did not finish
        # Check current queue length
        remaining_queue_count = len(berths_resource.queue)
        currently_berhed_count = berths_resource.count

        # 7. Compute Statistical Metrics
        if vessel_logs:
            wait_times = [v.waiting_time_hours for v in vessel_logs]
            mean_wait = round(float(np.mean(wait_times)), 2)
            median_wait = round(float(np.median(wait_times)), 2)
            p90_wait = round(float(np.percentile(wait_times, 90)), 2)
            total_wait = round(float(np.sum(wait_times)), 2)
        else:
            mean_wait = 0.0
            median_wait = 0.0
            p90_wait = 0.0
            total_wait = 0.0

        # Berth Utilization: total busy hours / (capacity * duration)
        total_berth_capacity_hours = effective_berths * params.duration_hours
        berth_util = round(
            min(100.0, (total_berth_busy_hours / max(1.0, total_berth_capacity_hours)) * 100), 1
        )

        # Crane Utilization: total crane busy hours / (capacity * duration)
        total_crane_capacity_hours = effective_cranes * params.duration_hours
        crane_util = round(
            min(100.0, (total_crane_busy_hours / max(1.0, total_crane_capacity_hours)) * 100), 1
        )

        # Secondary Environmental Output:
        # Auxiliary engine waiting emissions for vessels idling at outer anchorage
        # IMO GHG Study emission factor for container feeder at anchor ~ 0.18 tonnes CO2/hour
        co2_tonnes = round(total_wait * 0.18, 2)

        metrics = SimulationMetrics(
            mean_waiting_time_hours=mean_wait,
            median_waiting_time_hours=median_wait,
            p90_waiting_time_hours=p90_wait,
            total_waiting_hours=total_wait,
            berth_utilization_pct=berth_util,
            crane_utilization_pct=crane_util,
            vessels_served_count=served_count,
            vessels_remaining_queue=remaining_queue_count,
            estimated_secondary_co2_tonnes=co2_tonnes,
        )

        # 8. Time Series formatting
        queue_series = [
            TimeSeriesSample(
                hour=round(t, 1),
                timestamp_iso=(self.ref_start + timedelta(hours=t)).isoformat(),
                value=float(q),
            )
            for t, q in queue_samples
        ]

        berth_series = [
            TimeSeriesSample(
                hour=round(t, 1),
                timestamp_iso=(self.ref_start + timedelta(hours=t)).isoformat(),
                value=float(b),
            )
            for t, b in berth_samples
        ]

        # Methodology Notes
        methodology_notes = [
            f"SimPy discrete-event simulation with seed={params.random_seed}.",
            f"Terminal resources: {effective_berths} operational berths, {effective_cranes} active STS cranes.",
            f"Vessel arrival process: Poisson process with mean interval {round(mean_inter_arrival, 2)}h (multiplier={params.vessel_arrival_multiplier}).",
            f"Disruption assumptions: Weather factor={params.weather_disruption_factor}, Crane rate multiplier={params.crane_service_rate_multiplier}.",
            "CO2 emissions factor: 0.18 tonnes CO2 per vessel-waiting-hour at Outer Anchorage (IMO GHG 4th Study average feeder auxiliary load).",
            "Model outputs reflect simulated scenario dynamics only and are not observed Chattogram Port Authority telemetry.",
        ]

        run_id = f"sim_{params.scenario_code}_{params.random_seed}_{int(datetime.now(timezone.utc).timestamp())}"

        return SimulationRunResponse(
            run_id=run_id,
            scenario_code=params.scenario_code,
            scenario_name=params.scenario_name,
            is_baseline=params.is_baseline,
            random_seed=params.random_seed,
            duration_hours=params.duration_hours,
            parameters=params,
            metrics=metrics,
            queue_length_series=queue_series,
            berth_occupancy_series=berth_series,
            vessel_logs=vessel_logs,
            methodology_notes=methodology_notes,
            data_status=DataStatusEnum.SIMULATED,
        )
