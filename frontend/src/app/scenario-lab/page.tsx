import React from "react";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";

export default function ScenarioLabPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Scenario Lab & Decision Lab
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          Discrete-event simulation of disruption scenarios using SimPy.
        </p>
      </div>

      <MilestonePlaceholder
        moduleName="Scenario Lab"
        milestoneNumber="Milestone 10"
        milestoneTitle="SimPy Discrete-Event Simulation & Disruption Modeling"
        description="A deterministic discrete-event simulation engine modeling the end-to-end maritime terminal chain: arrival, queueing, berthing, crane discharge, and departure. Lets operators inject simulated equipment outages, weather delays, or surge volumes to evaluate trade-offs."
        plannedFeatures={[
          "Configurable scenario parameters (crane offline, arrival volume spikes, weather factors)",
          "Side-by-side KPI comparison (mean waiting time, queue distributions, equipment utilization)",
          "Deterministic reproducible runs with seed tracking",
          "Visual queue-depth dynamics and bottleneck identification",
          "Advisory recommendation generator proposing recovery plans",
        ]}
        prerequisites={[
          "Milestone 03: Scenario, ScenarioRun, and ScenarioResult database models",
          "Milestone 04: Simulation execution and result retrieval endpoints",
          "Milestone 10: Python SimPy simulation engine and distribution generators",
        ]}
      />
    </div>
  );
}

