import React from "react";
import { ScenarioLabView } from "@/components/scenarios/ScenarioLabView";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

export default function ScenarioLabPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Decision Lab & Scenario Simulation
            </h1>
            <DataStatusBadge status="SIMULATED" />
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Discrete-event simulation of terminal disruption scenarios using SimPy.
          </p>
        </div>
      </div>

      <ScenarioLabView />
    </div>
  );
}
