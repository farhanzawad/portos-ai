"use client";

import React from "react";
import { Ship, Anchor, Clock, Leaf, ArrowUp, ArrowDown, TrendingUp } from "lucide-react";

export function ExecutiveKpiStrip() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
      {/* Metric 1: Vessels in Fairway */}
      <div className="bg-[#12151c] border border-white/[0.07] rounded-xl p-5 sm:p-6 relative overflow-hidden group hover:border-white/[0.15] transition-all shadow-sm">
        <div className="flex items-center justify-between text-[#8e9bae] text-xs font-medium mb-3">
          <span className="tracking-wider">VESSELS IN FAIRWAY</span>
          <Ship className="h-4 w-4 text-[#64748b] group-hover:text-primary transition-colors" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="font-metric-display text-3xl font-bold tracking-tight text-white font-mono">
            42
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
            <ArrowUp className="h-3 w-3" />
            +3.2%
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#8e9bae]">
          <span>
            Ingress: <strong className="text-white font-medium">18</strong>
          </span>
          <span>
            Anchorage: <strong className="text-white font-medium">16</strong>
          </span>
          <span>
            Egress: <strong className="text-white font-medium">8</strong>
          </span>
        </div>
      </div>

      {/* Metric 2: Berth Occupancy Rate */}
      <div className="bg-[#12151c] border border-white/[0.07] rounded-xl p-5 sm:p-6 relative overflow-hidden group hover:border-white/[0.15] transition-all shadow-sm">
        <div className="flex items-center justify-between text-[#8e9bae] text-xs font-medium mb-3">
          <span className="tracking-wider">BERTH OCCUPANCY</span>
          <Anchor className="h-4 w-4 text-[#64748b] group-hover:text-primary transition-colors" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="font-metric-display text-3xl font-bold tracking-tight text-white font-mono">
            88.4%
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
            <TrendingUp className="h-3 w-3" />
            +1.8%
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#8e9bae]">
          <span>
            Available slots: <strong className="text-white font-medium">3 Berths</strong>
          </span>
          <span className="text-primary-container font-medium">CCT-02 turnaround in 45m</span>
        </div>
      </div>

      {/* Metric 3: Pilot Boarding Wait */}
      <div className="bg-[#12151c] border border-white/[0.07] rounded-xl p-5 sm:p-6 relative overflow-hidden group hover:border-white/[0.15] transition-all shadow-sm">
        <div className="flex items-center justify-between text-[#8e9bae] text-xs font-medium mb-3">
          <span className="tracking-wider">AVG PILOT BOARDING WAIT</span>
          <Clock className="h-4 w-4 text-[#64748b] group-hover:text-secondary transition-colors" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="font-metric-display text-3xl font-bold tracking-tight text-white font-mono">
            2.2 <span className="text-base font-normal text-[#8e9bae]">hrs</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
            <ArrowDown className="h-3 w-3" />
            -14.5%
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#8e9bae]">
          <span>
            Target benchmark: <strong className="text-white font-medium">&lt; 3.0 hrs</strong>
          </span>
          <span className="text-secondary font-medium">Pilot boats: 6/6 deployed</span>
        </div>
      </div>

      {/* Metric 4: CO2e Abated via Tidal Sync */}
      <div className="bg-[#12151c] border border-white/[0.07] rounded-xl p-5 sm:p-6 relative overflow-hidden group hover:border-white/[0.15] transition-all shadow-sm">
        <div className="flex items-center justify-between text-[#8e9bae] text-xs font-medium mb-3">
          <span className="tracking-wider">CO2e ABATED (TIDAL SYNC)</span>
          <Leaf className="h-4 w-4 text-[#64748b] group-hover:text-secondary transition-colors" />
        </div>
        <div className="flex items-baseline justify-between">
          <div className="font-metric-display text-3xl font-bold tracking-tight text-white font-mono">
            142.8 <span className="text-base font-normal text-[#8e9bae]">tCO2e</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20">
            <Leaf className="h-3 w-3" />
            +22.4%
          </span>
        </div>
        <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#8e9bae]">
          <span>
            Direct fuel saved: <strong className="text-white font-medium">46.2 MT</strong>
          </span>
          <span className="text-[#8e9bae]">Past 24 hours</span>
        </div>
      </div>
    </div>
  );
}
