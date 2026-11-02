import asyncio
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, Request, Header
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.scenario import OperationalEvent, EventSeverityEnum, EventTypeEnum
from app.schemas.operational import OperationalEventRead
from app.schemas.common import PaginatedResponse
from app.schemas.events import (
    EventMessage,
    IncidentInjectionRequest,
    IncidentInjectionResponse,
    IncidentResetResponse,
    IncidentPreset,
    EventStreamStatus,
)
from app.events.bus import event_bus
from app.events.incident_manager import incident_manager
from app.db.base import DataStatusEnum

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


@router.get("/stream")
async def event_stream(
    request: Request,
    last_event_id: Optional[str] = Query(None, description="Replay events emitted after this ID"),
    last_event_id_header: Optional[str] = Header(None, alias="Last-Event-ID"),
):
    """Server-Sent Events (SSE) unified live operational stream.
    
    Streams real-time updates for vessel positions, predictions, berth proposals,
    crane statuses, yard occupancy forecasts, and injected incidents with automatic
    reconnection and history catch-up.
    """
    effective_since_id = last_event_id or last_event_id_header

    async def sse_generator():
        # Emit initial ping / handshake
        yield f": connected to PORTOS AI unified event stream (time={asyncio.get_event_loop().time()})\n\n"

        async for event in event_bus.subscribe(since_id=effective_since_id):
            # Check if client disconnected
            if await request.is_disconnected():
                break

            # SSE wire format:
            # id: <id>\n
            # event: <type>\n
            # data: <json>\n\n
            data = event.model_dump_json()
            yield f"id: {event.id}\nevent: {event.event_type}\ndata: {data}\n\n"

    return StreamingResponse(
        sse_generator(),
        media_type="text/event-stream",
        headers={
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history", response_model=List[EventMessage])
def get_event_history(
    limit: int = Query(50, ge=1, le=200, description="Max historical events to return"),
    since_id: Optional[str] = Query(None, description="Events emitted after this ID"),
):
    """Retrieve in-memory ring buffer event history for timeline playback."""
    return event_bus.get_history(limit=limit, since_id=since_id)


@router.get("/status", response_model=EventStreamStatus)
def get_stream_status():
    """Retrieve health and connection statistics of the event stream."""
    return EventStreamStatus(
        active_subscribers=event_bus.active_subscribers_count,
        total_events_in_buffer=event_bus.history_count,
        last_event_id=event_bus.get_last_event_id(),
        data_status=DataStatusEnum.SIMULATED,
    )


@router.get("/presets", response_model=List[IncidentPreset])
def list_incident_presets():
    """Retrieve available deterministic incident scenarios for demonstration."""
    return incident_manager.get_presets()


@router.post("/inject-incident", response_model=IncidentInjectionResponse)
def inject_incident(
    request: IncidentInjectionRequest,
    db: Session = Depends(get_db),
):
    """Inject a deterministic incident across the terminal and broadcast synchronized events.
    
    Demonstrates cross-module propagation:
    1. Vessel status and ML delay risk escalate.
    2. Operational alert appears on Overview.
    3. Berth Planner registers schedule disruption.
    4. Decision Lab enables comparative simulation.
    5. Copilot explains root cause and trade-offs.
    """
    return incident_manager.inject_incident(request, db)


@router.post("/reset-incident", response_model=IncidentResetResponse)
def reset_incident(
    db: Session = Depends(get_db),
):
    """Deterministically roll back all injected incidents to clean seed baseline."""
    return incident_manager.reset_to_baseline(db)
