/**
 * Verified Karnaphuli River Fairway Navigation & Motion Engine
 * Strictly follows the natural hydrographic Karnaphuli river channel
 * from the Bay of Bengal through the Patenga reach to CCT/NCT and Sadarghat.
 */

import { calculateBearingDegrees, calculateDistanceMeters } from "./coordinates";

export const KARNAPHULI_FAIRWAY_WAYPOINTS: [number, number][] = [
  [91.7000, 22.1300], // 0: Outer deep sea (Bay of Bengal)
  [91.7250, 22.1550], // 1: Anchorage Area Bravo Corridor
  [91.7500, 22.1750], // 2: Anchorage Area Alpha Corridor
  [91.7750, 22.1950], // 3: Fairway buoy
  [91.7920, 22.2080], // 4: Pilot boarding station
  [91.8050, 22.2200], // 5: Water mouth entry (south of Patenga)
  [91.8095, 22.2260], // 6: River mouth fairway entry
  [91.8180, 22.2350], // 7: Lower reach channel transit
  [91.8295, 22.2450], // 8: Patenga reach (PCT frontage water)
  [91.8355, 22.2550], // 9: River reach east of airport
  [91.8355, 22.2650], // 10: River reach approaching meander
  [91.8230, 22.2700], // 11: Meander curve swinging northwest
  [91.8120, 22.2750], // 12: Gupta Bend entry
  [91.7998, 22.2800], // 13: Gupta Bend apex (in water)
  [91.7980, 22.2850], // 14: NCT approach fairway reach
  [91.7960, 22.2900], // 15: NCT container terminal fairway
  [91.7960, 22.2980], // 16: CCT container terminal fairway
  [91.8040, 22.3050], // 17: CPA Jetties fairway
  [91.8125, 22.3120], // 18: Majhirghat transition
  [91.8235, 22.3180], // 19: East reach to Sadarghat
  [91.8370, 22.3240], // 20: Sadarghat basin
];

// Calculate cumulative segment distances in meters along the centerline
const SEGMENT_DISTANCES: number[] = [];
let TOTAL_FAIRWAY_DISTANCE_M = 0;

for (let i = 0; i < KARNAPHULI_FAIRWAY_WAYPOINTS.length - 1; i++) {
  const [lon1, lat1] = KARNAPHULI_FAIRWAY_WAYPOINTS[i];
  const [lon2, lat2] = KARNAPHULI_FAIRWAY_WAYPOINTS[i + 1];
  const dist = calculateDistanceMeters(lat1, lon1, lat2, lon2);
  SEGMENT_DISTANCES.push(dist);
  TOTAL_FAIRWAY_DISTANCE_M += dist;
}

export { TOTAL_FAIRWAY_DISTANCE_M };

/**
 * Interpolate a continuous geographic point [lon, lat, headingDeg] along the fairway
 * given a normalized distance progress ratio between 0.0 (Outer Sea) and 1.0 (Sadarghat).
 */
export function interpolateFairwayPosition(progress: number): {
  lon: number;
  lat: number;
  heading: number;
} {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const targetDistM = clampedProgress * TOTAL_FAIRWAY_DISTANCE_M;

  let accumulatedDist = 0;
  for (let i = 0; i < SEGMENT_DISTANCES.length; i++) {
    const segDist = SEGMENT_DISTANCES[i];
    if (accumulatedDist + segDist >= targetDistM || i === SEGMENT_DISTANCES.length - 1) {
      const remainingDist = targetDistM - accumulatedDist;
      const segT = segDist > 0 ? Math.max(0, Math.min(1, remainingDist / segDist)) : 0;

      const [lon1, lat1] = KARNAPHULI_FAIRWAY_WAYPOINTS[i];
      const [lon2, lat2] = KARNAPHULI_FAIRWAY_WAYPOINTS[i + 1];

      const lon = lon1 + (lon2 - lon1) * segT;
      const lat = lat1 + (lat2 - lat1) * segT;
      const heading = calculateBearingDegrees(lat1, lon1, lat2, lon2);

      return {
        lon: Number(lon.toFixed(6)),
        lat: Number(lat.toFixed(6)),
        heading: Math.round(heading),
      };
    }
    accumulatedDist += segDist;
  }

  const lastWp = KARNAPHULI_FAIRWAY_WAYPOINTS[KARNAPHULI_FAIRWAY_WAYPOINTS.length - 1];
  return { lon: lastWp[0], lat: lastWp[1], heading: 45 };
}

