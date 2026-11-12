"use client";

import React, { useState } from "react";
import {
  Radar,
  Compass,
  Play,
  Pause,
  Plus,
  Minus,
  Crosshair,
  Layers,
  Anchor,
  Navigation,
  MapPin,
  Globe2,
} from "lucide-react";
import { GeospatialPortMap } from "@/components/geospatial/GeospatialPortMap";

interface EcdisRadarCanvasCardProps {
  onSelectVessel?: (vesselName: string) => void;
  selectedVessel?: string;
}

export function EcdisRadarCanvasCard({
  onSelectVessel,
  selectedVessel = "MV OOCL Singapore",
}: EcdisRadarCanvasCardProps) {
  const [viewMode, setViewMode] = useState<"ecdis" | "polar">("ecdis");
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<"1x" | "5x" | "10x">("1x");
  const [rangeNm, setRangeNm] = useState(6.0);

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.08] shadow-2xl overflow-hidden flex flex-col select-none">
      {/* Header with Navigational Metrics & Radar Tools */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#161922] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Radar className="h-4 w-4 text-primary" />
          <span className="text-xs sm:text-sm font-bold font-mono text-white uppercase tracking-wider">
            ECDIS S-57 Vector Radar &amp; Geospatial Chart
          </span>
        </div>

        {/* View Mode Switcher Pill */}
        <div className="flex items-center gap-1 bg-[#0c0e12] p-1 rounded-lg border border-white/[0.08] text-[10px] font-mono">
          <button
            onClick={() => setViewMode("ecdis")}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
              viewMode === "ecdis"
                ? "bg-primary-container text-white font-bold shadow-xs"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            <Globe2 className="h-3 w-3" />
            <span>GIS Chart (MapLibre)</span>
          </button>
          <button
            onClick={() => setViewMode("polar")}
            className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all ${
              viewMode === "polar"
                ? "bg-secondary-container/40 text-secondary font-bold shadow-xs"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            <Radar className="h-3 w-3" />
            <span>Polar Sweep (PPI)</span>
          </button>
        </div>

        {/* Dynamic Navigational Telemetry */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-[#8e9bae]">
          <span className="hidden xl:inline">
            PATENGA ANCHORAGE → GUPTA BEND → NCT REACH
          </span>
          <span className="text-white">HDG 042° TRUE</span>
          <span>RANGE {rangeNm.toFixed(1)} NM</span>
          <span className="text-secondary font-bold">WATERWAY DREDGED 11.2M</span>
        </div>

        {/* Zoom & Layer Floating Controls */}
        <div className="flex items-center gap-1 bg-[#222530] p-0.5 rounded-lg border border-white/[0.08]">
          <button
            onClick={() => setRangeNm((r) => Math.max(2, r - 1))}
            className="p-1 hover:text-white text-[#8e9bae] transition-colors"
            title="Zoom In (Decrease Range)"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setRangeNm((r) => Math.min(12, r + 1))}
            className="p-1 hover:text-white text-[#8e9bae] transition-colors"
            title="Zoom Out (Increase Range)"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1 hover:text-white text-[#8e9bae] transition-colors"
            title="Center Radar on CPA Ingress Gate"
          >
            <Crosshair className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Main Viewport: Mode 1 - Real GIS MapLibre Map */}
      {viewMode === "ecdis" && (
        <div className="relative h-[440px] bg-[#08090d] overflow-hidden">
          <GeospatialPortMap
            height="h-[440px]"
            className="w-full h-full"
            onSelectEntity={(entity) => {
              if (entity.data && (entity.data as any).name) {
                onSelectVessel?.((entity.data as any).name);
              }
            }}
          />
        </div>
      )}

      {/* Main Viewport: Mode 2 - Polar Radar PPI Scope Canvas */}
      {viewMode === "polar" && (
        <div className="relative h-[380px] sm:h-[440px] bg-[#08090d] overflow-hidden p-4">
          {/* Polar Radar Range Rings and Angular Graticule */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
            <defs>
              <linearGradient id="radarSweep" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#16a394" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#16a394" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Polar Circles from Center (60% x, 45% y) */}
            <circle cx="60%" cy="45%" r="70" fill="none" stroke="#223344" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="60%" cy="45%" r="140" fill="none" stroke="#223344" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="60%" cy="45%" r="220" fill="none" stroke="#223344" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="60%" cy="45%" r="300" fill="none" stroke="#223344" strokeWidth="1" strokeDasharray="4 4" />

            {/* Range Labels */}
            <text x="61%" y="36%" fill="#556677" fontSize="9" fontFamily="monospace">1 NM</text>
            <text x="61%" y="24%" fill="#556677" fontSize="9" fontFamily="monospace">2 NM</text>
            <text x="61%" y="12%" fill="#556677" fontSize="9" fontFamily="monospace">3 NM</text>

            {/* Karnaphuli Channel Navigational Fairway Corridor Path */}
            <path
              d="M 120 420 C 220 380, 360 320, 480 240 C 580 180, 720 140, 950 110"
              fill="none"
              stroke="#16a394"
              strokeWidth="28"
              strokeOpacity="0.12"
              strokeLinecap="round"
            />
            <path
              d="M 120 420 C 220 380, 360 320, 480 240 C 580 180, 720 140, 950 110"
              fill="none"
              stroke="#16a394"
              strokeWidth="1.5"
              strokeDasharray="6 4"
              strokeOpacity="0.4"
            />
          </svg>

          {/* TARGET 1: MV OOCL SINGAPORE (Critical Draft / Inbound Focus) */}
          <div
            onClick={() => onSelectVessel && onSelectVessel("MV OOCL Singapore")}
            className="absolute top-[48%] left-[32%] group cursor-pointer transition-transform hover:scale-105 z-20"
          >
            <div className="relative">
              <div className="size-4 text-primary transform rotate-45 mb-1 animate-pulse">
                <Navigation className="w-full h-full fill-primary-container text-primary-container" />
              </div>
              <div className="bg-[#0c0e12]/92 backdrop-blur-md border border-primary-container/80 rounded-lg px-2.5 py-1.5 shadow-2xl text-[10px] font-mono">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <span className="size-1.5 rounded-full bg-primary-container" />
                  <span>OOCL SINGAPORE</span>
                </div>
                <div className="text-[#8e9bae] mt-0.5">
                  SPD <strong className="text-white">8.4 kts</strong> DFT <strong className="text-white">10.4m</strong>{" "}
                  <span className="text-secondary font-semibold">PILOT ACTIVE</span>
                </div>
                <div className="text-[9px] text-[#64748b]">B-04 Gupta Port (FL.R.3s)</div>
              </div>
            </div>
          </div>

          {/* TARGET 2: PACIFIC ENDEAVOR (Outbound Bulk Carrier) */}
          <div
            onClick={() => onSelectVessel && onSelectVessel("Pacific Endeavor")}
            className="absolute top-[28%] left-[44%] group cursor-pointer transition-transform hover:scale-105 z-10"
          >
            <div className="relative">
              <div className="size-3.5 text-amber-400 transform -rotate-135 mb-1">
                <Navigation className="w-full h-full fill-amber-400 text-amber-400" />
              </div>
              <div className="bg-[#0c0e12]/85 backdrop-blur-md border border-amber-500/40 rounded-lg px-2 py-1 shadow-lg text-[9px] font-mono">
                <div className="font-bold text-white">PACIFIC ENDEAVOR</div>
                <div className="text-[#8e9bae]">
                  SPD <strong className="text-white">6.2 kts</strong> <span className="text-amber-400">OUTBOUND</span>
                </div>
                <div className="text-[8px] text-[#64748b]">11.8m NCT Terminal Reach</div>
              </div>
            </div>
          </div>

          {/* TARGET 3: WAN HAI 316 (Approaching Pilot Boarding) */}
          <div
            onClick={() => onSelectVessel && onSelectVessel("MV Wan Hai 316")}
            className="absolute top-[65%] left-[16%] group cursor-pointer transition-transform hover:scale-105 z-10"
          >
            <div className="relative">
              <div className="size-3 text-secondary transform rotate-30 mb-1">
                <Navigation className="w-full h-full fill-secondary text-secondary" />
              </div>
              <div className="bg-[#0c0e12]/85 backdrop-blur-md border border-secondary/40 rounded-lg px-2 py-1 shadow-lg text-[9px] font-mono">
                <div className="font-bold text-white">WAN HAI 316</div>
                <div className="text-[#8e9bae]">
                  SPD <strong className="text-white">10.1 kts</strong> DFT <strong className="text-white">9.1m</strong>
                </div>
                <div className="text-[8px] text-[#64748b]">12.1m Outer Fairway</div>
              </div>
            </div>
          </div>

          {/* Station Alpha: Patenga Pilot Boarding Ground */}
          <div className="absolute bottom-6 left-6 p-2 rounded-lg bg-[#0c0e12]/90 border border-white/[0.08] backdrop-blur-md text-[9px] font-mono">
            <div className="flex items-center gap-1.5 text-secondary font-bold">
              <Anchor className="size-3" />
              <span>STATION ALPHA</span>
            </div>
            <div className="text-white font-semibold">Patenga Pilot Boarding Ground</div>
            <div className="text-[#8e9bae]">2 Tugs On Standby • Calm Sea State</div>
          </div>
        </div>
      )}

      {/* Fairway Timeline Bar */}
      <div className="p-3 bg-[#111318] border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-[#1e2024] hover:bg-[#282a2e] text-white transition-colors border border-white/[0.06]"
          >
            {isPlaying ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
          </button>
          <div className="flex items-center bg-[#1e2024] rounded-lg p-0.5 border border-white/[0.06] text-[10px]">
            {(["1x", "5x", "10x"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-0.5 rounded transition-all ${
                  speed === s ? "bg-primary-container text-white font-bold" : "text-[#8e9bae] hover:text-white"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <span className="text-[#8e9bae] text-[11px] ml-2">
            PLAYBACK: <strong className="text-white">13:28:45 BST</strong> (-01:12h Actual)
          </span>
        </div>

        {/* Tidal Window Progress Indicator */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-[10px] text-[#8e9bae]">
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-rose-500" />
              Deep Draft (&gt;10.0m)
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-secondary" />
              Pilot Aboard
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-amber-500" />
              Inbound Queue
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2 rounded-full bg-sky-500" />
              Outbound
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[10px]">
            <span className="text-[#8e9bae]">12:00</span>
            <div className="w-32 h-1.5 bg-[#222530] rounded-full overflow-hidden flex">
              <div className="w-1/4 bg-rose-500" />
              <div className="w-1/3 bg-secondary" />
              <div className="w-1/5 bg-amber-500" />
            </div>
            <span className="text-[#8e9bae]">16:00 (High Tide Peak)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
