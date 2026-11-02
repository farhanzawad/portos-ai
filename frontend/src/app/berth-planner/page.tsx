import React from "react";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";

export default function BerthPlannerPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Constraint-Based Berth Planner
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          Mathematical berth allocation and scheduling using Google OR-Tools CP-SAT.
        </p>
      </div>

      <MilestonePlaceholder
        moduleName="Berth Planner"
        milestoneNumber="Milestone 09"
        milestoneTitle="Google OR-Tools CP-SAT Constrained Scheduling"
        description="A deterministic constraint optimization engine that schedules incoming feeder vessels across 6 illustrative berths. Solves combinatorial constraints: non-overlapping berth occupancy, draft and length boundaries, and crane gang capacities."
        plannedFeatures={[
          "Interactive Gantt-style schedule view comparing Baseline vs. Optimized plans",
          "Hard constraint enforcement (zero spatial overlap, vessel LOA vs. berth length)",
          "Independent feasibility validator that rejects invalid proposals",
          "Detailed assignment reasoning drawer explaining optimization trade-offs",
          "Advisory recommendation workflow requiring explicit human approval",
        ]}
        prerequisites={[
          "Milestone 03: Berth, BerthAssignment, and Equipment relational models",
          "Milestone 04: Berth occupancy and assignment query endpoints",
          "Milestone 09: Python OR-Tools CP-SAT solver service integration",
        ]}
      />
    </div>
  );
}

