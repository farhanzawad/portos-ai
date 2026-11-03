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
import { SelectedEntity } from "../digital-twin/types";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { MaritimeMapLegend } from "./MaritimeMapLegend";

interface GeospatialPortMapProps {
  selectedEntity?: SelectedEntity | null;
  onSelectEntity?: (entity: SelectedEntity) => void;
  isSimulating?: boolean;
  simulationSpeed?: 1 | 2 | 5;
  onOpen3DView?: (entityId?: string) => void;
  className?: string;
  height?: string;
}

type BaseMapStyle = "nautical-dark" | "maritime-standard" | "topographic" | "offline-vector";

interface MeasurementPoint {
  lat: number;
  lon: number;
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
    name: "Nautical Dark",
    url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
    description: "High-contrast dark hydrographic theme for bridge night-watch and monitoring",
  },
  "maritime-standard": {
    name: "Maritime Standard",
    url: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
    description: "Crisp neutral GIS cartography matching Port Authority hydrographic charts",
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
  const [showOverlaysPanel, setShowOverlaysPanel] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [showBaseMapModal, setShowBaseMapModal] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(12.5);

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
      bearing: 0,
      pitch: 0,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");

    map.on("load", () => {
      setMapLoaded(true);
      mapRef.current = map;
    });

    map.on("mousemove", (e) => {
      setCursorCoords({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });

    map.on("zoom", () => {
      setZoomLevel(Number(map.getZoom().toFixed(1)));
    });

    return () => {
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

    // 11. Vessels (AIS Directional Points)
    map.addLayer({
      id: "layer-vessels-circle",
      type: "circle",
      source: "portos-features",
      filter: ["==", ["get", "entity_type"], "Vessel"],
      paint: {
        "circle-radius": 7,
        "circle-color": [
          "match",
          ["get", "status"],
          "BERTHED", "#16a394",
          "EN_ROUTE", "#38bdf8",
          "OUTER_ANCHORAGE", "#f59e0b",
          "#64748b",
        ],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });

    // 12. Operational Incidents / Weather Alerts
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
          "layer-vessels-circle",
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
      "layer-vessels-circle",
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

  // Synchronize Layer Visibility Checkboxes
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
      vessels: ["layer-vessels-circle"],
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
  }, [layerVisibility, mapLoaded]);

  // Synchronize Selected Entity focus from 3D scene
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !selectedEntity) return;

    // If coordinates are explicitly attached or available in data
    const lat = selectedEntity.coordinates?.lat || (selectedEntity.data as any)?.latitude;
    const lon = selectedEntity.coordinates?.lon || (selectedEntity.data as any)?.longitude;

    if (lat && lon && selectedEntity.sourceEnvironment !== "2D") {
      map.flyTo({
        center: [lon, lat],
        zoom: Math.max(map.getZoom(), 14.5),
        speed: 1.2,
        curve: 1.4,
      });
    }
  }, [selectedEntity, mapLoaded]);

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
              onClick={resetToPortExtent}
              className="px-2 py-0.5 rounded hover:bg-portos-navy hover:text-white transition-colors text-slate-300"
              title="Fit Karnaphuli regional port extent"
            >
              Port Extent
            </button>
            <button
              onClick={focusPatengaPCT}
              className="px-2 py-0.5 rounded hover:bg-portos-navy hover:text-white transition-colors text-slate-300"
              title="Focus Patenga Container Terminal (PCT)"
            >
              PCT Patenga
            </button>
          </div>
        </div>

        {/* Right Toolbar Controls */}
        <div className="flex items-center gap-1.5">
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
            <span>Base: {BASEMAP_STYLES[activeBaseMap].name}</span>
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
          <span className="text-slate-400">Karnaphuli Channel Datum: CD +0.00m</span>
        </div>
      </div>
    </div>
  );
}

