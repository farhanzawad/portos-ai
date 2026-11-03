import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_maintenance_overview():
    """Verify fleet-wide equipment health overview with Isolation Forest assessments."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/maintenance/overview")
        assert resp.status_code == 200
        data = resp.json()

        assert "total_units" in data
        assert data["total_units"] > 0
        assert "mean_health_index" in data
        assert 0.0 <= data["mean_health_index"] <= 100.0
        assert len(data["units"]) == data["total_units"]

        unit = data["units"][0]
        assert "equipment_id" in unit
        assert "is_anomaly" in unit
        assert "anomaly_score" in unit
        assert unit["risk_level"] in ["NORMAL", "WATCH", "CRITICAL"]
        assert "telemetry" in unit
        assert unit["telemetry"]["vibration_mm_s"] > 0.0
        assert unit["telemetry"]["hydraulic_temp_c"] > 0.0


def test_maintenance_inject_and_reset_anomaly():
    """Verify interactive injection of telemetry anomaly and subsequent reset."""
    with TestClient(app) as client:
        # First get overview to find an equipment ID
        overview_resp = client.get("/api/v1/maintenance/overview")
        eq_id = overview_resp.json()["units"][0]["equipment_id"]

        # Inject severe vibration anomaly
        inject_resp = client.post(
            "/api/v1/maintenance/inject-anomaly",
            json={
                "equipment_id": eq_id,
                "vibration_mm_s": 5.8,
                "hydraulic_temp_c": 92.0,
            },
        )
        assert inject_resp.status_code == 200
        assert inject_resp.json()["status"] == "anomaly_injected"

        # Check equipment status is now anomalous
        eq_resp = client.get(f"/api/v1/maintenance/equipment/{eq_id}")
        assert eq_resp.status_code == 200
        eq_data = eq_resp.json()
        assert eq_data["is_anomaly"] is True
        assert eq_data["risk_level"] in ["WATCH", "CRITICAL"]
        assert "Vibration" in eq_data["dominant_contributing_feature"] or "Temp" in eq_data["dominant_contributing_feature"]

        # Reset anomaly
        reset_resp = client.post("/api/v1/maintenance/reset-anomalies")
        assert reset_resp.status_code == 200
        assert reset_resp.json()["status"] == "anomalies_reset"
