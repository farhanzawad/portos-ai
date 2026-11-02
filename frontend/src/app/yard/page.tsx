import React from "react";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";

export default function YardPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Yard Intelligence & Congestion Heatmap
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          Container yard block density tracking, threshold alerts, and multi-horizon forecasting.
        </p>
      </div>

      <MilestonePlaceholder
        moduleName="Yard Intelligence"
        milestoneNumber="Milestone 11"
        milestoneTitle="Yard Density Heatmap & Occupancy Forecasting"
        description="A visual top-down grid of container yard blocks showing real-time TEU density and forecasting bottlenecks over 6h, 12h, and 24h horizons. Helps terminal planners prevent crane productivity slowdowns caused by yard congestion."
        plannedFeatures={[
          "Top-down yard block grid with configurable threshold indicators (normal, watch, risk)",
          "Selectable forecast horizons (6h, 12h, 24h) with occupancy trendlines",
          "Deep integration with the 3D Digital Twin: clicking a block focuses it in 3D",
          "Transparent capacity modeling without storing sensitive personal consignee data",
          "Automated congestion alert triggers and bottleneck mitigation suggestions",
        ]}
        prerequisites={[
          "Milestone 03: YardBlock and YardOccupancyObservation models",
          "Milestone 04: Yard block telemetry and capacity API endpoints",
          "Milestone 11: Time-series occupancy forecaster service",
        ]}
      />
    </div>
  );
}

