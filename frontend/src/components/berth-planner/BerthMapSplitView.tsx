"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { BerthRead, ScheduledAssignment, VesselCallRead } from "@/types/api";
import {
  MapPin,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Compass,
  Ship,
  Wrench,
  Anchor,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Radio,
  Sliders,
  RotateCcw,
} from "lucide-react";

interface BerthMapSplitViewProps {
  berths: BerthRead[];
  assignments: ScheduledAssignment[];
  selectedAssignment: ScheduledAssignment | null;
  onSelectAssignment: (assignment: ScheduledAssignment) => void;
  selectedBerthId?: string | null;
  onSelectBerthId?: (berthId: string) => void;
  calls: VesselCallRead[];
}

// 6 Quayside Berths configured along the curved Karnaphuli river quayside
interface BerthLayoutSpec {
  id: string;
  code: string;
  name: string;
  quay: "CCT" | "NCT";
  x: number;
  y: number;
  width: number;
  height: number;
  maxLoa: number;
  depthDraft: number;
  maintenance?: boolean;
  bollards: { id: string; x: number; y: number }[];
}

export function BerthMapSplitView({
  berths,
  assignments,
  selectedAssignment,
  onSelectAssignment,
  selectedBerthId,
  onSelectBerthId,
  calls,
}: BerthMapSplitViewProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [mapStyle, setMapStyle] = useState<"nautical" | "satellite" | "radar">("nautical");
  const [hoveredEntity, setHoveredEntity] = useState<any | null>(null);
  const [showMooringRopes, setShowMooringRopes] = useState<boolean>(true);
  const [showCraneOperations, setShowCraneOperations] = useState<boolean>(true);

  // Quayside berths following the natural curved shoreline of Karnaphuli River
  const berthLayout: BerthLayoutSpec[] = useMemo(() => [
    {
      id: "berth_01",
      code: "BERTH-01",
      name: "CCT Berth 1",
      quay: "CCT",
      x: 75,
      y: 168,
      width: 120,
      height: 44,
      maxLoa: 185,
      depthDraft: 9.5,
      bollards: [
        { id: "B01", x: 85, y: 162 },
        { id: "B02", x: 125, y: 165 },
        { id: "B03", x: 165, y: 168 },
        { id: "B04", x: 185, y: 170 },
      ],
    },
    {
      id: "berth_02",
      code: "BERTH-02",
      name: "CCT Berth 2",
      quay: "CCT",
      x: 205,
      y: 172,
      width: 125,
      height: 44,
      maxLoa: 190,
      depthDraft: 9.5,
      bollards: [
        { id: "B05", x: 215, y: 173 },
        { id: "B06", x: 255, y: 176 },
        { id: "B07", x: 295, y: 180 },
        { id: "B08", x: 320, y: 182 },
      ],
    },
    {
      id: "berth_03",
      code: "BERTH-03",
      name: "CCT Berth 3",
      quay: "CCT",
      x: 340,
      y: 184,
      width: 120,
      height: 44,
      maxLoa: 180,
      depthDraft: 9.2,
      bollards: [
        { id: "B09", x: 350, y: 185 },
        { id: "B10", x: 390, y: 189 },
        { id: "B11", x: 430, y: 193 },
        { id: "B12", x: 450, y: 195 },
      ],
    },
    {
      id: "berth_04",
      code: "BERTH-04",
      name: "NCT Berth 4",
      quay: "NCT",
      x: 470,
      y: 197,
      width: 130,
      height: 44,
      maxLoa: 200,
      depthDraft: 10.0,
      bollards: [
        { id: "B13", x: 480, y: 198 },
        { id: "B14", x: 520, y: 202 },
        { id: "B15", x: 560, y: 206 },
        { id: "B16", x: 590, y: 209 },
      ],
    },
    {
      id: "berth_05",
      code: "BERTH-05",
      name: "NCT Berth 5",
      quay: "NCT",
      x: 610,
      y: 211,
      width: 125,
      height: 44,
      maxLoa: 190,
      depthDraft: 9.5,
      maintenance: true,
      bollards: [
        { id: "B17", x: 620, y: 212 },
        { id: "B18", x: 660, y: 216 },
        { id: "B19", x: 700, y: 220 },
        { id: "B20", x: 725, y: 223 },
      ],
    },
    {
      id: "berth_06",
      code: "BERTH-06",
      name: "NCT Berth 6",
      quay: "NCT",
      x: 745,
      y: 225,
      width: 130,
      height: 44,
      maxLoa: 200,
      depthDraft: 10.0,
      bollards: [
        { id: "B21", x: 755, y: 226 },
        { id: "B22", x: 795, y: 230 },
        { id: "B23", x: 835, y: 234 },
        { id: "B24", x: 865, y: 237 },
      ],
    },
  ], []);

  // Ship-to-Shore Gantry Cranes (mounted on dual rails straddling the quayside apron)
  const cranes = useMemo(() => [
    { id: "STS-01", berthId: "berth_01", x: 130, y: 142, rate: "30 moves/h", status: "ACTIVE" },
    { id: "STS-02", berthId: "berth_02", x: 260, y: 148, rate: "28 moves/h", status: "ACTIVE" },
    { id: "STS-03", berthId: "berth_03", x: 395, y: 160, rate: "32 moves/h", status: "ACTIVE" },
    { id: "STS-04", berthId: "berth_04", x: 535, y: 173, rate: "30 moves/h", status: "ACTIVE" },
    { id: "STS-05", berthId: "berth_06", x: 810, y: 201, rate: "34 moves/h", status: "ACTIVE" },
  ], []);

  // Anchorage Vessels waiting in the Karnaphuli river approach basin
  const anchorageVessels = useMemo(() => [
    {
      callId: "call_vsl_01",
      name: "DEMO MV Karnaphuli Pioneer",
      x: 180,
      y: 350,
      heading: 42,
      loa: 172,
      draft: 9.2,
      swingRadius: 28,
    },
    {
      callId: "call_vsl_04",
      name: "DEMO MV Karnaphuli Express",
      x: 360,
      y: 375,
      heading: 38,
      loa: 175,
      draft: 9.1,
      swingRadius: 28,
    },
    {
      callId: "call_vsl_05",
      name: "DEMO MV Bengal Pearl",
      x: 550,
      y: 365,
      heading: 45,
      loa: 160,
      draft: 8.8,
      swingRadius: 26,
    },
    {
      callId: "call_vsl_06",
      name: "DEMO MV Meghna Carrier",
      x: 730,
      y: 390,
      heading: 50,
      loa: 165,
      draft: 8.9,
      swingRadius: 27,
    },
  ], []);

  const isSelectedBerth = (bId: string) =>
    selectedBerthId === bId || selectedAssignment?.berth_id === bId;

  // Active theme color palettes
  const theme = useMemo(() => {
    if (mapStyle === "satellite") {
      return {
        bg: "#0B1520",
        waterTop: "#0E2A47",
        waterBottom: "#071726",
        apron: "#2B3544",
        quayLine: "#CBD5E1",
        fender: "#1E293B",
        channelDashed: "#38BDF8",
        channelText: "#7DD3FC",
        containerStackBg: "#1F2937",
        craneColor: "#F59E0B",
        gridLine: "#334155",
      };
    } else if (mapStyle === "radar") {
      return {
        bg: "#03140C",
        waterTop: "#042113",
        waterBottom: "#021008",
        apron: "#062817",
        quayLine: "#22C55E",
        fender: "#15803D",
        channelDashed: "#4ADE80",
        channelText: "#86EFAC",
        containerStackBg: "#06331D",
        craneColor: "#22C55E",
        gridLine: "#14532D",
      };
    } else {
      // Nautical Dark Chart (Default ECDIS)
      return {
        bg: "#07131E",
        waterTop: "#0C2337",
        waterBottom: "#061320",
        apron: "#1E293B",
        quayLine: "#E2E8F0",
        fender: "#334155",
        channelDashed: "#0EA5E9",
        channelText: "#38BDF8",
        containerStackBg: "#0F172A",
        craneColor: "#F59E0B",
        gridLine: "#1E293B",
      };
    }
  }, [mapStyle]);

  return (
    <div id="synchronized-port-gis-map-card" className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden flex flex-col h-full min-h-[520px] font-sans">
      {/* 1. Header & GIS Tactical Toolbar */}
      <div className="p-3.5 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-extrabold text-slate-900 tracking-tight">
                Synchronized Port GIS Map
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200">
                Chattogram Quayside & Fairway
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Synchronized 2D spatial mooring plan with real-time bollard chocks, STS gantry cranes, and tidal channel.
            </p>
          </div>
        </div>

        {/* Tactical Controls Strip */}
        <div className="flex items-center gap-2">
          {/* Map Style Segmented Control */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setMapStyle("nautical")}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                mapStyle === "nautical"
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Nautical Dark
            </button>
            <button
              onClick={() => setMapStyle("satellite")}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                mapStyle === "satellite"
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapStyle("radar")}
              className={`px-2.5 py-1 rounded-full text-[11px] transition-all ${
                mapStyle === "radar"
                  ? "bg-slate-900 text-white font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Tactical Radar
            </button>
          </div>

          {/* Mooring Ropes & Crane Toggle Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200">
            <button
              onClick={() => setShowMooringRopes(!showMooringRopes)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                showMooringRopes
                  ? "bg-sky-600 text-white"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Toggle high-tensile mooring lines"
            >
              Mooring Lines
            </button>
            <button
              onClick={() => setShowCraneOperations(!showCraneOperations)}
              className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                showCraneOperations
                  ? "bg-amber-500 text-slate-900"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              title="Toggle STS gantry crane spreaders"
            >
              STS Cranes
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.15))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-full"
              title="Zoom Out GIS Map"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[10px] tabular-nums px-1 font-bold text-slate-800">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
              className="p-1 text-slate-600 hover:text-slate-900 rounded-full"
              title="Zoom In GIS Map"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="px-1.5 py-0.5 text-[10px] font-bold text-slate-600 hover:text-slate-900"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3 w-3" />
            </button>
          </div>

          {/* Link to Interactive 3D Digital Twin */}
          <Link
            href="/digital-twin"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-xs"
            title="Open Interactive 3D Maritime Digital Twin"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>3D Twin</span>
          </Link>
        </div>
      </div>

      {/* 2. Interactive SVG GIS Map Canvas */}
      <div className="relative flex-1 bg-slate-950 overflow-hidden select-none min-h-[440px] flex items-center justify-center">
        <svg
          viewBox="0 0 940 560"
          className="w-full h-full object-cover transition-transform duration-200 ease-out"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
        >
          <defs>
            {/* Water dynamic gradient */}
            <linearGradient id="gisWaterGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.waterTop} />
              <stop offset="100%" stopColor={theme.waterBottom} />
            </linearGradient>

            {/* Apron concrete pattern */}
            <pattern id="gisQuayApronPaving" width="24" height="24" patternUnits="userSpaceOnUse">
              <rect width="24" height="24" fill={theme.apron} />
              <line x1="0" y1="0" x2="24" y2="0" stroke={theme.gridLine} strokeWidth="0.6" opacity="0.6" />
              <line x1="0" y1="0" x2="0" y2="24" stroke={theme.gridLine} strokeWidth="0.6" opacity="0.6" />
            </pattern>

            {/* Container Stacks 2D Pattern */}
            <pattern id="containerYardBlocks" width="40" height="20" patternUnits="userSpaceOnUse">
              <rect x="2" y="2" width="16" height="7" fill="#0284C7" rx="1" />
              <rect x="20" y="2" width="16" height="7" fill="#EF4444" rx="1" />
              <rect x="2" y="11" width="16" height="7" fill="#10B981" rx="1" />
              <rect x="20" y="11" width="16" height="7" fill="#F59E0B" rx="1" />
            </pattern>

            {/* Maintenance Hazard Warning Hatching */}
            <pattern id="hazardHatching" width="12" height="12" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <rect width="12" height="12" fill="#7F1D1D" />
              <line x1="0" y1="0" x2="0" y2="12" stroke="#EF4444" strokeWidth="4" />
            </pattern>

            {/* Glow Filter for Selected Vessel & Guidance Vector */}
            <filter id="gisGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* LAYER 1: Terminal Apron Landmass ($Y < 170$) */}
          <path
            d="M 0,0 L 940,0 L 940,245 L 875,237 L 745,225 L 610,211 L 470,197 L 340,184 L 205,172 L 75,168 L 0,165 Z"
            fill="url(#gisQuayApronPaving)"
          />

          {/* Container Stacking Yards on the Terminal Backland */}
          <g opacity={mapStyle === "radar" ? "0.3" : "0.75"}>
            {/* Yard Stacks CCT Backland */}
            <rect x="40" y="40" width="220" height="48" fill="url(#containerYardBlocks)" rx="3" stroke="#475569" strokeWidth="1" />
            <text x="45" y="32" fill="#94A3B8" fontSize="9" fontFamily="monospace" fontWeight="bold">
              CCT CONTAINER YARD (IMPORT / EXPORT BLOCK 1-4)
            </text>

            {/* Yard Stacks NCT Backland */}
            <rect x="300" y="40" width="240" height="48" fill="url(#containerYardBlocks)" rx="3" stroke="#475569" strokeWidth="1" />
            <text x="305" y="32" fill="#94A3B8" fontSize="9" fontFamily="monospace" fontWeight="bold">
              NCT CONTAINER YARD (REEFER / TRANSSHIPMENT BLOCK 5-8)
            </text>

            {/* Yard Stacks Gate Approach */}
            <rect x="580" y="40" width="240" height="48" fill="url(#containerYardBlocks)" rx="3" stroke="#475569" strokeWidth="1" />
            <text x="585" y="32" fill="#94A3B8" fontSize="9" fontFamily="monospace" fontWeight="bold">
              INLAND CONTAINER DEPOT & RAIL TRANSFER SIDINGS
            </text>
          </g>

          {/* Terminal Internal Roadway & Markings */}
          <line x1="0" y1="102" x2="940" y2="114" stroke="#475569" strokeWidth="2.5" strokeDasharray="8,6" />
          <line x1="0" y1="128" x2="940" y2="142" stroke="#64748B" strokeWidth="1.5" />

          {/* Crane Rear Rail Track (30.48m gauge from quayside rail) */}
          <path
            d="M 0,140 L 75,143 L 205,147 L 340,158 L 470,171 L 610,185 L 745,199 L 875,211 L 940,218"
            stroke="#64748B"
            strokeWidth="2"
            strokeDasharray="4,3"
            fill="none"
          />

          {/* LAYER 2: Karnaphuli River Water Fairway ($Y > 165$) */}
          <path
            d="M 0,165 L 75,168 L 205,172 L 340,184 L 470,197 L 610,211 L 745,225 L 875,237 L 940,245 L 940,560 L 0,560 Z"
            fill="url(#gisWaterGradient)"
          />

          {/* Bathymetric Depth Sounding Contours */}
          <path
            d="M 0,310 Q 450,330 940,360"
            stroke={theme.channelDashed}
            strokeWidth="1.2"
            strokeDasharray="5,6"
            fill="none"
            opacity="0.4"
          />
          <text x="35" y="325" fill={theme.channelText} fontSize="9" fontFamily="monospace" opacity="0.8">
            KARNAPHULI NAVIGATIONAL CHANNEL • DREDGED DEPTH: 10.5M LAT • GUPTA BEND FAIRWAY
          </text>

          {/* Navigational Lateral Channel Buoys */}
          <g>
            {/* Starboard Green Lateral Buoys (Green light flash) */}
            <circle cx="120" cy="270" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.2" />
            <circle cx="120" cy="270" r="9" fill="none" stroke="#10B981" strokeWidth="0.8" opacity="0.6" />
            <text x="120" y="260" fill="#6EE7B7" fontSize="8" fontFamily="monospace" textAnchor="middle">Q.G. Starboard 1</text>

            <circle cx="480" cy="295" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.2" />
            <circle cx="480" cy="295" r="9" fill="none" stroke="#10B981" strokeWidth="0.8" opacity="0.6" />
            <text x="480" y="285" fill="#6EE7B7" fontSize="8" fontFamily="monospace" textAnchor="middle">Q.G. Starboard 3</text>

            <circle cx="820" cy="320" r="4.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.2" />
            <circle cx="820" cy="320" r="9" fill="none" stroke="#10B981" strokeWidth="0.8" opacity="0.6" />
            <text x="820" y="310" fill="#6EE7B7" fontSize="8" fontFamily="monospace" textAnchor="middle">Q.G. Starboard 5</text>
          </g>

          {/* LAYER 3: Outer Anchorage Waiting Roadstead Basin */}
          <rect
            x="130"
            y="335"
            width="680"
            height="115"
            fill={mapStyle === "radar" ? "#042617" : "#0A1D2E"}
            fillOpacity="0.45"
            stroke="#38BDF8"
            strokeWidth="1"
            strokeDasharray="4,4"
            rx="12"
          />
          <text x="145" y="352" fill="#7DD3FC" fontSize="9" fontFamily="monospace" fontWeight="bold">
            CHATTOGRAM ROADSTEAD WAITING BASIN (BRAVO STATION ANCHORAGE)
          </text>

          {/* Render Anchorage Waiting Vessels with Anchor Chain & Swing Circles */}
          {anchorageVessels.map((vsl) => {
            const isCallSelected = selectedAssignment?.vessel_call_id === vsl.callId;

            return (
              <g
                key={vsl.callId}
                className="cursor-pointer transition-transform hover:scale-105"
                onClick={() => {
                  const match = assignments.find((a) => a.vessel_call_id === vsl.callId);
                  if (match) onSelectAssignment(match);
                }}
                onMouseEnter={() => setHoveredEntity({ type: "anchorage", data: vsl })}
                onMouseLeave={() => setHoveredEntity(null)}
              >
                {/* Dashed Anchor Swing Room Circle */}
                <circle
                  cx={vsl.x}
                  cy={vsl.y}
                  r={vsl.swingRadius}
                  fill="none"
                  stroke={isCallSelected ? "#F59E0B" : "#475569"}
                  strokeWidth="1"
                  strokeDasharray="2,2"
                  opacity="0.6"
                />

                {/* Anchor Drop Point on Seabed */}
                <circle cx={vsl.x - 22} cy={vsl.y - 12} r="2.5" fill="#F59E0B" />
                <line
                  x1={vsl.x - 22}
                  y1={vsl.y - 12}
                  x2={vsl.x - 14}
                  y2={vsl.y}
                  stroke="#F59E0B"
                  strokeWidth="1.2"
                  strokeDasharray="2,1"
                />

                {/* Hydrodynamic Ship Hull at Anchor */}
                <g transform={`translate(${vsl.x}, ${vsl.y}) rotate(${vsl.heading})`}>
                  {/* Ship Silhouette */}
                  <path
                    d="M 18,0 L 8,-6 L -16,-6 L -20,-3 L -20,3 L -16,6 L 8,6 Z"
                    fill={isCallSelected ? "#F59E0B" : "#1E293B"}
                    stroke={isCallSelected ? "#FDE68A" : "#94A3B8"}
                    strokeWidth={isCallSelected ? "2" : "1.2"}
                  />
                  {/* Wheelhouse deckhouse */}
                  <rect x="-14" y="-3" width="6" height="6" fill="#0F172A" stroke="#FFFFFF" strokeWidth="0.6" />
                  {/* Mast beacon */}
                  <circle cx="12" cy="0" r="1.5" fill="#EF4444" />
                </g>

                {/* Vessel Name Tag */}
                <text
                  x={vsl.x}
                  y={vsl.y + 24}
                  fill="#F8FAFC"
                  fontSize="8"
                  fontFamily="sans-serif"
                  fontWeight={isCallSelected ? "bold" : "500"}
                  textAnchor="middle"
                >
                  {vsl.name.replace("DEMO ", "")}
                </text>
              </g>
            );
          })}

          {/* LAYER 4: Continuous Heavy Quayside Concrete Wharf Edge */}
          {/* Wharf Coping Line with Safety Yellow/Black Markings */}
          <path
            d="M 75,168 L 205,172 L 340,184 L 470,197 L 610,211 L 745,225 L 875,237"
            stroke={theme.quayLine}
            strokeWidth="6"
            fill="none"
          />
          {/* Front Crane Rail Track along waterside */}
          <path
            d="M 75,164 L 205,168 L 340,180 L 470,193 L 610,207 L 745,221 L 875,233"
            stroke="#475569"
            strokeWidth="1.8"
            fill="none"
          />

          {/* LAYER 5: Berths along the Quayside Face */}
          {berthLayout.map((b) => {
            const isSelected = isSelectedBerth(b.id);
            const isMaintenance = b.maintenance;
            const assigned = assignments.find((a) => a.berth_id === b.id);

            return (
              <g
                key={b.id}
                className="cursor-pointer"
                onClick={() => {
                  if (onSelectBerthId) onSelectBerthId(b.id);
                  if (assigned) onSelectAssignment(assigned);
                }}
                onMouseEnter={() => setHoveredEntity({ type: "berth", data: b, assigned })}
                onMouseLeave={() => setHoveredEntity(null)}
              >
                {/* Berth Apron Background Footprint */}
                <rect
                  x={b.x}
                  y={b.y}
                  width={b.width}
                  height={b.height}
                  fill={
                    isMaintenance
                      ? "url(#hazardHatching)"
                      : isSelected
                      ? "#0F3D35"
                      : "#0F1E2E"
                  }
                  stroke={
                    isSelected
                      ? "#14B8A6"
                      : isMaintenance
                      ? "#EF4444"
                      : "#334155"
                  }
                  strokeWidth={isSelected ? "2.5" : "1"}
                  rx="4"
                  opacity={isMaintenance ? "0.75" : "0.95"}
                />

                {/* Berth Code & Specifications Label */}
                <text
                  x={b.x + 8}
                  y={b.y + 14}
                  fill={isSelected ? "#5EEAD4" : "#FFFFFF"}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {b.code}
                </text>
                <text
                  x={b.x + 8}
                  y={b.y + 26}
                  fill="#94A3B8"
                  fontSize="8"
                  fontFamily="sans-serif"
                  fontWeight="500"
                >
                  {b.maxLoa}m LOA • {b.depthDraft}m
                </text>

                {/* High-Definition Moored Vessel Hull */}
                {assigned && !isMaintenance && (
                  <g filter={isSelected ? "url(#gisGlowFilter)" : undefined}>
                    {/* Hydrodynamic Ship Hull alongside quayside */}
                    <path
                      d={`M ${b.x + 10},${b.y + 4} L ${b.x + b.width - 16},${b.y + 4} Q ${b.x + b.width - 2},${b.y + 16} ${b.x + b.width - 16},${b.y + 30} L ${b.x + 10},${b.y + 30} Q ${b.x + 2},${b.y + 17} ${b.x + 10},${b.y + 4} Z`}
                      fill={
                        isSelected
                          ? "#F59E0B"
                          : "#0D9488"
                      }
                      stroke={
                        isSelected
                          ? "#FEF08A"
                          : "#2DD4BF"
                      }
                      strokeWidth="1.6"
                    />

                    {/* Container Bay Rows on Ship Deck */}
                    <g opacity="0.85">
                      <rect x={b.x + 18} y={b.y + 8} width="14" height="18" fill="#1E293B" rx="1" />
                      <rect x={b.x + 36} y={b.y + 8} width="14" height="18" fill="#1E293B" rx="1" />
                      <rect x={b.x + 54} y={b.y + 8} width="14" height="18" fill="#1E293B" rx="1" />
                      {b.width > 120 && (
                        <rect x={b.x + 72} y={b.y + 8} width="14" height="18" fill="#1E293B" rx="1" />
                      )}
                    </g>

                    {/* Wheelhouse Superstructure / Bridge Tower */}
                    <rect
                      x={b.x + b.width - 24}
                      y={b.y + 9}
                      width="8"
                      height="16"
                      fill="#FFFFFF"
                      rx="1"
                    />

                    {/* Vessel Name Label */}
                    <text
                      x={b.x + b.width / 2}
                      y={b.y + 20}
                      fill="#FFFFFF"
                      fontSize="9"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      {assigned.vessel_name.replace("DEMO MV ", "").replace("DEMO ", "")}
                    </text>

                    {/* Mooring Lines (Bow, Stern, and Spring Ropes to Bollards) */}
                    {showMooringRopes && (
                      <g stroke="#FED7AA" strokeWidth="1.2" strokeDasharray="2,1" opacity="0.9">
                        {/* Bow Lines to Quayside Bollards */}
                        <line x1={b.x + 10} y1={b.y + 6} x2={b.bollards[0].x} y2={b.bollards[0].y} />
                        <line x1={b.x + 12} y1={b.y + 8} x2={b.bollards[1].x} y2={b.bollards[1].y} />
                        {/* Stern Lines to Quayside Bollards */}
                        <line x1={b.x + b.width - 16} y1={b.y + 6} x2={b.bollards[b.bollards.length - 1].x} y2={b.bollards[b.bollards.length - 1].y} />
                        <line x1={b.x + b.width - 18} y1={b.y + 8} x2={b.bollards[b.bollards.length - 2].x} y2={b.bollards[b.bollards.length - 2].y} />
                      </g>
                    )}
                  </g>
                )}

                {/* Maintenance Window Warning on Closed Berth */}
                {isMaintenance && (
                  <g>
                    <rect
                      x={b.x + 6}
                      y={b.y + 8}
                      width={b.width - 12}
                      height={26}
                      fill="#991B1B"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      rx="3"
                    />
                    <text
                      x={b.x + b.width / 2}
                      y={b.y + 23}
                      fill="#FEE2E2"
                      fontSize="9"
                      fontFamily="sans-serif"
                      fontWeight="bold"
                      textAnchor="middle"
                    >
                      Fender Maintenance (Closed)
                    </text>
                  </g>
                )}

                {/* Numbered Bollard Stations along Quayside Coping */}
                {b.bollards.map((bollard) => (
                  <g key={bollard.id}>
                    {/* Marine Rubber Fender at Coping Face */}
                    <rect
                      x={bollard.x - 4}
                      y={bollard.y + 4}
                      width="8"
                      height="3.5"
                      fill={theme.fender}
                      rx="1"
                    />
                    {/* Cast Steel Bollard Head */}
                    <circle
                      cx={bollard.x}
                      cy={bollard.y}
                      r="3.5"
                      fill="#F8FAFC"
                      stroke="#0F172A"
                      strokeWidth="1.2"
                    />
                  </g>
                ))}
              </g>
            );
          })}

          {/* LAYER 6: STS Container Gantry Cranes */}
          {showCraneOperations &&
            cranes.map((crane) => (
              <g key={crane.id} transform={`translate(${crane.x}, ${crane.y})`}>
                {/* 4-Leg Gantry Portal Frame */}
                <line x1="-10" y1="0" x2="10" y2="0" stroke={theme.craneColor} strokeWidth="3.5" />
                <line x1="-7" y1="0" x2="-7" y2="-20" stroke={theme.craneColor} strokeWidth="2.5" />
                <line x1="7" y1="0" x2="7" y2="-20" stroke={theme.craneColor} strokeWidth="2.5" />
                <line x1="-16" y1="-20" x2="22" y2="-20" stroke="#FDE68A" strokeWidth="3" />
                
                {/* Overhead Crane Boom Extending over Vessel */}
                <line x1="10" y1="-20" x2="36" y2="-6" stroke={theme.craneColor} strokeWidth="2.5" />
                
                {/* Spreader Hoist Cable & Container */}
                <line x1="26" y1="-11" x2="26" y2="10" stroke="#FFFFFF" strokeWidth="0.8" strokeDasharray="1,1" />
                <rect x="20" y="10" width="12" height="6" fill="#0284C7" stroke="#FFFFFF" strokeWidth="0.8" rx="0.5" />
                
                {/* Cab light */}
                <circle cx="0" cy="-14" r="2" fill="#EF4444" />

                {/* Crane identifier */}
                <text x="0" y="-23" fill="#FDE68A" fontSize="7" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {crane.id}
                </text>
              </g>
            ))}

          {/* Compass Rose in Upper Right */}
          <g transform="translate(895, 45)">
            <circle cx="0" cy="0" r="18" fill="#0F172A" stroke="#475569" strokeWidth="1.2" />
            <polygon points="0,-14 4.5,0 -4.5,0" fill="#EF4444" />
            <polygon points="0,14 4.5,0 -4.5,0" fill="#94A3B8" />
            <text x="0" y="-16" fill="#F8FAFC" fontSize="9" fontWeight="bold" textAnchor="middle">
              N
            </text>
          </g>

          {/* Scale Bar (50m Reference) */}
          <g transform="translate(825, 525)">
            <rect x="0" y="0" width="90" height="20" fill="#0F172A" opacity="0.85" rx="4" />
            <line x1="15" y1="13" x2="75" y2="13" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="15" y1="8" x2="15" y2="13" stroke="#FFFFFF" strokeWidth="2" />
            <line x1="75" y1="8" x2="75" y2="13" stroke="#FFFFFF" strokeWidth="2" />
            <text x="45" y="9" fill="#FFFFFF" fontSize="8" fontFamily="monospace" textAnchor="middle">
              50 m
            </text>
          </g>
        </svg>

        {/* 3. Floating Operational Telemetry HUD for Selected / Hovered Entity */}
        {hoveredEntity && (
          <div className="absolute top-3 left-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl shadow-2xl text-xs text-white max-w-xs z-30 font-sans pointer-events-none animate-in fade-in duration-150">
            {hoveredEntity.type === "berth" ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="font-extrabold text-sky-400 text-sm">
                    {hoveredEntity.data.code} ({hoveredEntity.data.name})
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      hoveredEntity.data.maintenance
                        ? "bg-rose-950 text-rose-300 border border-rose-600"
                        : "bg-emerald-950 text-emerald-300 border border-emerald-600"
                    }`}
                  >
                    {hoveredEntity.data.maintenance ? "MAINTENANCE" : "AVAILABLE"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-400 block text-[9px]">MAX LOA / DRAFT</span>
                    <span className="font-bold text-white tabular-nums">
                      {hoveredEntity.data.maxLoa}m • {hoveredEntity.data.depthDraft}m CD
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">MOORED VESSEL</span>
                    <span className="font-bold text-white truncate block">
                      {hoveredEntity.assigned
                        ? hoveredEntity.assigned.vessel_name.replace("DEMO ", "")
                        : "Vacant Slot"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <span className="font-extrabold text-amber-400 text-xs">
                    {hoveredEntity.data.name.replace("DEMO ", "")}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-950 text-amber-300 border border-amber-600">
                    AT ANCHOR
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  <div>LOA: {hoveredEntity.data.loa}m • Draft: {hoveredEntity.data.draft}m</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    Bravo Station Anchorage • Awaiting high-tide fairway window
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Sleek Floating Maritime Legend */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-700/80 p-2.5 rounded-xl text-[10px] text-slate-300 font-sans space-y-1.5 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-teal-500 shadow-xs" />
              <span>Assigned Vessel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-amber-500 shadow-xs" />
              <span>Selected Focus</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-rose-600 shadow-xs" />
              <span>Fender Maintenance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-xs bg-slate-700 shadow-xs" />
              <span>Anchorage Waiting</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
