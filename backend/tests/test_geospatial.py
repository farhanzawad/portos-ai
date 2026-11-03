import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.geospatial.transforms import (
    wgs84_to_enu,
    enu_to_wgs84,
    haversine_distance_m,
    initial_bearing_deg,
    DEFAULT_ORIGIN_LAT,
    DEFAULT_ORIGIN_LON,
)


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


def test_geospatial_geojson_endpoint(client: TestClient):
    """Verify /api/v1/geospatial/geojson returns valid GeoJSON FeatureCollection."""
    res = client.get("/api/v1/geospatial/geojson")
    assert res.status_code == 200
    data = res.json()

    assert data["type"] == "FeatureCollection"
    assert "features" in data
    assert len(data["features"]) >= 25
    assert data["crs"]["properties"]["name"] == "urn:ogc:def:crs:OGC:1.3:CRS84"

    # Check for core entity types
    entity_types = {f["properties"].get("entity_type") for f in data["features"]}
    assert "PortArea" in entity_types
    assert "Bathymetry" in entity_types
    assert "Terminal" in entity_types
    assert "Berth" in entity_types
    assert "YardBlock" in entity_types
    assert "Vessel" in entity_types
    assert "VesselTrack" in entity_types


def test_geospatial_layers_catalog(client: TestClient):
    """Verify /api/v1/geospatial/layers lists all controllable map layers."""
    res = client.get("/api/v1/geospatial/layers")
    assert res.status_code == 200
    layers = res.json()

    assert isinstance(layers, list)
    assert len(layers) >= 10

    layer_ids = [l["layer_id"] for l in layers]
    assert "base_geography" in layer_ids
    assert "bathymetry" in layer_ids
    assert "navigation_channels" in layer_ids
    assert "anchorage_zones" in layer_ids
    assert "berths" in layer_ids
    assert "container_yards" in layer_ids
    assert "vessels" in layer_ids


def test_geospatial_layer_filtering(client: TestClient):
    """Verify filtering GeoJSON features by layer parameter."""
    res = client.get("/api/v1/geospatial/geojson?layer=berths")
    assert res.status_code == 200
    data = res.json()
    assert len(data["features"]) > 0
    for f in data["features"]:
        assert f["properties"]["layer"] == "berths"


def test_wgs84_to_enu_transformation():
    """Verify mathematical precision of WGS84 to local East-North-Up transformation."""
    # Origin should map to (0, 0, 0)
    origin_enu = wgs84_to_enu(DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LON)
    assert abs(origin_enu.x) < 0.01
    assert abs(origin_enu.z) < 0.01

    # North point (lat + 0.01 deg is ~1107 meters North => -Z in Three.js)
    north_enu = wgs84_to_enu(DEFAULT_ORIGIN_LAT + 0.01, DEFAULT_ORIGIN_LON)
    assert north_enu.z < -1000.0  # -Z is North
    assert abs(north_enu.x) < 5.0

    # East point (lon + 0.01 deg is ~1030 meters East => +X in Three.js)
    east_enu = wgs84_to_enu(DEFAULT_ORIGIN_LAT, DEFAULT_ORIGIN_LON + 0.01)
    assert east_enu.x > 900.0
    assert abs(east_enu.z) < 5.0


def test_enu_to_wgs84_roundtrip():
    """Verify roundtrip coordinate conversion WGS84 -> ENU -> WGS84."""
    test_lat = 22.2450
    test_lon = 91.7850
    test_alt = 5.0

    enu = wgs84_to_enu(test_lat, test_lon, test_alt)
    wgs = enu_to_wgs84(enu.x, enu.y, enu.z)

    assert abs(wgs.latitude - test_lat) < 1e-5
    assert abs(wgs.longitude - test_lon) < 1e-5


def test_geospatial_transform_endpoints(client: TestClient):
    """Verify REST transformation endpoints."""
    # Forward transform
    res_fwd = client.post(
        "/api/v1/geospatial/transform/wgs84-to-enu",
        json={"latitude": 22.2850, "longitude": 91.8020, "altitude_m": 0.0},
    )
    assert res_fwd.status_code == 200
    enu_data = res_fwd.json()
    assert abs(enu_data["x"]) < 0.1
    assert abs(enu_data["z"]) < 0.1

    # Inverse transform
    res_inv = client.post(
        "/api/v1/geospatial/transform/enu-to-wgs84",
        json={"x": 0.0, "y": 0.0, "z": 0.0},
    )
    assert res_inv.status_code == 200
    wgs_data = res_inv.json()
    assert abs(wgs_data["latitude"] - DEFAULT_ORIGIN_LAT) < 0.001
    assert abs(wgs_data["longitude"] - DEFAULT_ORIGIN_LON) < 0.001


def test_distance_and_bearing_calculation(client: TestClient):
    """Verify Great Circle distance and bearing endpoint."""
    res = client.get(
        "/api/v1/geospatial/distance?lat1=22.2850&lon1=91.8020&lat2=22.2000&lon2=91.7500"
    )
    assert res.status_code == 200
    data = res.json()
    assert data["distance_meters"] > 9000.0
    assert data["distance_nautical_miles"] > 4.5
    assert 180.0 <= data["initial_bearing_degrees"] <= 270.0  # South-West
