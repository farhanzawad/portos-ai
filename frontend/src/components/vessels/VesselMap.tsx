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
  Eye,
  Ship,
} from "lucide-react";

interface VesselMapProps {
  calls: VesselCallRead[];
  selectedCall: VesselCallRead | null;
  trackData?: VesselTrackResponse;
  onSelectCall: (call: VesselCallRead) => void;
}

// Self-contained offline-safe dark maritime base style
const defaultMapStyle: maplibregl.StyleSpecification = {
  version: 8,
  name: "PORTOS Maritime Dark",
  sources: {},
  layers: [
    {
      id: "background",
      type: "background",
      paint: { "background-color": "#0d1b2a" },
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

  const [layers, setLayers] = useState<MapLayerState>({
    anchorageZones: true,
    fairwayChannel: true,
    historicalTrack: true,
    predictedRoute: true,
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: defaultMapStyle,
      center: [91.78, 22.25], // Karnaphuli River approach center
      zoom: 10.8,
      minZoom: 8.5,
      maxZoom: 16,
      attributionControl: false,
    });

    map.on("load", () => {
      // 1. Add Landmass / Coastline Outline
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
                    [91.88, 22.10],
                    [91.88, 22.38],
                    [91.82, 22.38],
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
          "fill-color": "#1a2536",
          "fill-opacity": 0.8,
        },
      });

      map.addLayer({
        id: "landmass-stroke",
        type: "line",
        source: "landmass-source",
        paint: {
          "line-color": "#334155",
          "line-width": 1.5,
        },
      });

      // 2. Add Karnaphuli Navigation Fairway Channel
      map.addSource("fairway-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Karnaphuli Navigation Fairway" },
              geometry: {
                type: "LineString",
                coordinates: [
                  [91.70, 22.12],
                  [91.735, 22.165],
                  [91.78, 22.21],
                  [91.802, 22.255],
                  [91.815, 22.29],
                  [91.824, 22.318],
                ],
              },
            },
          ],
        },
      });

      map.addLayer({
        id: "fairway-line",
        type: "line",
        source: "fairway-source",
        paint: {
          "line-color": "#16a394",
          "line-width": 2,
          "line-dasharray": [4, 2],
          "line-opacity": 0.7,
        },
      });

      // 3. Add Outer Anchorage Zones (A, B, C)
      map.addSource("anchorage-source", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              properties: { name: "Outer Anchorage Alpha" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [91.68, 22.11],
                    [91.73, 22.11],
                    [91.73, 22.14],
                    [91.68, 22.14],
                    [91.68, 22.11],
                  ],
                ],
              },
            },
            {
              type: "Feature",
              properties: { name: "Outer Anchorage Bravo" },
              geometry: {
                type: "Polygon",
                coordinates: [
                  [
                    [91.71, 22.145],
                    [91.76, 22.145],
                    [91.76, 22.18],
                    [91.71, 22.18],
                    [91.71, 22.145],
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
          "fill-color": "#e5a23b",
          "fill-opacity": 0.12,
        },
      });

      map.addLayer({
        id: "anchorage-stroke",
        type: "line",
        source: "anchorage-source",
        paint: {
          "line-color": "#e5a23b",
          "line-width": 1.2,
          "line-dasharray": [3, 2],
        },
      });

      // 4. Quayside Berth Marker Line
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
          "line-width": 4,
        },
      });
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Vessel Markers on map
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Realistic coordinate assignment per call
    calls.forEach((call, idx) => {
      // Deterministic coordinate based on status and index
      let lat = 22.14 + (idx % 4) * 0.02;
      let lon = 91.71 + (idx % 3) * 0.025;

      if (call.status === "BERTHED") {
        lat = 22.314 + (idx % 3) * 0.004;
        lon = 91.822 + (idx % 3) * 0.003;
      } else if (call.status === "PILOT_BOARDING") {
        lat = 22.21 + (idx % 2) * 0.01;
        lon = 91.78 + (idx % 2) * 0.01;
      }

      const isSelected = selectedCall?.id === call.id;

      // Custom HTML Marker element
      const el = document.createElement("div");
      el.className = "cursor-pointer group flex flex-col items-center";
      el.innerHTML = `
        <div class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap border shadow-sm transition-transform group-hover:scale-110 ${
          isSelected
            ? "bg-portos-teal text-white border-white ring-2 ring-portos-teal"
            : call.delay_risk_status === "HIGH_RISK"
            ? "bg-portos-red text-white border-white"
            : "bg-portos-navy text-white border-portos-border"
        }">
          ${call.vessel?.name || call.call_number}
        </div>
        <div class="w-3 h-3 -mt-0.5 rounded-full border-2 border-white flex items-center justify-center ${
          isSelected
            ? "bg-portos-teal animate-pulse"
            : call.delay_risk_status === "HIGH_RISK"
            ? "bg-portos-red"
            : "bg-sky-400"
        }">
          <div class="w-1 h-1 bg-white rounded-full"></div>
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

    // Add or update track source
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
          "line-color": "#16a394",
          "line-width": 3,
        },
      });
    }
  }, [trackData]);

  // Fit bounds to selected vessel route
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
      map.flyTo({ center: [91.78, 22.25], zoom: 11, duration: 600 });
    }
  };

  const handleResetView = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({ center: [91.78, 22.25], zoom: 10.8, pitch: 0, bearing: 0 });
  };

  return (
    <div className="relative w-full h-full min-h-[580px] bg-slate-950 rounded-lg border border-portos-border shadow-sm overflow-hidden select-none">
      {/* MapLibre DOM Container */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Top Map Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-portos-navy/90 backdrop-blur-md p-1.5 rounded-lg border border-portos-navy-secondary text-xs text-white">
        <button
          onClick={handleFitRoute}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-portos-teal hover:bg-portos-teal/90 text-white font-medium text-[11px] transition-colors"
          title="Fit map to selected vessel route"
        >
          <Maximize2 className="h-3.5 w-3.5" />
          <span>Fit to Route</span>
        </button>

        <button
          onClick={handleResetView}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-portos-navy-secondary hover:bg-slate-700 text-slate-200 text-[11px] transition-colors"
          title="Reset map view"
        >
          <RotateCcw className="h-3 w-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Layer Toggles Overlay */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-portos-navy/90 backdrop-blur-md px-2 py-1 rounded-lg border border-portos-navy-secondary text-[10px] text-white">
        <span className="text-slate-400 mr-1 flex items-center gap-1">
          <Layers className="h-3 w-3 text-portos-teal" />
          <span>Layers:</span>
        </span>
        <button
          onClick={() =>
            setLayers((prev) => ({
              ...prev,
              anchorageZones: !prev.anchorageZones,
            }))
          }
          className={`px-1.5 py-0.5 rounded transition-colors ${
            layers.anchorageZones
              ? "bg-portos-amber/30 text-portos-amber font-semibold border border-portos-amber/40"
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
          className={`px-1.5 py-0.5 rounded transition-colors ${
            layers.fairwayChannel
              ? "bg-portos-teal/30 text-portos-teal font-semibold border border-portos-teal/40"
              : "text-slate-400 opacity-60"
          }`}
        >
          Fairway
        </button>
      </div>

      {/* Mandatory Maritime Map Attribution (Prompt 07 Requirement) */}
      <div className="absolute bottom-2 right-2 z-10 bg-portos-navy/90 backdrop-blur-md px-2.5 py-1 rounded border border-portos-navy-secondary text-[9px] font-mono text-slate-300">
        MapLibre GL | PORTOS Maritime Spatial Model · Karnaphuli Fairway (CD
        +0.0m) · SIMULATED
      </div>
    </div>
  );
}
