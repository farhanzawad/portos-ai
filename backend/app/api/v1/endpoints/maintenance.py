from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel

from app.db.session import get_db
from app.models.equipment import Equipment
from app.maintenance.service import maintenance_service
from app.schemas.maintenance import (
    MaintenanceOverviewResponse,
    AnomalyAssessment,
)

router = APIRouter(prefix="/maintenance", tags=["Equipment Predictive Maintenance"])


class InjectAnomalyRequest(BaseModel):
    equipment_id: str
    vibration_mm_s: Optional[float] = 4.8
    hydraulic_temp_c: Optional[float] = 85.0
    power_draw_kw: Optional[float] = 460.0
    hoist_cycle_time_s: Optional[float] = 125.0


@router.get("/overview", response_model=MaintenanceOverviewResponse)
def get_maintenance_overview(db: Session = Depends(get_db)):
    """Retrieve predictive maintenance health index and anomaly statuses for all port equipment."""
    return maintenance_service.get_overview(db=db)


@router.get("/equipment/{equipment_id}", response_model=AnomalyAssessment)
def get_equipment_assessment(equipment_id: str, db: Session = Depends(get_db)):
    """Retrieve Isolation Forest anomaly assessment for a specific equipment unit."""
    eq = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment with ID '{equipment_id}' not found.",
        )
    return maintenance_service.assess_equipment(eq)


@router.post("/inject-anomaly")
def inject_anomaly(req: InjectAnomalyRequest, db: Session = Depends(get_db)):
    """Inject synthetic abnormal telemetry into an equipment unit to trigger predictive maintenance."""
    eq = db.query(Equipment).filter(Equipment.id == req.equipment_id).first()
    if not eq:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Equipment with ID '{req.equipment_id}' not found.",
        )
    return maintenance_service.inject_equipment_anomaly(
        equipment_id=req.equipment_id,
        vibration=req.vibration_mm_s,
        temp=req.hydraulic_temp_c,
        power=req.power_draw_kw,
        cycle_time=req.hoist_cycle_time_s,
    )


@router.post("/reset-anomalies")
def reset_anomalies():
    """Reset all injected equipment anomalies back to nominal baseline."""
    return maintenance_service.reset_anomalies()
