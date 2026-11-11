"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";

export function BerthAllocationMatrix() {
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  return (
    <div className="bg-[#12151c] border border-white/[0.07] rounded-xl p-5 sm:p-6 shadow-sm">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-white tracking-tight">
              Berth Allocation &amp; Tidal Horizon Matrix
            </h2>
            <span className="text-[11px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
              HW Crest: 14:40 (4.62m)
            </span>
          </div>
          <p className="text-xs text-[#8e9bae] mt-0.5">
            High-water ingress corridor sync. Deep-draft vessels (&gt;10.5m) synchronized with peak river
            flood stream.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs text-[#8e9bae]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-primary-container" />
            <span>Deep Draft</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-[#2b3548]" />
            <span>Standard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-2 rounded bg-secondary-container" />
            <span>Unberthing / Clear</span>
          </div>
        </div>
      </div>

      {/* Gantt Matrix Timeline View */}
      <div className="mt-6 space-y-4 overflow-x-auto">
        {/* Timeline Header */}
        <div className="grid grid-cols-12 gap-2 text-[11px] font-mono text-[#64748b] pb-2 border-b border-white/[0.05] min-w-[640px]">
          <div className="col-span-2 text-[#8e9bae] font-medium">TERMINAL BERTH</div>
          <div className="col-span-1 text-center">10:00</div>
          <div className="col-span-1 text-center">12:00</div>
          <div className="col-span-2 text-center text-primary font-semibold bg-primary/10 rounded py-0.5 border border-primary/20">
            14:40 HW (PEAK)
          </div>
          <div className="col-span-1 text-center">16:00</div>
          <div className="col-span-1 text-center">18:00</div>
          <div className="col-span-1 text-center">20:00</div>
          <div className="col-span-1 text-center">22:00</div>
          <div className="col-span-2 text-center">00:00</div>
        </div>

        {/* Berth Row 1: CCT-01 */}
        <div className="grid grid-cols-12 gap-2 items-center min-w-[640px] py-1">
          <div className="col-span-2">
            <div className="text-xs font-semibold text-white">CCT - Berth 01</div>
            <div className="text-[11px] text-[#64748b] font-mono">LOA 210m • 11.2m d</div>
          </div>
          <div className="col-span-10 grid grid-cols-10 gap-1 bg-[#181c24] h-11 rounded-lg p-1 relative items-center">
            {/* Tidal Window Highlight Underlay */}
            <div className="absolute inset-y-0 left-[22%] right-[54%] bg-primary-container/[0.08] border-x border-dashed border-primary-container/30 pointer-events-none rounded" />
            
            {/* Vessel Block 1 */}
            <div
              onClick={() => setSelectedVessel("MV MAERSK CHITTAGONG")}
              className={`col-span-4 col-start-2 bg-[#252c3c] border ${
                selectedVessel === "MV MAERSK CHITTAGONG"
                  ? "border-primary-container"
                  : "border-white/10 hover:border-primary-container/50"
              } rounded px-2.5 py-1 text-left cursor-pointer transition-all flex items-center justify-between`}
            >
              <div>
                <div className="text-xs font-semibold text-white truncate">MV MAERSK CHITTAGONG</div>
                <div className="text-[10px] text-[#8e9bae] font-mono">Draft: 10.9m • Discharging</div>
              </div>
              <span className="text-[10px] text-secondary font-mono font-bold">82%</span>
            </div>

            {/* Vessel Block 2 */}
            <div
              onClick={() => setSelectedVessel("EVER GLOBE")}
              className="col-span-3 col-start-7 bg-primary-container/20 border border-primary-container/50 rounded px-2 py-1 text-left cursor-pointer hover:bg-primary-container/30 transition-all"
            >
              <div className="text-xs font-semibold text-white truncate">EVER GLOBE</div>
              <div className="text-[10px] text-primary font-mono">ETA 14:25 • Ingress</div>
            </div>
          </div>
        </div>

        {/* Berth Row 2: CCT-02 */}
        <div className="grid grid-cols-12 gap-2 items-center min-w-[640px] py-1">
          <div className="col-span-2">
            <div className="text-xs font-semibold text-white">CCT - Berth 02</div>
            <div className="text-[11px] text-[#64748b] font-mono">LOA 190m • 10.8m d</div>
          </div>
          <div className="col-span-10 grid grid-cols-10 gap-1 bg-[#181c24] h-11 rounded-lg p-1 relative items-center">
            <div className="absolute inset-y-0 left-[22%] right-[54%] bg-primary-container/[0.08] border-x border-dashed border-primary-container/30 pointer-events-none rounded" />
            
            <div
              onClick={() => setSelectedVessel("CMA CGM CHATTOGRAM")}
              className="col-span-3 col-start-1 bg-[#252c3c] border border-white/10 rounded px-2.5 py-1 text-left cursor-pointer hover:border-white/30 transition-all"
            >
              <div className="text-xs font-semibold text-white truncate">CMA CGM CHATTOGRAM</div>
              <div className="text-[10px] text-secondary font-mono">Clearing 12:45</div>
            </div>
            <div
              onClick={() => setSelectedVessel("OOCL SINGAPORE")}
              className="col-span-4 col-start-4 bg-primary-container/20 border border-primary-container/50 rounded px-2.5 py-1 text-left cursor-pointer hover:bg-primary-container/30 transition-all"
            >
              <div className="text-xs font-semibold text-white truncate">OOCL SINGAPORE</div>
              <div className="text-[10px] text-primary font-mono">Tidal Slot: 14:10 • 11.4m d</div>
            </div>
          </div>
        </div>

        {/* Berth Row 3: NCT-01 */}
        <div className="grid grid-cols-12 gap-2 items-center min-w-[640px] py-1">
          <div className="col-span-2">
            <div className="text-xs font-semibold text-white">NCT - Berth 01</div>
            <div className="text-[11px] text-[#64748b] font-mono">LOA 225m • 11.5m d</div>
          </div>
          <div className="col-span-10 grid grid-cols-10 gap-1 bg-[#181c24] h-11 rounded-lg p-1 relative items-center">
            <div className="absolute inset-y-0 left-[22%] right-[54%] bg-primary-container/[0.08] border-x border-dashed border-primary-container/30 pointer-events-none rounded" />
            
            <div
              onClick={() => setSelectedVessel("MSC ALESSIA")}
              className="col-span-6 col-start-2 bg-[#252c3c] border border-white/10 rounded px-2.5 py-1 text-left flex items-center justify-between cursor-pointer hover:border-white/30 transition-all"
            >
              <div>
                <div className="text-xs font-semibold text-white truncate">MSC ALESSIA (IMO: 9225653)</div>
                <div className="text-[10px] text-[#8e9bae] font-mono">
                  Turnaround 18:30 • Crane Util: 3x QC
                </div>
              </div>
              <span className="text-[10px] text-[#8e9bae] font-mono">460 moves left</span>
            </div>
          </div>
        </div>

        {/* Berth Row 4: NCT-02 */}
        <div className="grid grid-cols-12 gap-2 items-center min-w-[640px] py-1">
          <div className="col-span-2">
            <div className="text-xs font-semibold text-white">NCT - Berth 02</div>
            <div className="text-[11px] text-[#64748b] font-mono">LOA 200m • 10.5m d</div>
          </div>
          <div className="col-span-10 grid grid-cols-10 gap-1 bg-[#181c24] h-11 rounded-lg p-1 relative items-center">
            <div className="absolute inset-y-0 left-[22%] right-[54%] bg-primary-container/[0.08] border-x border-dashed border-primary-container/30 pointer-events-none rounded" />
            
            <div className="col-span-2 col-start-1 bg-secondary-container/20 border border-secondary/30 rounded px-2.5 py-1 text-left">
              <div className="text-xs font-semibold text-secondary truncate">BERTH IDLE</div>
              <div className="text-[10px] text-[#8e9bae]">Available 40m</div>
            </div>
            <div
              onClick={() => setSelectedVessel("X-PRESS BENGAL")}
              className="col-span-4 col-start-4 bg-[#252c3c] border border-white/10 rounded px-2.5 py-1 text-left cursor-pointer hover:border-white/30 transition-all"
            >
              <div className="text-xs font-semibold text-white truncate">X-PRESS BENGAL</div>
              <div className="text-[10px] text-[#8e9bae] font-mono">Draft: 9.8m • Pilot Assigned</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Navigation Link */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2 text-xs text-[#8e9bae]">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-secondary" />
          Karnaphuli Channel depth verified: Gauge Stn. #3 reads +4.64m above chart datum.
        </span>
        <Link
          href="/berth-planner"
          className="text-primary hover:text-white hover:underline font-medium inline-flex items-center gap-1 transition-colors"
        >
          <span>Open Full Berth Sequence Matrix</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
