from typing import List, Optional, Literal
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.base import DataStatusEnum
from app.models.yard import (
    YardBlock,
    YardOccupancyObservation,
    ContainerMovementEvent,
    YardZoneEnum,
    YardRiskTierEnum,
)
from app.schemas.yard import (
    YardBlockRead,
    YardOccupancyRead,
    YardBlockStatusRead,
    YardSummaryResponse,
    YardBlockDetailResponse,
    YardCongestionAlert,
    ContainerMovementRead,
)
from app.yard.forecaster import yard_forecasting_service

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


@router.get("/status", response_model=YardSummaryResponse)
def get_yard_status(
    terminal_id: str = Query("term_cct_01", description="Terminal identifier"),
    db: Session = Depends(get_db),
):
    """Retrieve comprehensive yard status, multi-horizon forecasts, and aggregate KPIs."""
    blocks = db.query(YardBlock).order_by(YardBlock.code).all()
    if not blocks:
        return YardSummaryResponse(
            terminal_id=terminal_id,
            total_capacity_teu=0,
            total_occupied_teu=0,
            overall_occupancy_pct=0.0,
            blocks_normal_count=0,
            blocks_watch_count=0,
            blocks_high_risk_count=0,
            blocks=[],
            model_metadata=yard_forecasting_service.model_metadata,
            data_status=DataStatusEnum.SIMULATED,
            timestamp=datetime.now(timezone.utc),
        )

    statuses: List[YardBlockStatusRead] = []
    for b in blocks:
        observations = (
            db.query(YardOccupancyObservation)
            .filter(YardOccupancyObservation.yard_block_id == b.id)
            .order_by(YardOccupancyObservation.timestamp.asc())
            .all()
        )
        block_status = yard_forecasting_service.forecast_block_horizons(
            block=b,
            observations=observations,
        )
        statuses.append(block_status)

    return yard_forecasting_service.generate_summary(
        blocks_status=statuses,
        terminal_id=terminal_id,
    )


@router.get("/forecast")
def get_yard_forecast(
    horizon_hrs: int = Query(6, ge=1, le=72, description="Forecast horizon in simulated hours (6, 12, 24)"),
    block_id: Optional[str] = Query(None, description="Optional block identifier to isolate"),
    db: Session = Depends(get_db),
):
    """Retrieve block-by-block occupancy projections for a specific horizon."""
    query = db.query(YardBlock)
    if block_id:
        query = query.filter(YardBlock.id == block_id)
    blocks = query.order_by(YardBlock.code).all()

    results = []
    for b in blocks:
        observations = (
            db.query(YardOccupancyObservation)
            .filter(YardOccupancyObservation.yard_block_id == b.id)
            .order_by(YardOccupancyObservation.timestamp.asc())
            .all()
        )
        status_read = yard_forecasting_service.forecast_block_horizons(
            block=b,
            observations=observations,
        )

        horizon_detail = (
            status_read.forecast_6h
            if horizon_hrs == 6
            else (status_read.forecast_12h if horizon_hrs == 12 else status_read.forecast_24h)
        )

        results.append({
            "block_id": b.id,
            "code": b.code,
            "name": b.name,
            "zone": b.zone,
            "capacity": b.teu_capacity,
            "current_occupied_teu": status_read.current_occupied_teu,
            "current_occupancy_pct": status_read.current_occupancy_pct,
            "current_risk_tier": status_read.current_risk_tier,
            "horizon_hrs": horizon_hrs,
            "forecast": horizon_detail,
            "data_status": status_read.data_status,
            "source_name": status_read.source_name,
        })

    return {
        "horizon_hrs": horizon_hrs,
        "block_count": len(results),
        "model_metadata": yard_forecasting_service.model_metadata,
        "items": results,
    }


@router.get("/congestion-alerts", response_model=List[YardCongestionAlert])
def get_yard_congestion_alerts(db: Session = Depends(get_db)):
    """Retrieve operational bottlenecks and forecasted capacity saturation warnings."""
    blocks = db.query(YardBlock).order_by(YardBlock.code).all()
    statuses: List[YardBlockStatusRead] = []
    for b in blocks:
        observations = (
            db.query(YardOccupancyObservation)
            .filter(YardOccupancyObservation.yard_block_id == b.id)
            .order_by(YardOccupancyObservation.timestamp.asc())
            .all()
        )
        statuses.append(
            yard_forecasting_service.forecast_block_horizons(
                block=b,
                observations=observations,
            )
        )

    return yard_forecasting_service.generate_congestion_alerts(statuses)


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


@router.get("/blocks/{block_id}/detail", response_model=YardBlockDetailResponse)
def get_yard_block_detail(block_id: str, db: Session = Depends(get_db)):
    """Retrieve granular sector history, movements, multi-horizon forecasts, and explainability factors."""
    block = db.query(YardBlock).filter(YardBlock.id == block_id).first()
    if not block:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Yard block with ID '{block_id}' not found.",
        )

    observations = (
        db.query(YardOccupancyObservation)
        .filter(YardOccupancyObservation.yard_block_id == block_id)
        .order_by(YardOccupancyObservation.timestamp.asc())
        .all()
    )

    movements = (
        db.query(ContainerMovementEvent)
        .filter(ContainerMovementEvent.yard_block_id == block_id)
        .order_by(ContainerMovementEvent.timestamp.desc())
        .limit(20)
        .all()
    )

    status_read = yard_forecasting_service.forecast_block_horizons(
        block=block,
        observations=observations,
    )

    return YardBlockDetailResponse(
        block=block,
        current_status=status_read,
        history_observations=observations,
        recent_movements=movements,
        model_metadata=yard_forecasting_service.model_metadata,
        data_status=DataStatusEnum.SIMULATED,
    )
