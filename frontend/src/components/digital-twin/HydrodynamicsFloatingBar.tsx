"use client";

import React from "react";
import { Waves, Wind, Compass, ShieldCheck } from "lucide-react";

interface HydrodynamicsFloatingBarProps {
  tidalCrest?: string;
  peakTime?: string;
  currentVelocity?: string;
  currentDirection?: string;
  windSpeed?: string;
  windDirection?: string;
  windGusts?: string;
  ukcMargin?: string;
}

export function HydrodynamicsFloatingBar({
  tidalCrest = "+3.84m",
  peakTime = "14:40",
  currentVelocity = "2.8 kts",
  currentDirection = "Downriver Ebb",
  windSpeed = "11 kts",
  windDirection = "NE",
  windGusts = "14 kts",
  ukcMargin = "+0.60m Safe",
}: HydrodynamicsFloatingBarProps) {
  return (
    <div className="absolute bottom-4 left-5 right-5 sm:left-6 sm:right-6 z-20 flex flex-wrap items-center justify-between gap-4 bg-[#0c0e12]/92 backdrop-blur-xl border border-white/10 rounded-xl px-5 py-3 shadow-2xl select-none pointer-events-auto">
      {/* Live Channel Hydrodynamics Cluster */}
      <div className="flex items-center gap-5 sm:gap-6 divide-x divide-white/[0.08] overflow-x-auto py-0.5">
        {/* Hydrodynamic Header */}
        <div className="flex items-center gap-2.5 pr-2 shrink-0">
          <div className="p-1.5 rounded-lg bg-secondary-container/20 text-secondary border border-secondary-container/30">
            <Waves className="h-4 w-4" />
          </div>
          <div>
            <div className="text-[10px] font-sans font-bold text-[#8e9bae] uppercase tracking-wider">
              Karnaphuli Channel
            </div>
            <div className="text-xs font-bold text-white">Live Hydrodynamics</div>
          </div>
        </div>

        {/* Parameter 1: Tidal Crest */}
        <div className="pl-4 shrink-0">
          <div className="text-[10px] font-mono text-[#8e9bae]">Tidal Crest (BST)</div>
          <div className="text-xs font-bold font-mono text-white mt-0.5 flex items-center gap-1.5">
            <span>{tidalCrest}</span>
            <span className="text-[10px] font-normal text-secondary font-mono">
              (Peak {peakTime})
            </span>
          </div>
        </div>

        {/* Parameter 2: Channel Current */}
        <div className="pl-4 shrink-0">
          <div className="text-[10px] font-mono text-[#8e9bae]">Current Velocity</div>
          <div className="text-xs font-bold font-mono text-white mt-0.5 flex items-center gap-1.5">
            <span>{currentVelocity}</span>
            <span className="text-[10px] font-normal text-[#8e9bae]">{currentDirection}</span>
          </div>
        </div>

        {/* Parameter 3: Wind Vector */}
        <div className="pl-4 shrink-0">
          <div className="text-[10px] font-mono text-[#8e9bae]">Surface Wind</div>
          <div className="text-xs font-bold font-mono text-white mt-0.5 flex items-center gap-1.5">
            <span>
              {windSpeed} {windDirection}
            </span>
            <span className="text-[10px] font-normal text-secondary">Gusts {windGusts}</span>
          </div>
        </div>

        {/* Parameter 4: Under-Keel Clearance */}
        <div className="pl-4 shrink-0">
          <div className="text-[10px] font-mono text-[#8e9bae]">
            Under-Keel Clearance Margin
          </div>
          <div className="text-xs font-bold font-mono text-secondary mt-0.5 flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
            <span>{ukcMargin}</span>
          </div>
        </div>
      </div>

      {/* Spatial Viewport Interaction Shortcuts */}
      <div className="hidden lg:flex items-center gap-4 text-[11px] font-mono text-[#8e9bae] border-l border-white/[0.08] pl-5 shrink-0">
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-[#282a2e] border border-white/10 text-white font-medium text-[10px]">
            Right Click
          </kbd>
          <span>Orbit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-[#282a2e] border border-white/10 text-white font-medium text-[10px]">
            Shift + Drag
          </kbd>
          <span>Pan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 rounded bg-[#282a2e] border border-white/10 text-white font-medium text-[10px]">
            Scroll
          </kbd>
          <span>Zoom</span>
        </div>
      </div>
    </div>
  );
}
