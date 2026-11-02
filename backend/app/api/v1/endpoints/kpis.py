from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import DataStatusEnum
from app.db.session import get_db
from app.models.terminal import Terminal, Berth, BerthStatusEnum
from app.models.vessel import VesselCall, CallStatusEnum
from app.models.scenario import OperationalEvent
from app.models.yard import YardOccupancyObservation, YardRiskTierEnum
from app.schemas.operational import BaselineKPIsResponse

router = APIRouter(prefix="/kpis", tags=["KPIs & Metrics"])


@router.get("/overview", response_model=BaselineKPIsResponse)
def get_overview_kpis(
    terminal_id: Optional[str] = Query(None, description="Terminal ID (defaults to primary demo terminal)"),
    db: Session = Depends(get_db),
):
    """Calculate and return operational baseline KPIs for the selected terminal."""
    if not terminal_id:
        terminal = db.query(Terminal).first()
    else:
        terminal = db.query(Terminal).filter(Terminal.id == terminal_id).first()

    if not terminal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No terminal found in database. Please run database seed first.",
        )

    # 1. Vessel counts
    total_calls = db.query(VesselCall).filter(VesselCall.terminal_id == terminal.id).all()
    vessels_in_system = len(total_calls)
    vessels_at_berth = sum(1 for c in total_calls if c.status == CallStatusEnum.BERTHED)
    vessels_in_queue = sum(1 for c in total_calls if c.status == CallStatusEnum.OUTER_ANCHORAGE)

    # Mean predicted delay
    delays = [c.predicted_delay_hours for c in total_calls if c.status == CallStatusEnum.OUTER_ANCHORAGE]
    mean_delay = round(sum(delays) / len(delays), 1) if delays else 0.0

    # 2. Berth occupancy
    berths = db.query(Berth).filter(Berth.terminal_id == terminal.id).all()
    total_berths = len(berths)
    occupied_berths = sum(1 for b in berths if b.status == BerthStatusEnum.OCCUPIED)
    occupancy_pct = round((occupied_berths / total_berths) * 100, 1) if total_berths > 0 else 0.0

    # 3. Active alerts
    alerts_count = db.query(OperationalEvent).filter(OperationalEvent.terminal_id == terminal.id).count()

    # 4. Yard blocks above warning
    yard_risk_count = (
        db.query(YardOccupancyObservation)
        .filter(YardOccupancyObservation.risk_tier.in_([YardRiskTierEnum.WATCH, YardRiskTierEnum.HIGH_RISK]))
        .count()
    )

    return BaselineKPIsResponse(
        terminal_id=terminal.id,
        terminal_code=terminal.code,
        timestamp=datetime.now(timezone.utc),
        vessels_in_system=vessels_in_system,
        vessels_at_berth=vessels_at_berth,
        vessels_in_queue=vessels_in_queue,
        berth_occupancy_pct=occupancy_pct,
        total_berths=total_berths,
        occupied_berths=occupied_berths,
        active_alerts_count=alerts_count,
        yard_blocks_above_warning=yard_risk_count,
        mean_anchorage_delay_hours=mean_delay,
        data_status=DataStatusEnum.SIMULATED,
    )

