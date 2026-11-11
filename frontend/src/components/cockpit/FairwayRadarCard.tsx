"use client";

import React, { useState } from "react";
import { Radar, Compass } from "lucide-react";

export function FairwayRadarCard() {
  const [selectedBlip, setSelectedBlip] = useState<string | null>("OOCL SGP");

  return (
    <div className="bg-[#12151c] border border-white/[0.07] rounded-xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Karnaphuli Channel Fairway
          </h3>
          <p className="text-xs text-[#8e9bae]">Nav Corridor AIS &amp; Underkeel Clearance (UKC)</p>
        </div>
        <Radar className="h-5 w-5 text-primary-container animate-pulse" />
      </div>

      {/* Radar Graphic Scope */}
      <div className="mt-4 relative bg-[#090b0f] rounded-lg border border-white/[0.06] p-4 flex flex-col items-center justify-center overflow-hidden h-72">
        {/* Concentric Range Rings */}
        <div className="w-64 h-64 relative rounded-full border border-white/10 flex items-center justify-center">
          {/* Radar Sweep Line */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="radar-sweep-line absolute inset-0 bg-gradient-to-tr from-primary-container/20 via-transparent to-transparent opacity-60 rounded-full" />
          </div>

          <div className="w-48 h-48 rounded-full border border-white/[0.08] flex items-center justify-center">
            <div className="w-32 h-32 rounded-full border border-white/[0.06] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full border border-white/[0.04]" />
            </div>
          </div>
        </div>

        {/* Crosshairs */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-[1px] bg-white/[0.06]" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-full w-[1px] bg-white/[0.06]" />
        </div>

        {/* Channel Navigation Bounds */}
        <div className="absolute inset-y-0 w-28 border-x border-primary/20 bg-primary/[0.02] pointer-events-none" />

        {/* Vessel Blip 1: Deep Draft Ingress */}
        <div
          onClick={() => setSelectedBlip("OOCL SGP")}
          className="absolute top-[28%] left-[45%] flex items-center gap-1.5 group cursor-pointer z-10 transition-transform hover:scale-110"
        >
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-container ring-4 ring-primary-container/20" />
          </span>
          <span className="text-[10px] font-mono text-white bg-[#11141b]/95 px-1.5 py-0.5 rounded border border-primary-container/40 shadow-xs">
            OOCL SGP [11.4m]
          </span>
        </div>

        {/* Vessel Blip 2: Standard Container */}
        <div
          onClick={() => setSelectedBlip("WAN HAI 316")}
          className="absolute top-[52%] left-[38%] flex items-center gap-1.5 cursor-pointer z-10 transition-transform hover:scale-110"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-white ring-2 ring-white/30" />
          <span className="text-[10px] font-mono text-[#8e9bae] bg-[#11141b]/90 px-1 py-0.5 rounded border border-white/10">
            WAN HAI 316
          </span>
        </div>

        {/* Vessel Blip 3: Tug Escort */}
        <div
          onClick={() => setSelectedBlip("PB-02 (TUG)")}
          className="absolute bottom-[22%] left-[60%] flex items-center gap-1.5 cursor-pointer z-10 transition-transform hover:scale-110"
        >
          <span className="w-2 h-2 rounded-full bg-secondary ring-2 ring-secondary/30" />
          <span className="text-[10px] font-mono text-secondary bg-[#11141b]/90 px-1 py-0.5 rounded border border-secondary/30">
            PB-02 (TUG)
          </span>
        </div>

        {/* Radar Range Annotations */}
        <span className="absolute top-2 right-3 text-[10px] font-mono text-[#64748b]">
          RANGE: 5 NM
        </span>
      </div>

      {/* Radar Telemetry Footer */}
      <div className="w-full grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/[0.06] text-center">
        <div>
          <span className="text-[10px] text-[#64748b] block font-mono">FAIRWAY DEPTH</span>
          <span className="text-xs font-semibold text-white font-mono">12.1m</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748b] block font-mono">TIDAL STREAM</span>
          <span className="text-xs font-semibold text-secondary font-mono">3.1 kts F</span>
        </div>
        <div>
          <span className="text-[10px] text-[#64748b] block font-mono">UKC MINIMUM</span>
          <span className="text-xs font-semibold text-primary font-mono">+1.25m</span>
        </div>
      </div>
    </div>
  );
}
