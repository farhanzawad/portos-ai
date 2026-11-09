"use client";

import React, { useState } from "react";
import {
  Plus,
  Minus,
  Maximize2,
  Hand,
  Rotate3D,
  HelpCircle,
  X,
  Keyboard,
  Layers,
} from "lucide-react";
import { NavActionType, MouseInteractionMode, CameraMetrics } from "./types";

interface MapNavControlProps {
  onNavigate: (action: NavActionType) => void;
  onResetCamera: () => void;
  mouseMode: MouseInteractionMode;
  onSetMouseMode: (mode: MouseInteractionMode) => void;
  cameraMetrics: CameraMetrics;
  onToggle2D3D: () => void;
}

export function MapNavControl({
  onNavigate,
  onResetCamera,
  mouseMode,
  onSetMouseMode,
  cameraMetrics,
  onToggle2D3D,
}: MapNavControlProps) {
  const [showKeyHints, setShowKeyHints] = useState(false);
  const is2D = cameraMetrics.pitch < 15;

  // Format bearing compass heading (e.g. 035° NE)
  const getCardinal = (deg: number) => {
    const val = Math.floor((deg / 22.5) + 0.5);
    const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[val % 16];
  };

  const bearingStr = `${String(cameraMetrics.bearing).padStart(3, "0")}° ${getCardinal(cameraMetrics.bearing)}`;

  return (
    <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 select-none pointer-events-auto">
      {/* 1. Main Map Navigation Control Box */}
      <div className="bg-portos-navy/95 backdrop-blur-md border border-portos-navy-secondary rounded-xl shadow-2xl p-2.5 text-white flex flex-col items-center gap-2">
        {/* Top: Mode Toggle (Map Pan ✋ vs 3D Orbit 🔄) */}
        <div className="flex items-center bg-portos-navy-secondary/60 p-0.5 rounded-lg border border-portos-navy-secondary w-full text-[11px]">
          <button
            onClick={() => onSetMouseMode("pan")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md font-medium transition-all ${
              mouseMode === "pan"
                ? "bg-portos-teal text-white font-bold shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
            title="Map Drag Pan: Left-click drags the map freely across the port (like Google Maps)"
          >
            <Hand className="h-3 w-3" />
            <span>Pan Map</span>
          </button>
          <button
            onClick={() => onSetMouseMode("orbit")}
            className={`flex-1 flex items-center justify-center gap-1 py-1 px-2 rounded-md font-medium transition-all ${
              mouseMode === "orbit"
                ? "bg-portos-teal text-white font-bold shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
            title="3D Orbit: Left-click rotates and tilts the view"
          >
            <Rotate3D className="h-3 w-3" />
            <span>3D Orbit</span>
          </button>
        </div>

        {/* Middle: Map Pan Wheel & Live Compass Needle */}
        <div className="relative w-28 h-28 flex items-center justify-center my-0.5">
          {/* Outer Compass Pan Ring with Cardinal Direction Buttons */}
          <div className="absolute inset-0 rounded-full border border-portos-navy-secondary/80 bg-portos-navy-secondary/20 shadow-inner" />

          {/* North Button */}
          <button
            onClick={() => onNavigate("panNorth")}
            className="absolute top-0.5 left-1/2 -translate-x-1/2 w-7 h-7 flex flex-col items-center justify-center rounded-full bg-portos-navy hover:bg-portos-teal text-slate-200 hover:text-white font-bold text-[10px] transition-colors border border-portos-navy-secondary shadow"
            title="Pan North (Upriver / CCT / NCT)"
          >
            <span className="text-[9px] text-portos-teal group-hover:text-white">▲</span>
            <span className="-mt-1">N</span>
          </button>

          {/* South Button */}
          <button
            onClick={() => onNavigate("panSouth")}
            className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-7 h-7 flex flex-col items-center justify-center rounded-full bg-portos-navy hover:bg-portos-teal text-slate-200 hover:text-white font-bold text-[10px] transition-colors border border-portos-navy-secondary shadow"
            title="Pan South (Seaward / Bay of Bengal)"
          >
            <span className="-mb-1">S</span>
            <span className="text-[9px] text-slate-400">▼</span>
          </button>

          {/* West Button */}
          <button
            onClick={() => onNavigate("panWest")}
            className="absolute left-0.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-portos-navy hover:bg-portos-teal text-slate-200 hover:text-white font-bold text-[10px] transition-colors border border-portos-navy-secondary shadow"
            title="Pan West (Approach Channel / Breakwaters)"
          >
            <span>W</span>
          </button>

          {/* East Button */}
          <button
            onClick={() => onNavigate("panEast")}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full bg-portos-navy hover:bg-portos-teal text-slate-200 hover:text-white font-bold text-[10px] transition-colors border border-portos-navy-secondary shadow"
            title="Pan East (Container Yards / Gates / Land)"
          >
            <span>E</span>
          </button>

          {/* Center Circular Compass Rose Needle (Live Heading & Click to Reset North) */}
          <button
            onClick={() => onNavigate("resetNorth")}
            className="relative z-10 w-12 h-12 rounded-full bg-portos-navy/95 border-2 border-portos-teal/60 hover:border-portos-teal flex flex-col items-center justify-center shadow-lg transition-transform active:scale-95 group cursor-pointer"
            title="Click to reset view to True North (000°)"
          >
            {/* Rotating Needle Indicator */}
            <div
              className="w-full h-full flex flex-col items-center justify-between py-1 transition-transform duration-150"
              style={{ transform: `rotate(${-cameraMetrics.bearing}deg)` }}
            >
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-red-500 drop-shadow" />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-portos-teal" />
              <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[8px] border-t-slate-300 drop-shadow" />
            </div>
          </button>
        </div>

        {/* Bearing & Altitude readout badge */}
        <div className="text-[10px] font-mono text-slate-300 bg-portos-navy-secondary/40 px-2 py-0.5 rounded border border-portos-navy-secondary flex items-center gap-1.5">
          <span>{bearingStr}</span>
          {cameraMetrics.altitude !== undefined && (
            <>
              <span className="text-slate-500">·</span>
              <span className="text-sky-300 font-semibold tabular-nums">{cameraMetrics.altitude}m</span>
            </>
          )}
        </div>

        {/* Bottom Bar: Zoom Controls, 2D/3D Pitch Switch, and Center Button */}
        <div className="w-full flex items-center justify-between gap-1 pt-1 border-t border-portos-navy-secondary/60">
          {/* Zoom Buttons with Altitude/Distance Ceiling & Floor Boundaries */}
          <div className="flex items-center bg-portos-navy-secondary/50 rounded-lg p-0.5 border border-portos-navy-secondary">
            <button
              onClick={() => onNavigate("zoomIn")}
              disabled={cameraMetrics.distance <= 9 || (cameraMetrics.altitude !== undefined && cameraMetrics.altitude <= 4)}
              className="p-1.5 rounded hover:bg-portos-teal hover:text-white text-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title="Zoom In (Limit: 3.5m ground clearance)"
              aria-label="Zoom in"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onNavigate("zoomOut")}
              disabled={cameraMetrics.distance >= 112 || (cameraMetrics.altitude !== undefined && cameraMetrics.altitude >= 83)}
              className="p-1.5 rounded hover:bg-portos-teal hover:text-white text-slate-200 transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
              title="Zoom Out (Ceiling: 85m altitude)"
              aria-label="Zoom out"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 2D / 3D Pitch Switch (Map-style 3D tilt toggle) */}
          <button
            onClick={onToggle2D3D}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
              is2D
                ? "bg-portos-navy-secondary text-slate-200 border-portos-navy-secondary hover:text-white"
                : "bg-portos-teal text-white border-portos-teal shadow-sm"
            }`}
            title={is2D ? "Switch to 3D Perspective View" : "Switch to 2D Top-Down Plan View"}
          >
            {is2D ? "2D Map" : "3D View"}
          </button>

          {/* Fit / Center Extent Button */}
          <button
            onClick={onResetCamera}
            className="p-1.5 rounded-lg bg-portos-navy-secondary/50 hover:bg-portos-teal hover:text-white text-slate-200 transition-colors border border-portos-navy-secondary"
            title="Center Port / Fit Terminal Extent"
            aria-label="Reset to terminal center"
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>

          {/* Help Toggle */}
          <button
            onClick={() => setShowKeyHints(!showKeyHints)}
            className="p-1.5 rounded-lg bg-portos-navy-secondary/30 hover:bg-portos-navy-secondary text-slate-400 hover:text-white transition-colors"
            title="Toggle keyboard navigation hints"
          >
            <HelpCircle className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Keyboard & Movement Help Card */}
      {showKeyHints && (
        <div className="bg-portos-navy/95 backdrop-blur-md border border-portos-navy-secondary text-slate-200 rounded-lg p-2.5 shadow-2xl text-[11px] max-w-xs animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between pb-1.5 border-b border-portos-navy-secondary/60 mb-2">
            <div className="flex items-center gap-1.5 font-bold text-white text-xs">
              <Keyboard className="h-3.5 w-3.5 text-portos-teal" />
              <span>Map Navigation Controls</span>
            </div>
            <button
              onClick={() => setShowKeyHints(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-1.5 text-[10px] text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">Pan Port Map:</span>
              <span className="font-mono text-white">Left-Click Drag / WASD / Arrows</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rotate / Tilt 3D:</span>
              <span className="font-mono text-white">Right-Click Drag / Orbit Mode</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Zoom In/Out:</span>
              <span className="font-mono text-white">Scroll Wheel / + / −</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Elevate Sightline:</span>
              <span className="font-mono text-white">Q (Down) / E (Up)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Sprint Flyover:</span>
              <span className="font-mono text-white">Hold Shift</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

