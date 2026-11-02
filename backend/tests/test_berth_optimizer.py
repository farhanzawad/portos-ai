"""Unit and integration tests for Google OR-Tools CP-SAT Berth Planner and Independent Validator.

Verifies:
- Hard constraint: overlap prevention on single berth
- Hard constraint: LOA and draft physical compatibility
- Hard constraint: berth maintenance handling
- Independent validator detects deliberate temporal and physical violations
- Deterministic optimization solves sample scenario
- FastAPI endpoints (/api/v1/berth-planner/...)
"""

import pytest
from datetime import datetime, timedelta, timezone
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.db.seed import seed_database
from app.schemas.optimizer import (
    BerthSpec,
    VesselCallSpec,
    ScheduledAssignment,
    OptimizerConstraintSettings,
    SolverStatusEnum,
)
from app.optimizer.scheduler import BerthAllocationScheduler
from app.optimizer.validator import ScheduleFeasibilityValidator


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
    seed_database(session)

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
async def async_client(test_db_session):
    """Override get_db dependency to point to the in-memory test session."""
    def override_get_db():
        try:
            yield test_db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def sample_berths():
    return [
        BerthSpec(
            id="b_01",
            code="CCT-1",
            name="Chittagong Container Terminal 1",
            length_m=185.0,
            depth_draft_m=9.5,
            max_vessel_loa_m=185.0,
            is_active=True,
            status="AVAILABLE",
        ),
        BerthSpec(
            id="b_02",
            code="CCT-2",
            name="Chittagong Container Terminal 2",
            length_m=185.0,
            depth_draft_m=9.5,
            max_vessel_loa_m=185.0,
            is_active=True,
            status="AVAILABLE",
        ),
        BerthSpec(
            id="b_03",
            code="GCB-1",
            name="General Cargo Berth 1",
            length_m=160.0,
            depth_draft_m=8.5,
            max_vessel_loa_m=155.0,
            is_active=True,
            status="AVAILABLE",
        ),
        BerthSpec(
            id="b_maint",
            code="CCT-MAINT",
            name="Berth Under Maintenance",
            length_m=200.0,
            depth_draft_m=10.0,
            max_vessel_loa_m=190.0,
            is_active=True,
            status="MAINTENANCE",
        ),
    ]


@pytest.fixture
def sample_calls():
    t0 = datetime(2026, 11, 3, 0, 0, 0, tzinfo=timezone.utc)
    return [
        VesselCallSpec(
            id="call_01",
            call_number="CALL-01",
            vessel_name="MV Karnaphuli Feeder",
            vessel_type="CONTAINER_FEEDER",
            length_overall_m=175.0,
            max_draft_m=9.2,
            reported_eta=t0,
            service_duration_hours=12.0,
            priority=2,
        ),
        VesselCallSpec(
            id="call_02",
            call_number="CALL-02",
            vessel_name="MV Bay Express",
            vessel_type="CONTAINER_FEEDER",
            length_overall_m=170.0,
            max_draft_m=9.0,
            reported_eta=t0 + timedelta(hours=2),
            service_duration_hours=12.0,
            priority=3,
        ),
        VesselCallSpec(
            id="call_small",
            call_number="CALL-03",
            vessel_name="MV Small Coaster",
            vessel_type="CONTAINER_FEEDER",
            length_overall_m=145.0,
            max_draft_m=7.8,
            reported_eta=t0 + timedelta(hours=1),
            service_duration_hours=8.0,
            priority=1,
        ),
    ]


def test_overlap_prevention_on_single_berth(sample_calls):
    """Verify that when only 1 berth is available, vessels are scheduled sequentially with NO temporal overlap."""
    single_berth = [
        BerthSpec(
            id="b_single",
            code="CCT-SINGLE",
            name="Single Container Berth",
            length_m=200.0,
            depth_draft_m=10.0,
            max_vessel_loa_m=200.0,
            is_active=True,
            status="AVAILABLE",
        )
    ]

    scheduler = BerthAllocationScheduler()
    response = scheduler.optimize(
        berths=single_berth,
        calls=sample_calls,
        planning_horizon_hours=72,
    )

    assert response.solver_status in (SolverStatusEnum.OPTIMAL, SolverStatusEnum.FEASIBLE)
    assert len(response.optimized_schedule) == 3

    # Check each pair of assignments on b_single
    assignments = response.optimized_schedule
    for i in range(len(assignments)):
        for j in range(i + 1, len(assignments)):
            a1 = assignments[i]
            a2 = assignments[j]
            latest_start = max(a1.scheduled_start, a2.scheduled_start)
            earliest_end = min(a1.scheduled_end, a2.scheduled_end)
            # Must not overlap: latest_start >= earliest_end
            assert latest_start >= earliest_end, f"Overlap between {a1.vessel_name} and {a2.vessel_name}"

    # Independent validator check
    assert response.feasibility_validation.is_feasible is True
    assert response.feasibility_validation.violations_count == 0


