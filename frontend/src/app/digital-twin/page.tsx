"use client";

import React, { Suspense, useState } from "react";
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

// Dynamically import Three.js Canvas if WebGL 3D mode is toggled
const TerminalCanvas = dynamic(
  () =>
    import("@/components/digital-twin/TerminalCanvas").then(
      (mod) => mod.TerminalCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 bg-[#0A0C10] flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary animate-ping" />
          <span>Initializing High-Fidelity 3D WebGL Shaders...</span>
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
  const [cameraPreset, setCameraPreset] = useState<CameraPresetType>("overview");
  const [lightingMode, setLightingMode] = useState<LightingModeType>("daylight");
  const [renderMode, setRenderMode] = useState<RenderModeType>("3d");
  const [useLiveCanvas, setUseLiveCanvas] = useState(false);

  // Attitude telemetry state
  const [telemetry, setTelemetry] = useState({
    heading: 164,
    altitude: 45.0,
    pitch: -24.5,
    fov: 60.0,
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
  const isLoading =
    berthsLoading || vesselsLoading || equipmentLoading || yardLoading;

  const handleResetCamera = () => {
    setCameraPreset("overview");
    setTelemetry({
      heading: 164,
      altitude: 45.0,
      pitch: -24.5,
      fov: 60.0,
      fps: 60.0,
    });
  };

  const handlePresetSelect = (preset: CameraPresetType) => {
    setCameraPreset(preset);
    if (preset === "berths") {
      setTelemetry((prev) => ({ ...prev, heading: 142, altitude: 32.0, pitch: -18.0 }));
    } else if (preset === "fairway") {
      setTelemetry((prev) => ({ ...prev, heading: 210, altitude: 65.0, pitch: -30.0 }));
    } else if (preset === "yard") {
      setTelemetry((prev) => ({ ...prev, heading: 98, altitude: 28.0, pitch: -22.0 }));
    } else if (preset === "cranes") {
      setTelemetry((prev) => ({ ...prev, heading: 164, altitude: 22.0, pitch: -12.0 }));
    } else {
      setTelemetry((prev) => ({ ...prev, heading: 164, altitude: 45.0, pitch: -24.5 }));
    }
  };

  // Lighting overlay styling filter
  const getLightingFilter = () => {
    if (lightingMode === "golden") return "sepia(0.35) saturate(1.4) brightness(0.95)";
    if (lightingMode === "night") return "hue-rotate(190deg) invert(0.85) contrast(1.3) brightness(0.75)";
    return "brightness(0.95)";
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
        onSelectRenderMode={(mode) => {
          setRenderMode(mode);
          if (mode === "2d") setUseLiveCanvas(true);
        }}
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

        {/* Viewport Render Layer */}
        {useLiveCanvas ? (
          <div className="absolute inset-0 z-0">
            <TerminalCanvas
              berths={berths}
              vesselCalls={vesselCalls}
              equipment={equipment}
              yardBlocks={yardBlocks}
              isLoading={isLoading}
              initialSelectedBlockCode={blockParam}
            />
          </div>
        ) : (
          <div className="relative w-full h-full overflow-hidden">
            {/* High-Fidelity Photorealistic Quayside Simulation Backdrop */}
            <div
              className="w-full h-full bg-cover bg-center transition-all duration-700"
              style={{
                backgroundImage:
                  "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDmNRquZLZ6Fnj_Hmv40NdNP2Sf7X6uX9wz_KSSmEmEzcl6wFpQbScIyEIsE-OYDsmt5oG3ZXW25j6q8Yv9QBkSTGH4bOGAlOd6ItpsA3-L2dAXnfYB7ewCHOGJGYs72ck4fekYTvq4bb7evqfhx1fdl_V7o1p-KreHIDqVSecbddRttVgpMwLk1TMPbSQfZTONSBNo1lv7I58mLzjARZMac33fgPckX93ha37VaBY')",
                filter: getLightingFilter(),
              }}
            />

            {/* Perspective Depth Gradient Masks */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0C10] via-transparent to-black/30 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0C10]/60 via-transparent to-[#0A0C10]/70 pointer-events-none" />
          </div>
        )}

        {/* 4. Top-Left In-Scene Spatial Gizmo & Compass HUD */}
        <SpatialGizmoCompass
          heading={telemetry.heading}
          altitude={telemetry.altitude}
          pitch={telemetry.pitch}
          fov={telemetry.fov}
          fps={telemetry.fps}
        />

        {/* 5. In-Canvas 3D Spatial Vector & Entity Overlays */}
        <SpatialViewportPins
          onSelectEntity={(entityName) => setSelectedEntityName(entityName)}
        />

        {/* 6. Right Spatial Entity Telemetry Drawer (320px Aerospace Panel) */}
        <SpatialEntityInspector
          onOpenMaintenanceModal={() => setIsMaintenanceModalOpen(true)}
          onFocusEntity={() => {
            setTelemetry((prev) => ({ ...prev, heading: 164, altitude: 22.0 }));
          }}
        />

        {/* 7. Bottom Floating Telemetry & Hydrodynamics Bar */}
        <HydrodynamicsFloatingBar />
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
        <div className="w-screen h-screen bg-[#0A0C10] flex items-center justify-center text-slate-400 text-xs">
          Loading 3D Spatial Telemetry Cockpit...
        </div>
      }
    >
      <DigitalTwinContent />
    </Suspense>
  );
}
