import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.gov_data.service import gov_data_service
from app.ingestion.service import port_data_bridge_service
from app.models.provenance import DataSource, SourceTypeEnum
from app.db.base import DataStatusEnum


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_gov_data_sources_endpoint(client: TestClient, db_session):
    """Test retrieval of verified Bangladesh Government & Port Authority data sources."""
    # Ensure sources are present in DB
    from app.db.seed import seed_database
    seed_database(db_session)

    res = client.get("/api/v1/gov/sources")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 3

    codes = [s["code"] for s in data]
    assert any("CPA" in c for c in codes)


def test_gov_tides_endpoint(client: TestClient):
    """Test CPA official tide tables endpoint and date filtering."""
    # 1. Fetch all
    res = client.get("/api/v1/gov/tides")
    assert res.status_code == 200
    tides = res.json()
    assert len(tides) >= 28

    sample = tides[0]
    assert "circular_id" in sample
    assert "hw_time_1" in sample
    assert "max_permissible_draft_m" in sample
    assert 8.5 <= sample["max_permissible_draft_m"] <= 9.5
    assert sample["data_status"] == "OBSERVED"

    # 2. Date filter
    target_date = tides[3]["date"]
    res_filtered = client.get(f"/api/v1/gov/tides?date={target_date}")
    assert res_filtered.status_code == 200
    filtered_data = res_filtered.json()
    assert len(filtered_data) == 1
    assert filtered_data[0]["date"] == target_date


def test_gov_tides_compliance_checks(client: TestClient):
    """Test navigational compliance evaluation against CPA high-water draft circulars."""
    # 1. Compliant small feeder
    res1 = client.get("/api/v1/gov/tides/check-compliance?draft_m=8.20&loa_m=165.0&date=2026-11-04")
    assert res1.status_code == 200
    r1 = res1.json()
    assert r1["is_compliant"] is True
    assert r1["requires_daylight_only"] is False
    assert len(r1["violations"]) == 0

    # 2. Daylight-restricted larger feeder (LOA > 175m or draft > 8.5m)
    res2 = client.get("/api/v1/gov/tides/check-compliance?draft_m=8.90&loa_m=182.0&date=2026-11-04")
    assert res2.status_code == 200
    r2 = res2.json()
    assert r2["is_compliant"] is True
    assert r2["requires_daylight_only"] is True
    assert any("DAYLIGHT" in a for a in r2["advisories"])

    # 3. Violation: Draft exceeds Karnaphuli limit
    res3 = client.get("/api/v1/gov/tides/check-compliance?draft_m=9.85&loa_m=185.0&date=2026-11-04")
    assert res3.status_code == 200
    r3 = res3.json()
    assert r3["is_compliant"] is False
    assert len(r3["violations"]) >= 1
    assert any("exceeds" in v.lower() for v in r3["violations"])

    # 4. Violation: LOA exceeds terminal limit
    res4 = client.get("/api/v1/gov/tides/check-compliance?draft_m=9.00&loa_m=260.0&date=2026-11-04")
    assert res4.status_code == 200
    r4 = res4.json()
    assert r4["is_compliant"] is False
    assert any("LOA" in v for v in r4["violations"])


def test_gov_berth_specifications_endpoint(client: TestClient):
    """Test CPA official container berth technical specifications."""
    res = client.get("/api/v1/gov/berth-specifications")
    assert res.status_code == 200
    berths = res.json()
    assert len(berths) >= 8

    # Filter by NCT
    res_nct = client.get("/api/v1/gov/berth-specifications?terminal=NCT")
    assert res_nct.status_code == 200
    nct_berths = res_nct.json()
    assert len(nct_berths) >= 5
    for b in nct_berths:
        assert b["terminal_code"] == "NCT"
        assert b["sts_crane_equipped"] is True
        assert b["crane_rail_gauge_m"] == 30.48


def test_gov_met_bulletins_endpoint(client: TestClient):
    """Test BMD Patenga marine weather bulletins and warning signals."""
    res = client.get("/api/v1/gov/met-bulletins")
    assert res.status_code == 200
    bulletins = res.json()
    assert len(bulletins) >= 5

    # Filter by min_signal
    res_sig3 = client.get("/api/v1/gov/met-bulletins?min_signal=3")
    assert res_sig3.status_code == 200
    sig3_list = res_sig3.json()
    assert len(sig3_list) >= 1
    for b in sig3_list:
        assert b["signal_number"] >= 3
        assert b["port_operations_impact"] == "SUSPEND_LIGHTERAGE"


def test_gov_throughput_benchmarks_endpoint(client: TestClient):
    """Test CPA official annual container throughput statistics."""
    res = client.get("/api/v1/gov/throughput-benchmarks")
    assert res.status_code == 200
    benchmarks = res.json()
    assert len(benchmarks) >= 4

    latest = benchmarks[0]
    assert latest["total_container_throughput_teu"] > 3000000
    assert latest["avg_turnaround_time_days"] < 4.0
    assert latest["data_status"] == "OBSERVED"


def test_gov_sample_file_download(client: TestClient):
    """Test downloading public government reference CSVs."""
    # 1. Valid file
    res = client.get("/api/v1/gov/sample-file?file_type=berthing_log")
    assert res.status_code == 200
    assert "vessel_name" in res.text
    assert "MV KOTA RAJIN" in res.text

    # 2. Invalid file type
    res_err = client.get("/api/v1/gov/sample-file?file_type=unknown_doc")
    assert res_err.status_code == 400


def test_port_data_bridge_ingests_gov_sample(db_session):
    """Test ingesting verified CPA sample berthing log through the Port Data Bridge."""
    sample_file = gov_data_service.data_dir / "cpa_sample_berthing_log.csv"
    assert sample_file.exists()

    with open(sample_file, "rb") as f:
        content = f.read()

    upload_res = port_data_bridge_service.stage_uploaded_document(
        db=db_session,
        filename="cpa_sample_berthing_log.csv",
        content=content,
        data_source_id="ds_cpa_bulletin",
        document_type="VESSEL_BERTHING_LOG",
    )

    assert upload_res.total_rows_parsed >= 5
    assert len(upload_res.records) >= 5
    assert upload_res.file_sha256 is not None
