import pytest
from fastapi.testclient import TestClient
from app.main import app


def test_research_evaluation_endpoint():
    """Verify temporal cross-validation and calibration analysis endpoint."""
    with TestClient(app) as client:
        resp = client.get("/api/v1/ml/research-evaluation")
        assert resp.status_code == 200
        data = resp.json()

        assert "model_name" in data
        assert "mean_temporal_mae_hours" in data
        assert "mean_temporal_rmse_hours" in data
        assert "overall_brier_score" in data
        assert "expected_calibration_error" in data
        assert len(data["splits"]) == 5
        assert len(data["calibration_bins"]) > 0

        # Verify temporal expansion: each split's train_size must grow monotonically
        train_sizes = [s["train_size"] for s in data["splits"]]
        for i in range(len(train_sizes) - 1):
            assert train_sizes[i] < train_sizes[i + 1]

        # Verify calibration bins
        for b in data["calibration_bins"]:
            assert 0.0 <= b["mean_predicted_probability"] <= 1.0
            assert 0.0 <= b["fraction_of_positives"] <= 1.0
