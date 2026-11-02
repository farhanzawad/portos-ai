from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.terminal import Berth, BerthAssignment, BerthStatusEnum
from app.schemas.terminal import BerthRead, BerthAssignmentRead

router = APIRouter(prefix="/berths", tags=["Berths"])


@router.get("", response_model=List[BerthRead])
def list_berths(
    terminal_id: Optional[str] = Query(None, description="Filter by terminal ID"),
    status: Optional[BerthStatusEnum] = Query(None, description="Filter by berth status"),
    db: Session = Depends(get_db),
):
    """List berths with optional terminal and status filtering."""
    query = db.query(Berth)
    if terminal_id:
        query = query.filter(Berth.terminal_id == terminal_id)
    if status:
        query = query.filter(Berth.status == status)
    return query.order_by(Berth.code).all()


@router.get("/{berth_id}", response_model=BerthRead)
def get_berth(berth_id: str, db: Session = Depends(get_db)):
    """Retrieve berth specifications by ID."""
    berth = db.query(Berth).filter(Berth.id == berth_id).first()
    if not berth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Berth with ID '{berth_id}' not found.",
        )
    return berth


@router.get("/{berth_id}/assignments", response_model=List[BerthAssignmentRead])
def get_berth_assignments(berth_id: str, db: Session = Depends(get_db)):
    """Retrieve scheduled and active vessel assignments for a berth."""
    berth = db.query(Berth).filter(Berth.id == berth_id).first()
    if not berth:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Berth with ID '{berth_id}' not found.",
        )
    return (
        db.query(BerthAssignment)
        .filter(BerthAssignment.berth_id == berth_id)
        .order_by(BerthAssignment.scheduled_start)
        .all()
    )

