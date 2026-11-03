from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ais.adapter import ais_adapter
from app.schemas.ais import (
    AISProviderStatus,
    AISFeedResponse,
)

router = APIRouter(prefix="/ais", tags=["AIS Provider Adapter"])


@router.get("/status", response_model=AISProviderStatus)
def get_ais_status(db: Session = Depends(get_db)):
    """Retrieve operational status, active target count, and credential presence of AIS provider."""
    return ais_adapter.get_provider_status(db=db)


@router.get("/feed", response_model=AISFeedResponse)
def get_ais_feed(db: Session = Depends(get_db)):
    """Fetch live or synthetic AIS transponder target list across Chattogram Port corridor."""
    return ais_adapter.get_feed(db=db)


@router.post("/test-connection")
def test_ais_connection(db: Session = Depends(get_db)):
    """Diagnostic check for live AIS subscription key and websocket connectivity."""
    status_info = ais_adapter.get_provider_status(db=db)
    return {
        "status": "connected" if status_info.is_connected else "simulated_fallback",
        "api_key_configured": status_info.api_key_configured,
        "provider": status_info.provider_name,
        "audit_note": status_info.audit_note,
        "disclaimer": status_info.disclaimer,
    }
