"use client";

import React, { Suspense, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getBerths,
  getVesselCalls,
  getEquipment,
  getYardBlocks,
} from "@/lib/api-client";
import { DigitalTwinTopNav } from "@/components/digital-twin/DigitalTwinTopNav";
import {
  DigitalTwinSubheader,
  CameraPresetType,
  LightingModeType,
  RenderModeType,
} from "@/components/digital-twin/DigitalTwinSubheader";
import { SpatialGizmoCompass } from "@/components/digital-twin/SpatialGizmoCompass";
import { SpatialViewportPins } from "@/components/digital-twin/SpatialViewportPins";
import { SpatialEntityInspector } from "@/components/digital-twin/SpatialEntityInspector";
import { HydrodynamicsFloatingBar } from "@/components/digital-twin/HydrodynamicsFloatingBar";
import { EquipmentMaintenanceModal } from "@/components/digital-twin/EquipmentMaintenanceModal";
import { Terminal2DIsometricView } from "@/components/digital-twin/Terminal2DIsometricView";
import { TerminalThermalIRView } from "@/components/digital-twin/TerminalThermalIRView";
import { SelectedEntity, CameraMetrics } from "@/components/digital-twin/types";

// Dynamically import real Three.js 3D Canvas
const RealTerminal3DCanvas = dynamic(
  () =>
    import("@/components/digital-twin/RealTerminal3DCanvas").then(
      (mod) => mod.RealTerminal3DCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#0A0C10] flex items-center justify-center text-slate-400 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-secondary animate-ping" />
          <span>INITIALIZING 3D WEBGL SHADERS &amp; REAL TERMINAL MESHES...</span>
        </div>
      </div>
    ),
  }
);

