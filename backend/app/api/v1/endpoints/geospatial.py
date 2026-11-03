from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.geospatial.service import geospatial_service
from app.geospatial.transforms import (
    wgs84_to_enu,
    enu_to_wgs84,
    haversine_distance_m,
    initial_bearing_deg,
    DEFAULT_ORIGIN_LAT,
    DEFAULT_ORIGIN_LON,
)
from app.schemas.geospatial import (
    GeoJSONFeatureCollection,
    SpatialLayerRead,
    WGS84ToENURequest,
    ENUCoordinate,
    ENUToWGS84Request,
    WGS84Coordinate,
)

router = APIRouter(prefix="/geospatial", tags=["Geospatial & Digital Twin"])


@router.get("/geojson", response_model=GeoJSONFeatureCollection)
def get_port_geojson(
    layer: Optional[str] = Query(None, description="Optional layer filter (e.g. vessels, berths, bathymetry)"),
    db: Session = Depends(get_db),
):
    """Retrieve integrated WGS84 GeoJSON FeatureCollection across all port spatial layers."""
    fc = geospatial_service.build_full_feature_collection(db)
    if layer:
        filtered = [f for f in fc.features if f.properties.get("layer") == layer]
        return GeoJSONFeatureCollection(
            type="FeatureCollection",
            features=filtered,
            crs=fc.crs,
            metadata={**(fc.metadata or {}), "filtered_layer": layer, "total_features": len(filtered)},
        )
    return fc


@router.get("/layers", response_model=List[SpatialLayerRead])
def list_spatial_layers():
    """List all available controllable geospatial layers with category and metadata."""
    return geospatial_service.get_layers_catalog()


@router.post("/transform/wgs84-to-enu", response_model=ENUCoordinate)
def transform_wgs84_to_local_enu(req: WGS84ToENURequest):
    """Transform geographic WGS84 coordinates (lat/lon) to local East-North-Up 3D scene meters."""
    origin_lat = req.origin_lat or DEFAULT_ORIGIN_LAT
    origin_lon = req.origin_lon or DEFAULT_ORIGIN_LON
    return wgs84_to_enu(
        lat=req.latitude,
        lon=req.longitude,
        alt_m=req.altitude_m or 0.0,
        origin_lat=origin_lat,
        origin_lon=origin_lon,
    )


@router.post("/transform/enu-to-wgs84", response_model=WGS84Coordinate)
def transform_local_enu_to_wgs84(req: ENUToWGS84Request):
    """Transform local East-North-Up 3D scene meters back to geographic WGS84 coordinates."""
    origin_lat = req.origin_lat or DEFAULT_ORIGIN_LAT
    origin_lon = req.origin_lon or DEFAULT_ORIGIN_LON
    return enu_to_wgs84(
        x=req.x,
        y=req.y or 0.0,
        z=req.z,
        origin_lat=origin_lat,
        origin_lon=origin_lon,
    )


@router.get("/distance")
def calculate_spatial_distance(
    lat1: float = Query(..., ge=-90.0, le=90.0),
    lon1: float = Query(..., ge=-180.0, le=180.0),
    lat2: float = Query(..., ge=-90.0, le=90.0),
    lon2: float = Query(..., ge=-180.0, le=180.0),
):
    """Calculate Great Circle distance and initial navigation bearing between two points."""
    dist_m = haversine_distance_m(lat1, lon1, lat2, lon2)
    dist_nm = dist_m / 1852.0  # Nautical miles
    bearing = initial_bearing_deg(lat1, lon1, lat2, lon2)

    return {
        "distance_meters": round(dist_m, 2),
        "distance_nautical_miles": round(dist_nm, 3),
        "initial_bearing_degrees": round(bearing, 1),
        "point_1": {"lat": lat1, "lon": lon1},
        "point_2": {"lat": lat2, "lon": lon2},
        "crs": "WGS84 (EPSG:4326)",
    }