// Navigation loop bounds along the hydrographic fairway
export const MIN_FAIRWAY_PROGRESS = 0.05; // Outer Sea / Fairway Buoy (Bay of Bengal)
export const MAX_FAIRWAY_PROGRESS = 0.76; // Karnaphuli Ø 600m Turning Basin (-11m CD)
export const FAIRWAY_SPAN = MAX_FAIRWAY_PROGRESS - MIN_FAIRWAY_PROGRESS; // 0.71 (~15.6 km)

/**
 * Simulate live vessel motion along the Karnaphuli fairway corridor
 * based on elapsed time, vessel velocity, and transit route.
 * 
 * Features:
 * 1. Realistic maritime harbor speed calibration (calm, steady glide).
 * 2. Closed-loop 4-phase voyage cycle with ZERO teleportation:
 *    - Phase 1 (0.00-0.44): Inbound transit from Sea to Turning Basin.
 *    - Phase 2 (0.44-0.50): 180° swing maneuver inside Karnaphuli 600m Turning Basin.
 *    - Phase 3 (0.50-0.94): Outbound transit downriver along fairway to Sea.
 *    - Phase 4 (0.94-1.00): 180° swing maneuver in Bay of Bengal outer waiting roads.
 */
export function getLiveVesselFairwayCoord(
  baseProgress: number,
  speedKnots: number,
  elapsedSeconds: number,
  isOutboundInitial: boolean = false
): {
  lon: number;
  lat: number;
  heading: number;
  currentProgress: number;
  isOutbound: boolean;
  transitPhase: "INBOUND" | "TURNING_BASIN" | "OUTBOUND" | "SEA_TURNAROUND";
} {
  // Speed in meters per second (1 knot ~ 0.5144 m/s)
  // Calibrated visualization multiplier (3.2x) for calm, realistic harbor motion
  const vesselKnots = speedKnots > 0 ? speedKnots : 8.5;
  const speedMps = vesselKnots * 0.5144 * 3.2;

  // Total round-trip distance along the 2-way fairway corridor
  const roundTripDistanceM = 2 * FAIRWAY_SPAN * TOTAL_FAIRWAY_DISTANCE_M;
  const distTraveledM = speedMps * elapsedSeconds;
  const cycleDelta = distTraveledM / roundTripDistanceM;

  // Map initial vessel position into continuous [0, 1) cycle
  const clampedBase = Math.max(MIN_FAIRWAY_PROGRESS, Math.min(MAX_FAIRWAY_PROGRESS, baseProgress));
  let initialCycle: number;
  if (!isOutboundInitial) {
    // Inbound: maps [MIN, MAX] to [0.00, 0.44]
    initialCycle = ((clampedBase - MIN_FAIRWAY_PROGRESS) / FAIRWAY_SPAN) * 0.44;
  } else {
    // Outbound: maps [MAX, MIN] to [0.50, 0.94]
    initialCycle = 0.50 + ((MAX_FAIRWAY_PROGRESS - clampedBase) / FAIRWAY_SPAN) * 0.44;
  }

  const cycle = (initialCycle + cycleDelta) % 1.0;

  let currentProgress: number;
  let heading: number;
  let isOutbound: boolean;
  let transitPhase: "INBOUND" | "TURNING_BASIN" | "OUTBOUND" | "SEA_TURNAROUND";

  if (cycle < 0.44) {
    // Phase 1: Inbound Voyage (Upriver transit)
    transitPhase = "INBOUND";
    isOutbound = false;
    const u = cycle / 0.44;
    currentProgress = MIN_FAIRWAY_PROGRESS + u * FAIRWAY_SPAN;
    const pt = interpolateFairwayPosition(currentProgress);
    heading = pt.heading;
  } else if (cycle < 0.50) {
    // Phase 2: Karnaphuli 600m Turning Basin Swing Maneuver
    transitPhase = "TURNING_BASIN";
    currentProgress = MAX_FAIRWAY_PROGRESS;
    const u = (cycle - 0.44) / 0.06;
    isOutbound = u >= 0.5;
    const pt = interpolateFairwayPosition(currentProgress);
    // Smooth S-curve easing for realistic vessel 180° swing assisted by tugs
    const ease = (1 - Math.cos(u * Math.PI)) / 2;
    heading = Math.round((pt.heading + ease * 180) % 360);
  } else if (cycle < 0.94) {
    // Phase 3: Outbound Voyage (Downriver transit to Sea)
    transitPhase = "OUTBOUND";
    isOutbound = true;
    const u = (cycle - 0.50) / 0.44;
    currentProgress = MAX_FAIRWAY_PROGRESS - u * FAIRWAY_SPAN;
    const pt = interpolateFairwayPosition(currentProgress);
    heading = Math.round((pt.heading + 180) % 360);
  } else {
    // Phase 4: Bay of Bengal Sea Turnaround / Waiting Roads Maneuver
    transitPhase = "SEA_TURNAROUND";
    currentProgress = MIN_FAIRWAY_PROGRESS;
    const u = (cycle - 0.94) / 0.06;
    isOutbound = u < 0.5;
    const pt = interpolateFairwayPosition(currentProgress);
    // Smooth S-curve easing for vessel swing in outer anchorage
    const ease = (1 - Math.cos(u * Math.PI)) / 2;
    heading = Math.round((pt.heading + 180 + ease * 180) % 360);
  }

  const result = interpolateFairwayPosition(currentProgress);
  return {
    lon: result.lon,
    lat: result.lat,
    heading,
    currentProgress,
    isOutbound,
    transitPhase,
  };
}

