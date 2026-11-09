"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import maplibregl, { Map as MapLibreMap, GeoJSONSource } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Compass,
  Layers,
  Ruler,
  Info,
  Maximize2,
  Minimize2,
  Anchor,
  Ship,
  Eye,
  RotateCcw,
  Navigation,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  Radio,
} from "lucide-react";
import {
  getPortGeoJSON,
  getSpatialLayers,
} from "@/lib/api-client";
import {
  GeoJSONFeatureCollection,
  SpatialLayerRead,
  DataStatus,
} from "@/types/api";
import {
  formatCoordinatesDMM,
  calculateDistanceMeters,
  calculateBearingDegrees,
  DEFAULT_PORT_ORIGIN,
  PCT_TERMINAL_ORIGIN,
} from "@/lib/geospatial/coordinates";
import {
  getLiveVesselFairwayCoord,
  getAnchorageTidalDrift,
  getBerthedSway,
  getTrailingWakeCoordinates,
} from "@/lib/geospatial/fairway";
import { SelectedEntity } from "../digital-twin/types";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { MaritimeMapLegend } from "./MaritimeMapLegend";
import { createVesselTrackerElement } from "./VesselTrackerMarker";

interface GeospatialPortMapProps {
  selectedEntity?: SelectedEntity | null;
  onSelectEntity?: (entity: SelectedEntity) => void;
  isSimulating?: boolean;
  simulationSpeed?: 1 | 2 | 5;
  onOpen3DView?: (entityId?: string) => void;
  className?: string;
  height?: string;
}

type BaseMapStyle =
  | "nautical-dark"
  | "maritime-standard"
  | "satellite-hybrid"
  | "bathymetric-thermal"
  | "tactical-radar"
  | "topographic"
  | "offline-vector";

interface MeasurementPoint {
  lat: number;
  lon: number;
}

// Generate concentric nautical range rings around Patenga VTS Station (1 NM = 1.852 km)
function createRangeRingGeoJSON(centerLon: number, centerLat: number, radiiNM: number[]) {
  const features = radiiNM.map((nm) => {
    const points: [number, number][] = [];
    const steps = 64;
    const latRad = (centerLat * Math.PI) / 180;
    const rLat = (nm * 1.852) / 111.32;
    const rLon = (nm * 1.852) / (111.32 * Math.cos(latRad));

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * 2 * Math.PI;
      const x = centerLon + rLon * Math.cos(theta);
      const y = centerLat + rLat * Math.sin(theta);
      points.push([x, y]);
    }

    return {
      type: "Feature" as const,
      id: `range-ring-${nm}nm`,
      properties: {
        radius_nm: nm,
        label: `${nm} NM (${(nm * 1.852).toFixed(1)} km)`,
      },
      geometry: {
        type: "LineString" as const,
        coordinates: points,
      },
    };
  });

  return {
    type: "FeatureCollection" as const,
    features,
  };
}

// Offline Vector Fallback Style - 100% self-contained, zero external network dependency
const OFFLINE_VECTOR_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  name: "PORTOS Maritime Minimalist",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#0d1b2a",
      },
    },
  ],
};

