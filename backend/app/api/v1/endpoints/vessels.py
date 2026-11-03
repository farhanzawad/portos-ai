from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.db.session import get_db
from app.models.vessel import Vessel, VesselCall, VesselPosition, CallStatusEnum, DelayRiskStatusEnum
from app.schemas.vessel import VesselRead, VesselCallRead, VesselPositionRead, VesselTrackResponse
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/vessels", tags=["Vessels"])


@router.get("", response_model=PaginatedResponse[VesselRead])
def list_vessels(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(None, description="Search vessel name or IMO"),
    db: Session = Depends(get_db),
):
    """List registered vessels with pagination and search."""
    query = db.query(Vessel)
    if search:
        query = query.filter(or_(Vessel.name.ilike(f"%{search}%"), Vessel.imo_number.ilike(f"%{search}%")))

    total_count = query.count()
    items = query.order_by(Vessel.name).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/calls", response_model=PaginatedResponse[VesselCallRead])
def list_vessel_calls(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[CallStatusEnum] = Query(None, description="Filter by operational status"),
    delay_risk_status: Optional[DelayRiskStatusEnum] = Query(None, description="Filter by delay risk tier"),
    db: Session = Depends(get_db),
):
    """List vessel calls with operational status and delay-risk tier filtering."""
    query = db.query(VesselCall)
    if status:
        query = query.filter(VesselCall.status == status)
    if delay_risk_status:
        query = query.filter(VesselCall.delay_risk_status == delay_risk_status)

    total_count = query.count()
    items = query.order_by(VesselCall.reported_eta).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/calls/{call_id}", response_model=VesselCallRead)
def get_vessel_call(call_id: str, db: Session = Depends(get_db)):
    """Retrieve details for a specific vessel call."""
    call = db.query(VesselCall).filter(VesselCall.id == call_id).first()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel call with ID '{call_id}' not found.",
        )
    return call


@router.get("/calls/{call_id}/track", response_model=VesselTrackResponse)
def get_vessel_track(call_id: str, db: Session = Depends(get_db)):
    """Retrieve simulated GPS/AIS track history for an incoming vessel call."""
    call = db.query(VesselCall).filter(VesselCall.id == call_id).first()
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel call with ID '{call_id}' not found.",
        )

    positions = (
        db.query(VesselPosition)
        .filter(VesselPosition.vessel_call_id == call_id)
        .order_by(VesselPosition.timestamp)
        .all()
    )

    if len(positions) > 1:
        track_positions = [VesselPositionRead.model_validate(p) for p in positions]
    else:
        base_pos = positions[0] if positions else None
        track_positions = _generate_corridor_track(call, base_pos)

    return VesselTrackResponse(
        call_id=call.id,
        vessel_name=call.vessel.name if call.vessel else "Unknown Vessel",
        call_number=call.call_number,
        status=call.status,
        reported_eta=call.reported_eta,
        predicted_eta=call.predicted_eta,
        predicted_delay_hours=call.predicted_delay_hours,
        positions=track_positions,
    )


def _generate_corridor_track(call: VesselCall, base_pos: Optional[VesselPosition]) -> List[VesselPositionRead]:
    from datetime import datetime, timedelta
    from app.db.base import DataStatusEnum

    ref_time = base_pos.timestamp if base_pos else (call.reported_eta or datetime.utcnow())

    # Verified Karnaphuli channel waypoints following natural river meander strictly in water
    waypoints = [
        (22.1300, 91.7000, 14.2, 35.0, "Under way (Bay of Bengal)", 14.5),
        (22.1750, 91.7500, 12.0, 35.0, "Outer Fairway Approach", 8.5),
        (22.1950, 91.7750, 10.5, 40.0, "Pilot boarding approach", 4.0),
        (22.2080, 91.7920, 9.5, 42.0, "Pilot station boarding", 3.0),
        (22.2200, 91.8050, 8.5, 45.0, "River mouth transit", 2.0),
        (22.2260, 91.8095, 8.0, 45.0, "Lower reach channel transit", 1.5),
        (22.2350, 91.8180, 7.5, 35.0, "Lower reach river transit", 1.2),
        (22.2450, 91.8295, 7.0, 25.0, "Patenga reach PCT transit", 1.0),
        (22.2550, 91.8355, 6.5, 15.0, "River reach east of airport", 0.8),
        (22.2650, 91.8355, 6.2, 355.0, "Approaching river meander", 0.6),
        (22.2700, 91.8230, 5.8, 320.0, "Curving northwest into Gupta bend", 0.5),
        (22.2750, 91.8120, 5.5, 305.0, "Gupta bend entry transit", 0.4),
        (22.2800, 91.7998, 5.0, 345.0, "Gupta Bend apex navigation", 0.3),
        (22.2850, 91.7980, 4.6, 350.0, "NCT approach reach", 0.2),
        (22.2900, 91.7960, 4.2, 355.0, "North transit past NCT", 0.15),
        (22.2980, 91.7960, 3.8, 15.0, "CCT channel approach", 0.1),
        (22.3040, 91.8020, 0.0, 0.0, "Moored at berth" if call.status == CallStatusEnum.BERTHED else "At berth", 0.0),
    ]

    if call.status == CallStatusEnum.OUTER_ANCHORAGE:
        count = 2
    elif call.status == CallStatusEnum.EN_ROUTE:
        count = 4
    elif call.status == CallStatusEnum.PILOT_BOARDING:
        count = 5
    elif call.status in [CallStatusEnum.BERTHED, CallStatusEnum.OPERATING]:
        count = len(waypoints)
    else:
        count = 4

    result = []
    for idx, (lat, lon, spd, hdg, nav_status, dist) in enumerate(waypoints[:count]):
        step_time = ref_time - timedelta(minutes=(count - 1 - idx) * 35)
        result.append(
            VesselPositionRead(
                id=f"sim_track_{call.id}_{idx}",
                vessel_call_id=call.id,
                timestamp=step_time,
                latitude=lat,
                longitude=lon,
                speed_knots=spd,
                heading_degrees=hdg,
                navigational_status=nav_status,
                distance_to_pilot_nm=dist,
                data_status=DataStatusEnum.SIMULATED,
            )
        )
    return result


@router.get("/{vessel_id}", response_model=VesselRead)
def get_vessel(vessel_id: str, db: Session = Depends(get_db)):
    """Retrieve vessel technical specification by ID."""
    vessel = db.query(Vessel).filter(Vessel.id == vessel_id).first()
    if not vessel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Vessel with ID '{vessel_id}' not found.",
        )
    return vessel