/**
 * Generates dynamic trailing wake coordinates (polyline) behind a moving vessel
 * along the hydrographic fairway so users can clearly see the movement trajectory.
 */
export function getTrailingWakeCoordinates(
  currentProgress: number,
  isOutbound: boolean = false,
  wakePointsCount: number = 3
): [number, number][] {
  const coords: [number, number][] = [];
  const wakeSpan = 0.018; // ~400m realistic trailing wake
  for (let i = wakePointsCount; i >= 0; i--) {
    const fraction = i / wakePointsCount;
    const p = isOutbound
      ? Math.min(MAX_FAIRWAY_PROGRESS, currentProgress + fraction * wakeSpan)
      : Math.max(MIN_FAIRWAY_PROGRESS, currentProgress - fraction * wakeSpan);
    const pt = interpolateFairwayPosition(p);
    coords.push([pt.lon, pt.lat]);
  }
  return coords;
}

/**
 * Subtle tidal current oscillation for anchored vessels in waiting roads
 */
export function getAnchorageTidalDrift(
  baseLon: number,
  baseLat: number,
  elapsedSeconds: number,
  seedIndex: number = 0
): { lon: number; lat: number; heading: number } {
  const period = 24.0 + seedIndex * 3.5;
  const phase = seedIndex * 1.5;
  const t = (elapsedSeconds / period) * 2 * Math.PI + phase;

  // Tiny natural drift radius ~ 25m (approx 0.00025 deg)
  const dLon = Math.sin(t) * 0.00022;
  const dLat = Math.cos(t * 0.8) * 0.00018;
  const heading = Math.round((Math.sin(t * 0.5) * 25 + 160 + seedIndex * 30) % 360);

  return {
    lon: Number((baseLon + dLon).toFixed(6)),
    lat: Number((baseLat + dLat).toFixed(6)),
    heading,
  };
}

/**
 * Subtle berthing surge / sway at quayside
 */
export function getBerthedSway(
  baseLon: number,
  baseLat: number,
  elapsedSeconds: number,
  seedIndex: number = 0
): { lon: number; lat: number; heading: number } {
  const t = elapsedSeconds * 0.4 + seedIndex;
  const dLon = Math.sin(t) * 0.00003;
  const dLat = Math.cos(t * 0.7) * 0.00002;
  return {
    lon: Number((baseLon + dLon).toFixed(6)),
    lat: Number((baseLat + dLat).toFixed(6)),
    heading: 195, // Parallel to quay wall alignment
  };
}

