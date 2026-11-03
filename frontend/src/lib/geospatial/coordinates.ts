/**
 * High-precision WGS84 to Local East-North-Up (ENU) coordinate engine.
 * Maps regional geographic coordinates (lat/lon) into metric 3D scene coordinates (x, y, z).
 */

const WGS84_A = 6378137.0; // WGS84 Earth semi-major axis (meters)
const WGS84_E2 = 0.00669437999014; // Eccentricity squared

// Default Geographic Origin: Chattogram Container Terminal (CCT/NCT complex)
export const DEFAULT_PORT_ORIGIN = {
  lat: 22.2850,
  lon: 91.8020,
};

// Patenga Container Terminal (PCT) origin for terminal-focused inspection
export const PCT_TERMINAL_ORIGIN = {
  lat: 22.2380,
  lon: 91.7950,
};

function radiusOfCurvature(latDeg: number): { n: number; m: number } {
  const phi = (latDeg * Math.PI) / 180.0;
  const sinPhi = Math.sin(phi);
  const denom = Math.sqrt(1.0 - WGS84_E2 * sinPhi * sinPhi);
  const n = WGS84_A / denom;
  const m = (WGS84_A * (1.0 - WGS84_E2)) / (denom * denom * denom);
  return { n, m };
}

export interface Local3DPoint {
  x: number; // Easting in meters (+X is East)
  y: number; // Up elevation in meters (+Y is Up)
  z: number; // Northing in meters (+Z is South, -Z is North for Three.js coordinates)
}

export function wgs84ToLocalEnu(
  lat: number,
  lon: number,
  altM: number = 0,
  originLat: number = DEFAULT_PORT_ORIGIN.lat,
  originLon: number = DEFAULT_PORT_ORIGIN.lon
): Local3DPoint {
  const { n, m } = radiusOfCurvature(originLat);
  const phi0 = (originLat * Math.PI) / 180.0;

  const dPhi = ((lat - originLat) * Math.PI) / 180.0;
  const dLambda = ((lon - originLon) * Math.PI) / 180.0;

  const x = dLambda * (n + altM) * Math.cos(phi0);
  const northing = dPhi * (m + altM);

  // In Three.js right-handed coordinate convention, -Z is North, +Z is South
  const z = -northing;

  return {
    x: Number(x.toFixed(2)),
    y: Number(altM.toFixed(2)),
    z: Number(z.toFixed(2)),
  };
}

export function localEnuToWgs84(
  x: number,
  y: number = 0,
  z: number = 0,
  originLat: number = DEFAULT_PORT_ORIGIN.lat,
  originLon: number = DEFAULT_PORT_ORIGIN.lon
): { lat: number; lon: number } {
  const { n, m } = radiusOfCurvature(originLat);
  const phi0 = (originLat * Math.PI) / 180.0;

  const northing = -z;
  const dPhi = northing / (m + y);
  const dLambda = x / ((n + y) * Math.cos(phi0));

  const lat = originLat + (dPhi * 180.0) / Math.PI;
  const lon = originLon + (dLambda * 180.0) / Math.PI;

  return {
    lat: Number(lat.toFixed(6)),
    lon: Number(lon.toFixed(6)),
  };
}

/**
 * Format decimal latitude and longitude into maritime Degrees and Decimal Minutes (DMM)
 * e.g., "22°14.80'N, 91°46.50'E"
 */
export function formatCoordinatesDMM(lat: number, lon: number): string {
  const latDir = lat >= 0 ? "N" : "S";
  const absLat = Math.abs(lat);
  const latDeg = Math.floor(absLat);
  const latMin = ((absLat - latDeg) * 60).toFixed(2);

  const lonDir = lon >= 0 ? "E" : "W";
  const absLon = Math.abs(lon);
  const lonDeg = Math.floor(absLon);
  const lonMin = ((absLon - lonDeg) * 60).toFixed(2);

  return `${latDeg}°${latMin}'${latDir}, ${lonDeg}°${lonMin}'${lonDir}`;
}

/**
 * Great-circle distance between two geographic coordinates in meters.
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return WGS84_A * c;
}

/**
 * Initial compass bearing in degrees (0 to 360).
 */
export function calculateBearingDegrees(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}
