"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  SimulationRunResponse,
  SimulationTimelineFrame,
  VesselPositionSnapshot,
} from "@/types/api";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  Compass,
  Anchor,
  Ship,
  Layers,
  Search,
  Info,
  Maximize2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface SimulationGisMapProps {
  simulationRun: SimulationRunResponse;
  isPlaying: boolean;
  playbackSpeed: number;
  currentHour: number;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onHourChange: (hour: number) => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
}

export function SimulationGisMap({
  simulationRun,
  isPlaying,
  playbackSpeed,
  currentHour,
  onTogglePlay,
  onSpeedChange,
  onHourChange,
  onRunSimulation,
  isSimulating,
}: SimulationGisMapProps) {
  const [selectedVessel, setSelectedVessel] = useState<VesselPositionSnapshot | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [layerFilter, setLayerFilter] = useState<"ALL" | "ANCHORAGE" | "CHANNEL" | "BERTHED">("ALL");

  const frames = simulationRun.timeline_frames || [];
  // Find current frame or closest
  const currentFrame: SimulationTimelineFrame =
    frames.find((f) => Math.abs(f.hour - currentHour) < 0.6) ||
    frames[0] || {
      hour: 0,
      timestamp_iso: new Date().toISOString(),
      vessels: [],
      active_berths: 6,
      occupied_berths: 0,
      active_cranes: 5,
      anchorage_queue_count: 0,
      yard_occupancy_pct: 65,
    };

  // Filter vessels based on search and layer
  const filteredVessels = currentFrame.vessels.filter((v) => {
    if (searchFilter && !v.vessel_name.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    if (layerFilter === "ANCHORAGE") return v.state === "ANCHORAGE_WAITING";
    if (layerFilter === "CHANNEL") return v.state === "INWARD_TRANSIT" || v.state === "OUTWARD_TRANSIT";
    if (layerFilter === "BERTHED") return v.state === "BERTHED_WORKING";
    return true;
  });

  // Spatial coordinate mapping from Lat/Lon to SVG 800x520 viewport
  // Lat: 22.20 (bottom) to 22.33 (top)
  // Lon: 91.73 (left) to 91.85 (right)
  const minLat = 22.20;
  const maxLat = 22.33;
  const minLon = 91.73;
  const maxLon = 91.85;

  const latToY = (lat: number) => 500 - ((lat - minLat) / (maxLat - minLat)) * 460;
  const lonToX = (lon: number) => 30 + ((lon - minLon) / (maxLon - minLon)) * 740;

  // Key waypoint coordinates in SVG pixels
  const anchoragePixelX = lonToX(91.755);
  const anchoragePixelY = latToY(22.215);

  const berths = [
    { code: "BERTH_01", name: "CCT-1", lat: 22.2982, lon: 91.8152 },
    { code: "BERTH_02", name: "CCT-2", lat: 22.3015, lon: 91.8174 },
    { code: "BERTH_03", name: "GCB-1", lat: 22.3048, lon: 91.8196 },
    { code: "BERTH_04", name: "GCB-2", lat: 22.3082, lon: 91.8218 },
    { code: "BERTH_05", name: "NCT-1", lat: 22.3118, lon: 91.8241 },
    { code: "BERTH_06", name: "NCT-2", lat: 22.3155, lon: 91.8265 },
  ];

  const waitingCount = currentFrame.vessels.filter((v) => v.state === "ANCHORAGE_WAITING").length;
  const channelCount = currentFrame.vessels.filter((v) => v.state === "INWARD_TRANSIT" || v.state === "OUTWARD_TRANSIT").length;
  const berthedCount = currentFrame.vessels.filter((v) => v.state === "BERTHED_WORKING").length;

  return (
    <div className="relative flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl overflow-hidden shadow-sm text-slate-100 min-h-[580px] font-sans">
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={onRunSimulation}
            disabled={isSimulating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 fill-current ${isSimulating ? "animate-spin" : ""}`} />
            <span>{isSimulating ? "Simulating..." : "Run Simulation"}</span>
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vessel call..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 transition-colors w-44 sm:w-56"
            />
          </div>
        </div>

        {/* Live Filter Chips */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-800/90 backdrop-blur-md p-1 border border-slate-700 rounded-xl text-[11px]">
          <button
            onClick={() => setLayerFilter("ALL")}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
              layerFilter === "ALL"
                ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({currentFrame.vessels.length})
          </button>
          <button
            onClick={() => setLayerFilter("ANCHORAGE")}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
              layerFilter === "ANCHORAGE"
                ? "bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            Anchor ({waitingCount})
          </button>
          <button
            onClick={() => setLayerFilter("CHANNEL")}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
              layerFilter === "CHANNEL"
                ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Transit ({channelCount})
          </button>
          <button
            onClick={() => setLayerFilter("BERTHED")}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
              layerFilter === "BERTHED"
                ? "bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
            Quayside ({berthedCount})
          </button>
        </div>
      </div>

      {/* SVG GIS Nautical Map Canvas */}
      <div className="relative flex-1 w-full h-[460px] overflow-hidden select-none bg-gradient-to-b from-[#0B1726] via-[#0E2033] to-[#08121E]">
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(#38BDF8 0.75px, transparent 0.75px), radial-gradient(#38BDF8 0.75px, #0B1726 0.75px)",
            backgroundSize: "30px 30px",
            backgroundPosition: "0 0, 15px 15px",
          }}
        />

        <svg
          viewBox="0 0 800 520"
          className="w-full h-full object-cover"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="riverGrad" x1="0%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#102A43" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="anchorageGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.03" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Bay of Bengal Ocean Backdrop */}
          <path
            d="M 0,260 Q 200,320 400,380 T 800,460 L 800,520 L 0,520 Z"
            fill="#091A2A"
            opacity="0.9"
          />

          {/* Outer Anchorage Zone Boundary */}
          <ellipse
            cx={anchoragePixelX}
            cy={anchoragePixelY}
            rx="110"
            ry="75"
            fill="url(#anchorageGrad)"
            stroke="#F59E0B"
            strokeWidth="1.2"
            strokeDasharray="4 4"
            opacity="0.75"
          />
          <text
            x={anchoragePixelX}
            y={anchoragePixelY - 55}
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="10"
            fontFamily="monospace"
            letterSpacing="1"
            opacity="0.85"
          >
            CHATTOGRAM OUTER ANCHORAGE (ALPHA/BRAVO)
          </text>

          {/* Karnaphuli River Navigation Channel */}
          {/* Path from Bay into the terminal quayside */}
          <path
            d="M 180,480 Q 260,390 350,300 Q 420,230 520,160 Q 580,120 660,80 L 710,95 Q 610,140 540,190 Q 450,260 380,330 Q 300,410 240,510 Z"
            fill="url(#riverGrad)"
            stroke="#10B981"
            strokeWidth="1"
            strokeOpacity="0.3"
          />

          {/* Channel Fairway Center Line */}
          <path
            d="M 210,495 Q 280,400 365,315 Q 435,245 530,175 Q 595,130 685,88"
            fill="none"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeDasharray="6 4"
            strokeOpacity="0.4"
          />

          {/* Quayside Pier & Berth Line */}
          <g>
            {berths.map((b, i) => {
              const bx = lonToX(b.lon);
              const by = latToY(b.lat);
              const isOccupied = currentFrame.vessels.some(
                (v) => v.state === "BERTHED_WORKING" && v.berth_code === b.code
              );

              return (
                <g key={b.code} className="cursor-pointer">
                  {/* Berth Docking Pad */}
                  <rect
                    x={bx - 18}
                    y={by - 12}
                    width="36"
                    height="24"
                    rx="6"
                    fill={isOccupied ? "#10B981" : "#0E3520"}
                    fillOpacity={isOccupied ? "0.25" : "0.7"}
                    stroke={isOccupied ? "#10B981" : "#059669"}
                    strokeWidth={isOccupied ? "1.8" : "1"}
                  />
                  {/* STS Crane Gantry representation */}
                  <line
                    x1={bx - 12}
                    y1={by - 16}
                    x2={bx + 12}
                    y2={by - 16}
                    stroke="#F59E0B"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1={bx}
                    y1={by - 16}
                    x2={bx}
                    y2={by - 10}
                    stroke="#F59E0B"
                    strokeWidth="1.5"
                  />
                  {/* Label */}
                  <text
                    x={bx}
                    y={by + 3}
                    textAnchor="middle"
                    fill={isOccupied ? "#A7F3D0" : "#6EE7B7"}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {b.name}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Render Vessels according to current frame */}
          {filteredVessels.map((v) => {
            const vx = lonToX(v.lon);
            const vy = latToY(v.lat);
            const isSelected = selectedVessel?.vessel_id === v.vessel_id;

            // Color coding based on operational state
            let shipColor = "#F59E0B"; // Anchorage wait: Amber
            let stateLabel = "WAITING";
            if (v.state === "INWARD_TRANSIT") {
              shipColor = "#38BDF8"; // Transit: Sky
              stateLabel = "INWARD";
            } else if (v.state === "BERTHED_WORKING") {
              shipColor = "#10B981"; // Berthed: Emerald
              stateLabel = "BERTHED";
            } else if (v.state === "OUTWARD_TRANSIT") {
              shipColor = "#818CF8"; // Outward: Indigo
              stateLabel = "OUTWARD";
            }

            return (
              <g
                key={v.vessel_id}
                transform={`translate(${vx}, ${vy})`}
                onClick={() => setSelectedVessel(v)}
                className="cursor-pointer transition-transform duration-300 hover:scale-125"
              >
                {/* Ping wave pulse for waiting vessels */}
                {v.state === "ANCHORAGE_WAITING" && (
                  <circle
                    r="12"
                    fill="none"
                    stroke={shipColor}
                    strokeWidth="1"
                    strokeOpacity="0.4"
                    className="animate-ping"
                  />
                )}

                {/* Vessel Heading Vector Icon */}
                <g transform={`rotate(${v.heading})`}>
                  {/* Ship hull polygon */}
                  <path
                    d="M 0,-10 L 4,-3 L 4,8 L -4,8 L -4,-3 Z"
                    fill={shipColor}
                    stroke="#0F172A"
                    strokeWidth="1"
                    filter={isSelected ? "url(#glow)" : undefined}
                  />
                  {/* Wheelhouse */}
                  <rect x="-2" y="2" width="4" height="4" fill="#0F172A" rx="1" />
                </g>

                {/* Vessel Name Tag */}
                <text
                  x="0"
                  y="18"
                  textAnchor="middle"
                  fill="#E2E8F0"
                  fontSize="8"
                  fontWeight="600"
                  className="pointer-events-none drop-shadow"
                >
                  {v.vessel_name.split(" ")[1] || v.vessel_name.slice(0, 8)}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Selected Vessel Inspector Overlay Card */}
        {selectedVessel && (
          <div className="absolute top-16 right-4 z-30 w-72 bg-slate-900/95 backdrop-blur-xl border border-sky-500/40 rounded-2xl p-4 shadow-xl text-xs space-y-2.5 animate-in fade-in slide-in-from-right-4 font-sans">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                  Vessel Trajectory Inspector
                </span>
                <h4 className="font-bold text-white text-sm">
                  {selectedVessel.vessel_name}
                </h4>
              </div>
              <button
                onClick={() => setSelectedVessel(null)}
                className="text-slate-400 hover:text-white text-base leading-none p-1"
              >
                &times;
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block">Current State</span>
                <span className="font-semibold text-sky-300">
                  {selectedVessel.state.replace("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Speed / Heading</span>
                <span className="font-medium text-slate-200 tabular-nums">
                  {selectedVessel.speed_knots} kts | {selectedVessel.heading}°
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Wait at Anchor</span>
                <span className="font-semibold text-amber-400 tabular-nums">
                  {selectedVessel.waiting_hours.toFixed(1)} hrs
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Assigned Berth</span>
                <span className="font-semibold text-sky-300">
                  {selectedVessel.berth_code || "Pending Quay"}
                </span>
              </div>
            </div>

            {selectedVessel.state === "BERTHED_WORKING" && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-slate-300">
                  <span>Cargo Handling Progress</span>
                  <span className="tabular-nums font-bold text-sky-400">{selectedVessel.cargo_progress_pct}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500"
                    style={{ width: `${selectedVessel.cargo_progress_pct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legend strip on map bottom-left */}
        <div className="absolute bottom-20 left-4 z-20 flex items-center gap-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[10px] text-slate-300 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Anchorage Waiting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400"></span>
            <span>Channel Transit</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-300"></span>
            <span>Berthed Working</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Outward Bound</span>
          </div>
        </div>
      </div>

      {/* Bottom Simulation Playback Scrubber Bar */}
      <div className="bg-slate-950 border-t border-slate-800 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onHourChange(0)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset to Hour 0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={onTogglePlay}
            className="flex items-center justify-center h-9 w-9 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md transition-all active:scale-95"
            title={isPlaying ? "Pause Timeline" : "Play Timeline"}
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 fill-current" />
            ) : (
              <Play className="h-4 w-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Speed Toggles */}
          <div className="flex items-center gap-1 bg-slate-850 p-1 rounded-xl border border-slate-800">
            {[1, 2, 5, 10].map((speed) => (
              <button
                key={speed}
                onClick={() => onSpeedChange(speed)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                  playbackSpeed === speed
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Slider with Clock */}
        <div className="flex-1 w-full flex items-center gap-3 max-w-xl">
          <span className="text-sky-400 font-bold text-xs shrink-0 w-28 tabular-nums">
            +{currentHour.toFixed(1)}h / {simulationRun.duration_hours}h
          </span>

          <input
            type="range"
            min={0}
            max={simulationRun.duration_hours}
            step={0.5}
            value={currentHour}
            onChange={(e) => onHourChange(parseFloat(e.target.value))}
            className="w-full accent-sky-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />

          <span className="text-[10px] text-slate-400 font-medium shrink-0 hidden md:inline">
            Day {Math.floor(currentHour / 24) + 1}
          </span>
        </div>

        {/* Current State Summary Snapshot */}
        <div className="flex items-center gap-3 text-[11px] text-slate-300 font-medium shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Anchor:</span>
            <span className="font-bold text-amber-400 tabular-nums">{waitingCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Berths:</span>
            <span className="font-bold text-sky-400 tabular-nums">{currentFrame.occupied_berths}/6</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-400">Yard:</span>
            <span className="font-bold text-indigo-300 tabular-nums">{currentFrame.yard_occupancy_pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
