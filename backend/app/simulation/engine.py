"""SimPy Discrete-Event Simulation Engine for PORTOS AI Decision Lab.

Models the end-to-end maritime terminal operational chain:
1. Feeder vessel arrival in Bay of Bengal approach corridor
2. Holding and queueing at Outer Anchorage (Alpha/Bravo/Charlie anchorages)
3. Karnaphuli River inward transit pilotage & berthing maneuver
4. Quayside STS gantry crane allocation & container handling service
5. Terminal tractor yard haulage & RTG container block transfer
6. Cargo completion, unberthing maneuver, and outward departure to open sea.

Computes deterministic operational KPIs, Green Port emissions deltas, bottleneck diagnosis,
and generates GIS timeline state frames for digital twin visualization.
"""

from typing import List, Dict, Tuple, Optional, Any
from datetime import datetime, timedelta, timezone
import math
import numpy as np
import simpy

from app.schemas.simulation import (
    ScenarioParameters,
    SimulationMetrics,
    SimulationRunResponse,
    TimeSeriesSample,
    VesselSimulationLog,
    VesselPositionSnapshot,
    SimulationTimelineFrame,
)
from app.db.base import DataStatusEnum


# Geographic Waypoints for Chattogram Port / Karnaphuli River (Advisory demonstration coordinates)
BERTH_COORDINATES = {
    "BERTH_01": {"name": "Berth 01 (CCT-1)", "lat": 22.2982, "lon": 91.8152, "heading": 18.0},
    "BERTH_02": {"name": "Berth 02 (CCT-2)", "lat": 22.3015, "lon": 91.8174, "heading": 18.0},
    "BERTH_03": {"name": "Berth 03 (GCB-1)", "lat": 22.3048, "lon": 91.8196, "heading": 22.0},
    "BERTH_04": {"name": "Berth 04 (GCB-2)", "lat": 22.3082, "lon": 91.8218, "heading": 22.0},
    "BERTH_05": {"name": "Berth 05 (NCT-1)", "lat": 22.3118, "lon": 91.8241, "heading": 25.0},
    "BERTH_06": {"name": "Berth 06 (NCT-2)", "lat": 22.3155, "lon": 91.8265, "heading": 25.0},
}

ANCHORAGE_BASE_LAT = 22.2150
ANCHORAGE_BASE_LON = 91.7550
CHANNEL_WAYPOINTS = [
    (22.2150, 91.7550),  # Anchorage
    (22.2450, 91.7850),  # Outer Bar fairway
    (22.2700, 91.8020),  # Gupta Bend
    (22.2920, 91.8120),  # Inward approach
]


