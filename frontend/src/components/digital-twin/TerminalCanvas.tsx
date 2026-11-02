"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Canvas } from "@react-three/fiber";
import {
  SelectedEntity,
  LayerVisibility,
  SimulationState,
} from "./types";
import {
  BerthRead,
  VesselCallRead,
  EquipmentRead,
  YardBlockRead,
} from "@/types/api";
import { TwinHeaderControls } from "./TwinHeaderControls";
import { EntityInspectorDrawer } from "./EntityInspectorDrawer";
import { TwinLegend } from "./TwinLegend";
import { TerminalSchematic2D } from "./TerminalSchematic2D";
import { TerminalScene3D } from "./TerminalScene3D";
import { Skeleton } from "@/components/ui/LoadingSkeleton";

interface TerminalCanvasProps {
  berths: BerthRead[];
  vesselCalls: VesselCallRead[];
  equipment: EquipmentRead[];
  yardBlocks: YardBlockRead[];
  isLoading?: boolean;
}

export function TerminalCanvas({
  berths,
  vesselCalls,
  equipment,
  yardBlocks,
  isLoading = false,
}: TerminalCanvasProps) {
  const [viewMode, setViewMode] = useState<"3d" | "2d">("3d");
  const [hasWebGL, setHasWebGL] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(
    null
  );
  const [resetCameraSignal, setResetCameraSignal] = useState(0);

  const [layers, setLayers] = useState<LayerVisibility>({
    vessels: true,
    berths: true,
    cranes: true,
    yardBlocks: true,
  });

  const [simulation, setSimulation] = useState<SimulationState>({
    isPlaying: false,
    speed: 1,
    elapsedSeconds: 0,
  });

  // Detect WebGL capability on mount
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setHasWebGL(false);
        setViewMode("2d");
      }
    } catch {
      setHasWebGL(false);
      setViewMode("2d");
    }
  }, []);

  // Simulation timer tick
  useEffect(() => {
    if (!simulation.isPlaying) return;

    const interval = setInterval(() => {
      setSimulation((prev) => ({
        ...prev,
        elapsedSeconds: prev.elapsedSeconds + prev.speed,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [simulation.isPlaying, simulation.speed]);

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const togglePlay = () => {
    setSimulation((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const changeSpeed = (speed: 1 | 2 | 5) => {
    setSimulation((prev) => ({ ...prev, speed }));
  };

  const handleResetCamera = () => {
    setResetCameraSignal((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-portos-border bg-portos-surface shadow-sm overflow-hidden flex flex-col h-[700px]">
        <div className="p-4 border-b border-portos-border bg-portos-navy flex justify-between items-center">
          <Skeleton className="h-5 w-48 bg-slate-700" />
          <Skeleton className="h-5 w-32 bg-slate-700" />
        </div>
        <div className="flex-1 bg-slate-900 p-8 flex items-center justify-center">
          <div className="text-center space-y-3">
            <Skeleton className="h-10 w-10 rounded-full mx-auto bg-slate-800" />
            <Skeleton className="h-4 w-44 mx-auto bg-slate-800" />
            <p className="text-xs text-slate-500">
              Initializing procedural terminal scene and spatial telemetry...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-portos-border bg-portos-surface shadow-md overflow-hidden flex flex-col relative">
      {/* Top Controls Toolbar */}
      <TwinHeaderControls
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        layers={layers}
        onToggleLayer={toggleLayer}
        simulation={simulation}
        onTogglePlay={togglePlay}
        onChangeSpeed={changeSpeed}
        onResetCamera={handleResetCamera}
      />

      {/* Main Canvas Area */}
      <div className="relative w-full h-[660px] bg-slate-950 overflow-hidden select-none">
        {viewMode === "3d" && hasWebGL ? (
          <Canvas
            shadows
            camera={{ position: [40, 42, 46], fov: 38 }}
            className="w-full h-full cursor-grab active:cursor-grabbing"
            gl={{ antialias: true, alpha: false }}
          >
            <color attach="background" args={["#0c1926"]} />
            <TerminalScene3D
              berths={berths}
              vesselCalls={vesselCalls}
              equipment={equipment}
              yardBlocks={yardBlocks}
              layers={layers}
              selectedEntity={selectedEntity}
              onSelectEntity={(entity) => setSelectedEntity(entity)}
              isSimulating={simulation.isPlaying}
              simulationSpeed={simulation.speed}
              resetCameraSignal={resetCameraSignal}
            />
          </Canvas>
        ) : (
          <TerminalSchematic2D
            berths={berths}
            vesselCalls={vesselCalls}
            equipment={equipment}
            yardBlocks={yardBlocks}
            layers={layers}
            selectedEntity={selectedEntity}
            onSelectEntity={(entity) => setSelectedEntity(entity)}
          />
        )}

        {/* Floating Entity Inspector Drawer */}
        <EntityInspectorDrawer
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />

        {/* Bottom Legend Overlay */}
        <TwinLegend />
      </div>
    </div>
  );
}

