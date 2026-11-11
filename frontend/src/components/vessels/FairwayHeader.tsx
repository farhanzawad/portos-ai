"use client";

import React from "react";
import { Waves, ShieldCheck, Download, Radio, Signal } from "lucide-react";

interface FairwayHeaderProps {
  onBroadcastNotice?: () => void;
  onExportS57?: () => void;
  aisLatency?: string;
  nextHwCrest?: string;
  ukcMargin?: string;
}

export function FairwayHeader({
  onBroadcastNotice,
  onExportS57,
  aisLatency = "1.2s",
  nextHwCrest = "+3.84m at 14:40 BST",
  ukcMargin = "+0.60m Safe",
}: FairwayHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] select-none">
      {/* Title & Sector Context */}
      <div className="space-y-1">
        <div className="text-[10px] font-mono tracking-wider uppercase text-[#8e9bae] flex items-center gap-2">
          <span>PORT OPERATIONS</span>
          <span>•</span>
          <span>KARNAPHULI REACH</span>
          <span>•</span>
          <span className="text-white font-semibold">SECTOR CHARLIE-3</span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Fairway Navigation &amp; Vessel Traffic Management
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/20 text-secondary border border-secondary-container/30 text-[10px] font-mono font-bold">
            <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
            <span>AIS FEED ACTIVE • {aisLatency} LATENCY</span>
          </div>
        </div>
      </div>

      {/* Right Telemetry Badges & Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Tidal Gate HW Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2026] border border-amber-500/30 text-amber-400 text-xs font-mono shadow-xs">
          <Waves className="h-3.5 w-3.5 text-amber-400" />
          <div>
            <div className="text-[9px] text-[#8e9bae] uppercase">TIDAL GATE HW</div>
            <div className="font-bold text-white text-[11px]">{nextHwCrest}</div>
          </div>
        </div>

        {/* UKC Safety Limit Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e2026] border border-secondary-container/30 text-secondary text-xs font-mono shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
          <div>
            <div className="text-[9px] text-[#8e9bae] uppercase">UKC SAFETY LIMIT</div>
            <div className="font-bold text-secondary text-[11px]">{ukcMargin}</div>
          </div>
        </div>

        {/* Export S-57 Button */}
        <button
          onClick={onExportS57}
          className="flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#1a1d26] hover:bg-[#252a36] text-white text-xs font-medium border border-white/10 transition-colors shadow-xs"
          title="Export S-57 Electronic Navigational Chart Layer"
        >
          <Download className="h-3.5 w-3.5 text-[#8e9bae]" />
          <span className="hidden sm:inline">Export S-57 Layer</span>
        </button>

        {/* Broadcast Fairway Notice Button */}
        <button
          onClick={onBroadcastNotice}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary-container hover:bg-[#b02f00] text-white text-xs font-bold tracking-[0.015em] shadow-sm transition-all"
        >
          <Radio className="h-3.5 w-3.5 text-white" />
          <span>Broadcast Fairway Notice</span>
        </button>
      </div>
    </div>
  );
}
