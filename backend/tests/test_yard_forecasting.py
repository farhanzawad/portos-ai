"""Unit and integration tests for Yard Intelligence and Congestion Forecasting."""

import pytest
from datetime import datetime, timezone, timedelta
from httpx import AsyncClient, ASGITransport
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import create_application
from app.db.base import Base, DataStatusEnum
from app.db.session import get_db
from app.models.yard import (
    YardBlock,
    YardOccupancyObservation,
    ContainerMovementEvent,
    YardZoneEnum,
    YardRiskTierEnum,
    MovementTypeEnum,
)
from app.models.terminal import Terminal
from app.yard.forecaster import YardForecastingService, YardOccupancyMLPipeline


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

    # Seed terminal and sample blocks
    term = Terminal(
        id="term_test_01",
        code="CCT_TEST",
        name="Test Terminal",
        country_code="BGD",
        latitude=22.28,
        longitude=91.80,
        timezone="Asia/Dhaka",
        total_quay_length_m=1000.0,
        data_status=DataStatusEnum.SIMULATED,
    )
    session.add(term)

    ref_time = datetime(2026, 11, 2, 12, 0, 0, tzinfo=timezone.utc)

    # 1. Normal Block
    b1 = YardBlock(
        id="yb_test_01",
        terminal_id=term.id,
        code="YB-01",
        name="Import Block 01",
        zone=YardZoneEnum.IMPORT,
        teu_capacity=600,
        warning_threshold_pct=85.0,
        critical_threshold_pct=95.0,
        data_status=DataStatusEnum.SIMULATED,
        source_name="Test Suite",
    )
    session.add(b1)

    # Add historical observations for b1
    for h in [12, 8, 4, 0]:
        session.add(
            YardOccupancyObservation(
                id=f"obs_b1_h{h}",
                yard_block_id=b1.id,
                timestamp=ref_time - timedelta(hours=h),
                occupied_teu=300 + (12 - h) * 5,
                occupancy_pct=round(((300 + (12 - h) * 5) / 600) * 100, 1),
                reefer_occupied_count=0,
                risk_tier=YardRiskTierEnum.NORMAL,
                data_status=DataStatusEnum.SIMULATED,
                source_name="Test Suite",
            )
        )

    # 2. Saturated / Congested Block
    b2 = YardBlock(
        id="yb_test_02",
        terminal_id=term.id,
        code="YB-02",
        name="Congested Block 02",
        zone=YardZoneEnum.IMPORT,
        teu_capacity=600,
        warning_threshold_pct=85.0,
        critical_threshold_pct=95.0,
        data_status=DataStatusEnum.SIMULATED,
        source_name="Test Suite",
    )
    session.add(b2)
    session.add(
        YardOccupancyObservation(
            id="obs_b2_h0",
            yard_block_id=b2.id,
            timestamp=ref_time,
            occupied_teu=560,
            occupancy_pct=93.3,
            reefer_occupied_count=0,
            risk_tier=YardRiskTierEnum.WATCH,
            data_status=DataStatusEnum.SIMULATED,
            source_name="Test Suite",
        )
    )

    # 3. Empty Block with NO observations (testing missing observations / unavailable state)
    b3 = YardBlock(
        id="yb_test_03",
        terminal_id=term.id,
        code="YB-03",
        name="Empty Unmonitored Block 03",
        zone=YardZoneEnum.EMPTY,
        teu_capacity=400,
        warning_threshold_pct=85.0,
        critical_threshold_pct=95.0,
        data_status=DataStatusEnum.SIMULATED,
        source_name="Test Suite",
    )
    session.add(b3)

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


def test_ml_pipeline_reproducible_and_defensible():
    """Verify ML model trains deterministically with defensible MAE improvement over baseline."""
    pipeline = YardOccupancyMLPipeline(random_seed=42)
    assert pipeline.is_trained is True
    assert pipeline.baseline_mae > 0.0
    assert pipeline.model_mae > 0.0
    # Defensible improvement: model error is substantially less than naive persistence
    assert pipeline.improvement_pct > 30.0
    assert pipeline.model_mae < pipeline.baseline_mae


def test_missing_observations_unavailable_state():
    """Verify missing observations return explicit UNAVAILABLE state without crashing."""
    service = YardForecastingService(random_seed=42)
    block = YardBlock(
        id="yb_empty",
        terminal_id="term_01",
        code="YB-EMPTY",
        name="Unmonitored Sector",
        zone=YardZoneEnum.EMPTY,
        teu_capacity=500,
        warning_threshold_pct=85.0,
        critical_threshold_pct=95.0,
    )

    result = service.forecast_block_horizons(block=block, observations=[])
    assert result.data_status == DataStatusEnum.UNAVAILABLE
    assert result.current_occupied_teu == 0
    assert result.current_occupancy_pct == 0.0
    assert result.current_risk_tier == YardRiskTierEnum.NORMAL
    assert result.forecast_6h.predicted_occupied_teu == 0
    assert result.last_observation_time is None


