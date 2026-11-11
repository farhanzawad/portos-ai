"use client";

import React, { useState } from "react";
import { Sun, Sparkles, Eye, Video, RotateCcw } from "lucide-react";

export type CameraPresetType =
  | "overview"
  | "berths"
  | "fairway"
  | "yard"
  | "cranes";

export type LightingModeType = "daylight" | "golden" | "night";
export type RenderModeType = "3d" | "2d" | "thermal";

interface DigitalTwinSubheaderProps {
  currentPreset?: CameraPresetType;
  onSelectPreset?: (preset: CameraPresetType) => void;
  lightingMode?: LightingModeType;
  onSelectLighting?: (mode: LightingModeType) => void;
  renderMode?: RenderModeType;
  onSelectRenderMode?: (mode: RenderModeType) => void;
  onResetCamera?: () => void;
}

export function DigitalTwinSubheader({
  currentPreset = "overview",
  onSelectPreset,
  lightingMode = "daylight",
  onSelectLighting,
  renderMode = "3d",
  onSelectRenderMode,
  onResetCamera,
}: DigitalTwinSubheaderProps) {
  const [activePreset, setActivePreset] = useState<CameraPresetType>(currentPreset);
  const [activeLighting, setActiveLighting] = useState<LightingModeType>(lightingMode);
  const [activeRender, setActiveRender] = useState<RenderModeType>(renderMode);

  const handlePreset = (preset: CameraPresetType) => {
    setActivePreset(preset);
    if (onSelectPreset) onSelectPreset(preset);
  };

  const handleLighting = (mode: LightingModeType) => {
    setActiveLighting(mode);
    if (onSelectLighting) onSelectLighting(mode);
  };

  const handleRender = (mode: RenderModeType) => {
    setActiveRender(mode);
    if (onSelectRenderMode) onSelectRenderMode(mode);
  };

  return (
    <div className="bg-[#0c0e12] border-b border-white/[0.08] px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-4 z-20 shrink-0 select-none">
      {/* Title & Channel Subtitle */}
      <div className="flex items-center gap-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[#e2e2e8] text-sm sm:text-base font-bold tracking-tight">
              Terminal Digital Twin &amp; Spatial Telemetry
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-secondary-container/20 text-secondary border border-secondary-container/30">
              ONLINE SIM
            </span>
          </div>
          <p className="text-[#8e9bae] text-xs">
            Three.js WebGL Quayside Simulation • Hydrodynamic Karnaphuli Channel Model
          </p>
        </div>

        {/* Camera Presets Buttons */}
        <div className="hidden xl:flex items-center gap-1 bg-[#1a1c20] p-1 rounded-lg border border-white/[0.06]">
          <button
            onClick={() => handlePreset("overview")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activePreset === "overview"
                ? "bg-[#282a2e] text-white shadow-sm border border-white/10"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Overview (Quay)
          </button>
          <button
            onClick={() => handlePreset("berths")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activePreset === "berths"
                ? "bg-[#282a2e] text-white shadow-sm border border-white/10"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Berths CCT/NCT
          </button>
          <button
            onClick={() => handlePreset("fairway")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activePreset === "fairway"
                ? "bg-[#282a2e] text-white shadow-sm border border-white/10"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Fairway Approach
          </button>
          <button
            onClick={() => handlePreset("yard")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activePreset === "yard"
                ? "bg-[#282a2e] text-white shadow-sm border border-white/10"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            RTG Yard Blocks
          </button>
          <button
            onClick={() => handlePreset("cranes")}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activePreset === "cranes"
                ? "bg-[#282a2e] text-white shadow-sm border border-white/10"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            STS Cranes
          </button>
        </div>
      </div>

      {/* Lighting, Render Mode, and Camera Reset Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Lighting / Time Toggle */}
        <div className="flex items-center bg-[#1a1c20] p-0.5 rounded-lg border border-white/[0.06] text-xs">
          <button
            onClick={() => handleLighting("daylight")}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeLighting === "daylight"
                ? "bg-[#282a2e] text-primary"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            <Sun className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Daylight 14:00</span>
          </button>
          <button
            onClick={() => handleLighting("golden")}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeLighting === "golden"
                ? "bg-[#282a2e] text-amber-400"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Golden Hour</span>
          </button>
          <button
            onClick={() => handleLighting("night")}
            className={`px-2.5 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              activeLighting === "night"
                ? "bg-[#282a2e] text-cyan-400"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Night IR</span>
          </button>
        </div>

        {/* Render Switcher */}
        <div className="flex items-center bg-[#1a1c20] p-0.5 rounded-lg border border-white/[0.06] text-xs">
          <button
            onClick={() => handleRender("3d")}
            className={`px-3 py-1 rounded font-semibold transition-colors ${
              activeRender === "3d"
                ? "bg-primary-container text-white"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            3D WebGL (Active)
          </button>
          <button
            onClick={() => handleRender("2d")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeRender === "2d"
                ? "bg-[#282a2e] text-white"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            2D Isometric
          </button>
          <button
            onClick={() => handleRender("thermal")}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              activeRender === "thermal"
                ? "bg-[#282a2e] text-white"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Thermal IR
          </button>
        </div>

        {/* Reset Camera Button */}
        <button
          onClick={onResetCamera}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#282a2e] hover:bg-[#37393e] text-xs text-white border border-white/10 transition-colors shadow-sm"
          title="Reset Viewport to Default Perspective"
        >
          <Video className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Reset Camera</span>
        </button>
      </div>
    </div>
  );
}
