"""Machine Learning & Model Centre API Endpoints."""

from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from app.ml.service import VesselDelayPredictor, get_predictor
from app.schemas.ml import (
    VesselPredictionInput,
    VesselPredictionOutput,
    ModelMetadataResponse,
    ModelMetricsResponse,
)

router = APIRouter(prefix="/models", tags=["Machine Learning & Model Centre"])


@router.post("/predict", response_model=VesselPredictionOutput)
def predict_vessel_delay(
    payload: VesselPredictionInput,
    predictor: VesselDelayPredictor = Depends(get_predictor),
):
    """Run real-time ETA delay regression and delay risk classification for an incoming vessel."""
    try:
        return predictor.predict(payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference execution failed: {str(exc)}",
        )


@router.get("/metadata", response_model=ModelMetadataResponse)
def get_model_metadata(predictor: VesselDelayPredictor = Depends(get_predictor)):
    """Retrieve model registry metadata, versioning, feature inputs, and operational notice."""
    meta = predictor.get_metadata()
    if not meta:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model metadata registry not found.",
        )
    return ModelMetadataResponse(
        model_name=meta["model_name"],
        model_version=meta["model_version"],
        trained_at=meta["trained_at"],
        random_seed=meta["random_seed"],
        n_train_samples=meta["n_train_samples"],
        n_test_samples=meta["n_test_samples"],
        feature_columns=meta["feature_columns"],
        operational_notice=meta["operational_notice"],
        data_status=meta["data_status"],
    )


@router.get("/evaluation", response_model=ModelMetricsResponse)
def get_model_evaluation(predictor: VesselDelayPredictor = Depends(get_predictor)):
    """Retrieve full model evaluation metrics, baseline comparison, and feature importance."""
    metrics = predictor.get_evaluation_metrics()
    if not metrics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Model evaluation metrics not found.",
        )
    return ModelMetricsResponse(
        regression_metrics=metrics["regression_metrics"],
        classification_metrics=metrics["classification_metrics"],
        feature_importances=metrics["feature_importances"],
        target_definitions=metrics["target_definitions"],
    )

