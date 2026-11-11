"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BerthRead,
  VesselCallRead,
  OptimizerResponse,
  ScheduledAssignment,
  ProposeScheduleResponse,
  BerthPlannerSummaryResponse,
} from "@/types/api";
import { BerthPlannerTopNav } from "@/components/berth-planner/BerthPlannerTopNav";
import {
  BerthPlannerHeaderStrip,
  ScheduleOptimizationMode,
  WorkspaceLayoutMode,
} from "@/components/berth-planner/BerthPlannerHeaderStrip";
import { BerthPlannerKpiStrip } from "@/components/berth-planner/BerthPlannerKpiStrip";
import { QuaysideGanttMatrix } from "@/components/berth-planner/QuaysideGanttMatrix";
import { KarnaphuliFairwayGisCard } from "@/components/berth-planner/KarnaphuliFairwayGisCard";
import { VesselOptimizationDetailCard } from "@/components/berth-planner/VesselOptimizationDetailCard";
import { ProposeModal } from "@/components/berth-planner/ProposeModal";
import { ScheduleVersionsModal } from "@/components/berth-planner/ScheduleVersionsModal";
import { ManualAssignModal } from "@/components/berth-planner/ManualAssignModal";

export default function BerthPlannerPage() {
  const queryClient = useQueryClient();

  const [optimizationMode, setOptimizationMode] =
    useState<ScheduleOptimizationMode>("optimized");
  const [layoutMode, setLayoutMode] = useState<WorkspaceLayoutMode>("split");
  const [selectedVessel, setSelectedVessel] = useState<string>("MV Maersk Karun");

  // Modals state
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [proposalSuccess, setProposalSuccess] =
    useState<ProposeScheduleResponse | null>(null);

  const handleConfirmNewVersion = async (notes: string) => {
    setIsConfirming(true);
    try {
      const res = await fetch("/api/v1/berth-planner/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes || "Operational schedule confirmed by chief planner.",
        }),
      });
      if (!res.ok) throw new Error("Failed to confirm schedule version");
      queryClient.invalidateQueries({ queryKey: ["schedule-versions"] });
      setIsVersionsModalOpen(false);
    } finally {
      setIsConfirming(false);
    }
  };

  // Queries for real API backend integration
  const summaryQuery = useQuery<BerthPlannerSummaryResponse>({
    queryKey: ["berth-planner-summary"],
    queryFn: async () => {
      const res = await fetch("/api/v1/berth-planner/summary");
      if (!res.ok) throw new Error("Failed to fetch operational summary");
      return res.json();
    },
    refetchInterval: 15000,
  });

  const berthsQuery = useQuery<BerthRead[]>({
    queryKey: ["berths"],
    queryFn: async () => {
      const res = await fetch("/api/v1/berths");
      if (!res.ok) throw new Error("Failed to fetch berths");
      const json = await res.json();
      return Array.isArray(json) ? json : json.items || [];
    },
  });

  const callsQuery = useQuery<VesselCallRead[]>({
    queryKey: ["vessel-calls"],
    queryFn: async () => {
      const res = await fetch("/api/v1/vessels/calls?page_size=50");
      if (!res.ok) throw new Error("Failed to fetch vessel calls");
      const json = await res.json();
      return Array.isArray(json) ? json : json.items || [];
    },
  });

  const optimizeMutation = useMutation<OptimizerResponse>({
    mutationFn: async () => {
      const res = await fetch("/api/v1/berth-planner/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planning_horizon_hours: 72,
          time_granularity_minutes: 15,
        }),
      });
      if (!res.ok) throw new Error("Optimization solver execution failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["berth-planner-summary"] });
    },
  });

  const handleResolve = () => {
    optimizeMutation.mutate();
  };

  const summary = summaryQuery.data;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#0a0c10] text-[#e2e2e8] select-none font-sans overflow-y-auto">
      {/* 1. Global Aerospace Top Navigation Header */}
      <BerthPlannerTopNav
        onResolve={handleResolve}
        isResolving={optimizeMutation.isPending}
        onProposeSchedule={() => setIsProposeModalOpen(true)}
        onOpenVersions={() => setIsVersionsModalOpen(true)}
      />

      {/* 2. Main Dynamic Workspace */}
      <main className="p-4 sm:p-5 lg:p-6 space-y-4">
        {/* Header Row: Title, Solver Metadata, and View Mode Switches */}
        <BerthPlannerHeaderStrip
          optimizationMode={optimizationMode}
          onSelectOptimizationMode={setOptimizationMode}
          layoutMode={layoutMode}
          onSelectLayoutMode={setLayoutMode}
          onResolve={handleResolve}
          isResolving={optimizeMutation.isPending}
          planningHorizonHours={72}
        />

        {/* 5-Card Operational KPI Summary Strip */}
        <BerthPlannerKpiStrip
          solverLatencyMs={28.4}
          hardViolations={summary?.scheduling_conflicts_count ?? 0}
          totalAnchorageWaitHours={summary?.average_waiting_time_hours ?? 2.2}
          quaysideUtilizationPct={summary?.berth_utilization_pct ?? 88.4}
          tidalCompliancePct={100}
        />

        {/* Workspace Layout Content */}
        {layoutMode === "split" && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
            {/* Left Quayside Gantt Matrix (7 Cols on XL) */}
            <div className="xl:col-span-7">
              <QuaysideGanttMatrix
                selectedVessel={selectedVessel}
                onSelectVessel={setSelectedVessel}
              />
            </div>

            {/* Right Fairway GIS + Selected Vessel Card (5 Cols on XL) */}
            <div className="xl:col-span-5 space-y-4">
              <KarnaphuliFairwayGisCard />
              <VesselOptimizationDetailCard vesselName={selectedVessel} />
            </div>
          </div>
        )}

        {layoutMode === "gantt" && (
          <div className="w-full">
            <QuaysideGanttMatrix
              selectedVessel={selectedVessel}
              onSelectVessel={setSelectedVessel}
            />
          </div>
        )}

        {layoutMode === "map" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <KarnaphuliFairwayGisCard />
            <VesselOptimizationDetailCard vesselName={selectedVessel} />
          </div>
        )}
      </main>

      {/* Propose Schedule Confirmation Modal */}
      <ProposeModal
        isOpen={isProposeModalOpen}
        assignments={optimizeMutation.data?.optimized_schedule || []}
        onClose={() => setIsProposeModalOpen(false)}
        onSuccess={(data) => {
          setProposalSuccess(data);
          setIsProposeModalOpen(false);
        }}
      />

      {/* Version History Modal */}
      <ScheduleVersionsModal
        isOpen={isVersionsModalOpen}
        onClose={() => setIsVersionsModalOpen(false)}
        onConfirmNewVersion={handleConfirmNewVersion}
        isConfirming={isConfirming}
      />
    </div>
  );
}
