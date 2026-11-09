"""FastAPI endpoints for constraint-based berth allocation and optimization.

Uses Google OR-Tools CP-SAT for deterministic scheduling and an independent validator
for physical constraint verification. Strictly advisory decision support.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.db.base import DataStatusEnum
from app.models.terminal import (
    Berth,
    BerthAssignment,
    BerthStatusEnum,
    AssignmentStatusEnum,
    BerthMaintenanceWindow,
    BerthScheduleVersion,
    ScheduleVersionStatusEnum,
)
from app.models.vessel import VesselCall, CallStatusEnum
from app.models.equipment import Equipment, EquipmentTypeEnum, EquipmentStatusEnum
from app.schemas.optimizer import (
    OptimizerRequest,
    OptimizerResponse,
    ValidateScheduleRequest,
    FeasibilityValidationResult,
    ProposeScheduleRequest,
    ProposeScheduleResponse,
    BerthSpec,
    BerthMaintenanceSpec,
    VesselCallSpec,
    ScheduledAssignment,
    BerthPlannerSummaryResponse,
    ScheduleVersionRead,
    ConfirmScheduleRequest,
    ManualAssignmentRequest,
    BerthMaintenanceCreate,
)
from app.optimizer.scheduler import BerthAllocationScheduler
from app.optimizer.validator import ScheduleFeasibilityValidator

router = APIRouter(prefix="/berth-planner", tags=["Berth Planner"])


def _load_db_specs(db: Session, terminal_id: Optional[str] = None):
    """Helper to convert database berths and active vessel calls into optimizer specs."""
    berths_query = db.query(Berth).options(joinedload(Berth.maintenance_windows))
    if terminal_id:
        berths_query = berths_query.filter(Berth.terminal_id == terminal_id)
    db_berths = berths_query.order_by(Berth.code).all()

    # Query assigned cranes per berth
    cranes = db.query(Equipment).filter(
        Equipment.equipment_type == EquipmentTypeEnum.STS_CRANE,
        Equipment.status.in_([EquipmentStatusEnum.OPERATIONAL, EquipmentStatusEnum.DEGRADED]),
    ).all()
    cranes_by_berth: Dict[str, List[Equipment]] = {}
    for cr in cranes:
        if cr.assigned_berth_id:
            cranes_by_berth.setdefault(cr.assigned_berth_id, []).append(cr)

    berth_specs = []
    for b in db_berths:
        assigned_c = cranes_by_berth.get(b.id, [])
        c_count = len(assigned_c) if assigned_c else 1
        avg_moves = (
            sum(cr.rated_moves_per_hour for cr in assigned_c) / len(assigned_c)
            if assigned_c
            else 28.0
        )

        mw_specs = [
            BerthMaintenanceSpec(
                id=mw.id,
                berth_id=mw.berth_id,
                title=mw.title,
                reason=mw.reason,
                start_time=mw.start_time,
                end_time=mw.end_time,
                is_closed=mw.is_closed,
            )
            for mw in (b.maintenance_windows or [])
        ]

        berth_specs.append(
            BerthSpec(
                id=b.id,
                code=b.code,
                name=b.name,
                length_m=b.length_m,
                depth_draft_m=b.depth_draft_m,
                max_vessel_loa_m=b.max_vessel_loa_m,
                is_active=b.is_active,
                status=b.status.value if hasattr(b.status, "value") else str(b.status),
                assigned_cranes_count=c_count,
                crane_capacity_moves_per_hour=avg_moves,
                maintenance_windows=mw_specs,
            )
        )

    calls_query = (
        db.query(VesselCall)
        .options(joinedload(VesselCall.vessel))
        .filter(
            VesselCall.status.in_([
                CallStatusEnum.OUTER_ANCHORAGE,
                CallStatusEnum.PILOT_BOARDING,
                CallStatusEnum.EN_ROUTE,
                CallStatusEnum.BERTHED,
            ])
        )
    )
    if terminal_id:
        calls_query = calls_query.filter(VesselCall.terminal_id == terminal_id)
    db_calls = calls_query.order_by(VesselCall.reported_eta).all()

    # Get active confirmed assignment map
    active_assignments = (
        db.query(BerthAssignment)
        .filter(BerthAssignment.status.in_([AssignmentStatusEnum.CONFIRMED, AssignmentStatusEnum.ACTIVE]))
        .all()
    )
    call_to_berth_id = {a.vessel_call_id: a.berth_id for a in active_assignments}

    call_specs = []
    for c in db_calls:
        vessel = c.vessel
        loa = vessel.length_overall_m if vessel else 170.0
        draft = vessel.max_draft_m if vessel else 9.0
        v_name = vessel.name if vessel else f"Vessel {c.call_number}"
        v_type = (
            vessel.vessel_type.value if hasattr(vessel.vessel_type, "value") else str(vessel.vessel_type)
        ) if vessel else "CONTAINER_FEEDER"

        # Priority heuristic: High risk calls or express cargo have higher priority
        priority = 3 if c.delay_risk_status.value == "HIGH_RISK" else (2 if c.delay_risk_status.value == "WATCH" else 1)

        assigned_b_id = call_to_berth_id.get(c.id)
        assign_status = "BERTHED" if c.status == CallStatusEnum.BERTHED else ("ASSIGNED" if assigned_b_id else "WAITING")

        call_specs.append(
            VesselCallSpec(
                id=c.id,
                call_number=c.call_number,
                vessel_name=v_name,
                vessel_type=v_type,
                length_overall_m=loa,
                max_draft_m=draft,
                reported_eta=c.reported_eta,
                predicted_eta=c.predicted_eta,
                service_duration_hours=18.0,
                priority=priority,
                current_berth_id=assigned_b_id,
                delay_risk_status=c.delay_risk_status.value if hasattr(c.delay_risk_status, "value") else str(c.delay_risk_status),
                inbound_teu=c.inbound_teu,
                outbound_teu=c.outbound_teu,
                required_crane_capacity=25.0,
                assignment_status=assign_status,
            )
        )

    return berth_specs, call_specs


@router.get("/summary", response_model=BerthPlannerSummaryResponse)
def get_berth_planner_summary(
    terminal_id: Optional[str] = Query(None, description="Optional terminal filter"),
    db: Session = Depends(get_db),
):
    """Return operational KPI summary for Berth Planner workspace."""
    berths_q = db.query(Berth)
    if terminal_id:
        berths_q = berths_q.filter(Berth.terminal_id == terminal_id)
    all_berths = berths_q.all()

    total_berths = len(all_berths)
    occupied_berths = sum(1 for b in all_berths if b.status == BerthStatusEnum.OCCUPIED)
    available_berths = sum(1 for b in all_berths if b.status == BerthStatusEnum.AVAILABLE)

    # Waiting anchorage vessels
    anchorage_calls = (
        db.query(VesselCall)
        .filter(VesselCall.status.in_([CallStatusEnum.OUTER_ANCHORAGE, CallStatusEnum.PILOT_BOARDING]))
        .all()
    )
    vessels_at_anchorage = len(anchorage_calls)
    avg_wait = (
        round(sum(c.predicted_delay_hours for c in anchorage_calls) / max(1, vessels_at_anchorage), 1)
        if vessels_at_anchorage > 0
        else 0.0
    )

    # Utilization
    util_pct = round((occupied_berths / max(1, total_berths)) * 100, 1)

    # Conflicts: Check if any active assignments overlap
    active_assigns = (
        db.query(BerthAssignment)
        .filter(BerthAssignment.status.in_([AssignmentStatusEnum.CONFIRMED, AssignmentStatusEnum.ACTIVE]))
        .all()
    )
    b_specs, c_specs = _load_db_specs(db, terminal_id)
    validator = ScheduleFeasibilityValidator(berths=b_specs, calls=c_specs)

    sched_assigns = [
        ScheduledAssignment(
            vessel_call_id=a.vessel_call_id,
            vessel_name=a.vessel_call.vessel.name if a.vessel_call and a.vessel_call.vessel else "Vessel",
            call_number=a.vessel_call.call_number if a.vessel_call else a.id,
            berth_id=a.berth_id,
            berth_code=a.berth.code if a.berth else "BERTH",
            berth_name=a.berth.name if a.berth else "Berth",
            scheduled_start=a.scheduled_start,
            scheduled_end=a.scheduled_end,
            service_duration_hours=18.0,
            waiting_time_hours=0.0,
            assigned_quay_start_m=a.assigned_quay_start_m or 10.0,
            assigned_quay_end_m=a.assigned_quay_end_m or 180.0,
            is_feasible=True,
            assignment_explanation=a.advisory_notes or "Current schedule",
        )
        for a in active_assigns
    ]
    val_res = validator.validate(sched_assigns)

    # Pending decisions: unassigned calls waiting
    assigned_call_ids = {a.vessel_call_id for a in active_assigns}
    all_active_calls = (
        db.query(VesselCall)
        .filter(VesselCall.status.in_([CallStatusEnum.OUTER_ANCHORAGE, CallStatusEnum.EN_ROUTE]))
        .all()
    )
    pending_count = sum(1 for c in all_active_calls if c.id not in assigned_call_ids)

    return BerthPlannerSummaryResponse(
        total_berths=total_berths,
        occupied_berths=occupied_berths,
        available_berths=available_berths,
        vessels_at_anchorage=vessels_at_anchorage,
        average_waiting_time_hours=avg_wait,
        berth_utilization_pct=util_pct,
        scheduling_conflicts_count=val_res.violations_count,
        pending_allocation_decisions=pending_count,
        operational_notice="Simulated operational metrics for illustrative decision evaluation.",
        data_status=DataStatusEnum.SIMULATED,
    )


@router.get("/schedule")
def get_current_berth_schedule(
    terminal_id: Optional[str] = Query(None, description="Optional terminal filter"),
    db: Session = Depends(get_db),
):
    """Retrieve full operational berth schedule: berths, active assignments, and maintenance windows."""
    b_specs, c_specs = _load_db_specs(db, terminal_id)

    # Load active version if exists
    latest_version = (
        db.query(BerthScheduleVersion)
        .order_by(BerthScheduleVersion.version_number.desc())
        .first()
    )

    # Load assignments from database
    db_assignments = (
        db.query(BerthAssignment)
        .options(
            joinedload(BerthAssignment.berth),
            joinedload(BerthAssignment.vessel_call).joinedload(VesselCall.vessel),
        )
        .filter(BerthAssignment.status.in_([AssignmentStatusEnum.CONFIRMED, AssignmentStatusEnum.ACTIVE, AssignmentStatusEnum.PROPOSED]))
        .all()
    )

    assignments_out = []
    for a in db_assignments:
        v_name = (
            a.vessel_call.vessel.name
            if a.vessel_call and a.vessel_call.vessel
            else f"Call {a.vessel_call_id}"
        )
        c_num = a.vessel_call.call_number if a.vessel_call else a.id
        b_code = a.berth.code if a.berth else "BERTH"
        b_name = a.berth.name if a.berth else "Berth Lane"
        dur = round((a.scheduled_end - a.scheduled_start).total_seconds() / 3600.0, 1)

        assignments_out.append({
            "id": a.id,
            "vessel_call_id": a.vessel_call_id,
            "vessel_name": v_name,
            "call_number": c_num,
            "berth_id": a.berth_id,
            "berth_code": b_code,
            "berth_name": b_name,
            "scheduled_start": a.scheduled_start.isoformat(),
            "scheduled_end": a.scheduled_end.isoformat(),
            "service_duration_hours": dur,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "assigned_quay_start_m": a.assigned_quay_start_m or 10.0,
            "assigned_quay_end_m": a.assigned_quay_end_m or 180.0,
            "advisory_notes": a.advisory_notes,
            "is_feasible": True,
        })

    # Maintenance windows
    maintenance_windows = db.query(BerthMaintenanceWindow).all()
    mw_out = [
        {
            "id": mw.id,
            "berth_id": mw.berth_id,
            "title": mw.title,
            "reason": mw.reason,
            "start_time": mw.start_time.isoformat(),
            "end_time": mw.end_time.isoformat(),
            "is_closed": mw.is_closed,
        }
        for mw in maintenance_windows
    ]

    return {
        "berths": [b.model_dump() for b in b_specs],
        "calls": [c.model_dump() for c in c_specs],
        "assignments": assignments_out,
        "maintenance_windows": mw_out,
        "active_version": {
            "id": latest_version.id,
            "version_number": latest_version.version_number,
            "name": latest_version.name,
            "status": latest_version.status.value if hasattr(latest_version.status, "value") else str(latest_version.status),
            "confirmed_by": latest_version.confirmed_by,
            "confirmed_at": latest_version.confirmed_at.isoformat() if latest_version.confirmed_at else None,
        } if latest_version else None,
        "data_status": DataStatusEnum.SIMULATED.value,
    }


@router.post("/optimize", response_model=OptimizerResponse)
def run_berth_optimization(
    payload: OptimizerRequest,
    db: Session = Depends(get_db),
):
    """Run Google OR-Tools CP-SAT berth allocation optimization.

    Deterministically schedules incoming vessel calls against berth capabilities,
    minimizing weighted waiting time while enforcing zero overlap, LOA, and draft limits.
    """
    # Use supplied specs or load from database
    if payload.berths and payload.calls:
        berth_specs = payload.berths
        call_specs = payload.calls
    else:
        db_b, db_c = _load_db_specs(db, payload.terminal_id)
        berth_specs = payload.berths if payload.berths else db_b
        call_specs = payload.calls if payload.calls else db_c

    scheduler = BerthAllocationScheduler(settings=payload.settings)
    response = scheduler.optimize(
        berths=berth_specs,
        calls=call_specs,
        planning_horizon_hours=payload.planning_horizon_hours,
        time_granularity_minutes=payload.time_granularity_minutes,
    )
    return response


@router.post("/validate", response_model=FeasibilityValidationResult)
def validate_schedule(
    payload: ValidateScheduleRequest,
    db: Session = Depends(get_db),
):
    """Run independent feasibility validation on a proposed berth schedule.

    Catches spatial/temporal overlap, LOA excess, draft violations, and maintenance conflicts.
    """
    berth_specs = payload.berths
    call_specs = payload.calls

    if not berth_specs or not call_specs:
        db_b, db_c = _load_db_specs(db)
        berth_specs = berth_specs or db_b
        call_specs = call_specs or db_c

    validator = ScheduleFeasibilityValidator(berths=berth_specs, calls=call_specs)
    return validator.validate(payload.assignments)


@router.get("/baseline", response_model=OptimizerResponse)
def get_baseline_schedule(
    terminal_id: Optional[str] = Query(None, description="Optional terminal filter"),
    db: Session = Depends(get_db),
):
    """Retrieve current baseline berth schedule and queued vessels from database."""
    berth_specs, call_specs = _load_db_specs(db, terminal_id)
    scheduler = BerthAllocationScheduler()
    # Baseline run
    return scheduler.optimize(
        berths=berth_specs,
        calls=call_specs,
        planning_horizon_hours=72,
    )


@router.post("/propose", response_model=ProposeScheduleResponse)
def propose_schedule_for_review(
    payload: ProposeScheduleRequest,
    db: Session = Depends(get_db),
):
    """Record an internal advisory berth assignment proposal for human review.

    ADVISORY ACTION ONLY. Does not execute live port commands or vessel maneuvers.
    Saves candidate schedule with status=PROPOSED and records audit run ID.
    """
    if not payload.assignments:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot propose an empty schedule.",
        )

    proposal_id = f"proposal_{uuid.uuid4().hex[:12]}"
    created_count = 0

    for a in payload.assignments:
        # Check if call exists
        call = db.query(VesselCall).filter(VesselCall.id == a.vessel_call_id).first()
        if not call:
            continue

        assign_record = BerthAssignment(
            id=f"assign_{uuid.uuid4().hex[:16]}",
            berth_id=a.berth_id,
            vessel_call_id=a.vessel_call_id,
            scheduled_start=a.scheduled_start,
            scheduled_end=a.scheduled_end,
            assigned_quay_start_m=a.assigned_quay_start_m,
            assigned_quay_end_m=a.assigned_quay_end_m,
            status=AssignmentStatusEnum.PROPOSED,
            optimizer_run_id=payload.optimizer_run_id,
            advisory_notes=payload.advisory_notes or a.assignment_explanation,
            data_status=DataStatusEnum.SIMULATED,
            source_name="PORTOS Berth Optimizer (CP-SAT)",
        )
        db.add(assign_record)
        created_count += 1

    db.commit()

    return ProposeScheduleResponse(
        proposal_id=proposal_id,
        status="PROPOSED",
        created_at=datetime.now(timezone.utc),
        records_created=created_count,
        message=(
            f"Advisory proposal recorded successfully ({created_count} assignments). "
            f"Requires explicit Harbour Master review and operational approval before confirmation."
        ),
        data_status=DataStatusEnum.SIMULATED,
    )


@router.post("/assignments")
def create_or_update_manual_assignment(
    payload: ManualAssignmentRequest,
    db: Session = Depends(get_db),
):
    """Assign or reschedule a vessel call to a berth manually with constraint validation.

    Enforces that the assignment does not cause hard overlap or physical capability violations.
    """
    call = db.query(VesselCall).options(joinedload(VesselCall.vessel)).filter(VesselCall.id == payload.vessel_call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Vessel call not found")

    berth = db.query(Berth).filter(Berth.id == payload.berth_id).first()
    if not berth:
        raise HTTPException(status_code=404, detail="Berth not found")

    s_start = payload.scheduled_start
    if s_start.tzinfo is None:
        s_start = s_start.replace(tzinfo=timezone.utc)
    s_end = s_start + timedelta(hours=payload.service_duration_hours)

    # Validate against constraints
    b_specs, c_specs = _load_db_specs(db)
    validator = ScheduleFeasibilityValidator(berths=b_specs, calls=c_specs)

    candidate_assign = ScheduledAssignment(
        vessel_call_id=call.id,
        vessel_name=call.vessel.name if call.vessel else call.call_number,
        call_number=call.call_number,
        berth_id=berth.id,
        berth_code=berth.code,
        berth_name=berth.name,
        scheduled_start=s_start,
        scheduled_end=s_end,
        service_duration_hours=payload.service_duration_hours,
        waiting_time_hours=0.0,
        assigned_quay_start_m=payload.assigned_quay_start_m or 10.0,
        assigned_quay_end_m=payload.assigned_quay_end_m or (10.0 + (call.vessel.length_overall_m if call.vessel else 170.0)),
        is_feasible=True,
        assignment_explanation="Manual operator allocation",
    )

    # Check existing assignments on the same berth
    existing_other_assigns = (
        db.query(BerthAssignment)
        .filter(
            BerthAssignment.berth_id == berth.id,
            BerthAssignment.vessel_call_id != call.id,
            BerthAssignment.status.in_([AssignmentStatusEnum.CONFIRMED, AssignmentStatusEnum.ACTIVE]),
        )
        .all()
    )
    test_set = [candidate_assign]
    for ea in existing_other_assigns:
        test_set.append(
            ScheduledAssignment(
                vessel_call_id=ea.vessel_call_id,
                vessel_name=ea.vessel_call.vessel.name if ea.vessel_call and ea.vessel_call.vessel else "Other Vessel",
                call_number=ea.vessel_call.call_number if ea.vessel_call else ea.id,
                berth_id=ea.berth_id,
                berth_code=berth.code,
                berth_name=berth.name,
                scheduled_start=ea.scheduled_start,
                scheduled_end=ea.scheduled_end,
                service_duration_hours=18.0,
                waiting_time_hours=0.0,
                assigned_quay_start_m=10.0,
                assigned_quay_end_m=180.0,
                is_feasible=True,
                assignment_explanation="Existing assignment",
            )
        )

    val_res = validator.validate(test_set)
    if not val_res.is_feasible:
        reasons = "; ".join(v.description for v in val_res.violations)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot assign vessel: hard constraint violation. {reasons}",
        )

    # Check if assignment already exists
    existing_assign = db.query(BerthAssignment).filter(BerthAssignment.vessel_call_id == call.id).first()
    if existing_assign:
        existing_assign.berth_id = berth.id
        existing_assign.scheduled_start = s_start
        existing_assign.scheduled_end = s_end
        existing_assign.status = AssignmentStatusEnum.CONFIRMED
        existing_assign.advisory_notes = payload.advisory_notes or "Manually adjusted by operator"
        assign_id = existing_assign.id
    else:
        new_assign = BerthAssignment(
            id=f"assign_{uuid.uuid4().hex[:16]}",
            berth_id=berth.id,
            vessel_call_id=call.id,
            scheduled_start=s_start,
            scheduled_end=s_end,
            assigned_quay_start_m=payload.assigned_quay_start_m or 10.0,
            assigned_quay_end_m=candidate_assign.assigned_quay_end_m,
            status=AssignmentStatusEnum.CONFIRMED,
            advisory_notes=payload.advisory_notes or "Manual operator assignment",
            data_status=DataStatusEnum.SIMULATED,
            source_name="PORTOS Berth Planner Manual Operator",
        )
        db.add(new_assign)
        assign_id = new_assign.id

    db.commit()

    return {
        "status": "ASSIGNED",
        "assignment_id": assign_id,
        "vessel_call_id": call.id,
        "berth_id": berth.id,
        "berth_code": berth.code,
        "scheduled_start": s_start.isoformat(),
        "scheduled_end": s_end.isoformat(),
        "message": f"Successfully allocated '{call.vessel.name if call.vessel else call.call_number}' to {berth.code}.",
    }


@router.delete("/assignments/{assignment_id}")
def delete_berth_assignment(
    assignment_id: str,
    db: Session = Depends(get_db),
):
    """Release a vessel from its berth assignment."""
    assign = db.query(BerthAssignment).filter(BerthAssignment.id == assignment_id).first()
    if not assign:
        raise HTTPException(status_code=404, detail="Assignment not found")

    db.delete(assign)
    db.commit()
    return {"status": "DELETED", "assignment_id": assignment_id, "message": "Berth assignment released successfully."}


@router.post("/schedules/confirm")
def confirm_schedule_version(
    payload: ConfirmScheduleRequest,
    db: Session = Depends(get_db),
):
    """Save approved operational berth schedule as a new immutable version.

    Updates active database berth assignments and logs full version audit record.
    """
    if not payload.assignments:
        raise HTTPException(status_code=400, detail="Cannot confirm an empty schedule.")

    # 1. Determine next version number
    latest_v = (
        db.query(BerthScheduleVersion)
        .order_by(BerthScheduleVersion.version_number.desc())
        .first()
    )
    next_ver_num = (latest_v.version_number + 1) if latest_v else 1

    # 2. Archive previous confirmed versions
    db.query(BerthScheduleVersion).filter(
        BerthScheduleVersion.status == ScheduleVersionStatusEnum.CONFIRMED
    ).update({"status": ScheduleVersionStatusEnum.ARCHIVED})

    # 3. Create new schedule version
    now_utc = datetime.now(timezone.utc)
    version_id = f"ver_bap_{uuid.uuid4().hex[:12]}"

    assigns_json = [a.model_dump(mode="json") for a in payload.assignments]
    metrics_json = {
        "total_assignments": len(payload.assignments),
        "total_waiting_hours": round(sum(a.waiting_time_hours for a in payload.assignments), 1),
        "confirmed_at": now_utc.isoformat(),
    }

    new_version = BerthScheduleVersion(
        id=version_id,
        terminal_id="term_cct_01",
        version_number=next_ver_num,
        name=payload.name or f"Confirmed Operational Schedule v{next_ver_num}",
        status=ScheduleVersionStatusEnum.CONFIRMED,
        planning_start=payload.assignments[0].scheduled_start if payload.assignments else now_utc,
        planning_horizon_hours=payload.planning_horizon_hours,
        confirmed_by=payload.confirmed_by or "Chief Berth Planner",
        confirmed_at=now_utc,
        notes=payload.notes,
        metrics_json=metrics_json,
        assignments_json=assigns_json,
        data_status=DataStatusEnum.SIMULATED,
        source_name="PORTOS Berth Planning Approval",
    )
    db.add(new_version)

    # 4. Upsert assignments in database
    for a in payload.assignments:
        existing = db.query(BerthAssignment).filter(BerthAssignment.vessel_call_id == a.vessel_call_id).first()
        if existing:
            existing.berth_id = a.berth_id
            existing.scheduled_start = a.scheduled_start
            existing.scheduled_end = a.scheduled_end
            existing.assigned_quay_start_m = a.assigned_quay_start_m
            existing.assigned_quay_end_m = a.assigned_quay_end_m
            existing.status = AssignmentStatusEnum.CONFIRMED
            existing.advisory_notes = a.assignment_explanation
        else:
            db.add(
                BerthAssignment(
                    id=f"assign_{uuid.uuid4().hex[:16]}",
                    berth_id=a.berth_id,
                    vessel_call_id=a.vessel_call_id,
                    scheduled_start=a.scheduled_start,
                    scheduled_end=a.scheduled_end,
                    assigned_quay_start_m=a.assigned_quay_start_m,
                    assigned_quay_end_m=a.assigned_quay_end_m,
                    status=AssignmentStatusEnum.CONFIRMED,
                    advisory_notes=a.assignment_explanation,
                    data_status=DataStatusEnum.SIMULATED,
                    source_name="PORTOS Berth Optimization Approval",
                )
            )

    db.commit()

    return {
        "status": "CONFIRMED",
        "version_id": version_id,
        "version_number": next_ver_num,
        "name": new_version.name,
        "confirmed_by": new_version.confirmed_by,
        "confirmed_at": now_utc.isoformat(),
        "assignments_confirmed": len(payload.assignments),
        "message": f"Schedule v{next_ver_num} approved and confirmed successfully.",
    }


@router.get("/schedules/versions")
def list_schedule_versions(
    db: Session = Depends(get_db),
):
    """List all stored schedule versions with historical audit metadata."""
    versions = (
        db.query(BerthScheduleVersion)
        .order_by(BerthScheduleVersion.version_number.desc())
        .all()
    )
    return [
        {
            "id": v.id,
            "version_number": v.version_number,
            "name": v.name,
            "status": v.status.value if hasattr(v.status, "value") else str(v.status),
            "planning_start": v.planning_start.isoformat(),
            "planning_horizon_hours": v.planning_horizon_hours,
            "confirmed_by": v.confirmed_by,
            "confirmed_at": v.confirmed_at.isoformat() if v.confirmed_at else None,
            "notes": v.notes,
            "metrics": v.metrics_json,
            "assignments_count": len(v.assignments_json) if v.assignments_json else 0,
        }
        for v in versions
    ]


@router.post("/berths/{berth_id}/maintenance")
def create_berth_maintenance_window(
    berth_id: str,
    payload: BerthMaintenanceCreate,
    db: Session = Depends(get_db),
):
    """Schedule a maintenance, dredging, or fender closure window for a berth."""
    berth = db.query(Berth).filter(Berth.id == berth_id).first()
    if not berth:
        raise HTTPException(status_code=404, detail="Berth not found")

    mw_id = f"maint_{uuid.uuid4().hex[:12]}"
    mw = BerthMaintenanceWindow(
        id=mw_id,
        berth_id=berth_id,
        title=payload.title,
        reason=payload.reason,
        start_time=payload.start_time,
        end_time=payload.end_time,
        is_closed=payload.is_closed,
        data_status=DataStatusEnum.SIMULATED,
        source_name="Berth Maintenance Planner",
    )
    db.add(mw)
    db.commit()

    return {
        "status": "CREATED",
        "maintenance_id": mw_id,
        "berth_id": berth_id,
        "berth_code": berth.code,
        "title": payload.title,
        "start_time": payload.start_time.isoformat(),
        "end_time": payload.end_time.isoformat(),
        "message": f"Maintenance window scheduled for {berth.code}.",
    }


@router.delete("/berths/maintenance/{window_id}")
def delete_berth_maintenance_window(
    window_id: str,
    db: Session = Depends(get_db),
):
    """Delete a berth maintenance window."""
    mw = db.query(BerthMaintenanceWindow).filter(BerthMaintenanceWindow.id == window_id).first()
    if not mw:
        raise HTTPException(status_code=404, detail="Maintenance window not found")

    db.delete(mw)
    db.commit()
    return {"status": "DELETED", "window_id": window_id, "message": "Maintenance window cleared."}