def test_incompatible_vessel_loa_and_draft_rejection(sample_berths):
    """Verify that large vessels are never scheduled on small berths exceeding LOA or draft."""
    t0 = datetime(2026, 11, 3, 0, 0, 0, tzinfo=timezone.utc)
    # Large vessel: LOA 180m, Draft 9.2m (cannot fit on GCB-1 which has max LOA 155m, depth 8.5m)
    calls = [
        VesselCallSpec(
            id="call_large",
            call_number="CALL-LRG",
            vessel_name="MV Large Container",
            vessel_type="CONTAINER_FEEDER",
            length_overall_m=180.0,
            max_draft_m=9.2,
            reported_eta=t0,
            service_duration_hours=12.0,
            priority=1,
        )
    ]

    # Only provide GCB-1
    small_berth_only = [b for b in sample_berths if b.code == "GCB-1"]

    scheduler = BerthAllocationScheduler()
    response = scheduler.optimize(
        berths=small_berth_only,
        calls=calls,
        planning_horizon_hours=48,
    )

    # Vessel should be unassigned because no compatible berth exists
    assert "call_large" in response.unassigned_vessels
    assert len(response.optimized_schedule) == 0
    assert len(response.infeasibility_diagnostics) > 0


def test_maintenance_berth_never_assigned(sample_berths, sample_calls):
    """Verify that berths marked MAINTENANCE are ignored by the optimizer."""
    scheduler = BerthAllocationScheduler()
    response = scheduler.optimize(
        berths=sample_berths,
        calls=sample_calls,
        planning_horizon_hours=48,
    )

    assert response.solver_status in (SolverStatusEnum.OPTIMAL, SolverStatusEnum.FEASIBLE)
    assigned_berth_ids = [a.berth_id for a in response.optimized_schedule]
    assert "b_maint" not in assigned_berth_ids


def test_independent_validator_detects_deliberate_violations(sample_berths, sample_calls):
    """Verify that ScheduleFeasibilityValidator catches overlap, LOA excess, draft excess, and maintenance."""
    validator = ScheduleFeasibilityValidator(berths=sample_berths, calls=sample_calls)
    t0 = datetime(2026, 11, 3, 0, 0, 0, tzinfo=timezone.utc)

    # 1. Deliberate Overlap Violation
    overlapping_assignments = [
        ScheduledAssignment(
            vessel_call_id="call_01",
            vessel_name="MV Karnaphuli Feeder",
            call_number="CALL-01",
            berth_id="b_01",
            berth_code="CCT-1",
            berth_name="CCT-1",
            scheduled_start=t0,
            scheduled_end=t0 + timedelta(hours=10),
            service_duration_hours=10.0,
            waiting_time_hours=0.0,
            assigned_quay_start_m=10.0,
            assigned_quay_end_m=185.0,
            is_feasible=True,
            assignment_explanation="Test",
        ),
        ScheduledAssignment(
            vessel_call_id="call_02",
            vessel_name="MV Bay Express",
            call_number="CALL-02",
            berth_id="b_01",  # Same berth!
            berth_code="CCT-1",
            berth_name="CCT-1",
            scheduled_start=t0 + timedelta(hours=5),  # Starts before call_01 ends!
            scheduled_end=t0 + timedelta(hours=15),
            service_duration_hours=10.0,
            waiting_time_hours=0.0,
            assigned_quay_start_m=10.0,
            assigned_quay_end_m=180.0,
            is_feasible=True,
            assignment_explanation="Test",
        ),
    ]

    res = validator.validate(overlapping_assignments)
    assert res.is_feasible is False
    assert any(v.violation_type == "OVERLAP" for v in res.violations)

    # 2. Deliberate LOA & Draft Violation on GCB-1
    incompatible_assignment = [
        ScheduledAssignment(
            vessel_call_id="call_01",  # LOA 175m, draft 9.2m vs GCB-1 max LOA 155m, depth 8.5m
            vessel_name="MV Karnaphuli Feeder",
            call_number="CALL-01",
            berth_id="b_03",  # GCB-1
            berth_code="GCB-1",
            berth_name="GCB-1",
            scheduled_start=t0,
            scheduled_end=t0 + timedelta(hours=10),
            service_duration_hours=10.0,
            waiting_time_hours=0.0,
            assigned_quay_start_m=10.0,
            assigned_quay_end_m=185.0,
            is_feasible=True,
            assignment_explanation="Test",
        )
    ]
    res_incompat = validator.validate(incompatible_assignment)
    assert res_incompat.is_feasible is False
    violation_types = [v.violation_type for v in res_incompat.violations]
    assert "LOA_EXCEEDED" in violation_types
    assert "DRAFT_EXCEEDED" in violation_types

    # 3. Deliberate Maintenance Berth Assignment
    maint_assignment = [
        ScheduledAssignment(
            vessel_call_id="call_small",
            vessel_name="MV Small Coaster",
            call_number="CALL-03",
            berth_id="b_maint",
            berth_code="CCT-MAINT",
            berth_name="CCT-MAINT",
            scheduled_start=t0,
            scheduled_end=t0 + timedelta(hours=8),
            service_duration_hours=8.0,
            waiting_time_hours=0.0,
            assigned_quay_start_m=10.0,
            assigned_quay_end_m=150.0,
            is_feasible=True,
            assignment_explanation="Test",
        )
    ]
    res_maint = validator.validate(maint_assignment)
    assert res_maint.is_feasible is False
    assert any(v.violation_type == "BERTH_INACTIVE" for v in res_maint.violations)


