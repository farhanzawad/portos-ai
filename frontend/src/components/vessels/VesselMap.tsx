"use client";

import React, { useEffect, useRef, useState } from "react";
import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { VesselCallRead, VesselTrackResponse } from "@/types/api";
import { MapLayerState } from "./types";
import {
  Compass,
  Maximize2,
  RotateCcw,
  Layers,
  Radio,
  Anchor,
  Navigation,
  Eye,
  Crosshair,
} from "lucide-react";

interface VesselMapProps {
  calls: VesselCallRead[];
  selectedCall: VesselCallRead | null;
  trackData?: VesselTrackResponse;
  onSelectCall: (call: VesselCallRead) => void;
}

// Tactical Dark Maritime Nautical Base Chart
const defaultMapStyle: maplibregl.StyleSpecification = {
  version: 8,
  name: "PORTOS Nautical Dark Chart",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#07131e" }, // Deep oceanic blue-black
    },
  ],
};

export function VesselMap({
  calls,
  selectedCall,
  trackData,
  onSelectCall,
}: VesselMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const [cursorCoords, setCursorCoords] = useState<string>("22°14.80'N, 91°46.50'E");

  const [layers, setLayers] = useState<MapLayerState>({
    anchorageZones: true,
    fairwayChannel: true,
    historicalTrack: true,
    predictedRoute: true,
  });

  // Initialize Tactical Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: defaultMapStyle,
      center: [91.77, 22.24], // Karnaphuli River approach center
      zoom: 11.2,
      minZoom: 8.5,
      maxZoom: 16.5,
      pitch: 20, // Subtle tactical pitch for depth perception
      attributionControl: false,
    });

    map.on("mousemove", (e) => {
      const lat = e.lngLat.lat.toFixed(3);
      const lng = e.lngLat.lng.toFixed(3);
      setCursorCoords(`${lat}°N, ${lng}°E`);
    });

    map.on("load", () => {
      // 1. Bathymetric Shallow Water Flats (<5m depth contour)
      map.addSource("shoal-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { depth: "<5m Shoal Bank" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [91.73, 22.18],
                    [91.77, 22.19],
                    [91.79, 22.23],
                    [91.80, 22.21],
                    [91.76, 22.16],
                    [91.73, 22.18],
                  ],
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "shoal-fill",
        type: "fill",
        source: "shoal-source",
        paint: {
          "fill-color": "#0d2b3a",
          "fill-opacity": 0.55,
        },
      });

      // 2. Chattogram Mainland Landmass
      map.addSource("landmass-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Chattogram Mainland" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [91.78, 22.10],
                    [91.90, 22.10],
                    [91.90, 22.40],
                    [91.82, 22.40],
                    [91.815, 22.31],
                    [91.80, 22.26],
                    [91.78, 22.22],
                    [91.78, 22.10],
                  ],
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "landmass-fill",
        type: "fill",
        source: "landmass-source",
        paint: {
          "fill-color": "#111c29",
          "fill-opacity": 0.95,
        },
      });

      map.addLayer({
        id: "landmass-stroke",
        type: "line",
        source: "landmass-source",
        paint: {
          "line-color": "#2a3f55",
          "line-width": 1.5,
        },
      });

      // 3. Karnaphuli Navigational Fairway Channel (Dredged Deep Corridor)
      map.addSource("fairway-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Karnaphuli Dredged Channel Corridor" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [91.688, 22.112],
                    [91.728, 22.16],
                    [91.775, 22.205],
                    [91.798, 22.25],
                    [91.812, 22.285],
                    [91.821, 22.312],
                    [91.828, 22.325],
                    [91.822, 22.326],
                    [91.815, 22.314],
                    [91.806, 22.288],
                    [91.792, 22.253],
                    [91.768, 22.208],
                    [91.722, 22.163],
                    [91.682, 22.115],
                    [91.688, 22.112],
                  ],
                ],
              },
            },
            {
              type: "Feature",
              properties: { name: "Channel Center-Line Transit" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [91.685, 22.114],
                  [91.725, 22.162],
                  [91.772, 22.207],
                  [91.795, 22.252],
                  [91.809, 22.287],
                  [91.818, 22.313],
                  [91.825, 22.325],
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "fairway-corridor-fill",
        type: "fill",
        source: "fairway-source",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": "#0d3b4c",
          "fill-opacity": 0.28,
        },
      });

      map.addLayer({
        id: "fairway-corridor-border",
        type: "line",
        source: "fairway-source",
        filter: ["==", "$type", "Polygon"],
        paint: {
          "line-color": "#14b8a6",
          "line-width": 1.2,
          "line-dasharray": [4, 3],
          "line-opacity": 0.8,
        },
      });

      map.addLayer({
        id: "fairway-centerline",
        type: "line",
        source: "fairway-source",
        filter: ["==", "$type", "LineString"],
        paint: {
          "line-color": "#2dd4bf",
          "line-width": 1.8,
          "line-dasharray": [6, 4],
          "line-opacity": 0.9,
        },
      });

      // 4. Chattogram Outer Anchorage Sectors (A, B, C)
      map.addSource("anchorage-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Anchorage A (Deep Draught > 10m)" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [91.66, 22.09],
                    [91.72, 22.09],
                    [91.72, 22.135],
                    [91.66, 22.135],
                    [91.66, 22.09],
                  ],
                ],
              },
            },
            {
              type: "Feature",
              properties: { name: "Anchorage B (Awaiting Berth & Cargo Ops)" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [91.70, 22.14],
                    [91.755, 22.14],
                    [91.755, 22.18],
                    [91.70, 22.18],
                    [91.70, 22.14],
                  ],
                ],
              },
            },
            {
              type: "Feature",
              properties: { name: "Anchorage C (Lighterage & Shifting)" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [91.735, 22.185],
                    [91.78, 22.185],
                    [91.78, 22.215],
                    [91.735, 22.215],
                    [91.735, 22.185],
                  ],
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "anchorage-fill",
        type: "fill",
        source: "anchorage-source",
        paint: {
          "fill-color": "#f59e0b",
          "fill-opacity": 0.08,
        },
      });

      map.addLayer({
        id: "anchorage-stroke",
        type: "line",
        source: "anchorage-source",
        paint: {
          "line-color": "#f59e0b",
          "line-width": 1.4,
          "line-dasharray": [4, 2],
        },
      });

      // 5. CCT / NCT Container Quayside Berth Edge
      map.addSource("berths-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "CCT / NCT Container Quayside" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [91.821, 22.312],
                  [91.828, 22.326],
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "berths-line",
        type: "line",
        source: "berths-source",
        paint: {
          "line-color": "#16a394",
          "line-width": 4.5,
        },
      });

      // 6. Patenga Sector Light Beacon Arc (Chattogram Fairway entrance beacon)
      map.addSource("beacon-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Patenga Lighthouse Sector Light" },
              geometry: {
                type: "Point",
                coordinates: [91.798, 22.235],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "beacon-point",
        type: "circle",
        source: "beacon-source",
        paint: {
          "circle-radius": 6,
          "circle-color": "#38bdf8",
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Professional AIS Directional Vessel Locators
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    calls.forEach((call, idx) => {
      // Deterministic coordinates and maritime heading based on vessel status
      let lat = 22.14 + (idx % 4) * 0.02;
      let lon = 91.71 + (idx % 3) * 0.025;
      let headingDeg = 45; // Default channel approach heading (NE)
      let sogKnots = 10.5;

      if (call.status === "BERTHED") {
        lat = 22.314 + (idx % 3) * 0.004;
        lon = 91.822 + (idx % 3) * 0.003;
        headingDeg = 28; // Aligned with CCT quay orientation
        sogKnots = 0.0;
      } else if (call.status === "PILOT_BOARDING") {
        lat = 22.21 + (idx % 2) * 0.01;
        lon = 91.78 + (idx % 2) * 0.01;
        headingDeg = 42;
        sogKnots = 6.2;
      } else {
        // At anchorage
        headingDeg = (idx * 65) % 360;
        sogKnots = 0.4;
      }

      const isSelected = selectedCall?.id === call.id;
      const isHighRisk = call.delay_risk_status === "HIGH_RISK";

      // AIS Marker Color Scheme
      const markerColor = isSelected
        ? "#16a394"
        : isHighRisk
        ? "#ef4444"
        : call.status === "BERTHED"
        ? "#0284c7"
        : "#38bdf8";

      // Custom IMO-Standard Directional AIS Ship Chevron Marker
      const el = document.createElement("div");
      el.className = "cursor-pointer group flex flex-col items-center select-none";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${
            isSelected
              ? `<div class="absolute -inset-3 rounded-full bg-portos-teal/20 animate-ping"></div>
                 <div class="absolute -inset-2 rounded-full border border-portos-teal/60 animate-pulse"></div>`
              : isHighRisk
              ? `<div class="absolute -inset-2.5 rounded-full bg-rose-500/20 animate-ping"></div>`
              : ""
          }

          <!-- Tactical Vessel Heading Chevron -->
          <div style="transform: rotate(${headingDeg}deg);" class="transition-transform duration-300">
            <svg width="22" height="26" viewBox="0 0 22 26" fill="none" class="drop-shadow-md">
              <!-- Ship Hull Silhouette -->
              <path d="M11 1L20 9V24L11 22L2 24V9L11 1Z" fill="${markerColor}" stroke="#ffffff" stroke-width="1.4" />
              <!-- Centerline Vector -->
              <line x1="11" y1="5" x2="11" y2="19" stroke="#ffffff" stroke-width="1.2" stroke-dasharray="2 1" opacity="0.8" />
            </svg>
          </div>
        </div>

        <!-- Vessel Call Sign / Name Tag -->
        <div class="mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap border shadow-sm transition-all group-hover:scale-105 ${
          isSelected
            ? "bg-portos-teal text-white border-white ring-1 ring-portos-teal shadow-md"
            : isHighRisk
            ? "bg-rose-950 text-rose-200 border-rose-600 shadow-sm"
            : "bg-slate-900/90 text-slate-200 border-slate-700 backdrop-blur-xs"
        }">
          ${call.vessel?.name || call.call_number}
        </div>
      `;

      el.addEventListener("click", () => {
        onSelectCall(call);
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lon, lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [calls, selectedCall, onSelectCall]);

  // Update Dynamic Track Line Source when trackData updates
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const trackCoordinates =
      trackData?.positions?.map((p) => [p.longitude, p.latitude]) || [];

    if (map.getSource("vessel-track-source")) {
      const source = map.getSource(
        "vessel-track-source"
      ) as maplibregl.GeoJSONSource;
      source.setData({
        type: "FeatureCollection",
        features:
          trackCoordinates.length > 0
            ? [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "LineString",
                    coordinates: trackCoordinates,
                  },
                },
              ]
            : [],
      });
    } else if (trackCoordinates.length > 0) {
      map.addSource("vessel-track-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: trackCoordinates,
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "vessel-track-line",
        type: "line",
        source: "vessel-track-source",
        paint: {
          "line-color": "#2dd4bf",
          "line-width": 3.2,
          "line-opacity": 0.9,
        },
      });
    }
  }, [trackData]);

  // Camera presets
  const handleFitRoute = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (trackData?.positions && trackData.positions.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      trackData.positions.forEach((p) =>
        bounds.extend([p.longitude, p.latitude])
      );
      map.fitBounds(bounds, { padding: 80, duration: 800 });
    } else {
      map.flyTo({ center: [91.77, 22.24], zoom: 11.2, duration: 600 });
    }
  };

  const handleFocusAnchorage = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({ center: [91.72, 22.14], zoom: 12.2, pitch: 25, duration: 800 });
  };

  const handleFocusQuay = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({ center: [91.824, 22.318], zoom: 13.8, pitch: 30, duration: 800 });
  };

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({ center: [91.77, 22.24], zoom: 11.2, pitch: 20, bearing: 0, duration: 600 });
  };

  return (
    <div className="relative w-full h-full min-h-[590px] bg-slate-950 rounded-lg border border-portos-border shadow-md overflow-hidden select-none">
      {/* MapLibre DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Map Controls Toolbar */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-portos-navy/90 backdrop-blur-md p-1.5 rounded-lg border border-portos-navy-secondary text-xs text-white shadow-md">
        <button
          onClick={handleFitRoute}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-portos-teal hover:bg-portos-teal/90 text-white font-medium text-[11px] transition-all shadow-xs active:scale-95"
          title="Fit map to selected vessel route"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Fit to Route</span>
        </button>

        <button
          onClick={handleFocusAnchorage}
          className="flex items-center gap-1 px-2 py-1 rounded bg-portos-navy-secondary hover:bg-slate-700 text-slate-200 text-[11px] transition-all active:scale-95"
          title="Zoom to Outer Anchorage A/B/C"
        >
          <Anchor className="h-3 w-3 text-portos-amber" />
          <span>Anchorage</span>
        </button>

        <button
          onClick={handleFocusQuay}
          className="flex items-center gap-1 px-2 py-1 rounded bg-portos-navy-secondary hover:bg-slate-700 text-slate-200 text-[11px] transition-all active:scale-95"
          title="Zoom to CCT / NCT Container Quayside"
        >
          <Navigation className="h-3 w-3 text-portos-teal" />
          <span>Quayside</span>
        </button>

        <button
          onClick={handleResetView}
          className="flex items-center gap-1 px-2 py-1 rounded bg-portos-navy-secondary hover:bg-slate-700 text-slate-200 text-[11px] transition-all active:scale-95"
          title="Reset map view"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Layer Toggles Overlay */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-portos-navy/90 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-portos-navy-secondary text-[11px] text-white shadow-md">
        <span className="text-slate-400 mr-0.5 flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-portos-teal" />
          <span className="text-[10px] uppercase font-semibold">Layers:</span>
        </span>
        <button
          onClick={() =>
            setLayers((prev) => ({
              ...prev,
              anchorageZones: !prev.anchorageZones,
            }))
          }
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            layers.anchorageZones
              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
              : "text-slate-400 opacity-60"
          }`}
        >
          Anchorage
        </button>
        <button
          onClick={() =>
            setLayers((prev) => ({
              ...prev,
              fairwayChannel: !prev.fairwayChannel,
            }))
          }
          className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
            layers.fairwayChannel
              ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
              : "text-slate-400 opacity-60"
          }`}
        >
          Fairway
        </button>
      </div>

      {/* Bottom Tactical Coordinate Crosshairs Bar */}
      <div className="absolute bottom-2 left-2 z-10 flex items-center gap-2 bg-portos-navy/90 backdrop-blur-md px-2.5 py-1 rounded border border-portos-navy-secondary text-[10px] font-mono text-slate-300 shadow-sm">
        <Crosshair className="h-3 w-3 text-portos-teal" />
        <span>{cursorCoords}</span>
        <span className="text-slate-500">|</span>
        <span className="text-slate-400">Datum: WGS 84 / Karnaphuli Chart 3131</span>
      </div>

      {/* Mandatory Maritime Map Attribution (Prompt 07 Requirement) */}
      <div className="absolute bottom-2 right-2 z-10 bg-portos-navy/90 backdrop-blur-md px-2.5 py-1 rounded border border-portos-navy-secondary text-[9px] font-mono text-slate-300 shadow-sm">
        MapLibre GL | PORTOS Maritime Spatial Model · Karnaphuli Fairway (CD +0.0m) · SIMULATED
      </div>
    </div>
  );
}
