"use client";

import React from "react";

interface SpatialGizmoCompassProps {
  heading?: number;
  altitude?: number;
  pitch?: number;
  fov?: number;
  fps?: number;
}

export function SpatialGizmoCompass({
  heading = 164,
  altitude = 45.0,
  pitch = -24.5,
  fov = 60.0,
  fps = 60.0,
}: SpatialGizmoCompassProps) {
  return (
    <div className="absolute top-5 left-5 z-20 flex flex-col gap-3 pointer-events-auto select-none">
      {/* Compass & Attitude HUD Box */}
      <div className="bg-[#0c0e12]/85 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl w-44">
        <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 mb-2">
          <span className="text-[10px] font-sans font-bold text-[#8e9bae] uppercase tracking-wider">
            Spatial Gizmo
          </span>
          <span className="text-[10px] font-mono font-semibold text-secondary">
            HDG {heading}° SSE
          </span>
        </div>

        {/* Simulated Navigational Compass Dial */}
        <div className="flex items-center justify-center my-1.5">
          <div className="relative size-20 rounded-full border border-white/15 bg-black/40 flex items-center justify-center">
            {/* Cardinal Markers */}
            <div className="absolute top-1 text-[9px] font-bold text-primary">N</div>
            <div className="absolute right-1 text-[9px] font-bold text-[#8e9bae]">E</div>
            <div className="absolute bottom-1 text-[9px] font-bold text-[#8e9bae]">S</div>
            <div className="absolute left-1 text-[9px] font-bold text-[#8e9bae]">W</div>

            {/* Dial Axis Crosshairs */}
            <div className="absolute inset-x-2 h-px bg-white/[0.06]" />
            <div className="absolute inset-y-2 w-px bg-white/[0.06]" />

            {/* Rotating Pointer Vector */}
            <div
              className="w-0.5 h-14 bg-gradient-to-t from-primary-container via-white to-transparent transform transition-transform duration-300"
              style={{ transform: `rotate(${heading}deg)` }}
            />
            <div className="size-2 rounded-full bg-white shadow-sm ring-2 ring-primary-container/40 z-10" />
          </div>
        </div>

        {/* Telemetry Metrics Readout Grid */}
        <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-[#8e9bae] pt-2 border-t border-white/[0.08]">
          <div>
            ALT: <span className="text-white font-medium">{altitude.toFixed(1)}m AGL</span>
          </div>
          <div>
            PITCH: <span className="text-white font-medium">{pitch.toFixed(1)}°</span>
          </div>
          <div>
            FOV: <span className="text-white font-medium">{fov.toFixed(1)}°</span>
          </div>
          <div>
            FPS: <span className="text-secondary font-medium">{fps.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Drone Navigation Keybindings Tooltip */}
      <div className="bg-[#0c0e12]/80 backdrop-blur-md border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-[#8e9bae] flex items-center gap-2 shadow-lg">
        <kbd className="px-1.5 py-0.5 rounded bg-[#1e2024] text-white text-[9px] border border-white/15 font-semibold">
          WASD
        </kbd>
        <span>Free Flight</span>
        <span className="text-white/20">•</span>
        <kbd className="px-1.5 py-0.5 rounded bg-[#1e2024] text-white text-[9px] border border-white/15 font-semibold">
          Q/E
        </kbd>
        <span>Elevation</span>
      </div>
    </div>
  );
}
