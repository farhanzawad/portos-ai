from typing import Optional, List, Dict, Any, Union
from pydantic import BaseModel, ConfigDict, Field
from app.db.base import DataStatusEnum


class GeoJSONGeometry(BaseModel):
    type: str  # Point, LineString, Polygon, MultiPolygon
    coordinates: Any


class GeoJSONFeature(BaseModel):
    type: str = "Feature"
    id: str
    geometry: GeoJSONGeometry
    properties: Dict[str, Any] = Field(default_factory=dict)


class GeoJSONFeatureCollection(BaseModel):
    type: str = "FeatureCollection"
    features: List[GeoJSONFeature]
    crs: Optional[Dict[str, Any]] = None
    metadata: Optional[Dict[str, Any]] = None


class SpatialLayerRead(BaseModel):
    layer_id: str
    name: str
    category: str
    feature_count: int
    default_visible: bool
    description: str
    icon: Optional[str] = None


class WGS84ToENURequest(BaseModel):
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in decimal degrees")
    altitude_m: Optional[float] = Field(0.0, description="Altitude/height in meters")
    origin_lat: Optional[float] = Field(None, description="Anchor origin latitude (defaults to port center 22.2850)")
    origin_lon: Optional[float] = Field(None, description="Anchor origin longitude (defaults to port center 91.8020)")


class ENUCoordinate(BaseModel):
    x: float = Field(..., description="Easting offset in meters (East = +X, West = -X)")
    y: float = Field(..., description="Up elevation offset in meters (Up = +Y)")
    z: float = Field(..., description="Northing offset in meters (South = +Z, North = -Z for Three.js coordinates)")
    origin_lat: float
    origin_lon: float
    crs: str = "Local East-North-Up (WGS84 Ellipsoid)"
    data_status: DataStatusEnum = DataStatusEnum.DERIVED


class ENUToWGS84Request(BaseModel):
    x: float = Field(..., description="Easting offset in meters")
    y: Optional[float] = Field(0.0, description="Elevation offset in meters")
    z: float = Field(..., description="Northing offset in meters (Three.js Z coordinate)")
    origin_lat: Optional[float] = Field(None, description="Anchor origin latitude")
    origin_lon: Optional[float] = Field(None, description="Anchor origin longitude")


class WGS84Coordinate(BaseModel):
    latitude: float
    longitude: float
    altitude_m: float = 0.0
    crs: str = "WGS84 (EPSG:4326)"
    data_status: DataStatusEnum = DataStatusEnum.DERIVED

