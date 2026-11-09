"""Tests for Decision Lab & Scenario Planning REST APIs.

Verifies:
- Scenario listing (presets and database persisted scenarios)
- Custom scenario CRUD and duplicate operations
- SimPy execution endpoint with GIS timeline frames
- Multi-scenario comparative evaluation
- AI Scenario Analyst endpoint (deterministic demo synthesis and schema validation)
- Advisory proposal recording with audit trail
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


@pytest.mark.asyncio
async def test_list_scenarios_includes_presets(async_client):
    """Verify GET /api/v1/scenarios returns the 8 benchmark presets."""
    res = await async_client.get("/api/v1/scenarios")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8
    codes = [s["code"] for s in data]
    assert "baseline_normal" in codes
    assert "inbound_feeder_surge" in codes
    assert "sts_crane_breakdown" in codes
    assert "monsoon_weather_squall" in codes


@pytest.mark.asyncio
async def test_custom_scenario_lifecycle(async_client):
    """Verify Create -> Get -> Update -> Duplicate -> Delete workflow."""
    # 1. Create
    create_payload = {
        "code": "test_surge_50",
        "name": "Extreme 50% Surge Test",
        "description": "Simulating high volume shock for stress testing.",
        "parameters": {
            "scenario_code": "test_surge_50",
            "scenario_name": "Extreme 50% Surge Test",
            "vessel_arrival_multiplier": 1.5,
            "arrival_surge_pct": 50.0,
            "duration_hours": 48.0,
        },
    }
    create_res = await async_client.post("/api/v1/scenarios", json=create_payload)
    assert create_res.status_code == 201
    created_data = create_res.json()
    scen_id = created_data["id"]
    assert created_data["code"] == "test_surge_50"

    # 2. Get
    get_res = await async_client.get(f"/api/v1/scenarios/{scen_id}")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Extreme 50% Surge Test"

    # 3. Update
    update_res = await async_client.put(
        f"/api/v1/scenarios/{scen_id}",
        json={"name": "Extreme 50% Surge Test (Updated)"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["name"] == "Extreme 50% Surge Test (Updated)"

    # 4. Duplicate
    dup_res = await async_client.post(f"/api/v1/scenarios/{scen_id}/duplicate")
    assert dup_res.status_code == 201
    dup_data = dup_res.json()
    assert "Copy" in dup_data["name"]
    assert dup_data["id"] != scen_id

    # 5. Delete original
    del_res = await async_client.delete(f"/api/v1/scenarios/{scen_id}")
    assert del_res.status_code == 204

    # Verify original is deleted
    get_deleted = await async_client.get(f"/api/v1/scenarios/{scen_id}")
    assert get_deleted.status_code == 404


@pytest.mark.asyncio
async def test_run_simulation_and_analyst(async_client):
    """Verify /run executes SimPy with GIS timeline frames and /analyst provides structured insights."""
    # 1. Run Baseline
    base_res = await async_client.post(
        "/api/v1/scenarios/run",
        json={
            "scenario_code": "baseline_test",
            "scenario_name": "Baseline Test",
            "is_baseline": True,
            "duration_hours": 48.0,
            "random_seed": 42,
        },
    )
    assert base_res.status_code == 200
    base_run = base_res.json()
    assert len(base_run["timeline_frames"]) == 49  # 0 to 48 inclusive
    assert "metrics" in base_run
    assert base_run["metrics"]["estimated_secondary_co2_tonnes"] >= 0.0

    # 2. Run Disruption Scenario
    surge_res = await async_client.post(
        "/api/v1/scenarios/run",
        json={
            "scenario_code": "surge_test",
            "scenario_name": "Surge Test",
            "is_baseline": False,
            "duration_hours": 48.0,
            "random_seed": 42,
            "vessel_arrival_multiplier": 1.4,
            "arrival_surge_pct": 40.0,
            "berth_outage_count": 1,
        },
    )
    assert surge_res.status_code == 200
    surge_run = surge_res.json()
    assert surge_run["metrics"]["mean_waiting_time_hours"] >= base_run["metrics"]["mean_waiting_time_hours"]

    # 3. AI Scenario Analyst
    analyst_res = await async_client.post(
        "/api/v1/scenarios/analyst",
        json={
            "scenario_code": "surge_test",
            "baseline_run": base_run,
            "scenario_run": surge_run,
        },
    )
    assert analyst_res.status_code == 200
    analyst_data = analyst_res.json()
    assert "bottleneck_diagnosis" in analyst_data
    assert "optimal_path_recommendation" in analyst_data
    assert len(analyst_data["cascading_benefits"]) >= 2
    assert len(analyst_data["identified_trade_offs"]) >= 2
    assert len(analyst_data["suggested_action_items"]) >= 2


@pytest.mark.asyncio
async def test_propose_scenario_action_audit(async_client):
    """Verify /propose records an advisory proposal with status PROPOSED."""
    sim_res = await async_client.post(
        "/api/v1/scenarios/run",
        json={
            "scenario_code": "proposal_test",
            "scenario_name": "Proposal Test Scenario",
            "duration_hours": 24.0,
            "random_seed": 42,
        },
    )
    sim_run = sim_res.json()

    propose_res = await async_client.post(
        "/api/v1/scenarios/propose",
        json={
            "run_id": sim_run["run_id"],
            "scenario_code": "proposal_test",
            "scenario_name": "Proposal Test Scenario",
            "advisory_notes": "Recommend deploying mobile harbor cranes at GCB-01 to absorb surge.",
            "metrics": sim_run["metrics"],
        },
    )
    assert propose_res.status_code == 200
    prop_data = propose_res.json()
    assert prop_data["status"] == "PROPOSED"
    assert "proposal_id" in prop_data
    assert "Harbour Master" in prop_data["message"]
