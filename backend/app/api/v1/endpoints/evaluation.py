from fastapi import APIRouter
from app.ml.evaluation import compute_research_evaluation
from app.schemas.model_evaluation import ResearchEvaluationReport

router = APIRouter(prefix="/ml", tags=["Model Evaluation & Research Metrics"])


@router.get("/research-evaluation", response_model=ResearchEvaluationReport)
def get_research_evaluation():
    """Retrieve 5-fold temporal cross-validation metrics, Brier scores, and calibration curve."""
    return compute_research_evaluation(n_samples=2500, n_splits=5)

