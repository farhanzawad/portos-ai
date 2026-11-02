"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BerthRead, VesselCallRead, OptimizerResponse, ScheduledAssignment, ProposeScheduleResponse } from "@/types/api";
import { SolverMetricsBar } from "./SolverMetricsBar";
import { BerthGanttTimeline } from "./BerthGanttTimeline";
import { VesselQueuePanel } from "./VesselQueuePanel";
import { AssignmentReviewDrawer } from "./AssignmentReviewDrawer";
import { ProposeModal } from "./ProposeModal";
import { CheckCircle2, RefreshCw, AlertTriangle, Calendar } from "lucide-react";

export function BerthPlannerView() {
  const queryClient = useQueryClient();
  const [planningHorizonHours, setPlanningHorizonHours] = useState<number>(72);
  const [viewMode, setViewMode] = useState<"optimized" | "baseline" | "comparison">("optimized");
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduledAssignment | null>(null);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState<boolean>(false);
  const [proposalSuccess, setProposalSuccess] = useState<ProposeScheduleResponse | null>(null);

  // 1. Fetch Berths
  const berthsQuery = useQuery<BerthRead[]>({
    queryKey: ["berths"],
    queryFn: async () => {
      const res = await fetch("/api/v1/berths");
      if (!res.ok) throw new Error("Failed to fetch berths");
      return res.json();
    },
  });

  // 2. Fetch Active Vessel Calls
  const callsQuery = useQuery<VesselCallRead[]>({
    queryKey: ["vessel-calls"],
    queryFn: async () => {
      const res = await fetch("/api/v1/vessels/calls");
      if (!res.ok) throw new Error("Failed to fetch vessel calls");
      return res.json();
    },
  });

  // 3. Fetch/Run Optimization Schedule
  const optimizerQuery = useQuery<OptimizerResponse>({
    queryKey: ["berth-optimization", planningHorizonHours],
    queryFn: async () => {
      const res = await fetch("/api/v1/berth-planner/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planning_horizon_hours: planningHorizonHours,
          time_granularity_minutes: 15,
        }),
      });
      if (!res.ok) throw new Error("Optimization solver execution failed");
      return res.json();
    },
  });

  const handleSelectAssignmentByCallId = (callId: string) => {
    const list =
      viewMode === "baseline"
        ? optimizerQuery.data?.baseline_schedule
        : optimizerQuery.data?.optimized_schedule;
    const match = list?.find((a) => a.vessel_call_id === callId);
    if (match) {
      setSelectedAssignment(match);
    }
  };

  const selectedBerth =
    berthsQuery.data?.find((b) => b.id === selectedAssignment?.berth_id) || null;
  const selectedCall =
    callsQuery.data?.find((c) => c.id === selectedAssignment?.vessel_call_id) || null;

  const isLoading = berthsQuery.isLoading || callsQuery.isLoading || optimizerQuery.isLoading;

  if (isLoading) {
    return (
      <div className="bg-white border border-portos-border rounded-lg p-12 text-center shadow-xs">
        <RefreshCw className="h-6 w-6 text-portos-teal animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-bold text-portos-navy">
          Solving Constrained Berth Allocation Problem...
        </h3>
        <p className="text-xs text-portos-muted mt-1">
          Evaluating Google OR-Tools CP-SAT non-overlapping spatial-temporal matrix.
        </p>
      </div>
    );
  }

  if (optimizerQuery.isError || !optimizerQuery.data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center text-xs text-rose-800">
        <AlertTriangle className="h-6 w-6 text-rose-600 mx-auto mb-2" />
        <h3 className="font-bold text-sm">Failed to Load Berth Optimization Schedule</h3>
        <p className="mt-1">
          {optimizerQuery.error instanceof Error
            ? optimizerQuery.error.message
            : "An unexpected error occurred."}
        </p>
        <button
          onClick={() => optimizerQuery.refetch()}
          className="mt-3 px-3 py-1.5 rounded bg-portos-navy text-white text-xs font-medium hover:bg-portos-navy-secondary transition-colors"
        >
          Retry Solver
        </button>
      </div>
    );
  }

  const optData = optimizerQuery.data;

  return (
    <div className="space-y-4">
      {/* Horizon Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-portos-border p-3 rounded-lg shadow-xs">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-portos-teal" />
          <span className="text-xs font-semibold text-portos-navy">
            Horizon Configuration:
          </span>
          <div className="flex items-center gap-1">
            {[24, 48, 72].map((h) => (
              <button
                key={h}
                onClick={() => setPlanningHorizonHours(h)}
                className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                  planningHorizonHours === h
                    ? "bg-portos-navy text-white font-bold"
                    : "bg-slate-100 text-portos-muted hover:text-portos-navy"
                }`}
              >
                {h}h
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => optimizerQuery.refetch()}
            disabled={optimizerQuery.isFetching}
            className="flex items-center gap-1.5 text-xs text-portos-muted hover:text-portos-navy px-2.5 py-1 border border-portos-border rounded hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`h-3 w-3 ${optimizerQuery.isFetching ? "animate-spin" : ""}`} />
            <span>Re-solve Model</span>
          </button>
        </div>
      </div>

      {/* Success banner if proposal was submitted */}
      {proposalSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Advisory Proposal Logged ({proposalSuccess.proposal_id}): </span>
              <span>{proposalSuccess.message}</span>
            </div>
          </div>
          <button
            onClick={() => setProposalSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-sm leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Solver Metrics Strip */}
      <SolverMetricsBar
        solverStatus={optData.solver_status}
        solveTimeMs={optData.solve_time_ms}
        metrics={optData.comparison_metrics}
        validation={optData.feasibility_validation}
        planningHorizonHours={planningHorizonHours}
        isOptimizing={optimizerQuery.isFetching}
        onOptimize={() => optimizerQuery.refetch()}
        onOpenProposeModal={() => setIsProposeModalOpen(true)}
      />

      {/* Gantt Matrix Timeline */}
      <BerthGanttTimeline
        berths={berthsQuery.data || []}
        assignments={optData.optimized_schedule}
        baselineAssignments={optData.baseline_schedule}
        planningStart={optData.planning_start}
        planningHorizonHours={planningHorizonHours}
        viewMode={viewMode}
        selectedAssignment={selectedAssignment}
        onSelectAssignment={setSelectedAssignment}
        onViewModeChange={setViewMode}
      />

      {/* Vessel Queue & Compatibility Panel */}
      <VesselQueuePanel
        calls={callsQuery.data || []}
        berths={berthsQuery.data || []}
        assignments={optData.optimized_schedule}
        onSelectAssignmentByCallId={handleSelectAssignmentByCallId}
      />

      {/* Assignment Review Drawer */}
      <AssignmentReviewDrawer
        assignment={selectedAssignment}
        berth={selectedBerth}
        call={selectedCall}
        onClose={() => setSelectedAssignment(null)}
      />

      {/* Propose Review Modal */}
      <ProposeModal
        isOpen={isProposeModalOpen}
        assignments={optData.optimized_schedule}
        onClose={() => setIsProposeModalOpen(false)}
        onSuccess={(data) => {
          setIsProposeModalOpen(false);
          setProposalSuccess(data);
          queryClient.invalidateQueries({ queryKey: ["berth-assignments"] });
        }}
      />
    </div>
  );
}

