import math
from typing import Tuple
from app.schemas.geospatial import ENUCoordinate, WGS84Coordinate
from app.db.base import DataStatusEnum

# WGS84 Ellipsoid constants
WGS84_A = 6378137.0  # semi-major axis in meters
WGS84_E2 = 0.00669437999014  # eccentricity squared

# Default Anchor Coordinate: Chattogram Container Terminal (CCT/NCT baseline)
DEFAULT_ORIGIN_LAT = 22.2850
DEFAULT_ORIGIN_LON = 91.8020


def radius_of_curvature(lat_deg: float) -> Tuple[float, float]:
    """Computes radius of curvature in prime vertical (N) and meridian (M)."""
    phi = math.radians(lat_deg)
    sin_phi = math.sin(phi)
    denom = math.sqrt(1.0 - WGS84_E2 * sin_phi * sin_phi)
    n = WGS84_A / denom
    m = (WGS84_A * (1.0 - WGS84_E2)) / (denom * denom * denom)
    return n, m


def wgs84_to_enu(
    lat: float,
    lon: float,
    alt_m: float = 0.0,
    origin_lat: float = DEFAULT_ORIGIN_LAT,
    origin_lon: float = DEFAULT_ORIGIN_LON,
) -> ENUCoordinate:
    """Converts WGS84 latitude and longitude to local East-North-Up (Three.js coordinates).
    
    Coordinates mapping:
    - X: Easting in meters (+X is East, -X is West)
    - Y: Altitude / Up in meters (+Y is Up)
    - Z: Northing in meters (+Z is South, -Z is North in standard Three.js right-handed system)
    """
    n, m = radius_of_curvature(origin_lat)
    phi_0 = math.radians(origin_lat)

    d_phi = math.radians(lat - origin_lat)
    d_lambda = math.radians(lon - origin_lon)

    # Easting (+X)
    x = d_lambda * (n + alt_m) * math.cos(phi_0)

    # Northing
    northing = d_phi * (m + alt_m)

    # In Three.js, -Z points forward (North), so Z = -northing
    z = -northing
    y = alt_m

    return ENUCoordinate(
        x=round(x, 2),
        y=round(y, 2),
        z=round(z, 2),
        origin_lat=origin_lat,
        origin_lon=origin_lon,
        crs="Local East-North-Up (WGS84 Ellipsoid)",
        data_status=DataStatusEnum.DERIVED,
    )


def enu_to_wgs84(
    x: float,
    y: float = 0.0,
    z: float = 0.0,
    origin_lat: float = DEFAULT_ORIGIN_LAT,
    origin_lon: float = DEFAULT_ORIGIN_LON,
) -> WGS84Coordinate:
    """Converts local East-North-Up (Three.js coordinates) back to WGS84 latitude and longitude."""
    n, m = radius_of_curvature(origin_lat)
    phi_0 = math.radians(origin_lat)

    # In Three.js right-handed system, northing = -z
    northing = -z

    d_phi = northing / (m + y)
    d_lambda = x / ((n + y) * math.cos(phi_0))

    lat = origin_lat + math.degrees(d_phi)
    lon = origin_lon + math.degrees(d_lambda)

    return WGS84Coordinate(
        latitude=round(lat, 6),
        longitude=round(lon, 6),
        altitude_m=round(y, 2),
        crs="WGS84 (EPSG:4326)",
        data_status=DataStatusEnum.DERIVED,
    )


def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two points in meters."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return WGS84_A * c


def initial_bearing_deg(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes initial compass bearing from point 1 to point 2 in degrees (0..360)."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_lambda = math.radians(lon2 - lon1)

    y = math.sin(delta_lambda) * math.cos(phi2)
    x = math.cos(phi1) * math.sin(phi2) - math.sin(phi1) * math.cos(phi2) * math.cos(delta_lambda)
    bearing = math.degrees(math.atan2(y, x))
    return (bearing + 360.0) % 360.0
