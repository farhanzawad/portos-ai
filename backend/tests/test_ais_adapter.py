import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.base import DataStatusEnum


def test_ais_status_simulated_fallback():
    """Verify AIS provider returns SIMULATED status and operational truthfulness disclaimer when key absent."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/ais/status")
        assert resp.status_code == 200
        data = resp.json()

        assert "provider_name" in data
        assert data["is_connected"] is False
        assert data["api_key_configured"] is False
        assert data["data_status"] == DataStatusEnum.SIMULATED.value
        assert "NOT CERTIFIED FOR REAL-TIME COLLISION AVOIDANCE" in data["disclaimer"]
        assert "AIS_STREAM_API_KEY" in data["audit_note"]
        assert len(data["bounding_box"]) == 4


def test_ais_feed_target_tracking():
    """Verify AIS feed returns targets with valid coordinates and pilot distances."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/ais/feed")
        assert resp.status_code == 200
        data = resp.json()

        assert "provider_status" in data
        assert "targets" in data
        assert data["total_targets"] > 0

        target = data["targets"][0]
        assert "mmsi" in target
        assert "ship_name" in target
        assert 22.0 <= target["latitude"] <= 22.5
        assert 91.6 <= target["longitude"] <= 92.0
        assert target["distance_to_pilot_nm"] >= 0.0


def test_ais_test_connection_diagnostics():
    """Verify test-connection endpoint returns diagnostic payload."""
    with TestClient(app) as client:
        resp = client.post("/api/v1/ais/test-connection")
        assert resp.status_code == 200
        data = resp.json()

        assert data["status"] in ["connected", "simulated_fallback"]
        assert "provider" in data
        assert "audit_note" in data