function DigitalTwinContent() {
  const searchParams = useSearchParams();
  const blockParam = searchParams.get("block");

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [selectedEntityName, setSelectedEntityName] = useState<string>("STS-02");
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPresetType>("overview");
  const [lightingMode, setLightingMode] = useState<LightingModeType>("daylight");
  const [renderMode, setRenderMode] = useState<RenderModeType>("3d");
  const [resetCameraSignal, setResetCameraSignal] = useState(0);

  // Attitude telemetry state (driven by live Three.js camera metrics)
  const [telemetry, setTelemetry] = useState({
    heading: 164,
    altitude: 45.0,
    pitch: -24.5,
    fov: 38.0,
    fps: 60.0,
  });

  const { data: berths = [], isLoading: berthsLoading } = useQuery({
    queryKey: ["digital-twin-berths"],
    queryFn: () => getBerths(),
  });

  const { data: vesselData, isLoading: vesselsLoading } = useQuery({
    queryKey: ["digital-twin-vessels"],
    queryFn: () => getVesselCalls({ pageSize: 20 }),
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ["digital-twin-equipment"],
    queryFn: () => getEquipment(),
  });

  const { data: yardBlocks = [], isLoading: yardLoading } = useQuery({
    queryKey: ["digital-twin-yard"],
    queryFn: () => getYardBlocks(),
  });

  const vesselCalls = vesselData?.items || [];

  const handleResetCamera = () => {
    setCameraPreset("overview");
    setResetCameraSignal((s) => s + 1);
    setTelemetry({
      heading: 164,
      altitude: 45.0,
      pitch: -24.5,
      fov: 38.0,
      fps: 60.0,
    });
  };

  const handlePresetSelect = (preset: CameraPresetType) => {
    setCameraPreset(preset);
  };

  const handleCameraMetrics = useCallback((metrics: CameraMetrics) => {
    setTelemetry((prev) => ({
      ...prev,
      heading: Math.round(metrics.bearing),
      pitch: Math.round(metrics.pitch),
      altitude: Math.round(metrics.distance * 0.6),
    }));
  }, []);

  const handleSelectEntity = (entity: SelectedEntity) => {
    setSelectedEntity(entity);
    const anyData = entity.data as any;
    if (anyData?.name) {
      setSelectedEntityName(anyData.name);
    } else if (anyData?.vessel?.name) {
      setSelectedEntityName(anyData.vessel.name);
    } else if (entity.id) {
      setSelectedEntityName(entity.id);
    }
  };

  return (
    <div className="flex flex-1 w-full h-full flex-col overflow-hidden bg-[#0A0C10] select-none text-[#e2e2e8]">
      {/* 1. Shared Spatial Top Navigation Bar */}
      <DigitalTwinTopNav />

      {/* 2. Telemetry Controls Sub-Header */}
      <DigitalTwinSubheader
        currentPreset={cameraPreset}
        onSelectPreset={handlePresetSelect}
        lightingMode={lightingMode}
        onSelectLighting={setLightingMode}
        renderMode={renderMode}
        onSelectRenderMode={setRenderMode}
        onResetCamera={handleResetCamera}
      />

      {/* 3. Main Interactive Spatial Telemetry Viewport Area */}
      <div className="relative flex-1 w-full overflow-hidden bg-[#0A0C10]">
        {/* Subtle Telemetry Grid */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            backgroundSize: "40px 40px",
            backgroundImage:
              "linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
          }}
        />

        {/* MODE 1: REAL 3D WEBGL THREE.JS DIGITAL TWIN */}
        {renderMode === "3d" && (
          <div className="absolute inset-0 z-0">
            <RealTerminal3DCanvas
              berths={berths}
              vesselCalls={vesselCalls}
              equipment={equipment}
              yardBlocks={yardBlocks}
              selectedEntity={selectedEntity}
              onSelectEntity={handleSelectEntity}
              cameraPreset={cameraPreset}
              lightingMode={lightingMode}
              resetCameraSignal={resetCameraSignal}
              onCameraMetrics={handleCameraMetrics}
            />

            {/* In-Canvas 3D Spatial Vector & Entity Overlays (Pins) */}
            <div className="absolute inset-0 pointer-events-none z-10">
              <SpatialViewportPins
                onSelectEntity={(entityName) => setSelectedEntityName(entityName)}
              />
            </div>
          </div>
        )}

        {/* MODE 2: HIGH-PRECISION 2D ISOMETRIC VECTOR SCHEMATIC */}
        {renderMode === "2d" && (
          <div className="absolute inset-0 z-0">
            <Terminal2DIsometricView
              berths={berths}
              vesselCalls={vesselCalls}
              equipment={equipment}
              yardBlocks={yardBlocks}
              selectedEntity={selectedEntity}
              onSelectEntity={handleSelectEntity}
            />
          </div>
        )}

        {/* MODE 3: MARITIME THERMAL INFRARED FLIR SENSOR VIEW */}
        {renderMode === "thermal" && (
          <div className="absolute inset-0 z-0">
            <TerminalThermalIRView
              selectedEntity={selectedEntity}
              onSelectEntity={handleSelectEntity}
            />
          </div>
        )}

        {/* Top-Left In-Scene Spatial Gizmo & Compass HUD (Present strictly in 3D WebGL mode) */}
        {renderMode === "3d" && (
          <div className="pointer-events-none z-20">
            <SpatialGizmoCompass
              heading={telemetry.heading}
              altitude={telemetry.altitude}
              pitch={telemetry.pitch}
              fov={telemetry.fov}
              fps={telemetry.fps}
            />
          </div>
        )}

        {/* Right Spatial Entity Telemetry Drawer (320px Aerospace Panel) */}
        <div className="z-20">
          <SpatialEntityInspector
            onOpenMaintenanceModal={() => setIsMaintenanceModalOpen(true)}
            onFocusEntity={() => {
              setCameraPreset("cranes");
            }}
          />
        </div>

        {/* Bottom Floating Telemetry & Hydrodynamics Bar */}
        <div className="pointer-events-none z-20">
          <HydrodynamicsFloatingBar mode={renderMode} />
        </div>
      </div>

      {/* Equipment Maintenance Modal for Diagnostics & Model Tuning */}
      <EquipmentMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
      />
    </div>
  );
}

export default function DigitalTwinPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-full bg-[#0A0C10] flex items-center justify-center text-slate-400 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-secondary animate-ping" />
            <span>LOADING 3D SPATIAL TELEMETRY COCKPIT...</span>
          </div>
        </div>
      }
    >
      <DigitalTwinContent />
    </Suspense>
  );
}
