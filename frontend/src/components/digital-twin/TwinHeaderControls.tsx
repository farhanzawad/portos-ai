"use client";

import React from "react";
import { LayerVisibility, SimulationState, ViewMode, CameraPreset } from "./types";
import {
  Play,
  Pause,
  RotateCcw,
  Box,
  Map,
  Columns2,
  Ship,
  Anchor,
  Cpu,
  Grid3X3,
  Compass,
  Video,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface TwinHeaderControlsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  cameraPreset?: CameraPreset;
  onCameraPresetChange?: (preset: CameraPreset) => void;
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  simulation: SimulationState;
  onTogglePlay: () => void;
  onChangeSpeed: (speed: 1 | 2 | 5) => void;
  onResetCamera: () => void;
}

export function TwinHeaderControls({
  viewMode,
  onViewModeChange,
  cameraPreset = "isometric",
  onCameraPresetChange,
  layers,
  onToggleLayer,
  simulation,
  onTogglePlay,
  onChangeSpeed,
  onResetCamera,
}: TwinHeaderControlsProps) {
  const formatSimTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `+${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-portos-navy text-white rounded-t-lg border-b border-portos-navy-secondary text-xs select-none">
      {/* Left: View Mode Switcher (3D Twin | 2D GIS Map | 2D Schematic | Split View) */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-sm text-white">
            Digital Twin Workspace
          </span>
          <DataStatusBadge status="SIMULATED" size="sm" />
        </div>

        {/* 4-Way Mode Toggle */}
        <div className="flex items-center bg-portos-navy-secondary/60 p-0.5 rounded border border-portos-navy-secondary">
          <button
            onClick={() => onViewModeChange("3d")}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[11px] font-medium ${
              viewMode === "3d"
                ? "bg-portos-teal text-white font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
            title="Full 3D Interactive Terminal Digital Twin"
          >
            <Box className="h-3.5 w-3.5" />
            <span>3D Twin</span>
          </button>
          <button
            onClick={() => onViewModeChange("map")}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[11px] font-medium ${
              viewMode === "map"
                ? "bg-portos-teal text-white font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
            title="2D Regional Maritime GIS Port Map"
          >
            <Map className="h-3.5 w-3.5" />
            <span>2D GIS Map</span>
          </button>
          <button
            onClick={() => onViewModeChange("2d")}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[11px] font-medium ${
              viewMode === "2d"
                ? "bg-portos-teal text-white font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
            title="2D Operations Schematic Plan View"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>2D Schematic</span>
          </button>
          <button
            onClick={() => onViewModeChange("split")}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors text-[11px] font-medium ${
              viewMode === "split"
                ? "bg-portos-teal text-white font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
            title="Synchronized Split View: 2D GIS Map & 3D Terminal Twin"
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Split View</span>
          </button>
        </div>
      </div>

      {/* Middle: Simulation Controls */}
      <div className="flex items-center gap-2 bg-portos-navy-secondary/40 px-2.5 py-1 rounded border border-portos-navy-secondary">
        <button
          onClick={onTogglePlay}
          className={`flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] transition-colors ${
            simulation.isPlaying
              ? "bg-portos-amber text-portos-navy hover:bg-portos-amber/90"
              : "bg-portos-teal text-white hover:bg-portos-teal/90"
          }`}
          title={simulation.isPlaying ? "Pause Simulation" : "Start Simulation"}
        >
          {simulation.isPlaying ? (
            <>
              <Pause className="h-3 w-3 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3 w-3 fill-current" />
              <span>Simulate</span>
            </>
          )}
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-0.5 bg-portos-navy px-1 py-0.5 rounded text-[10px] font-mono">
          {([1, 2, 5] as const).map((spd) => (
            <button
              key={spd}
              onClick={() => onChangeSpeed(spd)}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                simulation.speed === spd
                  ? "bg-portos-teal text-white font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Elapsed Simulation Time Clock */}
        <div className="font-mono text-[11px] text-portos-teal bg-portos-navy px-2 py-0.5 rounded border border-portos-navy-secondary">
          {formatSimTime(simulation.elapsedSeconds)}
        </div>
      </div>

      {/* Right: Camera Presets & Layer Filters */}
      <div className="flex items-center gap-2">
        {/* Camera Presets (Visible in 3D & Split View) */}
        {(viewMode === "3d" || viewMode === "split") && onCameraPresetChange && (
          <div className="flex items-center gap-1 bg-portos-navy-secondary/60 p-0.5 rounded border border-portos-navy-secondary text-[11px]">
            <Video className="h-3 w-3 text-slate-400 ml-1" />
            <button
              onClick={() => onCameraPresetChange("isometric")}
              className={`px-2 py-0.5 rounded transition-colors ${
                cameraPreset === "isometric"
                  ? "bg-portos-teal text-white font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Isometric 45° terminal overview"
            >
              Isometric
            </button>
            <button
              onClick={() => onCameraPresetChange("topdown")}
              className={`px-2 py-0.5 rounded transition-colors ${
                cameraPreset === "topdown"
                  ? "bg-portos-teal text-white font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Top-down orthographic masterplan view"
            >
              Plan (Top)
            </button>
            <button
              onClick={() => onCameraPresetChange("operational")}
              className={`px-2 py-0.5 rounded transition-colors ${
                cameraPreset === "operational"
                  ? "bg-portos-teal text-white font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Low-angle quayside operational view"
            >
              Operational
            </button>
            <button
              onClick={() => onCameraPresetChange("free")}
              className={`flex items-center gap-1 px-2 py-0.5 rounded transition-colors ${
                cameraPreset === "free"
                  ? "bg-portos-teal text-white font-semibold"
                  : "text-slate-300 hover:text-white"
              }`}
              title="Free Roam unrestricted camera (WASD / Arrows to move freely)"
            >
              <Compass className="h-3 w-3" />
              <span>Free Roam</span>
            </button>
          </div>
        )}

        {/* 3D Layers Toggle */}
        {(viewMode === "3d" || viewMode === "split") && (
          <div className="hidden lg:flex items-center gap-1 bg-portos-navy-secondary/40 px-2 py-1 rounded border border-portos-navy-secondary text-[11px]">
            <LayerButton
              active={layers.berths}
              onClick={() => onToggleLayer("berths")}
              icon={<Anchor className="h-3 w-3" />}
              label="Berths"
            />
            <LayerButton
              active={layers.vessels}
              onClick={() => onToggleLayer("vessels")}
              icon={<Ship className="h-3 w-3" />}
              label="Vessels"
            />
            <LayerButton
              active={layers.cranes}
              onClick={() => onToggleLayer("cranes")}
              icon={<Cpu className="h-3 w-3" />}
              label="Cranes"
            />
            <LayerButton
              active={layers.yardBlocks}
              onClick={() => onToggleLayer("yardBlocks")}
              icon={<Grid3X3 className="h-3 w-3" />}
              label="Yard"
            />
          </div>
        )}

        {/* Camera Reset */}
        {(viewMode === "3d" || viewMode === "split") && (
          <button
            onClick={onResetCamera}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-portos-navy-secondary hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-[11px] font-medium border border-portos-navy-secondary"
            title="Reset Camera"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}

function LayerButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
        active
          ? "bg-portos-teal/30 text-portos-teal font-semibold border border-portos-teal/40"
          : "text-slate-400 hover:text-slate-200 opacity-60"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
