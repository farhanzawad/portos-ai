"""Deterministic and idempotent seed generator for PORTOS AI."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.db.base import DataStatusEnum
from app.db.session import SessionLocal, engine
from app.models import (
    Base,
    Terminal,
    Berth,
    BerthAssignment,
    BerthMaintenanceWindow,
    BerthScheduleVersion,
    BerthStatusEnum,
    AssignmentStatusEnum,
    ScheduleVersionStatusEnum,
    Vessel,
    VesselCall,
    VesselPosition,
    VesselTypeEnum,
    CallStatusEnum,
    DelayRiskStatusEnum,
    Equipment,
    EquipmentTelemetry,
    EquipmentMaintenanceEvent,
    EquipmentTypeEnum,
    EquipmentStatusEnum,
    MaintenanceTypeEnum,
    YardBlock,
    YardOccupancyObservation,
    ContainerMovementEvent,
    MovementTypeEnum,
    YardZoneEnum,
    YardRiskTierEnum,
    OperationalEvent,
    EventSeverityEnum,
    EventTypeEnum,
    Scenario,
    ScenarioRun,
    ScenarioResult,
    ScenarioRunStatusEnum,
    DataSource,
    SourceTypeEnum,
    EmissionFactor,
    PollutantTypeEnum,
    ActivityTypeEnum,
    FactorStatusEnum,
)

logger = logging.getLogger("portos-seed")

# Seed Configuration Parameters
SEED_TERMINAL_ID = "term_cct_nct_01"
SEED_CONFIG = {
    "vessel_count": 12,
    "berth_count": 6,
    "equipment_count": 5,
    "yard_block_count": 12,
    "seed_reference_time": datetime(2026, 11, 2, 12, 0, 0, tzinfo=timezone.utc),
}


def seed_database(db: Session, force_reset: bool = False) -> Dict[str, int]:
    """Populate database with deterministic synthetic operational records (idempotent)."""
    ref_time = SEED_CONFIG["seed_reference_time"]

    # 1. Terminal Record
    terminal = db.query(Terminal).filter_by(id=SEED_TERMINAL_ID).first()
    if not terminal:
        terminal = Terminal(
            id=SEED_TERMINAL_ID,
            code="CCT_NCT_DEMO",
            name="Chattogram Container Terminal (Illustrative CCT/NCT)",
            country_code="BGD",
            latitude=22.2850,
            longitude=91.8020,
            timezone="Asia/Dhaka",
            total_quay_length_m=1250.0,
            data_status=DataStatusEnum.SIMULATED,
            source_name="PORTOS Deterministic Seed Engine",
            methodology_note="Illustrative representation of Karnaphuli container berths.",
        )
        db.add(terminal)
        db.flush()

    # 2. Six Illustrative Berths
    berth_specs = [
        ("berth_01", "BERTH-01", "CCT Berth 1", 200.0, 9.5, 185.0, BerthStatusEnum.OCCUPIED),
        ("berth_02", "BERTH-02", "CCT Berth 2", 210.0, 9.5, 190.0, BerthStatusEnum.OCCUPIED),
        ("berth_03", "BERTH-03", "CCT Berth 3", 195.0, 9.2, 180.0, BerthStatusEnum.AVAILABLE),
        ("berth_04", "BERTH-04", "NCT Berth 4", 220.0, 10.0, 200.0, BerthStatusEnum.OCCUPIED),
        ("berth_05", "BERTH-05", "NCT Berth 5", 225.0, 10.2, 205.0, BerthStatusEnum.MAINTENANCE),
        ("berth_06", "BERTH-06", "NCT Berth 6", 200.0, 9.5, 185.0, BerthStatusEnum.AVAILABLE),
    ]
    for b_id, b_code, b_name, length, draft, loa, status in berth_specs:
        existing = db.query(Berth).filter_by(id=b_id).first()
        if not existing:
            db.add(
                Berth(
                    id=b_id,
                    terminal_id=SEED_TERMINAL_ID,
                    code=b_code,
                    name=b_name,
                    length_m=length,
                    depth_draft_m=draft,
                    max_vessel_loa_m=loa,
                    status=status,
                    is_active=True,
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Seed Engine",
                )
            )
    db.flush()

    # 3. Five Illustrative Equipment Units (3 STS, 2 RTG)
    equip_specs = [
        ("equip_sts_01", "STS-01", EquipmentTypeEnum.STS_CRANE, EquipmentStatusEnum.OPERATIONAL, 40.0, 30.0, "berth_01"),
        ("equip_sts_02", "STS-02", EquipmentTypeEnum.STS_CRANE, EquipmentStatusEnum.DEGRADED, 40.0, 18.0, "berth_02"),
        ("equip_sts_03", "STS-03", EquipmentTypeEnum.STS_CRANE, EquipmentStatusEnum.OPERATIONAL, 45.0, 32.0, "berth_04"),
        ("equip_rtg_01", "RTG-01", EquipmentTypeEnum.RTG_CRANE, EquipmentStatusEnum.OPERATIONAL, 40.0, 24.0, None),
        ("equip_rtg_02", "RTG-02", EquipmentTypeEnum.RTG_CRANE, EquipmentStatusEnum.OPERATIONAL, 40.0, 24.0, None),
    ]
    for e_id, e_code, e_type, e_status, cap, moves, b_id in equip_specs:
        existing = db.query(Equipment).filter_by(id=e_id).first()
        if not existing:
            db.add(
                Equipment(
                    id=e_id,
                    terminal_id=SEED_TERMINAL_ID,
                    code=e_code,
                    equipment_type=e_type,
                    status=e_status,
                    rated_capacity_tonnes=cap,
                    rated_moves_per_hour=moves,
                    assigned_berth_id=b_id,
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Seed Engine",
                )
            )
    db.flush()

    # 4. Twelve Yard Blocks
    for i in range(1, 13):
        yb_id = f"yb_{i:02d}"
        yb_code = f"YB-{i:02d}"
        zone = YardZoneEnum.REEFER if i in [5, 6] else (YardZoneEnum.EXPORT if i > 8 else YardZoneEnum.IMPORT)
        existing = db.query(YardBlock).filter_by(id=yb_id).first()
        if not existing:
            db.add(
                YardBlock(
                    id=yb_id,
                    terminal_id=SEED_TERMINAL_ID,
                    code=yb_code,
                    name=f"Container Yard Block {i:02d}",
                    zone=zone,
                    teu_capacity=600 if zone != YardZoneEnum.REEFER else 250,
                    warning_threshold_pct=85.0,
                    critical_threshold_pct=95.0,
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Seed Engine",
                )
            )
    db.flush()

    # 5. Twelve Sample Vessels & Calls
    vessel_data = [
        ("vsl_01", "9412001", "DEMO MV Karnaphuli Pioneer", "S2AP1", 172.0, 27.4, 9.2, 1450, 18200.0, CallStatusEnum.BERTHED, DelayRiskStatusEnum.NORMAL, 0.2, 0.0, -12, "berth_01"),
        ("vsl_02", "9412002", "DEMO MV Bay Feeder Express", "S2AP2", 168.0, 26.8, 8.9, 1200, 15400.0, CallStatusEnum.BERTHED, DelayRiskStatusEnum.WATCH, 0.6, 2.5, -8, "berth_02"),
        ("vsl_03", "9412003", "DEMO MV Padma Bridge Star", "S2AP3", 182.0, 28.0, 9.4, 1650, 21000.0, CallStatusEnum.BERTHED, DelayRiskStatusEnum.NORMAL, 0.1, 0.0, -6, "berth_04"),
        ("vsl_04", "9412004", "DEMO MV Karnaphuli Express", "S2AP4", 175.0, 27.5, 9.1, 1500, 19000.0, CallStatusEnum.OUTER_ANCHORAGE, DelayRiskStatusEnum.HIGH_RISK, 0.88, 4.2, 2, None),
        ("vsl_05", "9412005", "DEMO MV Bengal Pearl", "S2AP5", 160.0, 25.0, 8.5, 1050, 13800.0, CallStatusEnum.OUTER_ANCHORAGE, DelayRiskStatusEnum.NORMAL, 0.15, 0.0, 4, None),
        ("vsl_06", "9412006", "DEMO MV Meghna Carrier", "S2AP6", 185.0, 28.2, 9.5, 1720, 22100.0, CallStatusEnum.OUTER_ANCHORAGE, DelayRiskStatusEnum.WATCH, 0.55, 1.8, 8, None),
        ("vsl_07", "9412007", "DEMO MV Sundarban Pride", "S2AP7", 155.0, 24.5, 8.2, 980, 12600.0, CallStatusEnum.EN_ROUTE, DelayRiskStatusEnum.NORMAL, 0.1, 0.0, 14, None),
        ("vsl_08", "9412008", "DEMO MV Karnaphuli Voyager", "S2AP8", 170.0, 27.0, 9.0, 1350, 17500.0, CallStatusEnum.EN_ROUTE, DelayRiskStatusEnum.NORMAL, 0.2, 0.0, 20, None),
        ("vsl_09", "9412009", "DEMO MV Chittagong Trader", "S2AP9", 165.0, 26.5, 8.8, 1250, 16000.0, CallStatusEnum.EN_ROUTE, DelayRiskStatusEnum.WATCH, 0.48, 1.5, 26, None),
        ("vsl_10", "9412010", "DEMO MV Shitalakshya Wave", "S2AP10", 178.0, 27.8, 9.3, 1550, 19800.0, CallStatusEnum.EN_ROUTE, DelayRiskStatusEnum.NORMAL, 0.15, 0.0, 32, None),
        ("vsl_11", "9412011", "DEMO MV Rupsha Hope", "S2AP11", 162.0, 25.5, 8.6, 1100, 14200.0, CallStatusEnum.EN_ROUTE, DelayRiskStatusEnum.NORMAL, 0.05, 0.0, 40, None),
        ("vsl_12", "9412012", "DEMO MV Jamuna Horizon", "S2AP12", 180.0, 28.0, 9.4, 1600, 20500.0, CallStatusEnum.EN_ROUTE, DelayRiskStatusEnum.HIGH_RISK, 0.82, 3.8, 48, None),
    ]

    vessel_spatial_profiles = {
        "vsl_01": {"lat": 22.3040, "lon": 91.8020, "spd": 0.0, "hdg": 0.0, "nav": "Moored alongside CCT-01", "dist": 0.0},
        "vsl_02": {"lat": 22.3000, "lon": 91.7990, "spd": 0.0, "hdg": 0.0, "nav": "Moored alongside CCT-02", "dist": 0.0},
        "vsl_03": {"lat": 22.2940, "lon": 91.7960, "spd": 0.0, "hdg": 0.0, "nav": "Moored alongside NCT-04", "dist": 0.0},
        "vsl_04": {"lat": 22.1750, "lon": 91.7500, "spd": 0.0, "hdg": 210.0, "nav": "At anchor (Anchorage Alpha)", "dist": 4.5},
        "vsl_05": {"lat": 22.1550, "lon": 91.7250, "spd": 0.0, "hdg": 195.0, "nav": "At anchor (Anchorage Bravo)", "dist": 7.2},
        "vsl_06": {"lat": 22.1950, "lon": 91.7750, "spd": 11.2, "hdg": 40.0, "nav": "Under way (Outer Fairway Buoy Reach)", "dist": 2.8},
        "vsl_07": {"lat": 22.1300, "lon": 91.7000, "spd": 13.8, "hdg": 35.0, "nav": "Under way (Bay of Bengal Approaching)", "dist": 14.5},
        "vsl_08": {"lat": 22.1700, "lon": 91.7450, "spd": 0.0, "hdg": 205.0, "nav": "At anchor (Anchorage Alpha)", "dist": 8.5},
        "vsl_09": {"lat": 22.2080, "lon": 91.7920, "spd": 9.5, "hdg": 42.0, "nav": "Under way (Outer Bar Pilot Boarding)", "dist": 4.0},
        "vsl_10": {"lat": 22.2260, "lon": 91.8095, "spd": 8.5, "hdg": 45.0, "nav": "Under way (Patenga River Mouth Inbound)", "dist": 2.2},
        "vsl_11": {"lat": 22.2450, "lon": 91.8295, "spd": 7.2, "hdg": 30.0, "nav": "Under way (Patenga Reach PCT Transit)", "dist": 1.0},
        "vsl_12": {"lat": 22.2800, "lon": 91.7998, "spd": 5.4, "hdg": 345.0, "nav": "Under way (Gupta Bend Apex Navigation)", "dist": 0.0},
    }

    for (v_id, imo, name, cs, loa, beam, draft, teu, dwt, call_status, risk_status, risk_score, delay_hrs, eta_offset_hrs, assigned_b_id) in vessel_data:
        # Create or fetch vessel
        vessel = db.query(Vessel).filter_by(id=v_id).first()
        if not vessel:
            vessel = Vessel(
                id=v_id,
                imo_number=imo,
                name=name,
                call_sign=cs,
                flag_country="Bangladesh",
                vessel_type=VesselTypeEnum.CONTAINER_FEEDER,
                length_overall_m=loa,
                beam_m=beam,
                max_draft_m=draft,
                teu_capacity=teu,
                dwt_tonnes=dwt,
                data_status=DataStatusEnum.SIMULATED,
                source_name="PORTOS Seed Engine",
            )
            db.add(vessel)
            db.flush()

        # Create or fetch vessel call
        call_id = f"call_{v_id}"
        call = db.query(VesselCall).filter_by(id=call_id).first()
        rep_eta = ref_time + timedelta(hours=eta_offset_hrs)
        pred_eta = rep_eta + timedelta(hours=delay_hrs)

        if not call:
            call = VesselCall(
                id=call_id,
                vessel_id=v_id,
                terminal_id=SEED_TERMINAL_ID,
                call_number=f"CALL-2026-{v_id[-2:]}",
                voyage_number=f"VY-{v_id[-2:]}A",
                reported_eta=rep_eta,
                predicted_eta=pred_eta,
                status=call_status,
                delay_risk_status=risk_status,
                delay_risk_score=risk_score,
                predicted_delay_hours=delay_hrs,
                inbound_teu=int(teu * 0.65),
                outbound_teu=int(teu * 0.60),
                data_status=DataStatusEnum.SIMULATED,
                source_name="PORTOS Seed Engine",
            )
            db.add(call)
            db.flush()

        # Update or seed simulated vessel position strictly along water fairway/berths
        pos_info = vessel_spatial_profiles.get(
            v_id,
            {"lat": 22.1980, "lon": 91.7680, "spd": 10.0, "hdg": 40.0, "nav": "Under way", "dist": 5.0},
        )
        existing_pos = db.query(VesselPosition).filter_by(id=f"pos_{call_id}").first()
        if existing_pos:
            existing_pos.latitude = pos_info["lat"]
            existing_pos.longitude = pos_info["lon"]
            existing_pos.speed_knots = pos_info["spd"]
            existing_pos.heading_degrees = pos_info["hdg"]
            existing_pos.navigational_status = pos_info["nav"]
            existing_pos.distance_to_pilot_nm = pos_info["dist"]
        else:
            db.add(
                VesselPosition(
                    id=f"pos_{call_id}",
                    vessel_call_id=call_id,
                    timestamp=ref_time,
                    latitude=pos_info["lat"],
                    longitude=pos_info["lon"],
                    speed_knots=pos_info["spd"],
                    heading_degrees=pos_info["hdg"],
                    navigational_status=pos_info["nav"],
                    distance_to_pilot_nm=pos_info["dist"],
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Seed Engine",
                )
            )

        # If currently berthed, add berth assignment
        if assigned_b_id:
                assign_id = f"assign_{call_id}"
                if not db.query(BerthAssignment).filter_by(id=assign_id).first():
                    db.add(
                        BerthAssignment(
                            id=assign_id,
                            berth_id=assigned_b_id,
                            vessel_call_id=call_id,
                            scheduled_start=rep_eta,
                            scheduled_end=rep_eta + timedelta(hours=24),
                            actual_start=rep_eta,
                            status=AssignmentStatusEnum.ACTIVE,
                            assigned_quay_start_m=10.0,
                            assigned_quay_end_m=10.0 + loa,
                            data_status=DataStatusEnum.SIMULATED,
                            source_name="PORTOS Seed Engine",
                        )
                    )

    # 5b. Illustrative Berth Maintenance Windows
    maint_id = "mw_berth_05_fender"
    if not db.query(BerthMaintenanceWindow).filter_by(id=maint_id).first():
        db.add(
            BerthMaintenanceWindow(
                id=maint_id,
                berth_id="berth_05",
                title="Fender Maintenance & Dredge Survey",
                reason="Scheduled quayside rubber fender replacement and channel sounding depth verification.",
                start_time=ref_time - timedelta(hours=12),
                end_time=ref_time + timedelta(hours=36),
                is_closed=True,
                data_status=DataStatusEnum.SIMULATED,
                source_name="PORTOS Seed Engine",
            )
        )

    # 5c. Initial Confirmed Operational Schedule Version
    ver_id = "ver_bap_initial_v1"
    if not db.query(BerthScheduleVersion).filter_by(id=ver_id).first():
        db.add(
            BerthScheduleVersion(
                id=ver_id,
                terminal_id=SEED_TERMINAL_ID,
                version_number=1,
                name="Chattogram Corridor Confirmed Schedule v1.0",
                status=ScheduleVersionStatusEnum.CONFIRMED,
                planning_start=ref_time,
                planning_horizon_hours=72,
                confirmed_by="Capt. A. Rahman (Harbour Master)",
                confirmed_at=ref_time - timedelta(hours=2),
                notes="Baseline operational berth schedule established under standard monsoon guidelines.",
                metrics_json={
                    "total_assignments": 3,
                    "total_waiting_hours": 2.5,
                    "berth_utilization_pct": 50.0,
                },
                assignments_json=[],
                data_status=DataStatusEnum.SIMULATED,
                source_name="PORTOS Seed Engine",
            )
        )

    # 6. Yard Occupancy Observations (Historical 24h Telemetry + Current)
    obs_intervals = [24, 20, 16, 12, 8, 6, 4, 2, 0]
    for i in range(1, 13):
        yb_id = f"yb_{i:02d}"
        cap = 600 if i not in [5, 6] else 250
        target_pct = 0.88 if i == 4 else (0.92 if i == 7 else 0.55 + (i * 0.02))

        for hours_ago in obs_intervals:
            obs_id = f"obs_{yb_id}_t{hours_ago}h"
            if not db.query(YardOccupancyObservation).filter_by(id=obs_id).first():
                # Realistic historical trajectory leading up to current observation
                time_delta = hours_ago / 24.0
                fluctuation = (0.04 * (1.0 if (i + hours_ago) % 2 == 0 else -1.0)) * (1.0 - time_delta * 0.5)
                hist_pct = max(0.15, min(0.98, target_pct - (0.06 * time_delta) + fluctuation))
                occ = int(round(cap * hist_pct))
                pct = round((occ / cap) * 100, 1)
                tier = (
                    YardRiskTierEnum.HIGH_RISK
                    if pct >= 90.0
                    else (YardRiskTierEnum.WATCH if pct >= 80.0 else YardRiskTierEnum.NORMAL)
                )

                db.add(
                    YardOccupancyObservation(
                        id=obs_id,
                        yard_block_id=yb_id,
                        timestamp=ref_time - timedelta(hours=hours_ago),
                        occupied_teu=occ,
                        occupancy_pct=pct,
                        reefer_occupied_count=int(occ * 0.4) if i in [5, 6] else 0,
                        risk_tier=tier,
                        data_status=DataStatusEnum.SIMULATED,
                        source_name="PORTOS Seed Engine",
                    )
                )

    # 6b. Container Movement Events (Recent terminal transfers)
    movement_configs = [
        ("DISCHARGE_TO_YARD", MovementTypeEnum.DISCHARGE_TO_YARD, 25),
        ("GATE_TO_YARD", MovementTypeEnum.GATE_TO_YARD, 18),
        ("YARD_TO_GATE", MovementTypeEnum.YARD_TO_GATE, 22),
        ("YARD_TO_VESSEL", MovementTypeEnum.YARD_TO_VESSEL, 30),
        ("HOUSEKEEPING_SHIFT", MovementTypeEnum.HOUSEKEEPING_SHIFT, 12),
    ]
    for i in range(1, 13):
        yb_id = f"yb_{i:02d}"
        for idx, (m_tag, m_type, m_teu) in enumerate(movement_configs):
            mov_id = f"mov_{yb_id}_{idx+1}"
            if not db.query(ContainerMovementEvent).filter_by(id=mov_id).first():
                event_time = ref_time - timedelta(hours=(idx * 3 + (i % 3) + 1))
                v_call_id = f"call_{(i % 12) + 1:02d}" if m_type in (MovementTypeEnum.DISCHARGE_TO_YARD, MovementTypeEnum.YARD_TO_VESSEL) else None
                db.add(
                    ContainerMovementEvent(
                        id=mov_id,
                        yard_block_id=yb_id,
                        vessel_call_id=v_call_id,
                        equipment_id=f"eq_rtg_{(i % 4) + 1:02d}",
                        timestamp=event_time,
                        movement_type=m_type,
                        teu_count=m_teu + ((i * 3) % 15),
                        data_status=DataStatusEnum.SIMULATED,
                        source_name="PORTOS TOS Emulator",
                    )
                )

    # 7. Operational Disruption Events
    alerts_data = [
        ("evt_01", EventTypeEnum.VESSEL_DELAY_INJECTED, EventSeverityEnum.CRITICAL, "Delay Risk: MV Karnaphuli Express", "Simulated engine derating injected. Predicted arrival delay +4.2h requires pilot rescheduling."),
        ("evt_02", EventTypeEnum.CRANE_OUTAGE, EventSeverityEnum.WARNING, "Crane Degradation: STS-02 Gantry Warning", "Trolley sensor alert. Service moves reduced from 30/h to 18/h on Berth B-02."),
        ("evt_03", EventTypeEnum.YARD_BOTTLENECK, EventSeverityEnum.WARNING, "Yard Density Alert: Block YB-04 at 88%", "Block YB-04 approaching warning capacity threshold."),
    ]
    for ev_id, ev_type, ev_sev, ev_title, ev_desc in alerts_data:
        if not db.query(OperationalEvent).filter_by(id=ev_id).first():
            db.add(
                OperationalEvent(
                    id=ev_id,
                    terminal_id=SEED_TERMINAL_ID,
                    timestamp=ref_time - timedelta(minutes=25),
                    event_type=ev_type,
                    severity=ev_sev,
                    title=ev_title,
                    description=ev_desc,
                    payload_json={"simulated": True, "injected_disruption": True},
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Seed Engine",
                )
            )

    # 8. Baseline Scenario Record
    scenario_id = "scen_baseline_01"
    if not db.query(Scenario).filter_by(id=scenario_id).first():
        db.add(
            Scenario(
                id=scenario_id,
                code="SCENARIO_BASELINE_72H",
                name="Baseline Terminal Operations (72h Horizon)",
                description="Default deterministic queue and schedule with standard STS moves and no unexpected crane outages.",
                is_baseline=True,
                parameters_json={"vessel_count": 12, "active_cranes": 5, "disruption_factor": 0.0},
                data_status=DataStatusEnum.SIMULATED,
                source_name="PORTOS Seed Engine",
            )
        )

    # 9. Emission Factors (Traceable operational activity factors)
    factors_data = [
        (
            "ef_aux_hoteling",
            PollutantTypeEnum.CO2E,
            ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
            185.0,
            "kg CO2e / hour",
            "IMO 4th GHG Study 2020 Table 23: Feeder container auxiliary generator load (700 kW @ 0.22 kg/kWh)",
            "https://www.imo.org/en/OurWork/Environment/Pages/Fourth-IMO-GHG-Study-2020.aspx",
            "2020-08-04",
            "Scope 3 (Vessel Auxiliary Hoteling at Berth & Anchorage)",
            "Standard container feeder (1000–2000 TEU) auxiliary generator fuel consumption while alongside or at outer anchorage.",
            False,
            FactorStatusEnum.VERIFIED_SOURCE,
        ),
        (
            "ef_hoteling_nox",
            PollutantTypeEnum.NOX,
            ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
            3.4,
            "kg NOx / hour",
            "IMO MARPOL Annex VI Tier II NOx limits for marine auxiliary diesel generators",
            "https://www.imo.org/en/OurWork/Environment/Pages/Nitrogen-oxides-(NOx)-%E2%80%93-Regulation-13.aspx",
            "2016-01-01",
            "Scope 3 (Maritime Air Quality)",
            "Tier II auxiliary generator NOx combustion emissions during berth hoteling.",
            False,
            FactorStatusEnum.VERIFIED_SOURCE,
        ),
        (
            "ef_hoteling_sox",
            PollutantTypeEnum.SOX,
            ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
            0.42,
            "kg SOx / hour",
            "IMO 2020 Global 0.50% Sulphur Cap VLSFO auxiliary fuel specification",
            "https://www.imo.org/en/Media/PressBriefings/Pages/02-IMO-2020.aspx",
            "2020-01-01",
            "Scope 3 (Maritime Air Quality)",
            "Fuel-based SOx calculation assuming 0.50% sulphur m/m fuel oil.",
            False,
            FactorStatusEnum.VERIFIED_SOURCE,
        ),
        (
            "ef_vessel_maneuvering",
            PollutantTypeEnum.CO2E,
            ActivityTypeEnum.VESSEL_MANEUVERING,
            480.0,
            "kg CO2e / hour",
            "EPA Port Emissions Inventory Guidance & IMO River Fairway Slow Steaming model",
            "https://www.epa.gov/state-and-local-transportation/port-emissions-inventory-guidance",
            "2022-09-15",
            "Scope 3 (Fairway Navigation Transit)",
            "Main engine slow maneuvering speed (<8 knots) along Karnaphuli fairway corridor.",
            False,
            FactorStatusEnum.VERIFIED_SOURCE,
        ),
        (
            "ef_sts_electric",
            PollutantTypeEnum.CO2E,
            ActivityTypeEnum.STS_CRANE_ELECTRIC,
            4.2,
            "kg CO2e / move",
            "Power Grid Company of Bangladesh (PGCB) Grid Carbon Intensity (0.618 kg CO2e/kWh × 6.8 kWh/move)",
            "https://pgcb.gov.bd",
            "2024-06-30",
            "Scope 2 (Indirect Quayside Electricity)",
            "Electric rail-mounted ship-to-shore gantry cranes at CCT/NCT quays.",
            False,
            FactorStatusEnum.VERIFIED_SOURCE,
        ),
        (
            "ef_yard_diesel",
            PollutantTypeEnum.CO2E,
            ActivityTypeEnum.YARD_EQUIPMENT_DIESEL,
            2.8,
            "kg CO2e / move",
            "Terminal Tractor & RTG internal combustion estimate (1.05 L diesel/move × 2.68 kg CO2/L)",
            "https://portos.local/docs/assumptions",
            "2026-01-01",
            "Scope 1 (Direct Terminal Diesel Combustion)",
            "Illustrative demo assumption for yard rubber-tyred gantry and terminal transfer vehicle movement.",
            True,
            FactorStatusEnum.ILLUSTRATIVE_ASSUMPTION,
        ),
    ]

    for (
        ef_id,
        pol,
        act,
        val,
        unit,
        src,
        url,
        pub_date,
        scope,
        app_notes,
        is_demo,
        f_status,
    ) in factors_data:
        existing_ef = db.query(EmissionFactor).filter_by(id=ef_id).first()
        if not existing_ef:
            db.add(
                EmissionFactor(
                    id=ef_id,
                    pollutant=pol,
                    activity_type=act,
                    factor_value=val,
                    factor_unit=unit,
                    source_reference=src,
                    source_url=url,
                    publication_date=pub_date,
                    scope_category=scope,
                    applicability_notes=app_notes,
                    is_illustrative_assumption=is_demo,
                    factor_status=f_status,
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Seed Engine",
                )
            )
        else:
            # Update fields in-place if existing
            existing_ef.factor_value = val
            existing_ef.factor_unit = unit
            existing_ef.source_reference = src
            existing_ef.source_url = url
            existing_ef.publication_date = pub_date
            existing_ef.scope_category = scope
            existing_ef.applicability_notes = app_notes
            existing_ef.is_illustrative_assumption = is_demo
            existing_ef.factor_status = f_status

    # 11. Seed Data Sources
    default_sources = [
        (
            "ds_cpa_bulletin",
            "CPA-PUB-DAILY",
            "Chattogram Port Authority Daily Berthing Lineup (Simulated Public Report)",
            "Chattogram Port Authority",
            SourceTypeEnum.PUBLIC_REPORT,
            "https://cpa.gov.bd/berthing-lineup",
            "Public operational berthing and anchorage daily schedule published for shipping agents.",
            True,
            DataStatusEnum.SIMULATED,
        ),
        (
            "ds_cpa_tides",
            "SRC-CPA-TIDES-2026",
            "Chattogram Port Authority Tide Tables & Permissible Drafts",
            "Chattogram Port Authority (Hydrography Dept)",
            SourceTypeEnum.PUBLIC_REPORT,
            "https://cpa.gov.bd/site/page/87e07662-3c22-498c-8c0c-7b00bfd21ebc/Tide-Table",
            "Official semi-diurnal tide tables and permissible draft limits for Karnaphuli river approach.",
            True,
            DataStatusEnum.OBSERVED,
        ),
        (
            "ds_cpa_berths",
            "SRC-CPA-BERTH-SPEC-2026",
            "CPA Official Container Terminal & Berth Technical Specifications",
            "Chattogram Port Authority (Traffic Operations)",
            SourceTypeEnum.PUBLIC_REPORT,
            "https://cpa.gov.bd/site/page/f44b2053-4eb8-4ca4-bbdc-81c15f90c888/Berth-Specifications",
            "Official technical specifications, design depths, and crane rail gauges for CCT and NCT berths.",
            True,
            DataStatusEnum.OBSERVED,
        ),
        (
            "ds_bmd_patenga",
            "SRC-BMD-PATENGA-2026",
            "BMD Patenga Coastal Maritime Weather Bulletin & Cyclone Signals",
            "Bangladesh Meteorological Department",
            SourceTypeEnum.PUBLIC_REPORT,
            "https://bmd.gov.bd/coastal-bulletin",
            "Official maritime weather bulletins, cyclone warning signals, and coastal sea conditions for Patenga and North Bay.",
            True,
            DataStatusEnum.OBSERVED,
        ),
        (
            "ds_cpa_annual_stats",
            "SRC-CPA-ANNUAL-STATS-2025",
            "CPA Annual Container Throughput & Turnaround Statistics",
            "Chattogram Port Authority (Planning & Statistics)",
            SourceTypeEnum.PUBLIC_REPORT,
            "https://cpa.gov.bd/site/page/c79ec9df-7521-4fbe-9b34-8c886e0ba149/Port-Statistics",
            "Official annual container TEU throughput, vessel turnaround days, and berth occupancy rates.",
            True,
            DataStatusEnum.OBSERVED,
        ),
        (
            "ds_user_upload",
            "USER-UPLOAD-STAGING",
            "Operator Staged Operational Dataset",
            "PORTOS AI User Ingestion",
            SourceTypeEnum.USER_UPLOAD,
            None,
            "Operator uploaded spreadsheet or document for human review and ingestion.",
            False,
            DataStatusEnum.SIMULATED,
        ),
        (
            "ds_synthetic_stream",
            "PORTOS-SYNTH-01",
            "PORTOS Synthetic Benchmark Stream",
            "PORTOS AI Engineering",
            SourceTypeEnum.SYNTHETIC_GENERATOR,
            None,
            "Calibrated synthetic operational feed for Blue AI Challenge research.",
            True,
            DataStatusEnum.SIMULATED,
        ),
    ]

    for s_id, s_code, s_name, s_org, s_type, s_url, s_desc, s_ver, s_status in default_sources:
        existing_ds = db.query(DataSource).filter(DataSource.id == s_id).first()
        if not existing_ds:
            db.add(
                DataSource(
                    id=s_id,
                    code=s_code,
                    name=s_name,
                    organization=s_org,
                    source_type=s_type,
                    url=s_url,
                    description=s_desc,
                    is_verified=s_ver,
                    data_status=s_status,
                    source_name="Official Bangladesh Govt Portal / CPA",
                )
            )

    # Commit all seeded items
    db.commit()

    counts = {
        "terminals": db.query(Terminal).count(),
        "berths": db.query(Berth).count(),
        "equipment": db.query(Equipment).count(),
        "yard_blocks": db.query(YardBlock).count(),
        "yard_observations": db.query(YardOccupancyObservation).count(),
        "container_movements": db.query(ContainerMovementEvent).count(),
        "vessels": db.query(Vessel).count(),
        "vessel_calls": db.query(VesselCall).count(),
        "berth_assignments": db.query(BerthAssignment).count(),
        "events": db.query(OperationalEvent).count(),
        "emission_factors": db.query(EmissionFactor).count(),
        "data_sources": db.query(DataSource).count(),
    }
    return counts


if __name__ == "__main__":
    with engine.connect() as conn:
        conn.execute(text("DROP TABLE IF EXISTS emissions_estimates"))
        conn.execute(text("DROP TABLE IF EXISTS emission_factors"))
        conn.execute(text("DROP TABLE IF EXISTS data_quality_issues"))
        conn.execute(text("DROP TABLE IF EXISTS imported_records"))
        conn.execute(text("DROP TABLE IF EXISTS imported_datasets"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        result = seed_database(session)
        print("Database seeded successfully:", result)