def test_capacity_boundaries_and_clamping():
    """Verify forecast enforces bounds [0, 100%] and detects overflow when exceeding capacity."""
    service = YardForecastingService(random_seed=42)
    block = YardBlock(
        id="yb_overflow",
        terminal_id="term_01",
        code="YB-CRIT",
        name="Critical Import Sector",
        zone=YardZoneEnum.IMPORT,
        teu_capacity=500,
        warning_threshold_pct=85.0,
        critical_threshold_pct=95.0,
    )
    ref_time = datetime(2026, 11, 2, 12, 0, 0, tzinfo=timezone.utc)
    # Simulate high current occupancy and high positive trend
    obs = [
        YardOccupancyObservation(
            id="obs_crit_1",
            yard_block_id=block.id,
            timestamp=ref_time - timedelta(hours=4),
            occupied_teu=460,
            occupancy_pct=92.0,
            reefer_occupied_count=0,
            risk_tier=YardRiskTierEnum.HIGH_RISK,
        ),
        YardOccupancyObservation(
            id="obs_crit_2",
            yard_block_id=block.id,
            timestamp=ref_time,
            occupied_teu=490,
            occupancy_pct=98.0,
            reefer_occupied_count=0,
            risk_tier=YardRiskTierEnum.HIGH_RISK,
        ),
    ]

    status = service.forecast_block_horizons(
        block=block,
        observations=obs,
        ref_time=ref_time,
        vessel_moves_hint=75,
    )

    # Clamped bounds check
    assert 0 <= status.forecast_6h.predicted_occupancy_pct <= 100.0
    assert 0 <= status.forecast_12h.predicted_occupancy_pct <= 100.0
    assert 0 <= status.forecast_24h.predicted_occupancy_pct <= 100.0
    assert status.forecast_6h.predicted_occupied_teu <= block.teu_capacity
    assert status.forecast_24h.predicted_occupied_teu <= block.teu_capacity

    # Risk tier check for critical occupancy (>95%)
    assert status.current_risk_tier == YardRiskTierEnum.HIGH_RISK
    assert len(status.forecast_6h.explanatory_factors) > 0


def test_zone_specific_explanatory_factors():
    """Verify distinct explanatory factors are generated for different operational zones."""
    service = YardForecastingService(random_seed=42)
    ref_time = datetime(2026, 11, 2, 12, 0, 0, tzinfo=timezone.utc)

    zones_to_test = [
        (YardZoneEnum.IMPORT, "Scheduled Vessel Discharge Staging"),
        (YardZoneEnum.EXPORT, "Export Cargo Aggregation"),
        (YardZoneEnum.REEFER, "Reefer Plug Point Utilization"),
        (YardZoneEnum.EMPTY, "Depot Evacuation & Balancing"),
    ]

    for zone, expected_factor in zones_to_test:
        block = YardBlock(
            id=f"yb_{zone.value.lower()}",
            terminal_id="term_01",
            code=f"YB-{zone.value[:3]}",
            name=f"Block {zone.value}",
            zone=zone,
            teu_capacity=400,
            warning_threshold_pct=85.0,
            critical_threshold_pct=95.0,
        )
        obs = [
            YardOccupancyObservation(
                id=f"obs_{zone.value}",
                yard_block_id=block.id,
                timestamp=ref_time,
                occupied_teu=240,
                occupancy_pct=60.0,
                reefer_occupied_count=40 if zone == YardZoneEnum.REEFER else 0,
                risk_tier=YardRiskTierEnum.NORMAL,
            )
        ]
        status = service.forecast_block_horizons(block=block, observations=obs, ref_time=ref_time)
        factor_names = [f.factor for f in status.forecast_6h.explanatory_factors]
        assert expected_factor in factor_names


@pytest.mark.asyncio
async def test_api_yard_status_and_summary(client: AsyncClient):
    """Verify GET /api/v1/yard/status returns all seeded blocks and terminal aggregate KPIs."""
    res = await client.get("/api/v1/yard/status")
    assert res.status_code == 200
    data = res.json()

    assert data["total_capacity_teu"] == 1600  # 600 + 600 + 400
    assert len(data["blocks"]) == 3
    assert data["data_status"] == "SIMULATED"
    assert "model_metadata" in data
    assert data["model_metadata"]["error_reduction_pct"] > 30.0


@pytest.mark.asyncio
async def test_api_yard_forecast_filtering(client: AsyncClient):
    """Verify GET /api/v1/yard/forecast supports horizon selection and block isolation."""
    res = await client.get("/api/v1/yard/forecast?horizon_hrs=12&block_id=yb_test_01")
    assert res.status_code == 200
    data = res.json()

    assert data["horizon_hrs"] == 12
    assert data["block_count"] == 1
    assert data["items"][0]["code"] == "YB-01"
    assert data["items"][0]["forecast"]["horizon_hrs"] == 12


@pytest.mark.asyncio
async def test_api_yard_congestion_alerts(client: AsyncClient):
    """Verify GET /api/v1/yard/congestion-alerts identifies high-density sectors."""
    res = await client.get("/api/v1/yard/congestion-alerts")
    assert res.status_code == 200
    alerts = res.json()

    # Block 2 is at 93.3% and should trigger watch or critical alert
    alert_codes = [a["block_code"] for a in alerts]
    assert "YB-02" in alert_codes
    for a in alerts:
        assert a["data_status"] == "SIMULATED"
        assert len(a["recommended_action"]) > 0


@pytest.mark.asyncio
async def test_api_yard_block_detail_and_404(client: AsyncClient):
    """Verify GET /api/v1/yard/blocks/{id}/detail returns history, movements and handles 404."""
    res = await client.get("/api/v1/yard/blocks/yb_test_01/detail")
    assert res.status_code == 200
    detail = res.json()

    assert detail["block"]["code"] == "YB-01"
    assert len(detail["history_observations"]) == 4
    assert "forecast_6h" in detail["current_status"]
    assert detail["data_status"] == "SIMULATED"

    # 404 test
    res_404 = await client.get("/api/v1/yard/blocks/yb_non_existent/detail")
    assert res_404.status_code == 404

