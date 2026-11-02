import React from "react";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";

export default function VesselsPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Vessel Intelligence & Track View
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          MapLibre GL JS geographic tracking of Karnaphuli approach channel and ML delay-risk prediction.
        </p>
      </div>

      <MilestonePlaceholder
        moduleName="Vessel Intelligence"
        milestoneNumber="Milestone 07 & 08"
        milestoneTitle="Geographic Vessel Track & Predictive Delay ML"
        description="Geographic mapping of outer anchorage waiting areas and Karnaphuli river approach routes using MapLibre GL JS. Integrates with the scikit-learn predictive ML pipeline to estimate vessel delay hours and risk tiers."
        plannedFeatures={[
          "MapLibre GL JS vector map with explicit maritime attribution",
          "Outer anchorage queue sequencing and Karnaphuli tidal window checks",
          "Reported ETA vs. ML Predicted ETA variance comparison table",
          "Deterministic simulated AIS track replay with clear No Live AIS disclaimers",
          "Model Cards detailing synthetic training parameters and limitations",
        ]}
        prerequisites={[
          "Milestone 03: Vessel, VesselCall, and VesselPosition database entities",
          "Milestone 04: Vessel track and position history endpoints (/api/v1/vessels)",
          "Milestone 08: Trained scikit-learn ETA regression & classification pipeline",
        ]}
      />
    </div>
  );
}

