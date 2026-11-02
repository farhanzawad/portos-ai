import React from "react";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";

export default function DigitalTwinPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Interactive Terminal Digital Twin
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          Illustrative procedural Three.js 3D spatial canvas and 2D schematic terminal fallback.
        </p>
      </div>

      <MilestonePlaceholder
        moduleName="Digital Twin"
        milestoneNumber="Milestone 06"
        milestoneTitle="Procedural 3D Terminal & 2D Schematic Fallback"
        description="A stylized, illustrative 3D interactive terminal environment built with Three.js, React Three Fiber, and Drei. Visualizes 6 berth lanes, container vessels, ship-to-shore cranes, yard blocks, and simulated internal haulage. Provides camera focus, entity inspection drawers, and an accessible 2D fallback."
        plannedFeatures={[
          "Procedural Three.js geometry for berths, cranes, container stacks, and vessels",
          "Synchronized state binding with backend operational event stream",
          "Interactive raycaster click inspection for vessel draft and crane telemetry",
          "Automatic 2D SVG / Canvas schematic fallback for WebGL-disabled devices",
          "Reduced-motion compliance with static operational state visualization",
        ]}
        prerequisites={[
          "Milestone 03: Operational domain model & PostgreSQL seed data",
          "Milestone 04: Terminal profile & layout REST API endpoints",
          "Milestone 05: Overview dashboard telemetry bindings",
        ]}
      />
    </div>
  );
}

