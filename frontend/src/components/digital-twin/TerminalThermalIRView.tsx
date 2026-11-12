"use client";

import React, { useState } from "react";
import {
  Flame,
  Thermometer,
  Crosshair,
  AlertTriangle,
  Activity,
  Layers,
  Eye,
  Sliders,
} from "lucide-react";
import { SelectedEntity } from "./types";

interface ThermalHotspot {
  id: string;
  name: string;
  type: string;
  temp: number;
  delta: number;
  status: "NORMAL" | "WARNING" | "CRITICAL";
  location: string;
  component: string;
  xPct: number; // percentage coordinate on thermal canvas
  yPct: number;
}

interface TerminalThermalIRViewProps {
  selectedEntity: SelectedEntity | null;
  onSelectEntity: (entity: SelectedEntity) => void;
}

export function TerminalThermalIRView({
  selectedEntity,
  onSelectEntity,
}: TerminalThermalIRViewProps) {
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>("STS-02");
  const [paletteMode, setPaletteMode] = useState<"ironbow" | "whitehot" | "blackhot">("ironbow");

  const hotspots: ThermalHotspot[] = [
    {
      id: "STS-02",
      name: "STS Crane #02",
      type: "crane",
      temp: 54.2,
      delta: 25.8,
      status: "WARNING",
      location: "Quayside Rail CCT-01",
      component: "Hydraulic Main Pump Core",
      xPct: 52,
      yPct: 38,
    },
    {
      id: "STS-01",
      name: "STS Crane #01",
      type: "crane",
      temp: 41.8,
      delta: 13.4,
      status: "NORMAL",
      location: "Quayside Rail CCT-01",
      component: "Hoist Motor Bearing",
      xPct: 44,
      yPct: 39,
    },
    {
      id: "STS-03",
      name: "STS Crane #03",
      type: "crane",
      temp: 38.2,
      delta: 9.8,
      status: "NORMAL",
      location: "Quayside Rail CCT-02",
      component: "Trolley Drive Gearbox",
      xPct: 62,
      yPct: 40,
    },
    {
      id: "MV-MAERSK-KARUN",
      name: "MV Maersk Karun",
      type: "vessel",
      temp: 62.4,
      delta: 34.0,
      status: "WARNING",
      location: "Berth CCT-01",
      component: "Auxiliary Diesel Generator Exhaust",
      xPct: 36,
      yPct: 52,
    },
    {
      id: "BLOCK-C11",
      name: "Reefer Block C11",
      type: "yard",
      temp: 38.6,
      delta: 10.2,
      status: "NORMAL",
      location: "Yard Stacking Block C11",
      component: "420x Compressor Heat Banks",
      xPct: 70,
      yPct: 65,
    },
    {
      id: "WATER-ESTUARY",
      name: "Karnaphuli Channel",
      type: "channel",
      temp: 28.4,
      delta: 0.0,
      status: "NORMAL",
      location: "Channel Fairway",
      component: "Surface Water Ambient Datum",
      xPct: 22,
      yPct: 60,
    },
  ];

  const activeHotspot = hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0];

  const handleSelectHotspot = (h: ThermalHotspot) => {
    setSelectedHotspotId(h.id);
    onSelectEntity({
      type: (h.type as any) || "crane",
      id: h.id,
      data: { ...h },
    });
  };

  return (
    <div className="relative w-full h-full bg-[#050811] text-[#e2e2e8] select-none flex flex-col overflow-hidden">
      {/* 1. FLIR Top Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-2 border-b border-white/[0.08] bg-[#070b16] text-xs font-mono z-20 shrink-0 pr-4 xl:pr-[360px]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <Flame className="h-4 w-4 text-rose-500 animate-pulse" />
            <span>FLIR SEA-FLIR 280-HD</span>
          </div>
          <span className="text-[#64748b]">•</span>
          <span className="text-[#8e9bae]">LWIR 8-14 µm</span>
          <span className="text-[#64748b]">•</span>
          <span className="text-[#8e9bae]">EMISSIVITY: <strong className="text-white">0.95</strong></span>
          <span className="text-[#64748b]">•</span>
          <span className="text-[#8e9bae]">FOV: <strong className="text-white">24° x 18°</strong></span>
        </div>

        {/* Palette Controls */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#8e9bae] uppercase">Palette:</span>
          <div className="flex items-center bg-[#111624] p-0.5 rounded-lg border border-white/[0.08]">
            <button
              onClick={() => setPaletteMode("ironbow")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                paletteMode === "ironbow"
                  ? "bg-gradient-to-r from-purple-700 via-rose-600 to-amber-400 text-white shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              Ironbow FLIR
            </button>
            <button
              onClick={() => setPaletteMode("whitehot")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                paletteMode === "whitehot"
                  ? "bg-white text-black font-bold shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              White-Hot
            </button>
            <button
              onClick={() => setPaletteMode("blackhot")}
              className={`px-2.5 py-0.5 rounded text-[11px] font-semibold transition-colors ${
                paletteMode === "blackhot"
                  ? "bg-black text-white font-bold border border-white/20 shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              Black-Hot
            </button>
          </div>
        </div>
      </div>

      {/* 2. Main Thermal Viewport Area */}
      <div className="relative flex-1 w-full overflow-hidden flex items-center justify-center">
        {/* Synthetic Thermal Infrared Quayside Backdrop */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${
            paletteMode === "whitehot"
              ? "bg-gradient-to-br from-slate-900 via-slate-700 to-slate-900"
              : paletteMode === "blackhot"
              ? "bg-gradient-to-br from-slate-200 via-slate-400 to-slate-200"
              : "bg-gradient-to-br from-[#060a17] via-[#1a0b2e] to-[#0d071c]"
          }`}
        >
          {/* Thermal Noise / Scanline Texture */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255, 255, 255, 0.05) 50%, rgba(0, 0, 0, 0.4) 50%)",
              backgroundSize: "100% 4px",
            }}
          />
        </div>

        {/* Tactical Crosshair Targeting HUD Overlay */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Concentric FLIR reticle rings */}
          <div className="size-48 sm:size-64 rounded-full border border-rose-500/30 flex items-center justify-center">
            <div className="size-24 sm:size-32 rounded-full border border-amber-400/40 flex items-center justify-center">
              <Crosshair className="size-10 text-rose-500 animate-pulse" />
            </div>
          </div>

          {/* Crosshair target lines */}
          <div className="absolute w-full h-[1px] bg-rose-500/20" />
          <div className="absolute h-full w-[1px] bg-rose-500/20" />
        </div>

        {/* Real-Time Active Target Readout Box */}
        <div className="absolute top-6 left-6 z-20 p-3 rounded-xl bg-[#090e1d]/90 border border-rose-500/40 backdrop-blur-md shadow-2xl font-mono space-y-1.5 max-w-sm">
          <div className="flex items-center justify-between text-[10px] text-[#8e9bae]">
            <span className="flex items-center gap-1.5 text-rose-400 font-bold uppercase">
              <span className="size-2 rounded-full bg-rose-500 animate-ping" />
              RETICLE LOCK: {activeHotspot.id}
            </span>
            <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold">
              {activeHotspot.status}
            </span>
          </div>

          <div className="text-base font-bold text-white flex items-center justify-between">
            <span>{activeHotspot.name}</span>
            <span className="text-xl font-extrabold text-amber-400">
              {activeHotspot.temp.toFixed(1)}°C
            </span>
          </div>

          <div className="text-[11px] text-[#8e9bae]">
            Target Component: <strong className="text-white">{activeHotspot.component}</strong>
          </div>
          <div className="text-[11px] text-[#8e9bae]">
            Delta to Water Ambient: <strong className="text-rose-400">+{activeHotspot.delta.toFixed(1)}°C</strong>
          </div>
          <div className="text-[10px] text-[#64748b]">
            Location: {activeHotspot.location}
          </div>
        </div>

        {/* Interactive Hotspot Beacon Pins across the Quayside */}
        {hotspots.map((h) => {
          const isActive = h.id === selectedHotspotId;
          return (
            <button
              key={h.id}
              onClick={() => handleSelectHotspot(h)}
              style={{ left: `${h.xPct}%`, top: `${h.yPct}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 group transition-transform ${
                isActive ? "scale-110 z-30" : "hover:scale-105"
              }`}
            >
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border shadow-lg transition-all ${
                  isActive
                    ? "bg-rose-600 text-white border-white ring-2 ring-rose-400 animate-pulse"
                    : h.status === "WARNING"
                    ? "bg-[#1f1018]/90 text-amber-400 border-amber-500/50 hover:border-amber-400"
                    : "bg-[#0a1122]/90 text-cyan-400 border-cyan-500/40 hover:border-cyan-300"
                }`}
              >
                <Thermometer className="size-3" />
                <span>{h.name}</span>
                <span className="font-extrabold">{h.temp.toFixed(1)}°C</span>
              </div>
            </button>
          );
        })}

        {/* Vertical Thermal Color Gradient Scale Legend Bar on Left (beneath targeting card) */}
        <div className="absolute left-6 top-64 z-20 flex items-center gap-2 p-2.5 rounded-xl bg-[#090e1d]/90 border border-white/[0.08] backdrop-blur-md shadow-2xl font-mono text-[10px]">
          <div className="w-3.5 h-48 rounded-full overflow-hidden bg-gradient-to-t from-[#060a17] via-[#9333ea] via-[#e11d48] via-[#f97316] to-[#ffffff] border border-white/20 shadow-inner" />
          <div className="h-48 flex flex-col justify-between text-[#8e9bae] py-0.5">
            <span className="text-white font-bold">+85°C</span>
            <span className="text-amber-400 font-bold">+65°C</span>
            <span className="text-rose-400 font-bold">+50°C</span>
            <span className="text-secondary font-bold">+38°C</span>
            <span className="text-sky-400 font-bold">+28°C</span>
            <span className="text-slate-400">+15°C</span>
            <span className="text-slate-500">-10°C</span>
          </div>
        </div>

        {/* Bottom Hotspot Quick Selection Strip (Elevated at bottom-32 to float cleanly above Hydrodynamics Bar) */}
        <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-1.5 rounded-xl bg-[#090e1d]/95 border border-white/[0.12] backdrop-blur-md shadow-2xl font-mono text-xs overflow-x-auto max-w-[90vw]">
          {hotspots.map((h) => {
            const isActive = h.id === selectedHotspotId;
            return (
              <button
                key={h.id}
                onClick={() => handleSelectHotspot(h)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/40 font-bold shadow-xs"
                    : "text-[#8e9bae] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <span
                  className={`size-2 rounded-full ${
                    h.status === "WARNING" ? "bg-amber-400 animate-pulse" : "bg-cyan-400"
                  }`}
                />
                <span>{h.name}</span>
                <span className="font-bold text-white">{h.temp.toFixed(1)}°C</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
