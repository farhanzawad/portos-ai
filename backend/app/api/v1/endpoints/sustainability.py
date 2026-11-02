from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sustainability import EmissionFactor, PollutantTypeEnum, ActivityTypeEnum
from app.schemas.sustainability import (
    EmissionFactorRead,
    GreenPortOverviewResponse,
    ScenarioEmissionsComparison,
    EnvironmentalContext,
)
from app.sustainability.calculator import green_port_calculator

router = APIRouter(prefix="/sustainability", tags=["Green Port Analytics"])


@router.get("/overview", response_model=GreenPortOverviewResponse)
def get_green_port_overview(
    terminal_id: str = Query("term_cct_01", description="Terminal identifier"),
    period_hours: float = Query(72.0, ge=1.0, le=168.0, description="Reporting period duration in hours"),
    db: Session = Depends(get_db),
):
    """Retrieve full Green Port analytics dashboard with activity category breakdowns and factors."""
    factors = db.query(EmissionFactor).order_by(EmissionFactor.pollutant, EmissionFactor.activity_type).all()
    return green_port_calculator.generate_overview(
        factors=factors,
        terminal_id=terminal_id,
        reporting_period_hours=period_hours,
    )


@router.get("/factors", response_model=List[EmissionFactorRead])
def list_emission_factors(
    pollutant: Optional[PollutantTypeEnum] = Query(None, description="Filter by pollutant type"),
    activity_type: Optional[ActivityTypeEnum] = Query(None, description="Filter by activity type"),
    db: Session = Depends(get_db),
):
    """List configured emission factors with documentation lineage, units, and status."""
    query = db.query(EmissionFactor)
    if pollutant:
        query = query.filter(EmissionFactor.pollutant == pollutant)
    if activity_type:
        query = query.filter(EmissionFactor.activity_type == activity_type)
    return query.order_by(EmissionFactor.pollutant, EmissionFactor.id).all()


@router.get("/compare", response_model=ScenarioEmissionsComparison)
def compare_scenario_emissions(
    scenario_code: str = Query("monsoon_weather_squall", description="Scenario identifier to compare against baseline"),
    db: Session = Depends(get_db),
):
    """Compare operational carbon emissions between baseline and an alternative scenario.
    
    Enforces identical factor set and activity scope boundaries.
    """
    factors = db.query(EmissionFactor).all()

    scenario_configs = {
        "monsoon_weather_squall": {
            "name": "Monsoon Weather Squall & Rough Sea",
            "berthed_hrs": 188.0,
            "anchorage_hrs": 96.0,
            "crane_moves": 1720,
            "yard_moves": 2250,
        },
        "berth_cct2_closure": {
            "name": "Berth CCT-2 Quay Maintenance Outage",
            "berthed_hrs": 164.0,
            "anchorage_hrs": 112.0,
            "crane_moves": 1690,
            "yard_moves": 2180,
        },
        "feeder_arrival_surge": {
            "name": "Feeder Vessel Arrival Surge (+50% Inflow)",
            "berthed_hrs": 210.0,
            "anchorage_hrs": 138.0,
            "crane_moves": 2600,
            "yard_moves": 3400,
        },
        "crane_sts02_outage": {
            "name": "Crane STS-02 Mechanical Breakdown",
            "berthed_hrs": 176.0,
            "anchorage_hrs": 82.0,
            "crane_moves": 1600,
            "yard_moves": 2100,
        },
    }

    cfg = scenario_configs.get(scenario_code)
    if not cfg:
        # Fallback to standard comparison
        cfg = scenario_configs["monsoon_weather_squall"]

    return green_port_calculator.compare_scenarios(
        factors=factors,
        baseline_code="baseline_normal",
        baseline_name="Standard Baseline Terminal Operations",
        comparison_code=scenario_code,
        comparison_name=cfg["name"],
        duration_hours=72.0,
        comparison_berthed_hrs=cfg["berthed_hrs"],
        comparison_anchorage_hrs=cfg["anchorage_hrs"],
        comparison_crane_moves=cfg["crane_moves"],
        comparison_yard_moves=cfg["yard_moves"],
    )


@router.get("/environmental-context", response_model=EnvironmentalContext)
def get_environmental_context():
    """Retrieve ambient weather, tidal height, and air quality telemetry.
    
    Includes mandatory disclaimer that weather data must not be used for navigation.
    """
    return green_port_calculator.get_environmental_context()

