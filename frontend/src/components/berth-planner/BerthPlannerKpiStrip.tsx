"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, Zap, Clock, Anchor } from "lucide-react";

interface BerthPlannerKpiStripProps {
  solverLatencyMs?: number;
  hardViolations?: number;
  totalAnchorageWaitHours?: number;
  quaysideUtilizationPct?: number;
  tidalCompliancePct?: number;
}

export function BerthPlannerKpiStrip({
  solverLatencyMs = 28.4,
  hardViolations = 0,
  totalAnchorageWaitHours = 2.2,
  quaysideUtilizationPct = 88.4,
  tidalCompliancePct = 100,
}: BerthPlannerKpiStripProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 select-none">
      {/* 1. Solver Latency */}
      <div className="p-3.5 rounded-xl bg-[#171a22] border border-white/[0.08] shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#8e9bae] font-mono">
          <span>Solver Latency</span>
          <span className="text-[10px] font-bold text-secondary bg-secondary-container/20 px-1.5 py-0.5 rounded border border-secondary-container/30">
            -12.4%
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
          {solverLatencyMs.toFixed(1)} <span className="text-xs font-normal text-[#8e9bae]">ms</span>
        </div>
        <div className="text-[11px] text-[#8e9bae] mt-1">
          Deterministic CP-SAT engine
        </div>
      </div>

      {/* 2. Hard Violations */}
      <div className="p-3.5 rounded-xl bg-[#171a22] border border-white/[0.08] shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#8e9bae] font-mono">
          <span>Hard Violations</span>
          <ShieldCheck className="h-4 w-4 text-secondary" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-secondary mt-1">
          {hardViolations} <span className="text-xs font-normal text-white">Violations</span>
        </div>
        <div className="text-[11px] text-[#8e9bae] mt-1">
          Strict non-overlap satisfied
        </div>
      </div>

      {/* 3. Total Anchorage Wait */}
      <div className="p-3.5 rounded-xl bg-[#171a22] border border-white/[0.08] shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#8e9bae] font-mono">
          <span>Total Anchorage Wait</span>
          <span className="text-[10px] font-bold text-secondary bg-secondary-container/20 px-1.5 py-0.5 rounded border border-secondary-container/30">
            -81.7%
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
          {totalAnchorageWaitHours.toFixed(1)} <span className="text-xs font-normal text-[#8e9bae]">hrs</span>
        </div>
        <div className="text-[11px] text-[#8e9bae] mt-1">
          vs 12.0h FIFO Baseline
        </div>
      </div>

      {/* 4. Quayside Utilization */}
      <div className="p-3.5 rounded-xl bg-[#171a22] border border-white/[0.08] shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#8e9bae] font-mono">
          <span>Quayside Utilization</span>
          <span className="text-[10px] font-bold text-secondary bg-secondary-container/20 px-1.5 py-0.5 rounded border border-secondary-container/30">
            +14.2%
          </span>
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
          {quaysideUtilizationPct.toFixed(1)}<span className="text-xs font-normal text-[#8e9bae]">%</span>
        </div>
        <div className="text-[11px] text-[#8e9bae] mt-1">
          6 of 6 berths scheduled
        </div>
      </div>

      {/* 5. Tidal Gate Compliance */}
      <div className="p-3.5 rounded-xl bg-[#171a22] border border-white/[0.08] col-span-2 sm:col-span-1 shadow-xs">
        <div className="flex items-center justify-between text-xs text-[#8e9bae] font-mono">
          <span>Tidal Gate Compliance</span>
          <CheckCircle2 className="h-4 w-4 text-secondary" />
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-secondary mt-1">
          {tidalCompliancePct}% <span className="text-xs font-normal text-white">Valid</span>
        </div>
        <div className="text-[11px] text-[#8e9bae] mt-1">
          Draft-to-crest verified
        </div>
      </div>
    </div>
  );
}
