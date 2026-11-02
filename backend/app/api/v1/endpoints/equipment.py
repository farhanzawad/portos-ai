from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.equipment import Equipment, EquipmentTelemetry, EquipmentTypeEnum, EquipmentStatusEnum
from app.schemas.equipment import EquipmentRead, EquipmentTelemetryRead

router = APIRouter(prefix="/equipment", tags=["Equipment"])


@router.get("", response_model=List[EquipmentRead])
def list_equipment(
    equipment_type: Optional[EquipmentTypeEnum] = Query(None, description="Filter by equipment category"),
    status: Optional[EquipmentStatusEnum] = Query(None, description="Filter by operational status"),
    db: Session = Depends(get_db),
):
    """List container handling equipment fleet with category/status filtering."""
    query = db.query(Equipment)
    if equipment_type:
        query = query.filter(Equipment.equipment_type == equipment_type)
    if status:
        query = query.filter(Equipment.status == status)
    return query.order_by(Equipment.code).all()


@router.get("/{equipment_id}", response_model=EquipmentRead)
def get_equipment(equipment_id: str, db: Session = Depends(get_db)):
    """Retrieve equipment specifications by ID."""
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment with ID '{equipment_id}' not found.",
        )
    return equipment


@router.get("/{equipment_id}/telemetry", response_model=List[EquipmentTelemetryRead])
def get_equipment_telemetry(
    equipment_id: str,
    limit: int = Query(50, ge=1, le=200, description="Number of recent readings"),
    db: Session = Depends(get_db),
):
    """Retrieve recent telemetry log readings for an equipment unit."""
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment with ID '{equipment_id}' not found.",
        )
    return (
        db.query(EquipmentTelemetry)
        .filter(EquipmentTelemetry.equipment_id == equipment_id)
        .order_by(EquipmentTelemetry.timestamp.desc())
        .limit(limit)
        .all()
    )

