"use client";

import React from "react";
import { Ship, Compass, ShieldAlert, CheckCircle2, TrendingUp } from "lucide-react";

interface FairwayKpiStripProps {
  inTransitCount?: number;
  inboundQueueDelta?: number;
  activePilots?: string;
  pilotCapacityPct?: number;
  minSafeUkc?: string;
  ukcRestrictionZone?: string;
  channelDepth?: string;
}

export function FairwayKpiStrip({
  inTransitCount = 14,
  inboundQueueDelta = 2,
  activePilots = "4 / 4",
  pilotCapacityPct = 100,
  minSafeUkc = "+0.60 m",
  ukcRestrictionZone = "Restricted at Gupta Bend",
  channelDepth = "10.4 m",
}: FairwayKpiStripProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
      {/* 1. Fairway In-Transit */}
      <div className="p-3.5 rounded-xl bg-[#161922] border border-white/[0.08] shadow-xs">
        <div className="text-[10px] font-mono font-bold text-[#8e9bae] uppercase tracking-wider">
          Fairway In-Transit
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
          {inTransitCount} <span className="text-xs font-normal text-[#8e9bae]">Vessels</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-secondary mt-1">
          <TrendingUp className="h-3 w-3" />
          <span>+{inboundQueueDelta} Inbound queuing</span>
        </div>
      </div>

      {/* 2. Pilot Stations */}
      <div className="p-3.5 rounded-xl bg-[#161922] border border-white/[0.08] shadow-xs">
        <div className="text-[10px] font-mono font-bold text-[#8e9bae] uppercase tracking-wider">
          Pilot Stations
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
          {activePilots} <span className="text-xs font-normal text-[#8e9bae]">Active</span>
        </div>
        <div className="text-[11px] font-mono text-secondary mt-1">
          {pilotCapacityPct}% capacity deployed
        </div>
      </div>

      {/* 3. Min Safe UKC */}
      <div className="p-3.5 rounded-xl bg-[#161922] border border-white/[0.08] shadow-xs">
        <div className="text-[10px] font-mono font-bold text-[#8e9bae] uppercase tracking-wider">
          Min Safe UKC
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1">
          {minSafeUkc}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-[#8e9bae] mt-1">
          <ShieldAlert className="h-3 w-3 text-amber-400" />
          <span>{ukcRestrictionZone}</span>
        </div>
      </div>

      {/* 4. Channel Depth */}
      <div className="p-3.5 rounded-xl bg-[#161922] border border-white/[0.08] shadow-xs">
        <div className="text-[10px] font-mono font-bold text-[#8e9bae] uppercase tracking-wider">
          Channel Depth
        </div>
        <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
          {channelDepth}
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-secondary mt-1">
          <CheckCircle2 className="h-3 w-3" />
          <span>Sounding Validated</span>
        </div>
      </div>
    </div>
  );
}
