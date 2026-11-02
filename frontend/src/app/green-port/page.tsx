import React from "react";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";

export default function GreenPortPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Green Port Analytics
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          Auditable operational carbon and air quality estimates derived from transparent factor models.
        </p>
      </div>

      <MilestonePlaceholder
        moduleName="Green Port"
        milestoneNumber="Milestone 12"
        milestoneTitle="Auditable Emission Estimates & Factor Transparency"
        description="Transparent carbon footprint analysis calculating secondary emissions from auxiliary engine runtime during outer anchorage waiting and electrical draw from container handling equipment. Exposes traceable factor formulas without greenwashing or unsubstantiated claims."
        plannedFeatures={[
          "Activity-based carbon estimations (kg CO2e) for vessel hoteling and crane movements",
          "Traceable emission factor dictionary with explicit source lineage and scope notes",
          "Scenario comparison: estimated emissions variance between Baseline and Disruption runs",
          "Transparent distinction between verified factors and illustrative demo assumptions",
          "Environmental context tracking without unauthorized navigational clearances",
        ]}
        prerequisites={[
          "Milestone 03: EmissionFactor and EmissionsEstimate schema",
          "Milestone 04: Green Port analytics calculation API",
          "Milestone 10: SimPy waiting-time and equipment runtime telemetry feeds",
        ]}
      />
    </div>
  );
}

