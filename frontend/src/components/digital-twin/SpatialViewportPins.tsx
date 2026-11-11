"use client";

import React, { useState } from "react";
import { ChevronDown, ArrowRight, Anchor, Cpu, Waves } from "lucide-react";

interface SpatialViewportPinsProps {
  onSelectEntity?: (name: string) => void;
}

export function SpatialViewportPins({ onSelectEntity }: SpatialViewportPinsProps) {
  const [selectedPin, setSelectedPin] = useState<string>("STS-02");

  const handleSelect = (name: string) => {
    setSelectedPin(name);
    if (onSelectEntity) onSelectEntity(name);
  };

  return (
    <div className="absolute inset-0 pointer-events-none select-none z-10 overflow-hidden">
      {/* 1. Waterway Current Vector Streamlines */}
      <div className="absolute top-[52%] left-[16%] flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0c0e12]/85 backdrop-blur-md border border-secondary/40 shadow-xl text-[11px] font-mono text-secondary pointer-events-auto cursor-pointer hover:border-secondary transition-all">
        <span className="inline-block size-2 rounded-full bg-secondary animate-ping" />
        <span>Channel Flow: Ebb 2.8 kts • Depth 13.4m LAT</span>
        <ArrowRight className="h-3.5 w-3.5" />
      </div>

      {/* 2. Spatial Vessel Marker: MV Maersk Karun */}
      <div
        onClick={() => handleSelect("MV Maersk Karun")}
        className="absolute top-[34%] left-[22%] group cursor-pointer transition-transform hover:scale-105 pointer-events-auto"
      >
        <div className="relative">
          {/* Vessel Tag Card */}
          <div className="flex items-center gap-2.5 bg-[#0c0e12]/92 backdrop-blur-md border border-primary-container/80 rounded-lg px-3 py-1.5 shadow-2xl">
            <div className="size-2 rounded-full bg-primary-container animate-pulse" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-wide">MV Maersk Karun</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 bg-primary-container/20 text-primary-fixed rounded">
                  BERTH CCT-01
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#8e9bae] flex items-center gap-1.5">
                <span>Draft: 9.40m</span>
                <span>•</span>
                <span>LOA: 260m</span>
                <span>•</span>
                <span className="text-secondary font-semibold">Tide Window Clear</span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 text-[#8e9bae] group-hover:text-white transition-colors" />
          </div>

          {/* Vertical Projection Needle Line */}
          <div className="w-px h-10 bg-gradient-to-b from-primary-container to-transparent mx-auto" />
          <div className="size-1.5 rounded-full bg-primary-container mx-auto -mt-1 ring-2 ring-primary-container/40" />
        </div>
      </div>

      {/* 3. Spatial Crane Marker: STS-02 (Active Target) */}
      <div
        onClick={() => handleSelect("STS-02")}
        className="absolute top-[22%] left-[44%] group cursor-pointer transition-transform hover:scale-105 pointer-events-auto"
      >
        <div className="relative">
          {/* Gantry Telemetry Tag */}
          <div className="bg-[#0c0e12]/95 backdrop-blur-md border border-secondary/90 rounded-lg px-3 py-2 shadow-2xl ring-2 ring-secondary/20">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-secondary" />
                <span className="text-xs font-bold text-white">STS-02 (ZPMC Dual)</span>
              </div>
              <span className="text-[10px] font-mono bg-secondary-container/30 text-secondary px-1.5 py-0.5 rounded font-semibold">
                SELECTED
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2.5 text-[11px] font-mono text-[#cbd5e1]">
              <span>
                Lift: <strong className="text-white">42.1 t</strong>
              </span>
              <span>•</span>
              <span>
                Moves: <strong className="text-white">34/hr</strong>
              </span>
              <span>•</span>
              <span className="text-secondary font-medium">Auto-Trolley</span>
            </div>
          </div>

          {/* Vertical Projection Needle Line */}
          <div className="w-px h-12 bg-gradient-to-b from-secondary to-transparent mx-auto" />
          <div className="size-2 rounded-full bg-secondary mx-auto -mt-1 ring-4 ring-secondary/30" />
        </div>
      </div>

      {/* 4. Spatial Crane Marker: STS-03 (Secondary Target) */}
      <div
        onClick={() => handleSelect("STS-03")}
        className="absolute top-[25%] left-[60%] opacity-85 hover:opacity-100 cursor-pointer pointer-events-auto transition-opacity"
      >
        <div className="relative">
          <div className="bg-[#0c0e12]/85 backdrop-blur-sm border border-white/10 rounded px-2.5 py-1 text-[11px] font-mono flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-secondary" />
            <span className="text-white font-medium">STS-03</span>
            <span className="text-[#8e9bae]">29 Moves/hr</span>
          </div>
          <div className="w-px h-6 bg-white/20 mx-auto" />
        </div>
      </div>

      {/* 5. Fairway Buoy Cardinal Marker */}
      <div className="absolute bottom-[36%] left-[8%] bg-[#0c0e12]/80 backdrop-blur-sm border border-white/10 rounded px-2.5 py-1 text-[10px] font-mono text-[#8e9bae] flex items-center gap-1.5 pointer-events-auto">
        <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-white font-medium">Buoy #4 Karnaphuli</span>
        <span className="text-[#64748b]">{"22°14'06\"N 91°49'32\"E"}</span>
      </div>

      {/* 6. Yard Block RTG Cluster Spatial Tag */}
      <div
        onClick={() => handleSelect("Yard Block YD-04")}
        className="absolute top-[48%] left-[64%] bg-[#0c0e12]/85 backdrop-blur-md border border-white/15 rounded-lg p-2.5 shadow-xl pointer-events-auto cursor-pointer hover:border-white/30 transition-all"
      >
        <div className="text-[10px] font-sans font-bold text-[#8e9bae] uppercase tracking-wider">
          Yard Block YD-04
        </div>
        <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
          <span>RTG-08 Active</span>
          <span className="text-[10px] font-mono text-secondary">(92% Cap)</span>
        </div>
        <div className="w-28 bg-[#1e2024] rounded-full h-1.5 mt-1.5 overflow-hidden">
          <div className="bg-secondary-container h-full rounded-full" style={{ width: "92%" }} />
        </div>
      </div>
    </div>
  );
}
