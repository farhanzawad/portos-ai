"""Integration tests for PORTOS AI FastAPI v1 endpoints."""

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.db.base import Base
from app.db.session import get_db
from app.db.seed import seed_database


# Setup isolated in-memory test database with StaticPool for multi-threaded async testing
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


@pytest.mark.asyncio
async def test_terminals_and_layout(async_client):
    """Test listing terminals and fetching terminal layout metadata."""
    res = await async_client.get("/api/v1/terminals")
    assert res.status_code == 200
    terminals = res.json()
    assert len(terminals) >= 1
    term_id = terminals[0]["id"]

    layout_res = await async_client.get(f"/api/v1/terminals/{term_id}/layout")
    assert layout_res.status_code == 200
    layout = layout_res.json()
    assert layout["terminal"]["id"] == term_id
    assert len(layout["berths"]) == 6
    assert layout["active_berth_count"] >= 5


@pytest.mark.asyncio
async def test_berths_and_assignments(async_client):
    """Test listing berths and retrieving berth assignments."""
    res = await async_client.get("/api/v1/berths")
    assert res.status_code == 200
    berths = res.json()
    assert len(berths) == 6
    b_id = berths[0]["id"]

    assign_res = await async_client.get(f"/api/v1/berths/{b_id}/assignments")
    assert assign_res.status_code == 200
    assignments = assign_res.json()
    assert isinstance(assignments, list)


@pytest.mark.asyncio
async def test_vessels_and_pagination(async_client):
    """Test paginated vessel listing and search."""
    res = await async_client.get("/api/v1/vessels?page=1&page_size=5")
    assert res.status_code == 200
    data = res.json()
    assert data["page"] == 1
    assert data["page_size"] == 5
    assert len(data["items"]) == 5
    assert data["total_count"] == 12
    assert data["total_pages"] == 3

    # Test search
    search_res = await async_client.get("/api/v1/vessels?search=Karnaphuli")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert len(search_data["items"]) >= 1
    for v in search_data["items"]:
        assert "Karnaphuli" in v["name"]


@pytest.mark.asyncio
async def test_vessel_calls_and_tracks(async_client):
    """Test vessel call listing, filtering, and track retrieval."""
    res = await async_client.get("/api/v1/vessels/calls?status=BERTHED")
    assert res.status_code == 200
    calls = res.json()
    assert len(calls["items"]) == 3
    for c in calls["items"]:
        assert c["status"] == "BERTHED"

    # Test track retrieval
    call_id = calls["items"][0]["id"]
    track_res = await async_client.get(f"/api/v1/vessels/calls/{call_id}/track")
    assert track_res.status_code == 200
    track = track_res.json()
    assert track["call_id"] == call_id
    assert len(track["positions"]) >= 1
    assert "latitude" in track["positions"][0]


@pytest.mark.asyncio
async def test_equipment_and_telemetry(async_client):
    """Test equipment fleet listing and telemetry readings."""
    res = await async_client.get("/api/v1/equipment")
    assert res.status_code == 200
    equip = res.json()
    assert len(equip) == 5

    eq_id = equip[0]["id"]
    telem_res = await async_client.get(f"/api/v1/equipment/{eq_id}/telemetry")
    assert telem_res.status_code == 200
    assert isinstance(telem_res.json(), list)


@pytest.mark.asyncio
async def test_yard_blocks_and_occupancy(async_client):
    """Test yard blocks listing and occupancy history."""
    res = await async_client.get("/api/v1/yard/blocks")
    assert res.status_code == 200
    blocks = res.json()
    assert len(blocks) == 12

    b_id = blocks[0]["id"]
    occ_res = await async_client.get(f"/api/v1/yard/blocks/{b_id}/occupancy")
    assert occ_res.status_code == 200
    occ = occ_res.json()
    assert len(occ) >= 1
    assert occ[0]["yard_block_id"] == b_id


@pytest.mark.asyncio
async def test_events_and_filtering(async_client):
    """Test operational alerts timeline and severity filtering."""
    res = await async_client.get("/api/v1/events?severity=CRITICAL")
    assert res.status_code == 200
    events = res.json()
    assert len(events["items"]) >= 1
    assert events["items"][0]["severity"] == "CRITICAL"


@pytest.mark.asyncio
async def test_baseline_kpis(async_client):
    """Test overview baseline KPIs calculation."""
    res = await async_client.get("/api/v1/kpis/overview")
    assert res.status_code == 200
    kpis = res.json()
    assert kpis["vessels_in_system"] == 12
    assert kpis["vessels_at_berth"] == 3
    assert kpis["total_berths"] == 6
    assert kpis["occupied_berths"] == 3
    assert kpis["berth_occupancy_pct"] == 50.0
    assert kpis["data_status"] == "SIMULATED"


@pytest.mark.asyncio
async def test_provenance_summary(async_client):
    """Test provenance source registry and status breakdown."""
    res = await async_client.get("/api/v1/provenance/summary")
    assert res.status_code == 200
    data = res.json()
    assert "data_status_breakdown" in data
    assert data["data_status_breakdown"]["SIMULATED"] > 0
    assert "No live CPA or AIS connections" in data["disclaimer"]


@pytest.mark.asyncio
async def test_error_handling_not_found(async_client):
    """Verify standard 404 response structure for nonexistent records."""
    res = await async_client.get("/api/v1/vessels/nonexistent_id_999")
    assert res.status_code == 404
    data = res.json()
    assert "error" in data
    assert "detail" in data
    assert "not found" in data["detail"].lower()


@pytest.mark.asyncio
async def test_error_handling_validation(async_client):
    """Verify standard 422 response structure for invalid query parameters."""
    res = await async_client.get("/api/v1/vessels?page=0")  # page must be >= 1
    assert res.status_code == 422
    data = res.json()
    assert "error" in data
    assert data["error"] == "Validation Error"
    assert "detail" in data

