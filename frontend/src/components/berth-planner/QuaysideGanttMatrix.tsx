"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Anchor,
  Clock,
  ShieldCheck,
  AlertCircle,
  Ship,
} from "lucide-react";

interface QuaysideGanttMatrixProps {
  onSelectVessel?: (vesselName: string) => void;
  selectedVessel?: string;
}

export function QuaysideGanttMatrix({
  onSelectVessel,
  selectedVessel = "MV Maersk Karun",
}: QuaysideGanttMatrixProps) {
  const [shiftHours, setShiftHours] = useState(0);

  const timeSlots = [
    "00:00",
    "02:00",
    "04:00",
    "06:00",
    "08:00",
    "10:00",
    "12:00",
    "14:00", // HW Crest
    "16:00",
    "18:00",
    "20:00",
    "22:00",
  ];

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.08] shadow-xl overflow-hidden flex flex-col select-none">
      {/* Gantt Header & Legend */}
      <div className="p-3.5 sm:p-4 border-b border-white/[0.08] bg-[#171a22] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-bold font-mono text-white tracking-wider uppercase">
            Quayside Gantt Matrix
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold text-secondary bg-secondary-container/20 border border-secondary-container/30">
            0 CONFLICTS
          </span>
        </div>

        {/* Shift Controls & Legend */}
        <div className="flex items-center gap-5 text-xs">
          {/* Shift ±1h */}
          <div className="flex items-center gap-1 bg-[#22252e] px-2 py-1 rounded-lg border border-white/[0.08] font-mono text-[11px] text-[#8e9bae]">
            <button
              onClick={() => setShiftHours((h) => h - 1)}
              className="hover:text-white transition-colors"
              title="Shift -1 Hour"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="px-1 text-white font-medium">Shift ±1h</span>
            <button
              onClick={() => setShiftHours((h) => h + 1)}
              className="hover:text-white transition-colors"
              title="Shift +1 Hour"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Color Legend */}
          <div className="hidden sm:flex items-center gap-4 text-[11px] font-mono text-[#8e9bae]">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary-container" />
              <span>Moored</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-secondary" />
              <span>Discharging</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-amber-400" />
              <span>Tidal Ingress</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Schedule Grid Area */}
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          {/* Timeline Marks Bar */}
          <div className="grid grid-cols-12 border-b border-white/[0.08] bg-[#14171f] py-2 text-[10px] font-mono text-[#8e9bae]">
            <div className="col-span-3 px-4 font-bold text-white uppercase tracking-wider">
              Berth / Specification
            </div>
            <div className="col-span-9 grid grid-cols-12 text-center">
              {timeSlots.map((time, idx) => (
                <div
                  key={time}
                  className={`truncate ${
                    time === "14:00"
                      ? "text-amber-400 font-bold bg-amber-500/10 rounded"
                      : ""
                  }`}
                  title={time === "14:00" ? "High Water Tidal Peak Window (+3.84m)" : undefined}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Berth Rows */}
          <div className="divide-y divide-white/[0.06]">
            {/* ROW 1: CCT-01 */}
            <div className="grid grid-cols-12 items-center py-2.5 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-3 px-4">
                <div className="text-xs font-bold text-white font-mono">CCT-01</div>
                <div className="text-[10px] text-[#8e9bae] font-mono leading-tight">
                  LOA 186m • Draft 9.5m
                </div>
                <div className="text-[9px] text-[#64748b] font-mono">STS-01, STS-02</div>
              </div>
              <div className="col-span-9 relative h-12 flex items-center pr-3">
                {/* Active Moored Vessel: MV Maersk Karun */}
                <div
                  onClick={() => onSelectVessel && onSelectVessel("MV Maersk Karun")}
                  className={`absolute left-[36%] w-[48%] h-10 rounded-lg bg-gradient-to-r from-primary-container to-[#d64115] border border-white/20 p-2 text-white shadow-md cursor-pointer transition-transform hover:scale-[1.01] flex items-center justify-between ${
                    selectedVessel === "MV Maersk Karun" ? "ring-2 ring-white/60" : ""
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Anchor className="h-3.5 w-3.5 shrink-0 text-white" />
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">MV Maersk Karun</div>
                      <div className="text-[9px] font-mono text-white/80 truncate">
                        STS-01 + STS-02 assigned
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[9px] font-mono font-bold bg-black/30 px-1 py-0.5 rounded">
                      ACTIVE MOORING
                    </span>
                    <div className="text-[9px] font-mono text-white/90">ETD: 18:30</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: CCT-02 */}
            <div className="grid grid-cols-12 items-center py-2.5 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-3 px-4">
                <div className="text-xs font-bold text-white font-mono">CCT-02</div>
                <div className="text-[10px] text-[#8e9bae] font-mono leading-tight">
                  LOA 190m • Draft 9.2m
                </div>
                <div className="text-[9px] text-[#64748b] font-mono">STS-03</div>
              </div>
              <div className="col-span-9 relative h-12 flex items-center pr-3">
                {/* Vessel 1: MSC Kyra (Cast off) */}
                <div
                  onClick={() => onSelectVessel && onSelectVessel("MSC Kyra")}
                  className="absolute left-[8%] w-[26%] h-9 rounded-md bg-[#252834] border border-white/10 p-1.5 text-white/90 shadow-xs cursor-pointer hover:border-white/30 flex items-center justify-between"
                >
                  <div className="truncate text-[11px] font-bold">
                    MSC Kyra
                    <div className="text-[9px] font-mono text-[#8e9bae]">Dep 10:15 BST • Complete</div>
                  </div>
                  <span className="text-[8px] font-mono text-[#8e9bae] uppercase px-1 py-0.5 bg-black/30 rounded shrink-0">
                    CAST OFF
                  </span>
                </div>

                {/* Vessel 2: CMA CGM Bengal */}
                <div
                  onClick={() => onSelectVessel && onSelectVessel("CMA CGM Bengal")}
                  className="absolute left-[56%] w-[38%] h-9 rounded-md bg-gradient-to-r from-amber-600 to-amber-700 border border-white/20 p-1.5 text-white shadow-xs cursor-pointer hover:border-white/40 flex items-center justify-between"
                >
                  <div className="truncate text-[11px] font-bold">
                    CMA CGM Bengal
                    <div className="text-[9px] font-mono text-amber-100">HW Ingress @ 14:15</div>
                  </div>
                  <span className="text-[8px] font-mono text-white uppercase px-1 py-0.5 bg-black/30 rounded shrink-0">
                    HW Ingress
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 3: NCT-01 */}
            <div className="grid grid-cols-12 items-center py-2.5 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-3 px-4">
                <div className="text-xs font-bold text-white font-mono">NCT-01</div>
                <div className="text-[10px] text-[#8e9bae] font-mono leading-tight">
                  LOA 210m • Draft 9.8m
                </div>
                <div className="text-[9px] text-[#64748b] font-mono">STS-04, STS-05</div>
              </div>
              <div className="col-span-9 relative h-12 flex items-center pr-3">
                {/* Vessel: Ever Apex (Discharging 68%) */}
                <div
                  onClick={() => onSelectVessel && onSelectVessel("Ever Apex")}
                  className="absolute left-[20%] w-[58%] h-10 rounded-lg bg-gradient-to-r from-[#00a572] to-[#0d7857] border border-white/20 p-2 text-white shadow-md cursor-pointer transition-transform hover:scale-[1.01] flex items-center justify-between"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Ship className="h-3.5 w-3.5 shrink-0 text-white" />
                    <div className="truncate">
                      <div className="text-xs font-bold truncate">Ever Apex</div>
                      <div className="text-[9px] font-mono text-white/90 truncate">
                        STS-04, STS-05 (48 moves/hr)
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="text-[9px] font-mono font-bold bg-black/30 px-1 py-0.5 rounded text-white">
                      Discharging 68%
                    </span>
                    <div className="text-[9px] font-mono text-white/90">Comp 21:00</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 4: NCT-02 */}
            <div className="grid grid-cols-12 items-center py-2.5 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-3 px-4">
                <div className="text-xs font-bold text-white font-mono">NCT-02</div>
                <div className="text-[10px] text-[#8e9bae] font-mono leading-tight">
                  LOA 200m • Draft 9.5m
                </div>
                <div className="text-[9px] text-[#64748b] font-mono">STS-06</div>
              </div>
              <div className="col-span-9 relative h-12 flex items-center pr-3">
                {/* Vessel: OOCL Singapore */}
                <div
                  onClick={() => onSelectVessel && onSelectVessel("OOCL Singapore")}
                  className="absolute left-[64%] w-[32%] h-9 rounded-md bg-[#252834] border border-white/15 p-1.5 text-white shadow-xs cursor-pointer hover:border-white/30 flex items-center justify-between"
                >
                  <div className="truncate text-[11px] font-bold">
                    OOCL Singapore
                    <div className="text-[9px] font-mono text-[#8e9bae]">Draft 11.4m Boarding</div>
                  </div>
                  <span className="text-[8px] font-mono text-secondary uppercase px-1 py-0.5 bg-black/30 rounded shrink-0">
                    Inbound
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 5: NCT-03 */}
            <div className="grid grid-cols-12 items-center py-2.5 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-3 px-4">
                <div className="text-xs font-bold text-white font-mono">NCT-03</div>
                <div className="text-[10px] text-[#8e9bae] font-mono leading-tight">
                  LOA 180m • Draft 9.0m
                </div>
                <div className="text-[9px] text-[#64748b] font-mono">Mobile Harbor Crane</div>
              </div>
              <div className="col-span-9 relative h-12 flex items-center pr-3">
                <div className="w-full h-8 rounded border border-dashed border-white/15 bg-white/[0.02] flex items-center justify-center text-[10px] font-mono text-[#8e9bae]">
                  Available Window: 05:00 - 17:00 BST (Low Water Restriction)
                </div>
              </div>
            </div>

            {/* ROW 6: GCB-01 */}
            <div className="grid grid-cols-12 items-center py-2.5 hover:bg-white/[0.02] transition-colors">
              <div className="col-span-3 px-4">
                <div className="text-xs font-bold text-white font-mono">GCB-01</div>
                <div className="text-[10px] text-[#8e9bae] font-mono leading-tight">
                  LOA 175m • Draft 8.8m
                </div>
                <div className="text-[9px] text-[#64748b] font-mono">GCB Quay Gantry</div>
              </div>
              <div className="col-span-9 relative h-12 flex items-center pr-3">
                {/* Vessel: MV Kota Hening */}
                <div
                  onClick={() => onSelectVessel && onSelectVessel("MV Kota Hening")}
                  className="absolute left-[16%] w-[42%] h-9 rounded-md bg-[#252834] border border-white/10 p-1.5 text-white shadow-xs cursor-pointer hover:border-white/30 flex items-center justify-between"
                >
                  <div className="truncate text-[11px] font-bold">
                    MV Kota Hening
                    <div className="text-[9px] font-mono text-[#8e9bae]">Bulk/Container Mix</div>
                  </div>
                  <div className="text-right shrink-0 text-[9px] font-mono text-[#8e9bae]">
                    <span className="px-1 py-0.5 bg-black/30 rounded">Bunkering</span>
                    <div className="text-[8px]">ETD 16:30</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gantt Footer Audit Information */}
      <div className="p-3 border-t border-white/[0.08] bg-[#14171f] flex flex-wrap items-center justify-between gap-3 text-xs text-[#8e9bae] font-mono">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-secondary shrink-0" />
          <span className="text-white font-semibold">Deterministic Solution Verified</span>
          <span>•</span>
          <span>Continuous Mooring Envelope &gt; 15m Safety Buffer</span>
        </div>
        <div className="text-[11px] text-[#64748b]">
          Drag handles to simulate manual overrides
        </div>
      </div>
    </div>
  );
}
