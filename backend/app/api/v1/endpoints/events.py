from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.scenario import OperationalEvent, EventSeverityEnum, EventTypeEnum
from app.schemas.operational import OperationalEventRead
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/events", tags=["Operational Events & Timeline"])


@router.get("", response_model=PaginatedResponse[OperationalEventRead])
def list_events(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    severity: Optional[EventSeverityEnum] = Query(None, description="Filter by alert severity"),
    event_type: Optional[EventTypeEnum] = Query(None, description="Filter by event category"),
    db: Session = Depends(get_db),
):
    """Retrieve paginated operational event alerts and disruption history."""
    query = db.query(OperationalEvent)
    if severity:
        query = query.filter(OperationalEvent.severity == severity)
    if event_type:
        query = query.filter(OperationalEvent.event_type == event_type)

    total_count = query.count()
    items = query.order_by(OperationalEvent.timestamp.desc()).offset((page - 1) * page_size).limit(page_size).all()
    total_pages = max(1, (total_count + page_size - 1) // page_size)

    return PaginatedResponse(
        items=items,
        total_count=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )

