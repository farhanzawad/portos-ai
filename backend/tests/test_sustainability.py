"""Unit and integration tests for Green Port Analytics & Auditable Emissions Estimates."""

import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import create_application
from app.db.base import Base, DataStatusEnum
from app.db.session import get_db
from app.models.sustainability import (
    EmissionFactor,
    PollutantTypeEnum,
    ActivityTypeEnum,
    FactorStatusEnum,
)
from app.sustainability.calculator import GreenPortCalculator


@pytest.fixture(name="calculator")
def fixture_calculator():
    return GreenPortCalculator()


@pytest.fixture(name="db_session")
def fixture_db_session():
    """In-memory SQLite test database fixture."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSession()

    # Seed test emission factors
    factors = [
        EmissionFactor(
            id="ef_test_hoteling",
            pollutant=PollutantTypeEnum.CO2E,
            activity_type=ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
            factor_value=185.0,
            factor_unit="kg CO2e / hour",
            source_reference="IMO 4th GHG Study Table 23",
            source_url="https://imo.org",
            publication_date="2020-08-04",
            scope_category="Scope 3",
            applicability_notes="Container feeders",
            is_illustrative_assumption=False,
            factor_status=FactorStatusEnum.VERIFIED_SOURCE,
            data_status=DataStatusEnum.SIMULATED,
        ),
        EmissionFactor(
            id="ef_test_sts",
            pollutant=PollutantTypeEnum.CO2E,
            activity_type=ActivityTypeEnum.STS_CRANE_ELECTRIC,
            factor_value=4.2,
            factor_unit="kg CO2e / move",
            source_reference="PGCB Grid Factor",
            is_illustrative_assumption=False,
            factor_status=FactorStatusEnum.VERIFIED_SOURCE,
            data_status=DataStatusEnum.SIMULATED,
        ),
        EmissionFactor(
            id="ef_test_yard",
            pollutant=PollutantTypeEnum.CO2E,
            activity_type=ActivityTypeEnum.YARD_EQUIPMENT_DIESEL,
            factor_value=2.8,
            factor_unit="kg CO2e / move",
            source_reference="Demo RTG Diesel Estimate",
            is_illustrative_assumption=True,
            factor_status=FactorStatusEnum.ILLUSTRATIVE_ASSUMPTION,
            data_status=DataStatusEnum.SIMULATED,
        ),
    ]
    session.add_all(factors)
    session.commit()
    yield session
    session.close()


@pytest.fixture(name="client")
async def fixture_client(db_session):
    """Async test client with dependency override."""
    app = create_application()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


def test_unit_conversions(calculator: GreenPortCalculator):
    """Verify transparent mathematical conversions between kg, MT, and operational days."""
    assert calculator.kg_to_mt(1000.0) == 1.0
    assert calculator.kg_to_mt(58372.5) == 58.373
    assert calculator.kg_to_mt(0.0) == 0.0

    assert calculator.mt_to_kg(1.0) == 1000.0
    assert calculator.mt_to_kg(58.373) == 58373.0

    assert calculator.hours_to_days(72.0) == 3.0
    assert calculator.hours_to_days(24.0) == 1.0


def test_factor_application_and_formula(calculator: GreenPortCalculator):
    """Verify activity quantity multiplied by applicable factor produces exact formula."""
    factor = EmissionFactor(
        id="ef_sample",
        pollutant=PollutantTypeEnum.CO2E,
        activity_type=ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
        factor_value=185.0,
        factor_unit="kg CO2e / hour",
        source_reference="IMO 4th GHG Study",
        factor_status=FactorStatusEnum.VERIFIED_SOURCE,
    )

    estimate = calculator.calculate_activity_emissions(
        activity_type=ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
        activity_name="Vessel Hoteling at Berth",
        scope_category="Scope 3",
        quantity=100.0,
        quantity_unit="hours",
        pollutant=PollutantTypeEnum.CO2E,
        factors=[factor],
    )

    assert estimate.is_configured is True
    assert estimate.estimated_kg == 18500.0
    assert estimate.estimated_mt == 18.5
    assert "100.0 hours × 185.0 kg CO2e / hour = 18,500.0 kg" in estimate.formula_expression


def test_missing_factors_show_not_configured(calculator: GreenPortCalculator):
    """Verify unconfigured activity/pollutant returns explicit Not configured state without inventing numbers."""
    estimate = calculator.calculate_activity_emissions(
        activity_type=ActivityTypeEnum.YARD_EQUIPMENT_DIESEL,
        activity_name="Yard Equipment Diesel Moves",
        scope_category="Scope 1",
        quantity=500.0,
        quantity_unit="moves",
        pollutant=PollutantTypeEnum.PM25,  # PM25 is not in factors list
        factors=[],
    )

    assert estimate.is_configured is False
    assert estimate.estimated_kg is None
    assert estimate.estimated_mt is None
    assert "Not configured" in estimate.formula_expression
    assert estimate.factor_status == "UNCONFIGURED"


def test_comparison_integrity_and_disclaimer(calculator: GreenPortCalculator):
    """Verify baseline vs scenario comparison enforces identical factor set, scope, and non-claim disclaimer."""
    factor = EmissionFactor(
        id="ef_co2",
        pollutant=PollutantTypeEnum.CO2E,
        activity_type=ActivityTypeEnum.VESSEL_HOTELING_AUX_ENGINE,
        factor_value=185.0,
        factor_unit="kg CO2e / hour",
        source_reference="IMO 4th GHG Study",
        factor_status=FactorStatusEnum.VERIFIED_SOURCE,
    )

    comparison = calculator.compare_scenarios(
        factors=[factor],
        baseline_code="baseline_normal",
        baseline_name="Baseline Operations",
        comparison_code="monsoon_weather_squall",
        comparison_name="Monsoon Disruption",
        duration_hours=72.0,
        baseline_berthed_hrs=100.0,
        comparison_berthed_hrs=150.0,
    )

    assert comparison.comparison_integrity_verified is True
    assert comparison.delta_co2e_kg > 0.0
    assert comparison.delta_co2e_pct > 0.0
    # Must explicitly state it does not represent real-world regulatory offsets
    assert "certified port-wide carbon reporting" in comparison.disclaimer
    assert "regulatory emissions reduction" in comparison.disclaimer


def test_scope_boundaries_documented(calculator: GreenPortCalculator):
    """Verify Scope 1, Scope 2, Scope 3, and excluded boundaries are explicitly defined."""
    scope = calculator.scope_definition
    assert len(scope.scope_1_included) > 0
    assert len(scope.scope_2_included) > 0
    assert len(scope.scope_3_included) > 0
    assert len(scope.explicitly_excluded) > 0
    # Verify hinterland and unmodeled areas are explicitly excluded
    assert any("Hinterland" in ex for ex in scope.explicitly_excluded)
    assert any("Railway" in ex for ex in scope.explicitly_excluded)


def test_environmental_context_navigation_notice(calculator: GreenPortCalculator):
    """Verify environmental context contains mandatory safety disclaimer against navigation use."""
    env = calculator.get_environmental_context()
    assert env.data_status == DataStatusEnum.SIMULATED
    assert "NEVER be used for navigational" in env.navigational_use_prohibited_notice


@pytest.mark.asyncio
async def test_api_sustainability_overview(client: AsyncClient):
    """Verify GET /api/v1/sustainability/overview endpoint returns valid schema and totals."""
    res = await client.get("/api/v1/sustainability/overview")
    assert res.status_code == 200
    data = res.json()

    assert data["total_co2e_mt"] > 0.0
    assert data["total_co2e_kg"] > 0.0
    assert len(data["pollutant_summaries"]) == 4  # CO2E, NOX, SOX, PM25
    assert len(data["factors"]) == 3
    assert data["data_status"] == "SIMULATED"
    assert data["scope_definition"]["methodology_framework"] is not None


@pytest.mark.asyncio
async def test_api_sustainability_factors(client: AsyncClient):
    """Verify GET /api/v1/sustainability/factors returns list of factors with lineage."""
    res = await client.get("/api/v1/sustainability/factors")
    assert res.status_code == 200
    factors = res.json()

    assert len(factors) == 3
    for f in factors:
        assert f["pollutant"] in ["CO2E", "NOX", "SOX", "PM25"]
        assert f["factor_value"] > 0
        assert f["factor_status"] in ["VERIFIED_SOURCE", "ILLUSTRATIVE_ASSUMPTION"]


@pytest.mark.asyncio
async def test_api_sustainability_compare(client: AsyncClient):
    """Verify GET /api/v1/sustainability/compare returns scenario delta with verified integrity."""
    res = await client.get("/api/v1/sustainability/compare?scenario_code=monsoon_weather_squall")
    assert res.status_code == 200
    data = res.json()

    assert data["comparison_integrity_verified"] is True
    assert data["baseline_scenario_code"] == "baseline_normal"
    assert data["comparison_scenario_code"] == "monsoon_weather_squall"
    assert len(data["activity_deltas"]) > 0

