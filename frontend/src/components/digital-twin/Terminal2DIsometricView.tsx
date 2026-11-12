"use client";

import React, { useState } from "react";
import {
  Ship,
  Anchor,
  Compass,
  Waves,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Boxes,
  Cpu,
  ShieldAlert,
  Thermometer,
  Layers,
} from "lucide-react";
import { BerthRead, VesselCallRead, EquipmentRead, YardBlockRead } from "@/types/api";
import { SelectedEntity } from "./types";

interface Terminal2DIsometricViewProps {
  berths: BerthRead[];
  vesselCalls: VesselCallRead[];
  equipment: EquipmentRead[];
  yardBlocks: YardBlockRead[];
  selectedEntity: SelectedEntity | null;
  onSelectEntity: (entity: SelectedEntity) => void;
}

export function Terminal2DIsometricView({
  berths,
  vesselCalls,
  equipment,
  yardBlocks,
  selectedEntity,
  onSelectEntity,
}: Terminal2DIsometricViewProps) {
  const [zoom, setZoom] = useState(1.0);

  // 12 PCT Blocks Reference Data
  const blocks = [
    { code: "C01", name: "Block C01", type: "IMPORT", occupancy: 82, teu: 4120, maxTeu: 5000, risk: "WATCH" },
    { code: "C02", name: "Block C02", type: "IMPORT", occupancy: 78, teu: 3900, maxTeu: 5000, risk: "NORMAL" },
    { code: "C03", name: "Block C03", type: "EXPORT", occupancy: 71, teu: 3550, maxTeu: 5000, risk: "NORMAL" },
    { code: "C04", name: "Block C04", type: "EXPORT", occupancy: 65, teu: 3250, maxTeu: 5000, risk: "NORMAL" },
    { code: "C05", name: "Block C05", type: "TRANSSHIPMENT", occupancy: 58, teu: 2900, maxTeu: 5000, risk: "NORMAL" },
    { code: "C06", name: "Block C06", type: "EMPTY", occupancy: 42, teu: 2100, maxTeu: 5000, risk: "NORMAL" },
    { code: "C07", name: "Block C07", type: "IMPORT", occupancy: 85, teu: 4250, maxTeu: 5000, risk: "WATCH" },
    { code: "C08", name: "Block C08", type: "EXPORT", occupancy: 74, teu: 3700, maxTeu: 5000, risk: "NORMAL" },
    { code: "C09", name: "Block C09", type: "EXPORT", occupancy: 69, teu: 3450, maxTeu: 5000, risk: "NORMAL" },
    { code: "C10", name: "Block C10", type: "EMPTY", occupancy: 35, teu: 1750, maxTeu: 5000, risk: "NORMAL" },
    { code: "C11", name: "Block C11", type: "REEFER", occupancy: 94, teu: 420, maxTeu: 450, risk: "CRITICAL" },
    { code: "C12", name: "Block C12", type: "HAZARDOUS_IMO", occupancy: 48, teu: 960, maxTeu: 2000, risk: "NORMAL" },
  ];

  // 6 Illustrative Quayside Berths
  const berthList = [
    { code: "CCT-01", name: "CCT Berth 01", length: 210, depth: 11.2, vessel: "MV Maersk Karun", status: "MOORED", draft: 9.4, moves: 54 },
    { code: "CCT-02", name: "CCT Berth 02", length: 190, depth: 10.8, vessel: "CMA CGM Bengal", status: "INGRESS", draft: 9.2, moves: 48 },
    { code: "NCT-01", name: "NCT Berth 01", length: 225, depth: 11.5, vessel: "Ever Apex", status: "DISCHARGING", draft: 9.8, moves: 52 },
    { code: "NCT-02", name: "NCT Berth 02", length: 200, depth: 10.5, vessel: "OOCL Singapore", status: "APPROACHING", draft: 10.4, moves: 0 },
    { code: "NCT-03", name: "NCT Berth 03", length: 180, depth: 9.0, vessel: "X-Press Bengal", status: "STANDBY", draft: 8.4, moves: 36 },
    { code: "GCB-01", name: "GCB Berth 01", length: 175, depth: 8.8, vessel: "MV Kota Hening", status: "BUNKERING", draft: 8.2, moves: 28 },
  ];

  const handleZoomIn = () => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))));
  const handleZoomOut = () => setZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(2))));
  const handleResetZoom = () => setZoom(1.0);

  return (
    <div className="relative w-full h-full bg-[#0A0C10] overflow-y-auto select-none p-4 sm:p-6 pr-0 xl:pr-88 pb-28 space-y-6">
      {/* Schematic Context Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08] text-xs font-mono">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-white font-bold">2D ISOMETRIC VECTOR SCHEMATIC</span>
          <span className="text-[#64748b]">•</span>
          <span className="text-[#8e9bae]">KARNAPHULI REACH ESTUARY</span>
          <span className="text-[#64748b]">•</span>
          <span className="text-secondary font-semibold">DATUM CD +0.0m</span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#161922] border border-white/[0.08] rounded-lg px-2.5 py-1 shadow-xs">
          <span className="text-[10px] text-[#8e9bae] uppercase">Zoom</span>
          <button
            onClick={handleZoomOut}
            disabled={zoom <= 0.7}
            className="p-1 rounded text-[#8e9bae] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="font-bold text-white text-[11px] w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            disabled={zoom >= 1.4}
            className="p-1 rounded text-[#8e9bae] hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          {zoom !== 1.0 && (
            <button
              onClick={handleResetZoom}
              className="p-1 rounded text-primary hover:text-white hover:bg-white/[0.06] transition-colors ml-1"
              title="Reset Zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Scaled Diagram Container */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: "top center",
          transition: "transform 160ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="space-y-6 max-w-6xl mx-auto"
      >
        {/* SECTION 1: KARNAPHULI FAIRWAY APPROACH & WATER CHANNEL */}
        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08] space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 font-bold text-secondary">
              <Waves className="h-4 w-4 text-secondary" />
              <span>KARNAPHULI NAVIGATION CHANNEL &amp; FAIRWAY INGRESS</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#8e9bae]">
              <span>Channel Dredged: <strong className="text-white">11.2m LAT</strong></span>
              <span>•</span>
              <span>Flow Stream: <strong className="text-secondary">Ebb 2.8 kts</strong></span>
              <span>•</span>
              <span>UKC Buffer: <strong className="text-[#4edea3]">+0.60m Safe</strong></span>
            </div>
          </div>

          {/* Navigational Channel Waterway Canvas Graphic */}
          <div className="relative h-20 rounded-lg bg-gradient-to-r from-[#0d1e2e] via-[#102a43] to-[#0d1e2e] border border-cyan-500/20 p-3 flex items-center justify-between overflow-hidden">
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:16px_16px]" />
            
            {/* Buoys Strip */}
            <div className="relative z-10 flex items-center justify-around w-full text-[10px] font-mono">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#091522]/90 border border-emerald-500/40 text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Buoy #1 (Outer Bar)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#091522]/90 border border-emerald-500/40 text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Buoy #3 (Patenga Cut)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#091522]/90 border border-rose-500/40 text-rose-400">
                <span className="size-2 rounded-full bg-rose-400 animate-ping" />
                <span>Buoy #4 (Gupta Bend Restricted)</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#091522]/90 border border-emerald-500/40 text-emerald-400">
                <span className="size-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Buoy #6 (NCT Ingress Gate)</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: QUAYSIDE BERTH LINE & GANTRY CRANES */}
        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08] space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 font-bold text-white">
              <Anchor className="h-4 w-4 text-primary" />
              <span>580M CONTINUOUS QUAYSIDE COPING &amp; BERTH SLOTS</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#8e9bae]">
              <span>6 Active Berths</span>
              <span>•</span>
              <span className="text-secondary font-bold">88.4% Quayside Utilization</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {berthList.map((berth) => {
              const isSelected = selectedEntity?.id === berth.code || selectedEntity?.id === berth.vessel;
              return (
                <div
                  key={berth.code}
                  onClick={() =>
                    onSelectEntity({
                      type: "berth",
                      id: berth.code,
                      data: { ...berth },
                    })
                  }
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1f2430] border-primary-container ring-1 ring-primary-container shadow-md"
                      : "bg-[#161922] border-white/[0.06] hover:border-white/20 hover:bg-[#1a1d28]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white font-mono">{berth.code}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        berth.status === "MOORED"
                          ? "bg-secondary-container/20 text-secondary border-secondary-container/30"
                          : berth.status === "DISCHARGING"
                          ? "bg-sky-500/20 text-sky-400 border-sky-500/30"
                          : berth.status === "INGRESS"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-white/10 text-white border-white/20"
                      }`}
                    >
                      {berth.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-white mb-1.5 truncate">
                    <Ship className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{berth.vessel}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-[#8e9bae] pt-2 border-t border-white/[0.04]">
                    <div>LOA: <span className="text-white font-bold">{berth.length}m</span></div>
                    <div>Draft: <span className="text-white font-bold">{berth.draft}m</span></div>
                    <div>Rate: <span className="text-secondary font-bold">{berth.moves}m/h</span></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 3: 12 CONTAINER YARD BLOCKS IN ISOMETRIC GRID */}
        <div className="p-4 rounded-xl bg-[#111318] border border-white/[0.08] space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 font-bold text-white">
              <Boxes className="h-4 w-4 text-secondary" />
              <span>12 CONTAINER STACKING BLOCKS (C01 - C12)</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#8e9bae]">
              <span>Stack Saturation: <strong className="text-amber-400">74.2%</strong></span>
              <span>•</span>
              <span>Reefer Plug Saturation: <strong className="text-rose-400 font-bold">94% Alert</strong></span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {blocks.map((b) => {
              const isSelected = selectedEntity?.id === b.code;
              return (
                <div
                  key={b.code}
                  onClick={() =>
                    onSelectEntity({
                      type: "yard",
                      id: b.code,
                      data: { ...b },
                    })
                  }
                  className={`p-3 rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1f2430] border-secondary ring-1 ring-secondary shadow-md"
                      : "bg-[#161922] border-white/[0.06] hover:border-white/20 hover:bg-[#1a1d28]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-white font-mono">{b.code}</span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        b.risk === "CRITICAL"
                          ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                          : b.risk === "WATCH"
                          ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                          : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      }`}
                    >
                      {b.type}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono font-bold text-white mb-2">
                    {b.teu.toLocaleString()} <span className="text-[9px] text-[#8e9bae] font-normal">/ {b.maxTeu.toLocaleString()} TEU</span>
                  </div>

                  {/* Occupancy Progress Bar */}
                  <div className="w-full h-1.5 bg-[#222734] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        b.occupancy >= 90
                          ? "bg-rose-500"
                          : b.occupancy >= 80
                          ? "bg-amber-400"
                          : "bg-secondary"
                      }`}
                      style={{ width: `${b.occupancy}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#8e9bae] mt-1.5">
                    <span>Saturation</span>
                    <span className="font-bold text-white">{b.occupancy}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
