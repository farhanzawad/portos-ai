"""Unit and integration tests for PORTOS AI domain models and database seeding."""

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base, DataStatusEnum
from app.db.seed import seed_database
from app.models import (
    Terminal,
    Berth,
    Vessel,
    VesselCall,
    BerthAssignment,
    Equipment,
    YardBlock,
    OperationalEvent,
    Scenario,
    EmissionFactor,
    VesselTypeEnum,
    CallStatusEnum,
    DelayRiskStatusEnum,
    AssignmentStatusEnum,
)


@pytest.fixture
def test_db():
    """Create an isolated, in-memory SQLite database for deterministic testing."""
    engine = create_engine("sqlite:///:memory:", echo=False)
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


def test_seed_repeatability_and_idempotency(test_db):
    """Verify that running seed twice produces identical record counts without duplication."""
    # First seed execution
    first_counts = seed_database(test_db)
    assert first_counts["terminals"] == 1
    assert first_counts["berths"] == 6
    assert first_counts["equipment"] == 5
    assert first_counts["yard_blocks"] == 12
    assert first_counts["vessels"] == 12
    assert first_counts["vessel_calls"] == 12
    assert first_counts["berth_assignments"] == 3
    assert first_counts["events"] == 3

    # Second seed execution (Idempotency test)
    second_counts = seed_database(test_db)
    assert second_counts == first_counts, "Second seed run must produce identical counts"

    # Verify actual counts in database tables
    assert test_db.query(Vessel).count() == 12
    assert test_db.query(Berth).count() == 6
    assert test_db.query(YardBlock).count() == 12


def test_domain_entity_relationships(test_db):
    """Verify primary relationship traversal: Terminal -> Berth -> Assignment -> VesselCall -> Vessel."""
    seed_database(test_db)

    terminal = test_db.query(Terminal).filter_by(code="CCT_NCT_DEMO").first()
    assert terminal is not None
    assert len(terminal.berths) == 6

    # Test Berth 01 assignment and relationship to vessel call
    berth_01 = test_db.query(Berth).filter_by(code="BERTH-01").first()
    assert berth_01 is not None
    assert len(berth_01.assignments) > 0

    assignment = berth_01.assignments[0]
    assert assignment.status == AssignmentStatusEnum.ACTIVE
    assert assignment.vessel_call is not None

    vessel_call = assignment.vessel_call
    assert vessel_call.vessel is not None
    assert "DEMO MV" in vessel_call.vessel.name
    assert vessel_call.vessel.vessel_type == VesselTypeEnum.CONTAINER_FEEDER


def test_operational_truthfulness_and_provenance(test_db):
    """Ensure all seeded records maintain explicit SIMULATED data status and source provenance."""
    seed_database(test_db)

    # Check vessels
    vessels = test_db.query(Vessel).all()
    for v in vessels:
        assert v.data_status == DataStatusEnum.SIMULATED
        assert v.source_name == "PORTOS Seed Engine"
        assert v.created_at is not None

    # Check berths
    berths = test_db.query(Berth).all()
    for b in berths:
        assert b.data_status == DataStatusEnum.SIMULATED
        assert b.length_m > 0
        assert b.depth_draft_m > 0

    # Check operational events
    events = test_db.query(OperationalEvent).all()
    assert len(events) >= 3
    for ev in events:
        assert ev.data_status == DataStatusEnum.SIMULATED
        assert ev.payload_json.get("simulated") is True


def test_capacity_and_numeric_constraints(test_db):
    """Verify non-negative capacities, reasonable dimensions, and valid enums."""
    seed_database(test_db)

    # Yard blocks
    blocks = test_db.query(YardBlock).all()
    for yb in blocks:
        assert yb.teu_capacity > 0
        assert 0 <= yb.warning_threshold_pct <= 100
        assert 0 <= yb.critical_threshold_pct <= 100

    # Equipment
    equipment = test_db.query(Equipment).all()
    for eq in equipment:
        assert eq.rated_capacity_tonnes > 0
        assert eq.rated_moves_per_hour > 0

    # Emission Factors
    factors = test_db.query(EmissionFactor).all()
    assert len(factors) >= 2
    for ef in factors:
        assert ef.factor_value > 0
        assert isinstance(ef.is_illustrative_assumption, bool)

