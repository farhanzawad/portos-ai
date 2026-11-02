import pytest
from datetime import datetime
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.events.bus import InMemoryEventBus, event_bus
from app.events.incident_manager import incident_manager
from app.schemas.events import EventMessage, EventType, IncidentInjectionRequest
from app.models.vessel import VesselCall, DelayRiskStatusEnum
from app.models.scenario import OperationalEvent


@pytest.fixture
def test_client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_in_memory_event_bus_ring_buffer():
    """Verify in-memory event bus correctly sequences, caps history, and handles catch-up."""
    bus = InMemoryEventBus(max_history=5)
    bus.clear()
    assert bus.history_count == 0

    for i in range(7):
        evt = EventMessage(
            id=f"evt_{i}",
            event_type=EventType.VESSEL_POSITION_UPDATED.value,
            entity_id=f"vsl_{i}",
            payload={"index": i},
        )
        bus.publish_sync(evt)

    # History capped at max_history (5)
    assert bus.history_count == 5
    hist = bus.get_history()
    assert len(hist) == 5
    assert hist[0].id == "evt_2"
    assert hist[-1].id == "evt_6"

    # Catch-up with since_id
    catchup = bus.get_history(since_id="evt_4")
    assert len(catchup) == 2
    assert [e.id for e in catchup] == ["evt_5", "evt_6"]


def test_incident_injection_and_reset_workflow(db_session: Session):
    """Verify deterministic vessel delay injection propagates to DB, alerts, and resets cleanly."""
    call = db_session.query(VesselCall).first()
    assert call is not None
    original_tier = call.delay_risk_status

    # 1. Inject monsoon surge delay
    req = IncidentInjectionRequest(
        incident_type="monsoon_surge_delay",
        target_vessel_id=call.id,
        delay_hours=7.5,
    )
    resp = incident_manager.inject_incident(req, db_session)

    assert resp.status == "INJECTED"
    assert resp.events_emitted_count >= 4
    assert any(e.event_type == EventType.VESSEL_DELAY_RISK_CHANGED.value for e in resp.events)
    assert any(e.event_type == EventType.OPERATIONAL_ALERT_CREATED.value for e in resp.events)

    # Verify DB mutation
    db_session.refresh(call)
    assert call.delay_risk_status == DelayRiskStatusEnum.HIGH_RISK
    assert call.predicted_delay_hours == 7.5

    # Verify database operational alert created
    alerts = db_session.query(OperationalEvent).filter(
        OperationalEvent.title.like("%Monsoon Surge%")
    ).all()
    assert len(alerts) >= 1

    # 2. Reset back to baseline
    reset_resp = incident_manager.reset_to_baseline(db_session)
    assert reset_resp.status == "RESET_COMPLETED"
    assert reset_resp.restored_baseline is True

    # Verify DB restored
    db_session.refresh(call)
    assert call.delay_risk_status == original_tier
    assert call.predicted_delay_hours == 0.0

    # Injected alerts cleaned up
    alerts_after = db_session.query(OperationalEvent).filter(
        OperationalEvent.title.like("%Monsoon Surge%")
    ).all()
    assert len(alerts_after) == 0


def test_crane_outage_incident(db_session: Session):
    """Verify equipment degradation incident injection and reset."""
    req = IncidentInjectionRequest(incident_type="crane_outage")
    resp = incident_manager.inject_incident(req, db_session)
    assert resp.status == "INJECTED"
    assert any(e.event_type == EventType.EQUIPMENT_STATUS_CHANGED.value for e in resp.events)

    # Clean rollback
    reset_resp = incident_manager.reset_to_baseline(db_session)
    assert reset_resp.status == "RESET_COMPLETED"


def test_yard_congestion_incident(db_session: Session):
    """Verify yard occupancy congestion incident injection and reset."""
    req = IncidentInjectionRequest(incident_type="yard_congestion")
    resp = incident_manager.inject_incident(req, db_session)
    assert resp.status == "INJECTED"
    assert any(e.event_type == EventType.YARD_OCCUPANCY_FORECAST_UPDATED.value for e in resp.events)

    # Clean rollback
    reset_resp = incident_manager.reset_to_baseline(db_session)
    assert reset_resp.status == "RESET_COMPLETED"


def test_events_rest_endpoints(test_client):
    """Verify presets, status, history, injection, and reset REST routes."""
    # 1. Presets
    res_presets = test_client.get("/api/v1/events/presets")
    assert res_presets.status_code == 200
    presets = res_presets.json()
    assert len(presets) >= 3
    assert any(p["id"] == "monsoon_surge_delay" for p in presets)

    # 2. Status
    res_status = test_client.get("/api/v1/events/status")
    assert res_status.status_code == 200
    stat = res_status.json()
    assert "active_subscribers" in stat
    assert "total_events_in_buffer" in stat

    # 3. Inject incident via endpoint
    res_inj = test_client.post(
        "/api/v1/events/inject-incident",
        json={"incident_type": "monsoon_surge_delay", "delay_hours": 5.0},
    )
    assert res_inj.status_code == 200
    inj_data = res_inj.json()
    assert inj_data["status"] == "INJECTED"
    assert inj_data["events_emitted_count"] >= 4

    # 4. History
    res_hist = test_client.get("/api/v1/events/history?limit=10")
    assert res_hist.status_code == 200
    hist = res_hist.json()
    assert len(hist) >= 1

    # 5. Reset incident via endpoint
    res_rst = test_client.post("/api/v1/events/reset-incident")
    assert res_rst.status_code == 200
    assert res_rst.json()["status"] == "RESET_COMPLETED"
