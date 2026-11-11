"use client";

import React from "react";

export function ExecutiveFooter() {
  return (
    <footer className="mt-auto border-t border-white/[0.06] bg-[#0c0e12] py-3 text-xs text-[#64748b]">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-[#8e9bae]">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
            All 4 Hydro-gauges Synced
          </span>
          <span className="text-white/10 hidden sm:inline">•</span>
          <span>Satellite Telemetry Latency: 1.1s</span>
          <span className="text-white/10 hidden sm:inline">•</span>
          <span>Harbor Radar Coverage: 100%</span>
        </div>
        <div>
          <span>PORTOS Executive Suite • Chittagong Port Authority (CPA) Official Protocol</span>
        </div>
      </div>
    </footer>
  );
}
