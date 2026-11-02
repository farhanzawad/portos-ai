"""Deterministic and idempotent seed generator for PORTOS AI."""

import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.db.base import DataStatusEnum
from app.db.session import SessionLocal, engine
from app.models import (
    Base,
    Terminal,
    Berth,
    BerthAssignment,
    BerthStatusEnum,
    AssignmentStatusEnum,
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

            # Seed simulated vessel position
            db.add(
                VesselPosition(
                    id=f"pos_{call_id}",
                    vessel_call_id=call_id,
                    timestamp=ref_time,
                    latitude=22.1800 + (eta_offset_hrs * 0.015),
                    longitude=91.7200 + (eta_offset_hrs * 0.015),
                    speed_knots=0.0 if call_status in [CallStatusEnum.BERTHED, CallStatusEnum.OUTER_ANCHORAGE] else 12.4,
                    heading_degrees=340.0,
                    navigational_status="Moored" if call_status == CallStatusEnum.BERTHED else "At anchor",
                    distance_to_pilot_nm=0.0 if call_status == CallStatusEnum.BERTHED else max(0.0, eta_offset_hrs * 12.0),
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

    # 6. Yard Occupancy Observations
    for i in range(1, 13):
        yb_id = f"yb_{i:02d}"
        obs_id = f"obs_{yb_id}"
        if not db.query(YardOccupancyObservation).filter_by(id=obs_id).first():
            cap = 600 if i not in [5, 6] else 250
            occ = int(cap * (0.88 if i == 4 else (0.92 if i == 7 else 0.55 + (i * 0.02))))
            pct = round((occ / cap) * 100, 1)
            tier = YardRiskTierEnum.HIGH_RISK if pct >= 90.0 else (YardRiskTierEnum.WATCH if pct >= 80.0 else YardRiskTierEnum.NORMAL)

            db.add(
                YardOccupancyObservation(
                    id=obs_id,
                    yard_block_id=yb_id,
                    timestamp=ref_time,
                    occupied_teu=occ,
                    occupancy_pct=pct,
                    reefer_occupied_count=int(occ * 0.4) if i in [5, 6] else 0,
                    risk_tier=tier,
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Seed Engine",
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

    # 9. Emission Factors
    factors_data = [
        ("ef_aux_hoteling", PollutantTypeEnum.CO2E, ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE, 185.0, "kg CO2e / hour", "IMO GHG 4th Study average feeder auxiliary hoteling rate (illustrative demo value)"),
        ("ef_sts_electric", PollutantTypeEnum.CO2E, ActivityTypeEnum.STS_CRANE_ELECTRIC, 4.2, "kg CO2e / move", "Grid electricity factor for electric STS container cranes"),
    ]
    for ef_id, pol, act, val, unit, src in factors_data:
        if not db.query(EmissionFactor).filter_by(id=ef_id).first():
            db.add(
                EmissionFactor(
                    id=ef_id,
                    pollutant=pol,
                    activity_type=act,
                    factor_value=val,
                    factor_unit=unit,
                    source_reference=src,
                    is_illustrative_assumption=True,
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Seed Engine",
                )
            )

    # Commit all seeded items
    db.commit()

    counts = {
        "terminals": db.query(Terminal).count(),
        "berths": db.query(Berth).count(),
        "equipment": db.query(Equipment).count(),
        "yard_blocks": db.query(YardBlock).count(),
        "vessels": db.query(Vessel).count(),
        "vessel_calls": db.query(VesselCall).count(),
        "berth_assignments": db.query(BerthAssignment).count(),
        "events": db.query(OperationalEvent).count(),
    }
    return counts


if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as session:
        result = seed_database(session)
        print("Database seeded successfully:", result)

