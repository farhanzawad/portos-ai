"""FastAPI endpoints for Decision Lab SimPy discrete-event simulation.

Enables simulation of baseline vs. disruption scenarios (monsoon weather, berth closures,
feeder volume surges, and crane equipment outages). Strictly advisory decision support.
"""

from typing import List, Optional
from datetime import datetime, timezone
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.base import DataStatusEnum
from app.models.scenario import Scenario, ScenarioRun, ScenarioResult, ScenarioRunStatusEnum
from app.schemas.simulation import (
    ScenarioParameters,
    SimulationRunResponse,
    ScenarioComparisonRequest,
    ScenarioComparisonResponse,
    ProposeScenarioRequest,
    ProposeScenarioResponse,
)
from app.simulation.engine import PortSimulationEngine
from app.simulation.presets import get_preset_scenarios, build_scenario_comparison

router = APIRouter(prefix="/scenarios", tags=["Decision Lab & Scenarios"])


@router.get("/presets", response_model=List[ScenarioParameters])
def list_scenario_presets():
    """Retrieve standard benchmark disruption scenarios for Decision Lab."""
    return get_preset_scenarios()


@router.post("/run", response_model=SimulationRunResponse)
def run_simulation(payload: ScenarioParameters):
    """Run a deterministic SimPy discrete-event simulation with specified disruption parameters."""
    engine = PortSimulationEngine()
    return engine.run(payload)


@router.post("/compare", response_model=ScenarioComparisonResponse)
def compare_scenarios(payload: ScenarioComparisonRequest):
    """Run baseline and up to 3 alternative scenarios with matched seeds to calculate trade-offs."""
    engine = PortSimulationEngine()

    # 1. Run baseline scenario
    base_params = payload.baseline_parameters or next(
        p for p in get_preset_scenarios() if p.is_baseline
    )
    base_run = engine.run(base_params)

    # 2. Run alternative scenarios
    alt_runs: List[SimulationRunResponse] = []
    for alt_param in payload.alternative_scenarios:
        # Guarantee matched seed for equitable comparison
        if alt_param.random_seed is None:
            alt_param.random_seed = base_params.random_seed
        alt_run = engine.run(alt_param)
        alt_runs.append(alt_run)

    return build_scenario_comparison(baseline_run=base_run, alternative_runs=alt_runs)


@router.post("/propose", response_model=ProposeScenarioResponse)
def propose_scenario_action(
    payload: ProposeScenarioRequest,
    db: Session = Depends(get_db),
):
    """Record an internal advisory scenario proposal for Harbour Master review.

    ADVISORY DECISION SUPPORT ONLY. Does not execute real-world port commands.
    """
    proposal_id = f"proposal_scen_{uuid.uuid4().hex[:10]}"

    # Save to scenario database audit table if scenario exists or create record
    scen = db.query(Scenario).filter(Scenario.code == payload.scenario_code).first()
    if not scen:
        scen = Scenario(
            id=f"scen_{uuid.uuid4().hex[:12]}",
            code=payload.scenario_code,
            name=payload.scenario_name,
            description=f"Decision Lab simulation: {payload.advisory_notes}",
            is_baseline=False,
            parameters_json={},
            data_status=DataStatusEnum.SIMULATED,
            source_name="PORTOS Decision Lab (SimPy)",
        )
        db.add(scen)
        db.flush()

    run_record = ScenarioRun(
        id=payload.run_id,
        scenario_id=scen.id,
        run_timestamp=datetime.now(timezone.utc),
        random_seed=42,
        duration_hours=72.0,
        status=ScenarioRunStatusEnum.COMPLETED,
        data_status=DataStatusEnum.SIMULATED,
        source_name="PORTOS Decision Lab (SimPy)",
    )
    db.add(run_record)
    db.commit()

    return ProposeScenarioResponse(
        proposal_id=proposal_id,
        status="PROPOSED",
        created_at=datetime.now(timezone.utc),
        message=(
            f"Advisory operational scenario proposal recorded ({payload.scenario_name}). "
            f"Requires review and authorization by the Harbour Master before implementation."
        ),
        data_status=DataStatusEnum.SIMULATED,
    )
