"use client";

import React, { useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { TerminalScene3D, HoverEntityInfo } from "./TerminalScene3D";
import {
  BerthRead,
  VesselCallRead,
  EquipmentRead,
  YardBlockRead,
} from "@/types/api";
import {
  SelectedEntity,
  CameraPreset,
  CameraMetrics,
} from "./types";

interface RealTerminal3DCanvasProps {
  berths: BerthRead[];
  vesselCalls: VesselCallRead[];
  equipment: EquipmentRead[];
  yardBlocks: YardBlockRead[];
  selectedEntity: SelectedEntity | null;
  onSelectEntity: (entity: SelectedEntity) => void;
  cameraPreset?: CameraPreset;
  lightingMode?: "daylight" | "golden" | "night";
  resetCameraSignal?: number;
  onCameraMetrics?: (metrics: CameraMetrics) => void;
}

export function RealTerminal3DCanvas({
  berths,
  vesselCalls,
  equipment,
  yardBlocks,
  selectedEntity,
  onSelectEntity,
  cameraPreset = "overview",
  lightingMode = "daylight",
  resetCameraSignal = 0,
  onCameraMetrics,
}: RealTerminal3DCanvasProps) {
  const [hoveredInfo, setHoveredInfo] = useState<HoverEntityInfo | null>(null);

  const bgColor =
    lightingMode === "golden"
      ? "#1a1215"
      : lightingMode === "night"
      ? "#040810"
      : "#0c1926";

  return (
    <div className="relative w-full h-full select-none">
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ position: [42, 45, 48], fov: 38 }}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          precision: "highp",
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure =
            lightingMode === "golden"
              ? 1.25
              : lightingMode === "night"
              ? 0.88
              : 1.14;
        }}
      >
        <color attach="background" args={[bgColor]} />
        <TerminalScene3D
          berths={berths}
          vesselCalls={vesselCalls}
          equipment={equipment}
          yardBlocks={yardBlocks}
          layers={{
            vessels: true,
            berths: true,
            cranes: true,
            yardBlocks: true,
          }}
          selectedEntity={selectedEntity}
          onSelectEntity={onSelectEntity}
          onHoverEntity={setHoveredInfo}
          isSimulating={true}
          simulationSpeed={1}
          resetCameraSignal={resetCameraSignal}
          cameraPreset={cameraPreset}
          lightingMode={lightingMode}
          onCameraMetrics={onCameraMetrics}
        />
      </Canvas>

      {/* Floating Hover Card */}
      {hoveredInfo && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 pointer-events-none bg-[#111318]/95 backdrop-blur-md border border-secondary/40 rounded-xl px-4 py-2 text-white shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="text-[10px] font-mono font-bold text-secondary uppercase tracking-wider">
              {hoveredInfo.type}
            </span>
            {hoveredInfo.status && (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 font-mono text-[#8e9bae]">
                {hoveredInfo.status}
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-white mt-0.5">
            {hoveredInfo.title}
          </div>
          <div className="text-[11px] text-[#8e9bae]">
            {hoveredInfo.subtitle}
          </div>
          {hoveredInfo.metric && (
            <div className="text-[10px] font-mono text-[#4edea3] mt-0.5">
              {hoveredInfo.metric}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