def test_deterministic_solver_beats_or_matches_naive_baseline(sample_berths, sample_calls):
    """Verify that CP-SAT optimizer minimizes waiting time compared to naive baseline."""
    scheduler = BerthAllocationScheduler()
    response = scheduler.optimize(
        berths=sample_berths,
        calls=sample_calls,
        planning_horizon_hours=48,
    )

    assert response.solver_status in (SolverStatusEnum.OPTIMAL, SolverStatusEnum.FEASIBLE)
    assert response.comparison_metrics.optimized_total_waiting_hours <= (
        response.comparison_metrics.baseline_total_waiting_hours + 0.01
    )
    assert response.feasibility_validation.is_feasible is True


# API Integration Tests
@pytest.mark.asyncio
async def test_api_optimize_endpoint(async_client):
    """Verify POST /api/v1/berth-planner/optimize with seed database records."""
    response = await async_client.post(
        "/api/v1/berth-planner/optimize",
        json={
            "planning_horizon_hours": 72,
            "time_granularity_minutes": 15,
        },
    )
    assert response.status_code == 200
    data = response.json()
    assert data["solver_status"] in ["OPTIMAL", "FEASIBLE"]
    assert len(data["optimized_schedule"]) > 0
    assert data["feasibility_validation"]["is_feasible"] is True
    assert "Synthetic-data demonstration" in data["operational_notice"]


@pytest.mark.asyncio
async def test_api_validate_endpoint(async_client):
    """Verify POST /api/v1/berth-planner/validate independently checks schedule validity."""
    opt_res = await async_client.post(
        "/api/v1/berth-planner/optimize",
        json={"planning_horizon_hours": 72},
    )
    assert opt_res.status_code == 200
    schedule = opt_res.json()["optimized_schedule"]

    val_res = await async_client.post(
        "/api/v1/berth-planner/validate",
        json={"assignments": schedule},
    )
    assert val_res.status_code == 200
    assert val_res.json()["is_feasible"] is True


@pytest.mark.asyncio
async def test_api_baseline_endpoint(async_client):
    """Verify GET /api/v1/berth-planner/baseline retrieves current baseline and active calls."""
    response = await async_client.get("/api/v1/berth-planner/baseline")
    assert response.status_code == 200
    data = response.json()
    assert len(data["baseline_schedule"]) > 0


@pytest.mark.asyncio
async def test_api_propose_advisory_endpoint(async_client):
    """Verify POST /api/v1/berth-planner/propose records advisory proposals with PROPOSED status."""
    opt_res = await async_client.post(
        "/api/v1/berth-planner/optimize",
        json={"planning_horizon_hours": 72},
    )
    schedule = opt_res.json()["optimized_schedule"]

    propose_res = await async_client.post(
        "/api/v1/berth-planner/propose",
        json={
            "optimizer_run_id": "test_run_01",
            "assignments": schedule,
            "advisory_notes": "Harbour master advisory test recommendation.",
        },
    )
    assert propose_res.status_code == 200
    p_data = propose_res.json()
    assert p_data["status"] == "PROPOSED"
    assert p_data["records_created"] > 0
    assert "Advisory proposal recorded successfully" in p_data["message"]
