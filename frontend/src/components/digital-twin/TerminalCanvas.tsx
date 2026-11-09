"use client";

import React, { useState, useEffect } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import {
  SelectedEntity,
  LayerVisibility,
  SimulationState,
  ViewMode,
  CameraPreset,
  NavSignal,
  NavActionType,
  MouseInteractionMode,
  CameraMetrics,
  SplitLayoutMode,
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
import { MapNavControl } from "./MapNavControl";
import { TerminalSchematic2D } from "./TerminalSchematic2D";
import { TerminalScene3D, HoverEntityInfo } from "./TerminalScene3D";
import { GeospatialPortMap } from "@/components/geospatial/GeospatialPortMap";
import { Skeleton } from "@/components/ui/LoadingSkeleton";

interface TerminalCanvasProps {
  berths: BerthRead[];
  vesselCalls: VesselCallRead[];
  equipment: EquipmentRead[];
  yardBlocks: YardBlockRead[];
  isLoading?: boolean;
  initialSelectedBlockCode?: string | null;
}

export function TerminalCanvas({
  berths,
  vesselCalls,
  equipment,
  yardBlocks,
  isLoading = false,
  initialSelectedBlockCode,
}: TerminalCanvasProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("3d");
  const [splitLayoutMode, setSplitLayoutMode] = useState<SplitLayoutMode>("balanced");
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("isometric");
  const [hasWebGL, setHasWebGL] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(
    null
  );
  const [hoveredInfo, setHoveredInfo] = useState<HoverEntityInfo | null>(null);
  const [resetCameraSignal, setResetCameraSignal] = useState(0);
  const [navSignal, setNavSignal] = useState<NavSignal | null>(null);
  const [mouseMode, setMouseMode] = useState<MouseInteractionMode>("pan");
  const [cameraMetrics, setCameraMetrics] = useState<CameraMetrics>({
    bearing: 42,
    pitch: 48,
    distance: 75,
  });

  const handleNavigate = (action: NavActionType) => {
    setNavSignal({ action, timestamp: Date.now() });
  };

  const handleToggle2D3D = () => {
    handleNavigate("togglePitch");
  };

  const [layers, setLayers] = useState<LayerVisibility>({
    vessels: true,
    berths: true,
    cranes: true,
    yardBlocks: true,
  });

  const [simulation, setSimulation] = useState<SimulationState>({
    isPlaying: true, // Live port movement active by default
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

  // Auto-select yard block from deep link query parameter
  useEffect(() => {
    if (initialSelectedBlockCode && yardBlocks.length > 0) {
      const match = yardBlocks.find(
        (b) =>
          b.code.toUpperCase() === initialSelectedBlockCode.toUpperCase() ||
          b.id.toLowerCase() === initialSelectedBlockCode.toLowerCase()
      );
      if (match) {
        setSelectedEntity({
          type: "yard",
          id: match.id,
          data: match,
        });
      }
    }
  }, [initialSelectedBlockCode, yardBlocks]);

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

  const handleOpen3DView = (entityId?: string) => {
    setViewMode("3d");
    setCameraPreset("operational");
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
        splitLayoutMode={splitLayoutMode}
        onSplitLayoutModeChange={setSplitLayoutMode}
        cameraPreset={cameraPreset}
        onCameraPresetChange={(preset) => setCameraPreset(preset)}
        layers={layers}
        onToggleLayer={toggleLayer}
        simulation={simulation}
        onTogglePlay={togglePlay}
        onChangeSpeed={changeSpeed}
        onResetCamera={handleResetCamera}
      />

      {/* Main Workspace Area */}
      <div className="relative w-full min-h-[660px] bg-slate-950 overflow-hidden select-none">
        {/* VIEW MODE 1: 3D DIGITAL TWIN */}
        {viewMode === "3d" && (
          <div className="w-full h-[660px] relative">
            {hasWebGL ? (
              <Canvas
                shadows
                dpr={[1, 1.5]}
                camera={{ position: [42, 45, 48], fov: 38 }}
                className={`w-full h-full ${
                  mouseMode === "pan"
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-crosshair active:cursor-grabbing"
                }`}
                gl={{
                  antialias: true,
                  alpha: false,
                  powerPreference: "high-performance",
                  precision: "highp",
                }}
                onCreated={({ gl }) => {
                  gl.toneMapping = THREE.ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.14;
                }}
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
                  onHoverEntity={(info) => setHoveredInfo(info)}
                  isSimulating={simulation.isPlaying}
                  simulationSpeed={simulation.speed}
                  resetCameraSignal={resetCameraSignal}
                  cameraPreset={cameraPreset}
                  navSignal={navSignal}
                  mouseMode={mouseMode}
                  onCameraMetrics={setCameraMetrics}
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
            <TwinLegend />

            {/* Map-Style Navigation Controls (Pan Rose N/S/E/W, Compass Needle, Pan vs Orbit, Zoom, 2D/3D Pitch) */}
            <MapNavControl
              onNavigate={handleNavigate}
              onResetCamera={handleResetCamera}
              mouseMode={mouseMode}
              onSetMouseMode={setMouseMode}
              cameraMetrics={cameraMetrics}
              onToggle2D3D={handleToggle2D3D}
            />

            {/* Floating Live 3D Asset Telemetry HUD */}
            {hoveredInfo && (
              <div className="absolute top-3 left-3 z-20 pointer-events-none bg-portos-navy/95 backdrop-blur-md border border-portos-teal/60 rounded-lg px-3.5 py-2.5 text-white shadow-2xl animate-in fade-in duration-150 max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-portos-teal animate-ping" />
                  <span className="text-[10px] font-mono text-portos-teal uppercase font-bold tracking-wider">
                    {hoveredInfo.type}
                  </span>
                  {hoveredInfo.status && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {hoveredInfo.status}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  {hoveredInfo.title}
                </div>
                <div className="text-[11px] text-slate-300">
                  {hoveredInfo.subtitle}
                </div>
                {hoveredInfo.metric && (
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">
                    {hoveredInfo.metric}
                  </div>
                )}
                <div className="text-[9px] text-slate-400 mt-1 italic">
                  Click asset to frame 3D camera & link 2D GIS chart
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIEW MODE 2: 2D REGIONAL MARITIME GIS MAP */}
        {viewMode === "map" && (
          <div className="w-full h-[660px] relative">
            <GeospatialPortMap
              selectedEntity={selectedEntity}
              onSelectEntity={(entity) => setSelectedEntity(entity)}
              isSimulating={simulation.isPlaying}
              simulationSpeed={simulation.speed}
              onOpen3DView={handleOpen3DView}
              height="h-[660px]"
            />
          </div>
        )}

        {/* VIEW MODE 3: 2D OPERATIONS SCHEMATIC PLAN */}
        {viewMode === "2d" && (
          <div className="w-full min-h-[660px] relative">
            <TerminalSchematic2D
              berths={berths}
              vesselCalls={vesselCalls}
              equipment={equipment}
              yardBlocks={yardBlocks}
              layers={layers}
              selectedEntity={selectedEntity}
              onSelectEntity={(entity) => setSelectedEntity(entity)}
            />
          </div>
        )}

        {/* VIEW MODE 4: SYNCHRONIZED SPLIT VIEW WITH 4 VARIATIONS */}
        {viewMode === "split" && splitLayoutMode === "pip" ? (
          /* PiP Variation: Full 3D with Floating Synchronized GIS Radar */
          <div className="w-full h-[660px] relative">
            {hasWebGL ? (
              <Canvas
                shadows
                dpr={[1, 1.5]}
                camera={{ position: [42, 45, 48], fov: 38 }}
                className={`w-full h-full ${
                  mouseMode === "pan"
                    ? "cursor-grab active:cursor-grabbing"
                    : "cursor-crosshair active:cursor-grabbing"
                }`}
                gl={{
                  antialias: true,
                  alpha: false,
                  powerPreference: "high-performance",
                  precision: "highp",
                }}
                onCreated={({ gl }) => {
                  gl.toneMapping = THREE.ACESFilmicToneMapping;
                  gl.toneMappingExposure = 1.14;
                }}
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
                  onHoverEntity={(info) => setHoveredInfo(info)}
                  isSimulating={simulation.isPlaying}
                  simulationSpeed={simulation.speed}
                  resetCameraSignal={resetCameraSignal}
                  cameraPreset={cameraPreset}
                  navSignal={navSignal}
                  mouseMode={mouseMode}
                  onCameraMetrics={setCameraMetrics}
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
            <TwinLegend />
            <MapNavControl
              onNavigate={handleNavigate}
              onResetCamera={handleResetCamera}
              mouseMode={mouseMode}
              onSetMouseMode={setMouseMode}
              cameraMetrics={cameraMetrics}
              onToggle2D3D={handleToggle2D3D}
            />

            {/* Floating Live 3D Asset Telemetry HUD */}
            {hoveredInfo && (
              <div className="absolute top-3 left-3 z-20 pointer-events-none bg-portos-navy/95 backdrop-blur-md border border-portos-teal/60 rounded-lg px-3.5 py-2.5 text-white shadow-2xl animate-in fade-in duration-150 max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-portos-teal animate-ping" />
                  <span className="text-[10px] font-mono text-portos-teal uppercase font-bold tracking-wider">
                    {hoveredInfo.type}
                  </span>
                  {hoveredInfo.status && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {hoveredInfo.status}
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-white mt-1">
                  {hoveredInfo.title}
                </div>
                <div className="text-[11px] text-slate-300">
                  {hoveredInfo.subtitle}
                </div>
                {hoveredInfo.metric && (
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">
                    {hoveredInfo.metric}
                  </div>
                )}
              </div>
            )}

            {/* Floating Synchronized GIS Radar Window (PiP) */}
            <div className="absolute bottom-4 left-4 z-30 w-[360px] sm:w-[410px] h-[270px] rounded-2xl overflow-hidden shadow-2xl border-2 border-portos-teal/80 bg-portos-navy/95 backdrop-blur-md flex flex-col">
              <div className="flex items-center justify-between px-3 py-1.5 bg-portos-navy border-b border-portos-navy-secondary text-white text-[11px] font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-portos-teal animate-ping" />
                  <span className="font-bold text-portos-teal">SYNCHRONIZED GIS RADAR</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSplitLayoutMode("balanced")}
                    className="px-2 py-0.5 rounded bg-portos-navy-secondary text-slate-300 hover:text-white text-[10px] transition-colors"
                  >
                    50:50 Split
                  </button>
                  <button
                    onClick={() => setSplitLayoutMode("gis-focus")}
                    className="px-2 py-0.5 rounded bg-portos-navy-secondary text-slate-300 hover:text-white text-[10px] transition-colors"
                  >
                    Expand GIS
                  </button>
                </div>
              </div>
              <div className="flex-1 w-full h-[calc(100%-31px)] relative">
                <GeospatialPortMap
                  selectedEntity={selectedEntity}
                  onSelectEntity={(entity) => setSelectedEntity(entity)}
                  isSimulating={simulation.isPlaying}
                  simulationSpeed={simulation.speed}
                  onOpen3DView={handleOpen3DView}
                  height="h-full"
                />
              </div>
            </div>
          </div>
        ) : viewMode === "split" ? (
          /* Side-by-Side Variations: Balanced (50/50), GIS Focus (65/35), or Twin Focus (35/65) */
          <div
            className={`w-full h-[660px] divide-y lg:divide-y-0 lg:divide-x divide-portos-navy-secondary ${
              splitLayoutMode === "gis-focus"
                ? "grid grid-cols-1 lg:grid-cols-12"
                : splitLayoutMode === "twin-focus"
                ? "grid grid-cols-1 lg:grid-cols-12"
                : "grid grid-cols-1 lg:grid-cols-2"
            }`}
          >
            {/* Left Column: 2D Maritime GIS Map */}
            <div
              className={`relative w-full h-[330px] lg:h-[660px] ${
                splitLayoutMode === "gis-focus"
                  ? "lg:col-span-8"
                  : splitLayoutMode === "twin-focus"
                  ? "lg:col-span-4"
                  : ""
              }`}
            >
              <GeospatialPortMap
                selectedEntity={selectedEntity}
                onSelectEntity={(entity) => setSelectedEntity(entity)}
                isSimulating={simulation.isPlaying}
                simulationSpeed={simulation.speed}
                onOpen3DView={handleOpen3DView}
                height="h-full"
              />
            </div>

            {/* Right Column: 3D Terminal Digital Twin */}
            <div
              className={`relative w-full h-[330px] lg:h-[660px] bg-slate-950 ${
                splitLayoutMode === "gis-focus"
                  ? "lg:col-span-4"
                  : splitLayoutMode === "twin-focus"
                  ? "lg:col-span-8"
                  : ""
              }`}
            >
              {hasWebGL ? (
                <Canvas
                  shadows
                  dpr={[1, 1.5]}
                  camera={{ position: [42, 45, 48], fov: 38 }}
                  className={`w-full h-full ${
                    mouseMode === "pan"
                      ? "cursor-grab active:cursor-grabbing"
                      : "cursor-crosshair active:cursor-grabbing"
                  }`}
                  gl={{
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance",
                    precision: "highp",
                  }}
                  onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping;
                    gl.toneMappingExposure = 1.14;
                  }}
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
                    onHoverEntity={(info) => setHoveredInfo(info)}
                    isSimulating={simulation.isPlaying}
                    simulationSpeed={simulation.speed}
                    resetCameraSignal={resetCameraSignal}
                    cameraPreset={cameraPreset}
                    navSignal={navSignal}
                    mouseMode={mouseMode}
                    onCameraMetrics={setCameraMetrics}
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
              <TwinLegend />

              {/* Map-Style Navigation Controls (Pan Rose N/S/E/W, Compass Needle, Pan vs Orbit, Zoom, 2D/3D Pitch) */}
              <MapNavControl
                onNavigate={handleNavigate}
                onResetCamera={handleResetCamera}
                mouseMode={mouseMode}
                onSetMouseMode={setMouseMode}
                cameraMetrics={cameraMetrics}
                onToggle2D3D={handleToggle2D3D}
              />

              {/* Floating Live 3D Asset Telemetry HUD in Split View */}
              {hoveredInfo && (
                <div className="absolute top-3 left-3 z-20 pointer-events-none bg-portos-navy/95 backdrop-blur-md border border-portos-teal/60 rounded-lg px-3 py-2 text-white shadow-2xl animate-in fade-in duration-150 max-w-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-portos-teal animate-ping" />
                    <span className="text-[9px] font-mono text-portos-teal uppercase font-bold tracking-wider">
                      {hoveredInfo.type}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-white mt-0.5 truncate">
                    {hoveredInfo.title}
                  </div>
                  <div className="text-[10px] text-slate-300 truncate">
                    {hoveredInfo.subtitle}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Floating Entity Inspector Drawer for selected entities */}
        <EntityInspectorDrawer
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      </div>
    </div>
  );
}
