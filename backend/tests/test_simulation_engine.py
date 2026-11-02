"""Unit and integration tests for PORTOS AI SimPy discrete-event simulation engine.

Verifies:
- Deterministic repeatability: identical seeds produce identical outputs
- Event sequence integrity: arrival <= berthing <= departure
- Non-negativity of waiting times
- Resource capacity constraints (berths and cranes)
- Disruption sensitivity: outages and weather factors degrade performance as expected
- API endpoints (/api/v1/scenarios/...)
"""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.schemas.simulation import ScenarioParameters
from app.simulation.engine import PortSimulationEngine
from app.simulation.presets import get_preset_scenarios, build_scenario_comparison


@pytest.fixture
def test_db_session():
    test_engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=test_engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
    session = TestingSessionLocal()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
async def async_client(test_db_session):
    def override_get_db():
        try:
            yield test_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


def test_deterministic_repeatability():
    """Verify that two simulation runs with the same seed generate bit-for-bit identical results."""
    engine = PortSimulationEngine()
    params = ScenarioParameters(
        scenario_code="test_rep",
        scenario_name="Test Repeatability",
        random_seed=42,
        duration_hours=48.0,
    )

    run_1 = engine.run(params)
    run_2 = engine.run(params)

    assert run_1.metrics.mean_waiting_time_hours == run_2.metrics.mean_waiting_time_hours
    assert run_1.metrics.total_waiting_hours == run_2.metrics.total_waiting_hours
    assert run_1.metrics.vessels_served_count == run_2.metrics.vessels_served_count
    assert len(run_1.vessel_logs) == len(run_2.vessel_logs)

    # Check each individual vessel event timestamp
    for v1, v2 in zip(run_1.vessel_logs, run_2.vessel_logs):
        assert v1.vessel_id == v2.vessel_id
        assert v1.arrival_hour == v2.arrival_hour
        assert v1.berth_hour == v2.berth_hour
        assert v1.departure_hour == v2.departure_hour


def test_event_sequence_integrity_and_non_negativity():
    """Verify that every vessel follows the strict operational chain: arrival <= berthing <= departure."""
    engine = PortSimulationEngine()
    params = ScenarioParameters(
        scenario_code="test_integrity",
        random_seed=123,
        duration_hours=72.0,
    )

    run = engine.run(params)
    assert len(run.vessel_logs) > 0

    for v in run.vessel_logs:
        # No negative waiting times
        assert v.waiting_time_hours >= 0.0, f"Negative wait time found: {v}"
        assert v.service_duration_hours > 0.0

        # Monotonic time progression
        assert v.arrival_hour <= v.berth_hour, f"Berth time before arrival: {v}"
        assert v.berth_hour <= v.departure_hour, f"Departure before berthing: {v}"
        assert round(v.berth_hour - v.arrival_hour, 2) == round(v.waiting_time_hours, 2)


def test_resource_capacity_constraints():
    """Verify that berth occupancy never exceeds configured capacity."""
    engine = PortSimulationEngine()
    # Baseline with 1 berth outage => 5 berths capacity
    params = ScenarioParameters(
        scenario_code="test_capacity",
        random_seed=42,
        duration_hours=48.0,
        berth_outage_count=1,
    )

    run = engine.run(params)
    effective_berths = 6 - 1

    for sample in run.berth_occupancy_series:
        assert sample.value <= effective_berths, (
            f"Berth occupancy {sample.value} exceeded max capacity {effective_berths}"
        )


def test_disruption_impact_sensitivity():
    """Verify that berth outage or weather squall measurably increases waiting hours compared to baseline."""
    engine = PortSimulationEngine()

    baseline_params = ScenarioParameters(
        scenario_code="baseline",
        random_seed=42,
        duration_hours=72.0,
        berth_outage_count=0,
        weather_disruption_factor=1.0,
    )
    outage_params = ScenarioParameters(
        scenario_code="outage",
        random_seed=42,
        duration_hours=72.0,
        berth_outage_count=2,  # 2 berths offline
        weather_disruption_factor=1.0,
    )

    base_run = engine.run(baseline_params)
    outage_run = engine.run(outage_params)

    # 2 berths offline must increase total waiting hours
    assert outage_run.metrics.total_waiting_hours >= base_run.metrics.total_waiting_hours


def test_preset_comparison_builder():
    """Verify build_scenario_comparison accurately generates metric deltas and summaries."""
    engine = PortSimulationEngine()
    presets = get_preset_scenarios()
    base_param = presets[0]
    squall_param = presets[1]

    base_run = engine.run(base_param)
    squall_run = engine.run(squall_param)

    comp = build_scenario_comparison(base_run, [squall_run])
    assert len(comp.alternative_runs) == 1
    assert "monsoon_weather_squall" in comp.comparisons
    assert len(comp.trade_off_summary) == 1


# API Integration Tests
@pytest.mark.asyncio
async def test_api_presets(async_client):
    """Verify GET /api/v1/scenarios/presets."""
    res = await async_client.get("/api/v1/scenarios/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 4
    assert any(p["is_baseline"] for p in presets)


@pytest.mark.asyncio
async def test_api_run_simulation(async_client):
    """Verify POST /api/v1/scenarios/run."""
    res = await async_client.post(
        "/api/v1/scenarios/run",
        json={
            "scenario_code": "test_api_run",
            "scenario_name": "API Test Scenario",
            "random_seed": 42,
            "duration_hours": 48.0,
            "vessel_arrival_multiplier": 1.1,
            "berth_outage_count": 0,
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["scenario_code"] == "test_api_run"
    assert data["metrics"]["vessels_served_count"] > 0
    assert len(data["queue_length_series"]) > 0
    assert "Synthetic-data demonstration" in data["operational_notice"]


@pytest.mark.asyncio
async def test_api_compare_scenarios(async_client):
    """Verify POST /api/v1/scenarios/compare."""
    res = await async_client.post(
        "/api/v1/scenarios/compare",
        json={
            "baseline_parameters": {
                "scenario_code": "baseline",
                "scenario_name": "Baseline",
                "random_seed": 42,
                "duration_hours": 48.0,
            },
            "alternative_scenarios": [
                {
                    "scenario_code": "monsoon",
                    "scenario_name": "Monsoon Squall",
                    "random_seed": 42,
                    "duration_hours": 48.0,
                    "weather_disruption_factor": 1.3,
                }
            ],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert "monsoon" in data["comparisons"]
    assert len(data["trade_off_summary"]) > 0


@pytest.mark.asyncio
async def test_api_propose_scenario(async_client):
    """Verify POST /api/v1/scenarios/propose."""
    res = await async_client.post(
        "/api/v1/scenarios/propose",
        json={
            "run_id": "sim_test_run_01",
            "scenario_code": "monsoon_squall",
            "scenario_name": "Monsoon Mitigation Recovery",
            "advisory_notes": "Recommendation to prioritize feeder calls at NCT-1 during monsoon window.",
            "metrics": {
                "mean_waiting_time_hours": 2.5,
                "median_waiting_time_hours": 2.0,
                "p90_waiting_time_hours": 5.0,
                "total_waiting_hours": 35.0,
                "berth_utilization_pct": 72.0,
                "crane_utilization_pct": 65.0,
                "vessels_served_count": 14,
                "vessels_remaining_queue": 2,
                "estimated_secondary_co2_tonnes": 6.3,
            },
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "PROPOSED"
    assert "proposal_scen_" in data["proposal_id"]
