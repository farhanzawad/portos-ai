"use client";

import React from "react";
import { LayerVisibility, SimulationState } from "./types";
import {
  Play,
  Pause,
  RotateCcw,
  Box,
  Map,
  Ship,
  Anchor,
  Cpu,
  Grid3X3,
  Eye,
  SlidersHorizontal,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface TwinHeaderControlsProps {
  viewMode: "3d" | "2d";
  onViewModeChange: (mode: "3d" | "2d") => void;
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
      {/* Left: View Mode Toggle & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold tracking-tight text-sm text-white">
            Digital Twin Workspace
          </span>
          <DataStatusBadge status="SIMULATED" size="sm" />
        </div>

        {/* 3D vs 2D Toggle */}
        <div className="flex items-center bg-portos-navy-secondary/60 p-0.5 rounded border border-portos-navy-secondary">
          <button
            onClick={() => onViewModeChange("3d")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
              viewMode === "3d"
                ? "bg-portos-teal text-white font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Box className="h-3.5 w-3.5" />
            <span>3D Interactive</span>
          </button>
          <button
            onClick={() => onViewModeChange("2d")}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
              viewMode === "2d"
                ? "bg-portos-teal text-white font-semibold"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            <span>2D Schematic</span>
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
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Sim Time Elapsed */}
        <div className="font-mono text-[11px] text-portos-teal pl-1 tabular-nums">
          <span className="text-[10px] text-slate-400 mr-1">TICK:</span>
          {formatSimTime(simulation.elapsedSeconds)}
        </div>
      </div>

      {/* Right: Layers & Camera Controls */}
      <div className="flex items-center gap-2">
        {/* Layer Visibility Chips */}
        <div className="hidden lg:flex items-center gap-1 bg-portos-navy-secondary/40 px-2 py-1 rounded border border-portos-navy-secondary text-[10px]">
          <span className="text-slate-400 mr-1 flex items-center gap-1">
            <LayersIcon />
            <span>Layers:</span>
          </span>

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

        {/* Camera Reset */}
        {viewMode === "3d" && (
          <button
            onClick={onResetCamera}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-portos-navy-secondary hover:bg-slate-700 text-slate-200 hover:text-white transition-colors text-[11px] font-medium border border-portos-navy-secondary"
            title="Reset Isometric Camera"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset View</span>
          </button>
        )}
      </div>
    </div>
  );
}

function LayersIcon() {
  return <SlidersHorizontal className="h-3 w-3 text-slate-400" />;
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

