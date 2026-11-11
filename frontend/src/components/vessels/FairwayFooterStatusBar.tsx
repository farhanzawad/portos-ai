"use client";

import React from "react";
import { Info, CheckCircle2 } from "lucide-react";

export function FairwayFooterStatusBar() {
  return (
    <footer className="mt-4 p-3 rounded-xl bg-[#111318] border border-white/[0.08] flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#8e9bae] select-none">
      {/* Telemetry Sensor Sync Strip */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-white font-semibold">
          <span className="size-2 rounded-full bg-secondary animate-pulse" />
          <span>PORT RADAR ENGINES SYNCHRONIZED</span>
        </div>
        <span>•</span>
        <span>LAT: 22°14.8&apos; N • LON: 91°48.3&apos; E</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">WATER TEMP: 28.4°C • SWELL: 0.4m SSE</span>
      </div>

      {/* System Health */}
      <div className="flex items-center gap-1.5 text-secondary font-medium">
        <span>SYSTEM HEALTH: NOMINAL (99.98% UPTIME)</span>
        <Info className="h-3.5 w-3.5 text-[#8e9bae]" />
      </div>
    </footer>
  );
}
