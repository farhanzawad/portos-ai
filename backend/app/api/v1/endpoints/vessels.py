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

    return VesselTrackResponse(
        call_id=call.id,
        vessel_name=call.vessel.name if call.vessel else "Unknown Vessel",
        call_number=call.call_number,
        status=call.status,
        reported_eta=call.reported_eta,
        predicted_eta=call.predicted_eta,
        predicted_delay_hours=call.predicted_delay_hours,
        positions=[VesselPositionRead.model_validate(p) for p in positions],
    )


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

