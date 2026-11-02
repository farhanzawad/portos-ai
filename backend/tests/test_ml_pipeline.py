"""Unit and integration tests for the Predictive ML pipeline."""

import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.ml.synthetic_data import (
    generate_synthetic_vessel_data,
    FEATURE_COLUMNS,
    TARGET_REGRESSION,
    TARGET_CLASSIFICATION,
)
from app.ml.service import get_predictor
from app.schemas.ml import VesselPredictionInput
from app.models.vessel import VesselTypeEnum, DelayRiskStatusEnum


def test_synthetic_data_reproducibility():
    """Verify that synthetic data generation is deterministic and reproducible."""
    df1 = generate_synthetic_vessel_data(n_samples=200, random_seed=42)
    df2 = generate_synthetic_vessel_data(n_samples=200, random_seed=42)

    assert len(df1) == 200
    assert len(df2) == 200
    assert list(df1.columns) == list(df2.columns)
    for col in FEATURE_COLUMNS:
        assert col in df1.columns
        assert df1[col].isnull().sum() == 0

    assert df1[TARGET_REGRESSION].equals(df2[TARGET_REGRESSION])
    assert df1[TARGET_CLASSIFICATION].equals(df2[TARGET_CLASSIFICATION])


def test_model_beats_baseline():
    """Verify that trained model evaluation metrics beat transparent naive baselines."""
    predictor = get_predictor()
    metrics = predictor.get_evaluation_metrics()

    reg_metrics = metrics["regression_metrics"]
    clf_metrics = metrics["classification_metrics"]

    # Model MAE must be strictly lower than naive median baseline MAE
    assert reg_metrics["mae_hours"] < reg_metrics["baseline_median_mae_hours"]
    assert reg_metrics["beats_baseline"] is True

    # Classification accuracy must beat or equal naive majority class baseline
    assert clf_metrics["accuracy"] >= clf_metrics["baseline_accuracy"]
    assert clf_metrics["beats_baseline"] is True


def test_inference_service_execution():
    """Test inference service on operational vessel parameters."""
    predictor = get_predictor()

    # Normal approach with favorable tidal window
    input_normal = VesselPredictionInput(
        vessel_type=VesselTypeEnum.CONTAINER_FEEDER,
        distance_to_pilot_nm=25.0,
        speed_knots=14.0,
        scheduled_hour_of_day=10,
        anchorage_queue_count=3,
        berth_occupancy_ratio=0.65,
        wind_speed_knots=12.0,
        visibility_nm=10.0,
        is_monsoon_season=False,
        tidal_window_favorable=True,
        carrier_historical_delay_mean=0.2,
    )

    pred_normal = predictor.predict(input_normal)
    assert isinstance(pred_normal.predicted_delay_hours, float)
    assert isinstance(pred_normal.is_delayed_high_risk, bool)
    assert pred_normal.delay_risk_tier in [DelayRiskStatusEnum.NORMAL, DelayRiskStatusEnum.WATCH]
    assert pred_normal.data_status.value == "SIMULATED"
    assert "Synthetic-data demonstration" in pred_normal.operational_notice

    # Heavy delay shock: bulk carrier, unfavorable tide, severe anchorage congestion, gale wind
    input_delayed = VesselPredictionInput(
        vessel_type=VesselTypeEnum.BULK_CARRIER,
        distance_to_pilot_nm=80.0,
        speed_knots=8.0,
        scheduled_hour_of_day=2,
        anchorage_queue_count=16,
        berth_occupancy_ratio=0.95,
        wind_speed_knots=32.0,
        visibility_nm=2.0,
        is_monsoon_season=True,
        tidal_window_favorable=False,
        carrier_historical_delay_mean=3.5,
    )

    pred_delayed = predictor.predict(input_delayed)
    assert pred_delayed.predicted_delay_hours > 3.0
    assert pred_delayed.is_delayed_high_risk is True
    assert pred_delayed.delay_risk_tier == DelayRiskStatusEnum.HIGH_RISK


@pytest.mark.asyncio
async def test_models_api_endpoints():
    """Test /api/v1/models REST API endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. Metadata endpoint
        meta_res = await client.get("/api/v1/models/metadata")
        assert meta_res.status_code == 200
        meta = meta_res.json()
        assert meta["model_name"] == "portos-vessel-delay-ensemble"
        assert meta["model_version"] == "1.0.0"
        assert "vessel_type_code" in meta["feature_columns"]
        assert meta["data_status"] == "SIMULATED"

        # 2. Evaluation metrics endpoint
        eval_res = await client.get("/api/v1/models/evaluation")
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert "regression_metrics" in eval_data
        assert "classification_metrics" in eval_data
        assert "feature_importances" in eval_data
        assert eval_data["regression_metrics"]["mae_hours"] > 0

        # 3. Predict endpoint (Valid payload)
        payload = {
            "vessel_type": "CONTAINER_FEEDER",
            "distance_to_pilot_nm": 30.0,
            "speed_knots": 13.0,
            "scheduled_hour_of_day": 14,
            "anchorage_queue_count": 5,
            "berth_occupancy_ratio": 0.70,
            "wind_speed_knots": 15.0,
            "visibility_nm": 8.0,
            "is_monsoon_season": False,
            "tidal_window_favorable": True,
            "carrier_historical_delay_mean": 0.5,
        }
        pred_res = await client.post("/api/v1/models/predict", json=payload)
        assert pred_res.status_code == 200
        pred_data = pred_res.json()
        assert "predicted_delay_hours" in pred_data
        assert "delay_risk_tier" in pred_data
        assert pred_data["data_status"] == "SIMULATED"

        # 4. Predict endpoint (Validation error on negative distance)
        bad_payload = payload.copy()
        bad_payload["distance_to_pilot_nm"] = -10.0
        bad_res = await client.post("/api/v1/models/predict", json=bad_payload)
        assert bad_res.status_code == 422

