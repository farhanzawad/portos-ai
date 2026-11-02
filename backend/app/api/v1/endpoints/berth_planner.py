"""FastAPI endpoints for constraint-based berth allocation and optimization.

Uses Google OR-Tools CP-SAT for deterministic scheduling and an independent validator
for physical constraint verification. Strictly advisory decision support.
"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.db.base import DataStatusEnum
from app.models.terminal import Berth, BerthAssignment, BerthStatusEnum, AssignmentStatusEnum
from app.models.vessel import VesselCall, CallStatusEnum
from app.schemas.optimizer import (
    OptimizerRequest,
    OptimizerResponse,
    ValidateScheduleRequest,
    FeasibilityValidationResult,
    ProposeScheduleRequest,
    ProposeScheduleResponse,
    BerthSpec,
    VesselCallSpec,
    ScheduledAssignment,
)
from app.optimizer.scheduler import BerthAllocationScheduler
from app.optimizer.validator import ScheduleFeasibilityValidator

router = APIRouter(prefix="/berth-planner", tags=["Berth Planner"])


def _load_db_specs(db: Session, terminal_id: Optional[str] = None):
    """Helper to convert database berths and active vessel calls into optimizer specs."""
    berths_query = db.query(Berth)
    if terminal_id:
        berths_query = berths_query.filter(Berth.terminal_id == terminal_id)
    db_berths = berths_query.order_by(Berth.code).all()

    berth_specs = [
        BerthSpec(
            id=b.id,
            code=b.code,
            name=b.name,
            length_m=b.length_m,
            depth_draft_m=b.depth_draft_m,
            max_vessel_loa_m=b.max_vessel_loa_m,
            is_active=b.is_active,
            status=b.status.value if hasattr(b.status, "value") else str(b.status),
        )
        for b in db_berths
    ]

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

    call_specs = []
    for c in db_calls:
        vessel = c.vessel
        loa = vessel.length_overall_m if vessel else 170.0
        draft = vessel.max_draft_m if vessel else 9.0
        v_name = vessel.name if vessel else f"Vessel {c.call_number}"
        v_type = (vessel.vessel_type.value if hasattr(vessel.vessel_type, "value") else str(vessel.vessel_type)) if vessel else "CONTAINER_FEEDER"

        # Priority heuristic: High risk calls or express cargo have higher priority
        priority = 3 if c.delay_risk_status.value == "HIGH_RISK" else (2 if c.delay_risk_status.value == "WATCH" else 1)

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
                delay_risk_status=c.delay_risk_status.value if hasattr(c.delay_risk_status, "value") else str(c.delay_risk_status),
            )
        )

    return berth_specs, call_specs


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
