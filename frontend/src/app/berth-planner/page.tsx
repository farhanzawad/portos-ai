import React from "react";
import { BerthPlannerView } from "@/components/berth-planner/BerthPlannerView";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

export default function BerthPlannerPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Constraint-Based Berth Planner
            </h1>
            <DataStatusBadge status="SIMULATED" />
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Mathematical berth allocation and scheduling using Google OR-Tools CP-SAT.
          </p>
        </div>
      </div>

      <BerthPlannerView />
    </div>
  );
}