class PortSimulationEngine:
    """Deterministic discrete-event simulation runtime powered by SimPy."""

    TOTAL_BERTHS_BASELINE = 6
    TOTAL_CRANES_BASELINE = 5  # 3 STS + 2 RTG baseline
    MEAN_CONTAINER_MOVES = 550
    BASE_CRANE_MOVES_PER_HOUR = 28.0
    TRANSIT_INWARD_HOURS = 0.75
    UNBERTH_MANEUVER_HOURS = 0.50

    def __init__(self, ref_start: Optional[datetime] = None):
        self.ref_start = ref_start or datetime(2026, 11, 4, 0, 0, 0, tzinfo=timezone.utc)
        if self.ref_start.tzinfo is None:
            self.ref_start = self.ref_start.replace(tzinfo=timezone.utc)

    def run(self, params: ScenarioParameters) -> SimulationRunResponse:
        """Execute a deterministic discrete-event simulation run."""
        rng = np.random.default_rng(params.random_seed)

        # 1. Resource Capacities & Constraints
        closed_count = params.berth_outage_count or len(params.closed_berth_ids)
        effective_berths = max(1, self.TOTAL_BERTHS_BASELINE - closed_count)

        failed_cranes_count = params.crane_outage_count or len(params.failed_crane_ids)
        effective_cranes = max(1, self.TOTAL_CRANES_BASELINE - failed_cranes_count)

        # 2. Setup SimPy Environment & Resources
        env = simpy.Environment()
        berths_resource = simpy.Resource(env, capacity=effective_berths)
        cranes_resource = simpy.Resource(env, capacity=effective_cranes)

        # Operational tracking structures
        vessel_logs: List[VesselSimulationLog] = []
        queue_samples: List[Tuple[float, int]] = []
        berth_samples: List[Tuple[float, int]] = []
        yard_samples: List[Tuple[float, float]] = []

        # Yard State
        current_yard_occupancy = float(params.yard_initial_occupancy_pct)
        peak_yard_occupancy = current_yard_occupancy

        total_berth_busy_hours = 0.0
        total_crane_busy_hours = 0.0
        total_teus_handled = 0

        # Periodic hourly monitor process
        def monitor_process():
            nonlocal peak_yard_occupancy, current_yard_occupancy
            while True:
                q_len = len(berths_resource.queue)
                b_occ = berths_resource.count

                # Dynamic yard occupancy: vessels discharge containers into yard (+),
                # gate evacuates containers out (-)
                # Nominal evacuation rate: ~0.4% capacity per hour
                gate_rate = 0.45 * (1.0 - (params.gate_throughput_reduction_pct / 100.0))
                # Add natural fluctuation
                current_yard_occupancy = max(35.0, min(98.5, current_yard_occupancy - gate_rate + (b_occ * 0.12)))
                if current_yard_occupancy > peak_yard_occupancy:
                    peak_yard_occupancy = current_yard_occupancy

                queue_samples.append((env.now, q_len))
                berth_samples.append((env.now, b_occ))
                yard_samples.append((env.now, round(current_yard_occupancy, 1)))
                yield env.timeout(1.0)

        # Vessel process lifecycle
        def vessel_process(
            v_id: str,
            v_name: str,
            c_num: str,
            arr_time: float,
            moves: int,
            assigned_berth_label: str,
        ):
            nonlocal total_berth_busy_hours, total_crane_busy_hours, total_teus_handled, current_yard_occupancy

            # Step 1: Wait until vessel arrival epoch
            yield env.timeout(arr_time)
            arrival_epoch = env.now

            # Step 2: Outer Anchorage Queueing -> Request Berth
            berth_req = berths_resource.request()
            yield berth_req

            # Berth becomes available
            berth_grant_epoch = env.now
            waiting_time = max(0.0, berth_grant_epoch - arrival_epoch)

            # Inward navigation & pilotage transit along Karnaphuli channel
            yield env.timeout(self.TRANSIT_INWARD_HOURS)
            docked_epoch = env.now

            # Step 3: Request STS Crane Capacity
            crane_count = 2 if moves > 550 and effective_cranes >= 2 else 1
            crane_req = cranes_resource.request()
            yield crane_req

            # Step 4: Quayside Handling Service
            effective_crane_rate = (
                self.BASE_CRANE_MOVES_PER_HOUR
                * params.crane_service_rate_multiplier
                * crane_count
            )
            base_duration = moves / max(5.0, effective_crane_rate)

            # Apply weather disruption if weather is severe
            effective_weather_factor = params.weather_disruption_factor
            if params.wind_speed_knots > 28.0 or params.wave_height_meters > 2.2:
                effective_weather_factor = max(effective_weather_factor, 1.35)

            service_duration = base_duration * effective_weather_factor

            # Apply yard congestion penalty: if yard is over congested threshold, terminal tractor cycles slow down
            if current_yard_occupancy > params.yard_congestion_threshold_pct:
                service_duration *= 1.22  # 22% delay penalty due to yard stack congestion

            service_duration = round(service_duration, 2)
            yield env.timeout(service_duration)

            total_crane_busy_hours += service_duration * crane_count
            cranes_resource.release(crane_req)

            # Container discharge updates yard
            current_yard_occupancy = min(98.5, current_yard_occupancy + (moves * 0.003))

            # Step 5: Unberthing Maneuver & Departure Transit
            yield env.timeout(self.UNBERTH_MANEUVER_HOURS)
            departure_epoch = env.now

            total_berth_busy_hours += (departure_epoch - berth_grant_epoch)
            total_teus_handled += int(moves * 1.55)
            berths_resource.release(berth_req)

            # Record completed vessel log
            vessel_logs.append(
                VesselSimulationLog(
                    vessel_id=v_id,
                    vessel_name=v_name,
                    call_number=c_num,
                    arrival_hour=round(arrival_epoch, 2),
                    berth_hour=round(berth_grant_epoch, 2),
                    departure_hour=round(departure_epoch, 2),
                    waiting_time_hours=round(waiting_time, 2),
                    service_duration_hours=service_duration,
                    assigned_berth=assigned_berth_label,
                    assigned_cranes=crane_count,
                    cargo_moves=moves,
                    status="SERVED",
                )
            )

        # 3. Vessel Arrival Generator
        effective_surge_mult = params.vessel_arrival_multiplier * (1.0 + params.arrival_surge_pct / 100.0)
        mean_inter_arrival = 4.5 / max(0.2, effective_surge_mult)

        feeder_names = [
            "MV Karnaphuli Pioneer", "MV Bay Feeder Express", "MV Padma Bridge Star",
            "MV Karnaphuli Express", "MV Bengal Pearl", "MV Meghna Carrier",
            "MV Sundarban Pride", "MV Karnaphuli Voyager", "MV Chittagong Trader",
            "MV Shitalakshya Wave", "MV Rupsha Hope", "MV Jamuna Horizon",
            "MV Meghna Feeder", "MV Surma Star", "MV Buriganga Pride",
            "MV Teesta Express", "MV Turag Voyager", "MV Modhumoti Carrier",
            "MV Sangu Glory", "MV Halda Navigator", "MV Feni River Leader",
        ]

        current_time = 0.5
        vessel_counter = 1

        while current_time < params.duration_hours:
            v_id = f"vsl_sim_{vessel_counter:03d}"
            name_idx = (vessel_counter - 1) % len(feeder_names)
            v_name = f"{feeder_names[name_idx]} [Call #{vessel_counter}]"
            c_num = f"CALL-SIM-{vessel_counter:03d}"

            # Calculate cargo moves based on multiplier
            base_moves = int(rng.normal(self.MEAN_CONTAINER_MOVES, 90))
            moves = int(base_moves * params.cargo_moves_multiplier)
            moves = max(280, min(1100, moves))

            # Assign demonstration berth identifier
            berth_slot = ((vessel_counter - 1) % effective_berths) + 1
            assigned_berth_label = f"BERTH_{berth_slot:02d}"

            env.process(
                vessel_process(
                    v_id=v_id,
                    v_name=v_name,
                    c_num=c_num,
                    arr_time=current_time,
                    moves=moves,
                    assigned_berth_label=assigned_berth_label,
                )
            )

            # Sample next arrival time
            delta = float(rng.exponential(mean_inter_arrival))

            # Adjust delta based on concentration pattern
            if params.arrival_concentration == "MORNING_PEAK":
                tod = (current_time + delta) % 24.0
                if 6.0 <= tod <= 12.0:
                    delta *= 0.6  # Compressed inter-arrival during morning surge
            elif params.arrival_concentration == "TIDAL_WINDOW":
                # High-water tides occur every 12.4 hours in Chittagong
                tide_phase = (current_time + delta) % 12.4
                if tide_phase > 4.0:
                    delta += 1.2  # Delayed to meet next high water window

            current_time += delta
            vessel_counter += 1

        # Start periodic monitor
        env.process(monitor_process())

        # 4. Execute SimPy Engine
        env.run(until=params.duration_hours)

        # 5. Compute Detailed Metrics
        served_count = len(vessel_logs)
        remaining_queue_count = len(berths_resource.queue)

        if vessel_logs:
            wait_times = [v.waiting_time_hours for v in vessel_logs]
            mean_wait = round(float(np.mean(wait_times)), 2)
            median_wait = round(float(np.median(wait_times)), 2)
            p90_wait = round(float(np.percentile(wait_times, 90)), 2)
            total_wait = round(float(np.sum(wait_times)), 2)
            turnarounds = [(v.departure_hour or v.arrival_hour) - v.arrival_hour for v in vessel_logs]
            avg_turnaround = round(float(np.mean(turnarounds)), 2)
            # Reliability compliance (% waiting <= threshold)
            on_time = sum(1 for w in wait_times if w <= params.delay_threshold_hours)
            reliability_compliance = round((on_time / len(wait_times)) * 100.0, 1)
        else:
            mean_wait = median_wait = p90_wait = total_wait = avg_turnaround = 0.0
            reliability_compliance = 100.0

        # Utilization ratios
        total_berth_capacity_hours = effective_berths * params.duration_hours
        berth_util = round(
            min(100.0, (total_berth_busy_hours / max(1.0, total_berth_capacity_hours)) * 100), 1
        )

        total_crane_capacity_hours = effective_cranes * params.duration_hours
        crane_util = round(
            min(100.0, (total_crane_busy_hours / max(1.0, total_crane_capacity_hours)) * 100), 1
        )

        # Operational conflicts detected
        conflicts_count = sum(1 for v in vessel_logs if v.waiting_time_hours >= 6.0)

        # Green Port Accounting (IMO GHG 4th Study & Terminal Equipment factors)
        # 0.18 tonnes CO2 per vessel-waiting-hour at Outer Anchorage
        co2_aux_idling = round(total_wait * 0.18, 2)
        idle_fuel_liters = round(total_wait * 58.0, 1)  # 58 liters MGO / hour auxiliary load
        crane_power_kwh = round(total_teus_handled * 4.8, 1)  # 4.8 kWh per container lift
        # Total CO2e: aux engine + crane power (0.00062 t CO2/kWh grid factor)
        total_co2e = round(co2_aux_idling + (crane_power_kwh * 0.00062), 2)
        nox_emissions = round(total_wait * 8.2, 1)
        sox_emissions = round(total_wait * 0.65, 1)

        # Automated Bottleneck Diagnosis
        primary_bottleneck = "NONE"
        bottleneck_severity = "LOW"
        if mean_wait > 8.0 and berth_util >= 82.0:
            primary_bottleneck = "QUAYSIDE_BERTHS"
            bottleneck_severity = "CRITICAL" if mean_wait > 14.0 else "HIGH"
        elif crane_util >= 84.0 and berth_util < 78.0:
            primary_bottleneck = "STS_CRANES"
            bottleneck_severity = "HIGH"
        elif peak_yard_occupancy >= 88.0:
            primary_bottleneck = "YARD_CAPACITY"
            bottleneck_severity = "HIGH"
        elif params.weather_disruption_factor >= 1.25 or params.wind_speed_knots >= 28.0:
            primary_bottleneck = "OUTER_ANCHORAGE"
            bottleneck_severity = "MEDIUM"
        elif remaining_queue_count > 3:
            primary_bottleneck = "ARRIVAL_SURGE"
            bottleneck_severity = "MEDIUM"

        metrics = SimulationMetrics(
            mean_waiting_time_hours=mean_wait,
            median_waiting_time_hours=median_wait,
            p90_waiting_time_hours=p90_wait,
            total_waiting_hours=total_wait,
            average_turnaround_hours=avg_turnaround,
            berth_utilization_pct=berth_util,
            crane_utilization_pct=crane_util,
            peak_yard_occupancy_pct=round(peak_yard_occupancy, 1),
            vessels_served_count=served_count,
            vessels_remaining_queue=remaining_queue_count,
            total_teus_handled=total_teus_handled,
            reliability_compliance_pct=reliability_compliance,
            scheduling_conflicts_count=conflicts_count,
            primary_bottleneck=primary_bottleneck,
            bottleneck_severity=bottleneck_severity,
            estimated_secondary_co2_tonnes=co2_aux_idling,
            idle_fuel_burn_liters=idle_fuel_liters,
            crane_power_kwh=crane_power_kwh,
            total_co2e_tonnes=total_co2e,
            nox_emissions_kg=nox_emissions,
            sox_emissions_kg=sox_emissions,
        )

        # 6. Generate Time Series Samples
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

        yard_series = [
            TimeSeriesSample(
                hour=round(t, 1),
                timestamp_iso=(self.ref_start + timedelta(hours=t)).isoformat(),
                value=float(y),
            )
            for t, y in yard_samples
        ]

        # 7. Generate Timeline Frames for GIS Layer & Digital Twin Playback
        timeline_frames = self._generate_gis_timeline_frames(
            duration_hours=params.duration_hours,
            vessel_logs=vessel_logs,
            queue_samples=queue_samples,
            berth_samples=berth_samples,
            yard_samples=yard_samples,
            effective_berths=effective_berths,
            effective_cranes=effective_cranes,
        )

        # Methodology Notes
        methodology_notes = [
            f"SimPy discrete-event simulation with seed={params.random_seed}.",
            f"Terminal resources: {effective_berths} active berths, {effective_cranes} operational STS/RTG cranes.",
            f"Vessel arrival process: Poisson process with mean interval {round(mean_inter_arrival, 2)}h (surge multiplier={round(effective_surge_mult, 2)}x).",
            f"Disruptions modeled: Weather slowdown factor={params.weather_disruption_factor}, Crane productivity={params.crane_service_rate_multiplier}x.",
            f"Yard dynamics: Initial occupancy={params.yard_initial_occupancy_pct}%, Peak={round(peak_yard_occupancy, 1)}%, Congestion threshold={params.yard_congestion_threshold_pct}%.",
            "CO2 emissions factor: 0.18 tonnes CO2 per vessel-waiting-hour at Outer Anchorage (IMO GHG 4th Study average feeder auxiliary load).",
            "Demonstration environment: outputs are advisory mathematical estimates and do not reflect observed CPA telemetry.",
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
            yard_occupancy_series=yard_series,
            vessel_logs=vessel_logs,
            timeline_frames=timeline_frames,
            methodology_notes=methodology_notes,
            data_status=DataStatusEnum.SIMULATED,
        )

    def _generate_gis_timeline_frames(
        self,
        duration_hours: float,
        vessel_logs: List[VesselSimulationLog],
        queue_samples: List[Tuple[float, int]],
        berth_samples: List[Tuple[float, int]],
        yard_samples: List[Tuple[float, float]],
        effective_berths: int,
        effective_cranes: int,
    ) -> List[SimulationTimelineFrame]:
        """Produce discrete hourly GIS state frames for digital twin & map playback."""
        frames: List[SimulationTimelineFrame] = []
        step_hours = 1.0
        current_h = 0.0

        q_dict = {round(t, 1): q for t, q in queue_samples}
        b_dict = {round(t, 1): b for t, b in berth_samples}
        y_dict = {round(t, 1): y for t, y in yard_samples}

        while current_h <= duration_hours:
            frame_iso = (self.ref_start + timedelta(hours=current_h)).isoformat()
            vessel_snapshots: List[VesselPositionSnapshot] = []

            for idx, vlog in enumerate(vessel_logs):
                arr = vlog.arrival_hour
                berth_h = vlog.berth_hour or (arr + vlog.waiting_time_hours + self.TRANSIT_INWARD_HOURS)
                dep = vlog.departure_hour or (berth_h + vlog.service_duration_hours + self.UNBERTH_MANEUVER_HOURS)

                if current_h < arr:
                    # Has not arrived yet
                    continue

                berth_key = vlog.assigned_berth or "BERTH_01"
                berth_info = BERTH_COORDINATES.get(berth_key, BERTH_COORDINATES["BERTH_01"])

                # Spatial jitter based on index so waiting vessels don't stack on exact same pixel
                jitter_lat = ((idx % 5) - 2) * 0.003
                jitter_lon = (((idx * 3) % 5) - 2) * 0.0035

                if arr <= current_h < (berth_h - self.TRANSIT_INWARD_HOURS):
                    # In Outer Anchorage Waiting Queue
                    wait_so_far = max(0.0, current_h - arr)
                    vessel_snapshots.append(
                        VesselPositionSnapshot(
                            vessel_id=vlog.vessel_id,
                            vessel_name=vlog.vessel_name,
                            state="ANCHORAGE_WAITING",
                            lat=round(ANCHORAGE_BASE_LAT + jitter_lat, 5),
                            lon=round(ANCHORAGE_BASE_LON + jitter_lon, 5),
                            heading=210.0,
                            speed_knots=0.2,
                            berth_code=None,
                            waiting_hours=round(wait_so_far, 1),
                            cargo_progress_pct=0.0,
                        )
                    )
                elif (berth_h - self.TRANSIT_INWARD_HOURS) <= current_h < berth_h:
                    # Inward channel transit (interpolating from anchorage to berth)
                    transit_progress = max(0.0, min(1.0, (current_h - (berth_h - self.TRANSIT_INWARD_HOURS)) / self.TRANSIT_INWARD_HOURS))
                    c_lat = ANCHORAGE_BASE_LAT + (berth_info["lat"] - ANCHORAGE_BASE_LAT) * transit_progress
                    c_lon = ANCHORAGE_BASE_LON + (berth_info["lon"] - ANCHORAGE_BASE_LON) * transit_progress
                    vessel_snapshots.append(
                        VesselPositionSnapshot(
                            vessel_id=vlog.vessel_id,
                            vessel_name=vlog.vessel_name,
                            state="INWARD_TRANSIT",
                            lat=round(c_lat, 5),
                            lon=round(c_lon, 5),
                            heading=35.0,
                            speed_knots=7.8,
                            berth_code=berth_key,
                            waiting_hours=round(vlog.waiting_time_hours, 1),
                            cargo_progress_pct=0.0,
                        )
                    )
                elif berth_h <= current_h < (dep - self.UNBERTH_MANEUVER_HOURS):
                    # Berthed at quay & cargo operating
                    op_duration = max(1.0, vlog.service_duration_hours)
                    cargo_prog = max(0.0, min(100.0, ((current_h - berth_h) / op_duration) * 100.0))
                    vessel_snapshots.append(
                        VesselPositionSnapshot(
                            vessel_id=vlog.vessel_id,
                            vessel_name=vlog.vessel_name,
                            state="BERTHED_WORKING",
                            lat=berth_info["lat"],
                            lon=berth_info["lon"],
                            heading=berth_info["heading"],
                            speed_knots=0.0,
                            berth_code=berth_key,
                            waiting_hours=round(vlog.waiting_time_hours, 1),
                            cargo_progress_pct=round(cargo_prog, 1),
                        )
                    )
                elif (dep - self.UNBERTH_MANEUVER_HOURS) <= current_h < dep + 1.2:
                    # Outward transit down Karnaphuli River
                    out_progress = max(0.0, min(1.0, (current_h - (dep - self.UNBERTH_MANEUVER_HOURS)) / 1.7))
                    o_lat = berth_info["lat"] - (berth_info["lat"] - ANCHORAGE_BASE_LAT) * out_progress
                    o_lon = berth_info["lon"] - (berth_info["lon"] - ANCHORAGE_BASE_LON) * out_progress
                    vessel_snapshots.append(
                        VesselPositionSnapshot(
                            vessel_id=vlog.vessel_id,
                            vessel_name=vlog.vessel_name,
                            state="OUTWARD_TRANSIT",
                            lat=round(o_lat, 5),
                            lon=round(o_lon, 5),
                            heading=215.0,
                            speed_knots=8.4,
                            berth_code=None,
                            waiting_hours=round(vlog.waiting_time_hours, 1),
                            cargo_progress_pct=100.0,
                        )
                    )

            nearest_t = round(current_h, 1)
            frames.append(
                SimulationTimelineFrame(
                    hour=round(current_h, 1),
                    timestamp_iso=frame_iso,
                    vessels=vessel_snapshots,
                    active_berths=effective_berths,
                    occupied_berths=b_dict.get(nearest_t, len([v for v in vessel_snapshots if v.state == "BERTHED_WORKING"])),
                    active_cranes=min(effective_cranes, len([v for v in vessel_snapshots if v.state == "BERTHED_WORKING"]) * 2),
                    anchorage_queue_count=q_dict.get(nearest_t, len([v for v in vessel_snapshots if v.state == "ANCHORAGE_WAITING"])),
                    yard_occupancy_pct=y_dict.get(nearest_t, 65.0),
                )
            )

            current_h += step_hours

        return frames
