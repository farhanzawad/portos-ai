"use client";

import React, { useState } from "react";
import { Radar, Compass, Waves, Navigation } from "lucide-react";

export type GisMapMode = "vector" | "radar" | "satellite";

export function KarnaphuliFairwayGisCard() {
  const [mapMode, setMapMode] = useState<GisMapMode>("vector");

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.08] shadow-xl overflow-hidden flex flex-col select-none">
      {/* Header with Mode Switcher */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#171a22] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Radar className="h-4 w-4 text-primary" />
          <span className="text-xs sm:text-sm font-bold font-mono text-white uppercase tracking-wider">
            Karnaphuli Fairway GIS
          </span>
        </div>

        {/* Base Map Switcher */}
        <div className="flex items-center bg-[#22252e] p-0.5 rounded-lg border border-white/[0.08] text-[11px] font-mono">
          <button
            onClick={() => setMapMode("vector")}
            className={`px-2.5 py-0.5 rounded font-medium transition-all ${
              mapMode === "vector"
                ? "bg-[#2f333e] text-white font-semibold"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Nautical Vector
          </button>
          <button
            onClick={() => setMapMode("radar")}
            className={`px-2.5 py-0.5 rounded font-medium transition-all ${
              mapMode === "radar"
                ? "bg-[#2f333e] text-white font-semibold"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Tactical Radar
          </button>
          <button
            onClick={() => setMapMode("satellite")}
            className={`px-2.5 py-0.5 rounded font-medium transition-all ${
              mapMode === "satellite"
                ? "bg-[#2f333e] text-white font-semibold"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Satellite
          </button>
        </div>
      </div>

      {/* Telemetry Ingress Banner */}
      <div className="px-3.5 py-2 bg-[#14171f] border-b border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-secondary font-bold">
            <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
            <span>CHANNEL INGRESS: ACTIVE</span>
          </div>
          <div className="text-[#8e9bae]">
            Estuary Fairway Sounding: <span className="text-white">10.4m - 12.1m</span>
          </div>
          <div className="text-[#8e9bae]">
            Tide: <span className="text-white">Flood (Rising +0.18m/15min)</span>
          </div>
        </div>

        <div className="text-right space-y-0.5">
          <div className="text-[#8e9bae] font-bold">
            CPA RADAR: <span className="text-white">RANGE 6.2 NM</span>
          </div>
          <div className="text-secondary font-semibold">PST-01 PILOT ABOARD</div>
        </div>
      </div>

      {/* Synchronized GIS Canvas Representation */}
      <div className="relative h-44 bg-[#0a0c10] overflow-hidden p-3 flex flex-col justify-between">
        {/* Radar Range Rings and Waterway Flow Gradients */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 60% 50%, rgba(22, 163, 148, 0.25) 0%, transparent 65%)",
          }}
        />

        {/* Quayside Berths Vector Graphic */}
        <div className="relative z-10 space-y-2 mt-1">
          {/* Berth CCT-01 Vector Tag */}
          <div className="p-2 rounded-lg bg-[#161a24]/90 border border-primary-container/60 shadow-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-primary-container animate-pulse" />
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Berth CCT-01</span>
                  <span className="text-[#8e9bae] font-mono text-[10px] font-normal">
                    MV Maersk Karun (186.2m)
                  </span>
                </div>
                <div className="text-[10px] font-mono text-[#8e9bae] flex items-center gap-2">
                  <span>Draft 9.4m</span>
                  <span>•</span>
                  <span className="text-secondary">2x STS Gantry Deployed</span>
                </div>
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-primary-container/20 text-primary-fixed border border-primary-container/30">
              MOORED
            </span>
          </div>

          {/* NCT-01 Vector Tag */}
          <div className="p-1.5 px-2.5 rounded-lg bg-[#141822]/80 border border-secondary/40 shadow-md flex items-center justify-between text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-secondary" />
              <span className="text-white font-medium">NCT-01: Ever Apex</span>
            </div>
            <span className="text-secondary font-bold">68%</span>
          </div>
        </div>

        {/* Bottom Scale & Waterway Heading */}
        <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-[#8e9bae] pt-2 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <span>SCALE: 200m</span>
            <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="w-8 h-full bg-white/60" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-white">
            <Navigation className="h-3 w-3 text-secondary transform rotate-45" />
            <span>Karnaphuli CPA Reach</span>
          </div>
        </div>
      </div>
    </div>
  );
}