const BASEMAP_STYLES: Record<BaseMapStyle, { name: string; url: string | maplibregl.StyleSpecification; description: string }> = {
  "nautical-dark": {
    name: "Tactical Nautical Dark",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    description: "High-contrast dark hydrographic theme for bridge night-watch and monitoring",
  },
  "maritime-standard": {
    name: "ECDIS Maritime Standard",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    description: "Crisp neutral GIS cartography matching Port Authority hydrographic charts",
  },
  "satellite-hybrid": {
    name: "Coastal Satellite Hybrid",
    url: {
      version: 8,
      sources: {
        "esri-satellite": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "&copy; Esri, Maxar, Earthstar Geographics",
        },
      },
      layers: [
        {
          id: "satellite-layer",
          type: "raster",
          source: "esri-satellite",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
    description: "High-resolution coastal satellite orthophoto overlaid with fairway hydrography",
  },
  "bathymetric-thermal": {
    name: "Bathymetric Soundings",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    description: "Thermal depth gradient highlighting dredged fairway channels and shoal banks",
  },
  "tactical-radar": {
    name: "Tactical Radar (Phosphor Green)",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    description: "Authentic phosphor green night sweep radar with nautical range rings and VTS tracking",
  },
  "topographic": {
    name: "Coastal Topographic",
    url: {
      version: 8,
      sources: {
        "osm-tiles": {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          attribution: "&copy; OpenStreetMap contributors",
        },
      },
      layers: [
        {
          id: "osm-tiles-layer",
          type: "raster",
          source: "osm-tiles",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
    description: "Regional topographic relief and coastal settlement context",
  },
  "offline-vector": {
    name: "Offline Vector (Zero Network)",
    url: OFFLINE_VECTOR_STYLE,
    description: "Self-contained vector rendering without internet tile dependencies",
  },
};

export function GeospatialPortMap({
  selectedEntity,
  onSelectEntity,
  isSimulating = false,
  simulationSpeed = 1,
  onOpen3DView,
  className = "",
  height = "h-[680px]",
}: GeospatialPortMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeBaseMap, setActiveBaseMap] = useState<BaseMapStyle>("nautical-dark");
  const [showOverlaysPanel, setShowOverlaysPanel] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showBaseMapModal, setShowBaseMapModal] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(12.5);
  const [showRadarRings, setShowRadarRings] = useState(true);

  // Measurement Tool State
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [measurePoints, setMeasurePoints] = useState<MeasurementPoint[]>([]);

  // GetInfo Inspector Tool State
  const [isGetInfoActive, setIsGetInfoActive] = useState(false);
  const [inspectedFeature, setInspectedFeature] = useState<any | null>(null);

  // Spatial Layers from Backend
  const [spatialLayers, setSpatialLayers] = useState<SpatialLayerRead[]>([]);
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({
    base_geography: true,
    bathymetry: true,
    navigation_channels: true,
    anchorage_zones: true,
    terminals: true,
    berths: true,
    container_yards: true,
    port_facilities: true,
    road_rail_network: true,
    vessels: true,
    vessel_tracks: true,
    incidents: true,
  });

  const [geojsonData, setGeojsonData] = useState<GeoJSONFeatureCollection | null>(null);

  // Live continuous fairway vessel motion animation state
  const [isLiveActive, setIsLiveActive] = useState(true);
  const animFrameIdRef = useRef<number | null>(null);
  const animStartTimeRef = useRef<number>(Date.now());
  const initialVesselStatesRef = useRef<
    Map<
      string,
      {
        baseLon: number;
        baseLat: number;
        baseProgress: number;
        speedKnots: number;
        status: string;
        isOutbound: boolean;
      }
    >
  >(new Map());

  // High-fidelity HTML Vessel Trackers (IMO directional chevrons & tactical reticles)
  const vesselMarkersRef = useRef<
    Map<
      string,
      {
        marker: maplibregl.Marker;
        el: HTMLElement;
        rotatorEl: HTMLElement | null;
        reticleEl: HTMLElement | null;
        labelEl: HTMLElement | null;
      }
    >
  >(new Map());

  // Fetch Spatial Layers & GeoJSON
  useEffect(() => {
    async function loadData() {
      try {
        const [layersData, geoData] = await Promise.all([
          getSpatialLayers(),
          getPortGeoJSON(),
        ]);
        setSpatialLayers(layersData);
        setGeojsonData(geoData);

        // Precompute initial vessel states for natural, smooth live movement
        if (geoData?.features) {
          const vMap = new Map<
            string,
            {
              baseLon: number;
              baseLat: number;
              baseProgress: number;
              speedKnots: number;
              status: string;
              isOutbound: boolean;
            }
          >();

          let vIndex = 0;
          geoData.features.forEach((f) => {
            if (f.properties?.entity_type === "Vessel" && f.geometry?.type === "Point") {
              const coords = f.geometry.coordinates as [number, number];
              const st = (f.properties.status || "EN_ROUTE").toUpperCase();
              const spd = Number(f.properties.speed_knots) || (st === "BERTHED" ? 0 : 8.5);
              const progress = ((vIndex * 0.16) + 0.08) % 0.82;
              const stateObj = {
                baseLon: coords[0],
                baseLat: coords[1],
                baseProgress: progress,
                speedKnots: spd > 0 ? spd : 8.0,
                status: st,
                isOutbound: vIndex % 3 === 0,
              };
              if (f.id) vMap.set(String(f.id), stateObj);
              if (f.properties?.id) vMap.set(String(f.properties.id), stateObj);
              if (f.properties?.vessel_call_id) vMap.set(String(f.properties.vessel_call_id), stateObj);
              vIndex++;
            }
          });
          initialVesselStatesRef.current = vMap;
        }
      } catch (err) {
        console.error("Failed to load geospatial datasets from backend:", err);
      }
    }
    loadData();
  }, []);

  // Initialize MapLibre GL Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const baseStyle = BASEMAP_STYLES[activeBaseMap].url;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: baseStyle,
      center: [DEFAULT_PORT_ORIGIN.lon, DEFAULT_PORT_ORIGIN.lat],
      zoom: 12.2,
      minZoom: 10.5,
      maxZoom: 17.5,
      bearing: 0,
      pitch: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false, showZoom: true }), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
      mapRef.current = map;
      if (typeof window !== "undefined") {
        (window as any).__portMap = map;
      }
    });

    map.on("mousemove", (e) => {
      setCursorCoords({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });

    map.on("zoom", () => {
      setZoomLevel(Number(map.getZoom().toFixed(1)));
    });

    const markers = vesselMarkersRef.current;
    return () => {
      markers.forEach((item) => item.marker.remove());
      markers.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [activeBaseMap]);

  // Add GeoJSON Port Layers once map and data are ready
  const renderGeoJSONLayers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !geojsonData) return;

    // Remove existing portos source/layers if present
    const existingSource = map.getSource("portos-features") as GeoJSONSource;
    if (existingSource) {
      existingSource.setData(geojsonData as any);
      return;
    }

    map.addSource("portos-features", {
      type: "geojson",
      data: geojsonData as any,
    });

    // 1. Base Geography: Karnaphuli River Fairway Polygon
    map.addLayer({
      id: "layer-base-geography-fill",
      type: "fill",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "Waterway"],
      paint: {
        "fill-color": "#0d3b66",
        "fill-opacity": 0.45,
      },
    });

    map.addLayer({
      id: "layer-base-geography-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "Waterway"],
      paint: {
        "line-color": "#16a394",
        "line-width": 1.5,
        "line-opacity": 0.8,
      },
    });

    // 2. Bathymetry Contours
    map.addLayer({
      id: "layer-bathymetry-fill",
      type: "fill",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "BathymetryContour"],
      paint: {
        "fill-color": [
          "match",
          ["get", "depth_range_cd_m"],
          "< 5.0m (Shoals)", "#1e3a5f",
          "-9.0m (Standard Fairway)", "#164e63",
          "-11.0m (PCT & NCT Basin)", "#0e7490",
          "-14.0m (Outer Deep Channel)", "#0369a1",
          "#1e293b",
        ],
        "fill-opacity": 0.35,
      },
    });

    map.addLayer({
      id: "layer-bathymetry-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "BathymetryContour"],
      paint: {
        "line-color": "#38bdf8",
        "line-width": 1.2,
        "line-dasharray": [3, 2],
      },
    });

    // 3a. Navigation Corridor (Dredged Channel Polygon)
    map.addLayer({
      id: "layer-navigation-corridor-fill",
      type: "fill",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "NavigationCorridor"],
      paint: {
        "fill-color": "#eab308",
        "fill-opacity": 0.12,
      },
    });

    map.addLayer({
      id: "layer-navigation-corridor-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "NavigationCorridor"],
      paint: {
        "line-color": "#eab308",
        "line-width": 1.2,
        "line-dasharray": [3, 2],
        "line-opacity": 0.5,
      },
    });

    // 3b. Navigation Channels & Centerlines
    map.addLayer({
      id: "layer-navigation-channels-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "NavigationRoute"],
      paint: {
        "line-color": "#eab308",
        "line-width": 2.5,
        "line-dasharray": [4, 3],
        "line-opacity": 0.9,
      },
    });

    // 4. Anchorage Zones
    map.addLayer({
      id: "layer-anchorage-fill",
      type: "fill",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "AnchorageZone"],
      paint: {
        "fill-color": "#f59e0b",
        "fill-opacity": 0.18,
      },
    });

    map.addLayer({
      id: "layer-anchorage-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "AnchorageZone"],
      paint: {
        "line-color": "#f59e0b",
        "line-width": 1.5,
        "line-dasharray": [2, 2],
      },
    });

    // 5. Terminal Boundaries
    map.addLayer({
      id: "layer-terminals-fill",
      type: "fill",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "Terminal"],
      paint: {
        "fill-color": "#102a43",
        "fill-opacity": 0.4,
      },
    });

    map.addLayer({
      id: "layer-terminals-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "Terminal"],
      paint: {
        "line-color": "#16a394",
        "line-width": 2.2,
      },
    });

    // 6. Berths & Jetties
    map.addLayer({
      id: "layer-berths-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "Berth"],
      paint: {
        "line-color": "#38bdf8",
        "line-width": 4.5,
      },
    });

    // 7. Container Stacking Blocks (C01-C12)
    map.addLayer({
      id: "layer-container-yards-fill",
      type: "fill",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "YardBlock"],
      paint: {
        "fill-color": [
          "match",
          ["get", "category"],
          "REEFER", "#0284c7",
          "HAZARDOUS_IMO", "#ef4444",
          "TRANSSHIPMENT", "#8b5cf6",
          "EXPORT", "#10b981",
          "EMPTY", "#64748b",
          "#3b82f6", // Default IMPORT
        ],
        "fill-opacity": 0.7,
      },
    });

    map.addLayer({
      id: "layer-container-yards-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "YardBlock"],
      paint: {
        "line-color": "#ffffff",
        "line-width": 1,
        "line-opacity": 0.8,
      },
    });

    // 8. Port Facilities (Gate, Towers, Workshops, Fuel Tanks)
    map.addLayer({
      id: "layer-facilities-fill",
      type: "fill",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "PortFacility"],
      paint: {
        "fill-color": "#475569",
        "fill-opacity": 0.65,
      },
    });

    map.addLayer({
      id: "layer-facilities-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "PortFacility"],
      paint: {
        "line-color": "#94a3b8",
        "line-width": 1.2,
      },
    });

    // 9. Roads & Railways
    map.addLayer({
      id: "layer-road-rail-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "InfrastructureRoute"],
      paint: {
        "line-color": "#94a3b8",
        "line-width": 2,
        "line-opacity": 0.7,
      },
    });

    // 10. Vessel Historical & Predicted Tracks
    map.addLayer({
      id: "layer-vessel-tracks-line",
      type: "line",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "VesselTrack"],
      paint: {
        "line-color": "#38bdf8",
        "line-width": 2,
        "line-opacity": 0.75,
      },
    });

    // 11. Operational Incidents / Weather Alerts
    map.addLayer({
      id: "layer-incidents-circle",
      type: "circle",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "OperationalAlert"],
      paint: {
        "circle-radius": 9,
        "circle-color": "#ef4444",
        "circle-stroke-color": "#fee2e2",
        "circle-stroke-width": 3,
        "circle-opacity": 0.9,
      },
    });

    // 12. Tactical Radar Range Rings (1, 2, 4, 8, 12 Nautical Miles from Patenga VTS Station)
    const rangeRingData = createRangeRingGeoJSON(DEFAULT_PORT_ORIGIN.lon, DEFAULT_PORT_ORIGIN.lat, [1, 2, 4, 8, 12]);
    const existingRangeSource = map.getSource("portos-range-rings") as GeoJSONSource;
    if (existingRangeSource) {
      existingRangeSource.setData(rangeRingData as any);
    } else {
      map.addSource("portos-range-rings", {
        type: "geojson",
        data: rangeRingData as any,
      });

      map.addLayer({
        id: "layer-radar-range-rings",
        type: "line",
        source: "portos-range-rings",
        layout: {
          visibility: showRadarRings ? "visible" : "none",
        },
        paint: {
          "line-color": activeBaseMap === "tactical-radar" ? "#22c55e" : "#38bdf8",
          "line-width": 1.4,
          "line-dasharray": [4, 4],
          "line-opacity": activeBaseMap === "tactical-radar" ? 0.85 : 0.45,
        },
      });
    }

    // Attach Click Handler for Feature Inspection & Selection
    map.on("click", (e) => {
      // If measuring, do not trigger feature inspection
      if (isMeasuring) {
        setMeasurePoints((prev) => [...prev, { lat: e.lngLat.lat, lon: e.lngLat.lng }]);
        return;
      }

      const bbox: [maplibregl.PointLike, maplibregl.PointLike] = [
        [e.point.x - 5, e.point.y - 5],
        [e.point.x + 5, e.point.y + 5],
      ];

      const features = map.queryRenderedFeatures(bbox, {
        layers: [
          "layer-berths-line",
          "layer-container-yards-fill",
          "layer-facilities-fill",
          "layer-anchorage-fill",
          "layer-bathymetry-fill",
          "layer-incidents-circle",
        ],
      });

      if (features.length > 0) {
        const feat = features[0];
        const props = feat.properties || {};

        setInspectedFeature({
          id: props.id || feat.id,
          name: props.name || "Port Entity",
          entityType: props.entity_type,
          dataStatus: props.data_status || "SIMULATED",
          properties: props,
          coordinates: { lat: e.lngLat.lat, lon: e.lngLat.lng },
        });

        // If entity can be linked to digital twin selection:
        if (onSelectEntity) {
          const typeMapping: Record<string, any> = {
            Vessel: "vessel",
            Berth: "berth",
            YardBlock: "yard",
            PortFacility: "facility",
          };
          const mappedType = typeMapping[props.entity_type] || "vessel";
          onSelectEntity({
            type: mappedType,
            id: props.id || String(feat.id),
            data: props,
            sourceEnvironment: "2D",
            coordinates: { lat: e.lngLat.lat, lon: e.lngLat.lng },
          });
        }
      } else {
        setInspectedFeature(null);
      }
    });

    // Cursor pointer on hoverable interactive features
    const interactiveLayers = [
      "layer-berths-line",
      "layer-container-yards-fill",
      "layer-facilities-fill",
      "layer-incidents-circle",
    ];

    interactiveLayers.forEach((layerId) => {
      map.on("mouseenter", layerId, () => {
        map.getCanvas().style.cursor = isMeasuring ? "crosshair" : "pointer";
      });
      map.on("mouseleave", layerId, () => {
        map.getCanvas().style.cursor = isMeasuring ? "crosshair" : "";
      });
    });
  }, [mapLoaded, geojsonData, isMeasuring, onSelectEntity]);

  useEffect(() => {
    renderGeoJSONLayers();
  }, [renderGeoJSONLayers]);

  // Live Continuous Fairway Vessel Animation Loop (30-60 FPS smooth motion, zero lag)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !geojsonData || !isLiveActive) return;

    let lastTick = performance.now();

    const animateFairway = (now: number) => {
      // Throttle updates to ~30 fps for smooth continuous motion
      if (now - lastTick >= 33) {
        lastTick = now;
        const elapsedSec = ((Date.now() - animStartTimeRef.current) / 1000) * simulationSpeed;

        const source = map.getSource("portos-features") as GeoJSONSource;
        if (source && geojsonData.features) {
          let updatedAny = false;
          let idx = 0;
          const vesselWakeMap = new Map<string, [number, number][]>();

          const updatedFeatures = geojsonData.features.map((feat) => {
            if (feat.properties?.entity_type === "Vessel" && feat.geometry.type === "Point") {
              const key = String(feat.id || feat.properties?.id || feat.properties?.vessel_call_id);
              const state = initialVesselStatesRef.current.get(key);
              if (!state) return feat;

              updatedAny = true;
              let nextLon = state.baseLon;
              let nextLat = state.baseLat;
              let nextHeading = feat.properties.heading_degrees || 0;

              if (state.status === "BERTHED") {
                const sway = getBerthedSway(state.baseLon, state.baseLat, elapsedSec, idx);
                nextLon = sway.lon;
                nextLat = sway.lat;
                nextHeading = sway.heading;
              } else if (state.status === "OUTER_ANCHORAGE" || state.status.includes("ANCHOR")) {
                const drift = getAnchorageTidalDrift(state.baseLon, state.baseLat, elapsedSec, idx);
                nextLon = drift.lon;
                nextLat = drift.lat;
                nextHeading = drift.heading;
              } else {
                // Moving vessel underway along Karnaphuli fairway
                const motion = getLiveVesselFairwayCoord(
                  state.baseProgress,
                  state.speedKnots,
                  elapsedSec,
                  state.isOutbound
                );
                nextLon = motion.lon;
                nextLat = motion.lat;
                nextHeading = motion.heading;

                // Dynamic trailing wake line
                const wake = getTrailingWakeCoordinates(motion.currentProgress, motion.isOutbound, 4);
                if (feat.properties?.id) vesselWakeMap.set(String(feat.properties.id), wake);
                if (feat.id) vesselWakeMap.set(String(feat.id), wake);
              }
              idx++;

              // Update HTML Vessel Tracker marker position & directional rotation
              const markerItem = vesselMarkersRef.current.get(key);
              if (markerItem) {
                markerItem.marker.setLngLat([nextLon, nextLat]);
                if (markerItem.rotatorEl) {
                  markerItem.rotatorEl.style.transform = `rotate(${nextHeading}deg)`;
                }
              }

              return {
                ...feat,
                geometry: {
                  ...feat.geometry,
                  coordinates: [nextLon, nextLat],
                },
                properties: {
                  ...feat.properties,
                  heading_degrees: nextHeading,
                  latitude: nextLat,
                  longitude: nextLon,
                },
              };
            } else if (feat.properties?.entity_type === "VesselTrack" && feat.geometry.type === "LineString") {
              // Update trailing track for moving vessels
              const callId = feat.properties?.vessel_call_id || feat.id?.toString().replace("feat_track_", "");
              const wake = vesselWakeMap.get(String(callId)) || vesselWakeMap.get(`feat_vessel_${callId}`);
              if (wake && wake.length > 1) {
                return {
                  ...feat,
                  geometry: {
                    ...feat.geometry,
                    coordinates: wake,
                  },
                };
              }
            }
            return feat;
          });

          if (updatedAny) {
            source.setData({
              ...geojsonData,
              features: updatedFeatures,
            } as any);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(animateFairway);
    };

    animFrameIdRef.current = requestAnimationFrame(animateFairway);

    return () => {
      if (animFrameIdRef.current !== null) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [mapLoaded, geojsonData, isLiveActive, simulationSpeed]);

  // Synchronize Layer Visibility Checkboxes & HTML Vessel Markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const layerMap: Record<string, string[]> = {
      base_geography: ["layer-base-geography-fill", "layer-base-geography-line"],
      bathymetry: ["layer-bathymetry-fill", "layer-bathymetry-line"],
      navigation_channels: [
        "layer-navigation-channels-line",
        "layer-navigation-corridor-fill",
        "layer-navigation-corridor-line",
      ],
      anchorage_zones: ["layer-anchorage-fill", "layer-anchorage-line"],
      terminals: ["layer-terminals-fill", "layer-terminals-line"],
      berths: ["layer-berths-line"],
      container_yards: ["layer-container-yards-fill", "layer-container-yards-line"],
      port_facilities: ["layer-facilities-fill", "layer-facilities-line"],
      road_rail_network: ["layer-road-rail-line"],
      vessels: [],
      vessel_tracks: ["layer-vessel-tracks-line"],
      incidents: ["layer-incidents-circle"],
    };

    Object.entries(layerVisibility).forEach(([key, visible]) => {
      const mapLayerIds = layerMap[key];
      if (mapLayerIds) {
        mapLayerIds.forEach((id) => {
          if (map.getLayer(id)) {
            map.setLayoutProperty(id, "visibility", visible ? "visible" : "none");
          }
        });
      }
    });

    // Toggle HTML Vessel Trackers
    vesselMarkersRef.current.forEach((item) => {
      item.marker.getElement().style.display = layerVisibility.vessels ? "block" : "none";
    });
  }, [layerVisibility, mapLoaded]);

  // Synchronize High-Fidelity Directional Vessel Trackers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !geojsonData) return;

    const vesselFeatures = geojsonData.features.filter(
      (f) => f.properties?.entity_type === "Vessel" && f.geometry?.type === "Point"
    );

    const currentKeys = new Set<string>();

    vesselFeatures.forEach((feat) => {
      const coords = feat.geometry.coordinates as [number, number];
      const props = feat.properties || {};
      const key = String(feat.id || props.id || props.vessel_call_id);
      currentKeys.add(key);

      const isSelected = Boolean(
        selectedEntity?.id && (
          selectedEntity.id === key ||
          (props.id && selectedEntity.id === props.id) ||
          (props.id && selectedEntity.id === `feat_vessel_${props.id}`) ||
          `feat_vessel_${selectedEntity.id}` === key ||
          ((selectedEntity.data as any)?.id && props.id && (selectedEntity.data as any)?.id === props.id) ||
          ((selectedEntity.data as any)?.id && (selectedEntity.data as any)?.id === key)
        )
      );

      if (vesselMarkersRef.current.has(key)) {
        const item = vesselMarkersRef.current.get(key)!;
        item.marker.setLngLat(coords);
        if (item.reticleEl) {
          item.reticleEl.style.display = isSelected ? "block" : "none";
        }
        item.marker.getElement().style.display = layerVisibility.vessels ? "block" : "none";
      } else {
        const markerEl = createVesselTrackerElement({
          vesselProps: {
            id: String(props.id || feat.id),
            name: props.vessel_name || props.name || "Vessel",
            status: props.status || "EN_ROUTE",
            speedKnots: Number(props.speed_knots) || (props.status === "BERTHED" ? 0 : 8.5),
            headingDegrees: Number(props.heading_degrees) || 45,
            delayRisk: props.delay_risk,
            draftM: props.draft_m,
            loaM: props.length_overall_m,
            callSign: props.id || props.vessel_call_id,
            imoNumber: props.imo_number,
            berthAssigned: props.berth_assigned,
            dataStatus: props.data_status,
          },
          isSelected,
          onSelect: () => {
            setInspectedFeature({
              id: props.id || feat.id,
              name: props.vessel_name || props.name || "Vessel",
              entityType: "Vessel",
              dataStatus: props.data_status || "SIMULATED",
              properties: props,
              coordinates: { lat: coords[1], lon: coords[0] },
            });
            if (onSelectEntity) {
              onSelectEntity({
                type: "vessel",
                id: props.id || String(feat.id),
                data: props,
                sourceEnvironment: "2D",
                coordinates: { lat: coords[1], lon: coords[0] },
              });
            }
          },
        });

        markerEl.style.display = layerVisibility.vessels ? "block" : "none";

        const marker = new maplibregl.Marker({
          element: markerEl,
          anchor: "center",
        })
          .setLngLat(coords)
          .addTo(map);

        vesselMarkersRef.current.set(key, {
          marker,
          el: markerEl,
          rotatorEl: markerEl.querySelector(".tracker-symbol-rotator"),
          reticleEl: markerEl.querySelector(".tracker-reticle"),
          labelEl: markerEl.querySelector(".tracker-label"),
        });
      }
    });

    // Remove any stale markers
    vesselMarkersRef.current.forEach((item, key) => {
      if (!currentKeys.has(key)) {
        item.marker.remove();
        vesselMarkersRef.current.delete(key);
      }
    });
  }, [mapLoaded, geojsonData, layerVisibility.vessels, onSelectEntity, selectedEntity]);

  // Synchronize Selected Entity focus and target highlight reticle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    vesselMarkersRef.current.forEach((item, key) => {
      const isSelected = Boolean(
        selectedEntity?.id && (
          selectedEntity.id === key ||
          selectedEntity.id === key.replace(/^feat_vessel_/, "") ||
          `feat_vessel_${selectedEntity.id}` === key ||
          ((selectedEntity.data as any)?.id && (selectedEntity.data as any)?.id === key) ||
          ((selectedEntity.data as any)?.id && (selectedEntity.data as any)?.id === key.replace(/^feat_vessel_/, ""))
        )
      );

      if (item.reticleEl) {
        item.reticleEl.style.display = isSelected ? "block" : "none";
      }
      if (item.labelEl) {
        if (isSelected) {
          item.labelEl.className =
            "tracker-label mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans tracking-tight whitespace-nowrap shadow-lg flex items-center gap-1.5 bg-sky-600 text-white border-2 border-white ring-2 ring-sky-400";
        } else {
          item.labelEl.className =
            "tracker-label mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold font-sans tracking-tight whitespace-nowrap shadow-md flex items-center gap-1.5 bg-slate-900/90 text-slate-100 border border-slate-700/80 group-hover:border-slate-500";
        }
      }
    });

    if (!selectedEntity) return;

    const entityId = selectedEntity.id;

    // Resolve coordinates if explicitly attached or find matching feature in GeoJSON
    let lat = selectedEntity.coordinates?.lat || (selectedEntity.data as any)?.latitude;
    let lon = selectedEntity.coordinates?.lon || (selectedEntity.data as any)?.longitude;

    if ((!lat || !lon) && geojsonData?.features) {
      const match = geojsonData.features.find(
        (f) =>
          f.id === entityId ||
          f.id === `feat_vessel_${entityId}` ||
          f.properties?.id === entityId ||
          f.properties?.vessel_call_id === entityId ||
          f.properties?.vessel_id === entityId ||
          (selectedEntity.data as any)?.vessel?.name &&
            f.properties?.vessel_name?.toLowerCase() === (selectedEntity.data as any)?.vessel?.name?.toLowerCase()
      );
      if (match?.geometry && match.geometry.type === "Point") {
        lon = match.geometry.coordinates[0];
        lat = match.geometry.coordinates[1];
      }
    }

    if (lat && lon && selectedEntity.sourceEnvironment !== "2D") {
      map.flyTo({
        center: [lon, lat],
        zoom: Math.max(map.getZoom(), 13.8),
        speed: 1.2,
        curve: 1.4,
      });
    }
  }, [selectedEntity, mapLoaded, geojsonData]);

  // Synchronize Radar Range Rings visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getLayer("layer-radar-range-rings")) {
      map.setLayoutProperty(
        "layer-radar-range-rings",
        "visibility",
        showRadarRings ? "visible" : "none"
      );
    }
  }, [showRadarRings, mapLoaded]);

  // Measure calculation logic
  const calculateTotalMeasurement = () => {
    if (measurePoints.length < 2) return null;
    let totalMeters = 0;
    for (let i = 0; i < measurePoints.length - 1; i++) {
      totalMeters += calculateDistanceMeters(
        measurePoints[i].lat,
        measurePoints[i].lon,
        measurePoints[i + 1].lat,
        measurePoints[i + 1].lon
      );
    }
    const nauticalMiles = totalMeters / 1852.0;
    const initialBearing = calculateBearingDegrees(
      measurePoints[0].lat,
      measurePoints[0].lon,
      measurePoints[1].lat,
      measurePoints[1].lon
    );

    return {
      totalMeters: Math.round(totalMeters),
      nauticalMiles: Number(nauticalMiles.toFixed(2)),
      initialBearing: Math.round(initialBearing),
    };
  };

  const measurementResult = calculateTotalMeasurement();

  const toggleLayer = (layerId: string) => {
    setLayerVisibility((prev) => ({
      ...prev,
      [layerId]: !prev[layerId],
    }));
  };

  const fitToRoute = () => {
    mapRef.current?.fitBounds(
      [
        [91.68, 22.12],
        [91.86, 22.34],
      ],
      { padding: 40, duration: 1200 }
    );
  };

  const resetToPortExtent = () => {
    mapRef.current?.flyTo({
      center: [DEFAULT_PORT_ORIGIN.lon, DEFAULT_PORT_ORIGIN.lat],
      zoom: 12.2,
      bearing: 0,
      pitch: 0,
      speed: 1.2,
    });
  };

  const focusPatengaPCT = () => {
    mapRef.current?.flyTo({
      center: [PCT_TERMINAL_ORIGIN.lon, PCT_TERMINAL_ORIGIN.lat],
      zoom: 15.2,
      bearing: 0,
      pitch: 0,
      speed: 1.4,
    });
  };

  const clearMeasurements = () => {
    setMeasurePoints([]);
    setIsMeasuring(false);
  };

  return (
    <div className={`relative flex flex-col w-full ${height} ${className} bg-slate-950 text-slate-100 rounded-lg overflow-hidden border border-portos-border shadow-md select-none`}>
      {/* 1. TOP MARITIME GIS WORKSPACE TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-portos-navy border-b border-portos-navy-secondary text-xs z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-portos-teal animate-spin-slow" />
            <span className="font-bold tracking-tight text-white uppercase text-[11px]">
              Chattogram Maritime GIS Fairway
            </span>
            <DataStatusBadge status="OBSERVED" size="sm" />
          </div>

          {/* Quick Extent Jump Buttons */}
          <div className="hidden sm:flex items-center gap-1 bg-portos-navy-secondary/60 p-0.5 rounded border border-portos-navy-secondary text-[10px]">
            <button
              onClick={fitToRoute}
              className="px-2 py-0.5 rounded hover:bg-portos-navy hover:text-white transition-colors text-slate-300"
              title="Fit to complete fairway navigation route"
            >
              Fit to Route
            </button>
            <button
              onClick={resetToPortExtent}
              className="px-2 py-0.5 rounded hover:bg-portos-navy hover:text-white transition-colors text-slate-300"
              title="Reset to port default extent"
            >
              Reset
            </button>
            <button
              onClick={focusPatengaPCT}
              className="px-2 py-0.5 rounded hover:bg-portos-navy hover:text-white transition-colors text-slate-300"
              title="Focus Patenga Container Terminal (PCT)"
            >
              PCT Patenga
            </button>
          </div>

          {/* Live Vessel Traffic Pulsing Status Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-700/60 text-[10px] font-mono text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE FAIRWAY TRAFFIC · {initialVesselStatesRef.current.size || 12} VESSELS</span>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1.5">
          {/* Live Motion Toggle */}
          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              isLiveActive
                ? "bg-emerald-950/60 text-emerald-300 border-emerald-700 hover:bg-emerald-900/60"
                : "bg-portos-navy-secondary/40 text-slate-300 border-portos-navy-secondary hover:text-white"
            }`}
            title="Toggle live fairway vessel traffic motion"
          >
            <Navigation className={`h-3 w-3 ${isLiveActive ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
            <span>{isLiveActive ? "Motion: Live" : "Motion: Paused"}</span>
          </button>

          {/* Base Map Selector Button */}
          <button
            onClick={() => setShowBaseMapModal(!showBaseMapModal)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              showBaseMapModal
                ? "bg-portos-teal text-white border-portos-teal"
                : "bg-portos-navy-secondary/40 text-slate-200 border-portos-navy-secondary hover:text-white"
            }`}
          >
            <Layers className="h-3 w-3 text-portos-teal" />
            <span>Theme: {BASEMAP_STYLES[activeBaseMap].name}</span>
          </button>

          {/* Corridor Radar Range Rings Toggle */}
          <button
            onClick={() => setShowRadarRings(!showRadarRings)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              showRadarRings
                ? "bg-emerald-950/70 text-emerald-300 border-emerald-600/70 shadow-2xs"
                : "bg-portos-navy-secondary/40 text-slate-300 border-portos-navy-secondary hover:text-white"
            }`}
            title="Toggle 1-12 NM Corridor Radar Range Rings"
          >
            <Radio className={`h-3 w-3 ${showRadarRings ? "text-emerald-400 animate-pulse" : "text-slate-400"}`} />
            <span>Range Rings: {showRadarRings ? "1-12 NM" : "Off"}</span>
          </button>

          {/* Measurement Tool Toggle */}
          <button
            onClick={() => {
              setIsMeasuring(!isMeasuring);
              if (isMeasuring) setMeasurePoints([]);
            }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              isMeasuring
                ? "bg-portos-amber text-portos-navy border-portos-amber font-semibold"
                : "bg-portos-navy-secondary/40 text-slate-200 border-portos-navy-secondary hover:text-white"
            }`}
            title="Measure distance and bearing along channel"
          >
            <Ruler className="h-3 w-3" />
            <span>{isMeasuring ? "Measuring..." : "Measure"}</span>
          </button>

          {/* Activate GetInfo Tool */}
          <button
            onClick={() => setIsGetInfoActive(!isGetInfoActive)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              isGetInfoActive
                ? "bg-portos-teal text-white border-portos-teal font-semibold"
                : "bg-portos-navy-secondary/40 text-slate-200 border-portos-navy-secondary hover:text-white"
            }`}
            title="Inspect attributes of any clicked spatial feature"
          >
            <Info className="h-3 w-3" />
            <span>Inspect</span>
          </button>

          {/* Cartographic Legend Toggle */}
          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded border text-[11px] font-medium transition-colors ${
              showLegend
                ? "bg-portos-teal text-white border-portos-teal font-semibold"
                : "bg-portos-navy-secondary/40 text-slate-200 border-portos-navy-secondary hover:text-white"
            }`}
            title="Toggle cartographic map legend"
            aria-label="Toggle map legend"
          >
            <Compass className="h-3 w-3" />
            <span>Legend</span>
          </button>

          {/* Overlays Drawer Toggle */}
          <button
            onClick={() => setShowOverlaysPanel(!showOverlaysPanel)}
            className={`p-1.5 rounded border text-[11px] transition-colors ${
              showOverlaysPanel
                ? "bg-portos-teal text-white border-portos-teal"
                : "bg-portos-navy-secondary/40 text-slate-200 border-portos-navy-secondary hover:text-white"
            }`}
            title="Toggle spatial overlays manager"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. BASE MAP SELECTOR MODAL / DROPDOWN */}
      {showBaseMapModal && (
        <div className="absolute top-11 right-3 z-30 w-72 bg-portos-navy/95 backdrop-blur-md border border-portos-navy-secondary rounded-lg shadow-xl p-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-portos-navy-secondary mb-2">
            <span className="font-semibold text-white">Cartographic Base Map</span>
            <button
              onClick={() => setShowBaseMapModal(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="space-y-1.5">
            {(Object.keys(BASEMAP_STYLES) as BaseMapStyle[]).map((key) => {
              const item = BASEMAP_STYLES[key];
              const isSelected = activeBaseMap === key;
              return (
                <button
                  key={key}
                  onClick={() => {
                    setActiveBaseMap(key);
                    setShowBaseMapModal(false);
                  }}
                  className={`w-full text-left p-2 rounded border transition-colors ${
                    isSelected
                      ? "bg-portos-teal/20 border-portos-teal text-white"
                      : "bg-portos-navy/40 border-slate-800 text-slate-300 hover:bg-portos-navy-secondary/50"
                  }`}
                >
                  <div className="font-medium text-[11px] flex items-center justify-between">
                    <span>{item.name}</span>
                    {isSelected && <span className="text-portos-teal text-[10px]">Active</span>}
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                    {item.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MEASUREMENT FLOATING HUD */}
      {isMeasuring && (
        <div className="absolute top-12 left-3 z-30 bg-portos-navy/95 backdrop-blur-md border border-portos-amber/50 rounded-lg shadow-xl p-3 text-xs w-72">
          <div className="flex items-center justify-between pb-1.5 border-b border-portos-navy-secondary mb-2">
            <div className="flex items-center gap-1.5 text-portos-amber font-semibold text-[11px]">
              <Ruler className="h-3.5 w-3.5" />
              <span>Hydrographic Fairway Measure</span>
            </div>
            <button
              onClick={clearMeasurements}
              className="text-slate-400 hover:text-white text-[10px]"
            >
              Clear
            </button>
          </div>

          <p className="text-[10px] text-slate-300 mb-2">
            Click points along the Karnaphuli channel or fairway route.
          </p>

          <div className="space-y-1 text-[11px] font-mono bg-slate-900/80 p-2 rounded border border-slate-800">
            <div className="flex justify-between">
              <span className="text-slate-400">Waypoints:</span>
              <span className="text-white font-bold">{measurePoints.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance (Meters):</span>
              <span className="text-portos-teal font-bold">
                {measurementResult ? `${measurementResult.totalMeters.toLocaleString()} m` : "--"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Distance (Nautical):</span>
              <span className="text-portos-teal font-bold">
                {measurementResult ? `${measurementResult.nauticalMiles} NM` : "--"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Initial Bearing:</span>
              <span className="text-portos-amber font-bold">
                {measurementResult ? `${measurementResult.initialBearing}°` : "--"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. MAPLIBRE CANVAS CONTAINER */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <div ref={mapContainerRef} className="w-full h-full cursor-crosshair" />

        {/* 5. FLOATING OVERLAYS MANAGER DRAWER (Matching Image 4) */}
        {showOverlaysPanel && (
          <div className="absolute top-3 left-3 z-20 w-64 max-h-[85%] bg-portos-navy/95 backdrop-blur-md border border-portos-navy-secondary rounded-lg shadow-2xl flex flex-col text-xs overflow-hidden">
            <div className="flex items-center justify-between p-2.5 border-b border-portos-navy-secondary bg-portos-navy">
              <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase tracking-wider">
                <Layers className="h-3.5 w-3.5 text-portos-teal" />
                <span>Maritime Overlays</span>
              </div>
              <button
                onClick={() => setShowOverlaysPanel(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-2 space-y-1.5 overflow-y-auto max-h-[460px]">
              {spatialLayers.map((layer) => {
                const isChecked = layerVisibility[layer.layer_id] !== false;
                return (
                  <label
                    key={layer.layer_id}
                    className="flex items-start gap-2 p-1.5 rounded hover:bg-portos-navy-secondary/40 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleLayer(layer.layer_id)}
                      className="mt-0.5 rounded border-slate-700 bg-slate-900 text-portos-teal focus:ring-0 cursor-pointer"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] font-medium text-slate-200">
                        <span className="truncate">{layer.name}</span>
                        <span className="text-[9px] font-mono text-slate-400 px-1 rounded bg-slate-800">
                          {layer.feature_count}
                        </span>
                      </div>
                      <div className="text-[9px] text-slate-400 truncate">
                        {layer.description}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Quick All / None actions */}
            <div className="p-2 border-t border-portos-navy-secondary bg-portos-navy flex justify-between text-[10px] text-slate-400">
              <button
                onClick={() => {
                  const allTrue: Record<string, boolean> = {};
                  spatialLayers.forEach((l) => (allTrue[l.layer_id] = true));
                  setLayerVisibility(allTrue);
                }}
                className="hover:text-portos-teal"
              >
                Enable All
              </button>
              <button
                onClick={() => {
                  const allFalse: Record<string, boolean> = {};
                  spatialLayers.forEach((l) => (allFalse[l.layer_id] = false));
                  setLayerVisibility(allFalse);
                }}
                className="hover:text-portos-amber"
              >
                Disable All
              </button>
            </div>
          </div>
        )}

        {/* 6. MARITIME CARTOGRAPHIC LEGEND */}
        <MaritimeMapLegend
          isOpen={showLegend}
          onClose={() => setShowLegend(false)}
        />

        {/* 7. FEATURE INSPECTOR CARD (When feature is clicked) */}
        {inspectedFeature && (
          <div className="absolute bottom-10 right-3 z-20 w-80 bg-portos-navy/95 backdrop-blur-md border border-portos-teal/50 rounded-lg shadow-2xl p-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-portos-navy-secondary mb-2">
              <div className="flex items-center gap-1.5">
                <Ship className="h-4 w-4 text-portos-teal" />
                <span className="font-bold text-white text-[12px] truncate">
                  {inspectedFeature.name}
                </span>
              </div>
              <button
                onClick={() => setInspectedFeature(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Entity Category:</span>
                <span className="font-medium text-slate-200">
                  {inspectedFeature.entityType}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Data Status:</span>
                <DataStatusBadge status={inspectedFeature.dataStatus} size="sm" />
              </div>
              {inspectedFeature.coordinates && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Coordinates:</span>
                  <span className="font-mono text-portos-teal text-[10px]">
                    {formatCoordinatesDMM(
                      inspectedFeature.coordinates.lat,
                      inspectedFeature.coordinates.lon
                    )}
                  </span>
                </div>
              )}

              {/* Extra Properties */}
              {inspectedFeature.properties.draft_m && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vessel Draft:</span>
                  <span className="font-mono text-white">
                    {inspectedFeature.properties.draft_m} m
                  </span>
                </div>
              )}
              {inspectedFeature.properties.speed_knots !== undefined && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Speed Over Ground:</span>
                  <span className="font-mono text-white">
                    {inspectedFeature.properties.speed_knots} kts
                  </span>
                </div>
              )}
              {inspectedFeature.properties.assigned_berth && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Assigned Berth:</span>
                  <span className="font-semibold text-portos-amber">
                    {inspectedFeature.properties.assigned_berth}
                  </span>
                </div>
              )}
            </div>

            {/* Focus in 3D Digital Twin Button */}
            {onOpen3DView && (
              <button
                onClick={() => onOpen3DView(inspectedFeature.id)}
                className="mt-3 w-full py-1.5 px-2 bg-portos-teal text-white rounded font-medium text-[11px] flex items-center justify-center gap-1.5 hover:bg-portos-teal/90 transition-colors shadow-sm"
              >
                <ExternalLink className="h-3 w-3" />
                <span>Open in 3D Terminal Twin</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 7. BOTTOM MARITIME STATUS & RATIO SCALE BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-1.5 bg-portos-navy border-t border-portos-navy-secondary text-[11px] font-mono text-slate-300 z-10">
        {/* Left: Dynamic Live Coordinates */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px]">Cursor:</span>
          <span className="text-portos-teal font-medium">
            {cursorCoords
              ? formatCoordinatesDMM(cursorCoords.lat, cursorCoords.lon)
              : "22°17.10'N, 91°48.12'E"}
          </span>
        </div>

        {/* Center: Dynamic Cartographic Scale Bar */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase text-[10px]">Scale:</span>
          <span className="text-slate-200">
            {zoomLevel >= 15 ? "1 : 10,000" : zoomLevel >= 13 ? "1 : 25,000" : "1 : 50,000"}
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500 uppercase text-[10px]">Zoom:</span>
          <span className="text-portos-teal font-bold">{zoomLevel}x</span>
        </div>

        {/* Right: Operational Environment Badge */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-portos-teal animate-pulse" />
          <span className="text-slate-400">
            MapLibre GL | PORTOS Maritime Spatial Model · Karnaphuli Fairway (CD +0.0m) · SIMULATED
          </span>
        </div>
      </div>
    </div>
  );
}

