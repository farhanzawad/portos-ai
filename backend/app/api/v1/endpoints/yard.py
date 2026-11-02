from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.yard import YardBlock, YardOccupancyObservation, YardZoneEnum
from app.schemas.yard import YardBlockRead, YardOccupancyRead

router = APIRouter(prefix="/yard", tags=["Yard Intelligence"])


@router.get("/blocks", response_model=List[YardBlockRead])
def list_yard_blocks(
    zone: Optional[YardZoneEnum] = Query(None, description="Filter by yard zone type"),
    db: Session = Depends(get_db),
):
    """List container yard blocks and design capacity limits."""
    query = db.query(YardBlock)
    if zone:
        query = query.filter(YardBlock.zone == zone)
    return query.order_by(YardBlock.code).all()


@router.get("/blocks/{block_id}", response_model=YardBlockRead)
def get_yard_block(block_id: str, db: Session = Depends(get_db)):
    """Retrieve yard block sector details by ID."""
    block = db.query(YardBlock).filter(YardBlock.id == block_id).first()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Yard block with ID '{block_id}' not found.",
        )
    return block


@router.get("/blocks/{block_id}/occupancy", response_model=List[YardOccupancyRead])
def get_yard_occupancy(
    block_id: str,
    limit: int = Query(24, ge=1, le=100, description="Number of historical/forecast observations"),
    db: Session = Depends(get_db),
):
    """Retrieve timestamped occupancy observations and forecast horizons for a yard block."""
    block = db.query(YardBlock).filter(YardBlock.id == block_id).first()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Yard block with ID '{block_id}' not found.",
        )
    return (
        db.query(YardOccupancyObservation)
        .filter(YardOccupancyObservation.yard_block_id == block_id)
        .order_by(YardOccupancyObservation.timestamp.desc())
        .limit(limit)
        .all()
    )

