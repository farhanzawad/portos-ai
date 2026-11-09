"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BerthRead,
  VesselCallRead,
  OptimizerResponse,
  ScheduledAssignment,
  ProposeScheduleResponse,
  BerthPlannerSummaryResponse,
} from "@/types/api";
import { BerthOperationalSummary } from "./BerthOperationalSummary";
import { SolverMetricsBar } from "./SolverMetricsBar";
import { BerthGanttTimeline } from "./BerthGanttTimeline";
import { BerthMapSplitView } from "./BerthMapSplitView";
import { VesselQueuePanel } from "./VesselQueuePanel";
import { AssignmentReviewDrawer } from "./AssignmentReviewDrawer";
import { BerthInfoModal } from "./BerthInfoModal";
import { ManualAssignModal } from "./ManualAssignModal";
import { ScheduleVersionsModal } from "./ScheduleVersionsModal";
import { ProposeModal } from "./ProposeModal";
import { OperationalSyncLoopModal } from "@/components/layout/OperationalSyncLoopModal";
import {
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Layout,
  Columns,
  MapPin,
  History,
  Lock,
  Workflow,
  Sliders,
} from "lucide-react";

export function BerthPlannerView() {
  const queryClient = useQueryClient();
  const [planningHorizonHours, setPlanningHorizonHours] = useState<number>(72);
  const [viewMode, setViewMode] = useState<"optimized" | "baseline" | "comparison">("optimized");
  const [layoutMode, setLayoutMode] = useState<"split" | "gantt" | "map">("split");
  const [selectedAssignment, setSelectedAssignment] = useState<ScheduledAssignment | null>(null);
  const [selectedBerthForInfo, setSelectedBerthForInfo] = useState<BerthRead | null>(null);
  const [callForManualAssign, setCallForManualAssign] = useState<VesselCallRead | null>(null);
  const [isVersionsModalOpen, setIsVersionsModalOpen] = useState<boolean>(false);
  const [isSyncLoopOpen, setIsSyncLoopOpen] = useState<boolean>(false);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState<boolean>(false);
  const [proposalSuccess, setProposalSuccess] = useState<ProposeScheduleResponse | null>(null);
  const [confirmSuccessMsg, setConfirmSuccessMsg] = useState<string | null>(null);

  // 1. Fetch Operational Summary KPIs
  const summaryQuery = useQuery<BerthPlannerSummaryResponse>({
    queryKey: ["berth-planner-summary"],
    queryFn: async () => {
      const res = await fetch("/api/v1/berth-planner/summary");
      if (!res.ok) throw new Error("Failed to fetch operational summary");
      return res.json();
    },
    refetchInterval: 15000,
  });

  // 2. Fetch Berths
  const berthsQuery = useQuery<BerthRead[]>({
    queryKey: ["berths"],
    queryFn: async () => {
      const res = await fetch("/api/v1/berths");
      if (!res.ok) throw new Error("Failed to fetch berths");
      const json = await res.json();
      return Array.isArray(json) ? json : (json.items || []);
    },
  });

  // 3. Fetch Active Vessel Calls
  const callsQuery = useQuery<VesselCallRead[]>({
    queryKey: ["vessel-calls"],
    queryFn: async () => {
      const res = await fetch("/api/v1/vessels/calls?page_size=50");
      if (!res.ok) throw new Error("Failed to fetch vessel calls");
      const json = await res.json();
      return Array.isArray(json) ? json : (json.items || []);
    },
  });

  // 4. Fetch/Run Optimization Schedule
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

  // Confirm schedule mutation
  const confirmMutation = useMutation({
    mutationFn: async (notes: string) => {
      const res = await fetch("/api/v1/berth-planner/schedules/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planning_horizon_hours: planningHorizonHours,
          operator_notes: notes,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Failed to confirm schedule");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setConfirmSuccessMsg(`Schedule locked & confirmed as v${data.version_number}.0!`);
      queryClient.invalidateQueries({ queryKey: ["berth-optimization"] });
      queryClient.invalidateQueries({ queryKey: ["berth-planner-summary"] });
      queryClient.invalidateQueries({ queryKey: ["berth-schedule-versions"] });
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

  const berthsList = Array.isArray(berthsQuery.data) ? berthsQuery.data : [];
  const callsList = Array.isArray(callsQuery.data) ? callsQuery.data : [];

  const selectedBerth =
    berthsList.find((b) => b.id === selectedAssignment?.berth_id) || null;
  const selectedCall =
    callsList.find((c) => c.id === selectedAssignment?.vessel_call_id) || null;

  const isLoading = berthsQuery.isLoading || callsQuery.isLoading || optimizerQuery.isLoading;

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
        <RefreshCw className="h-6 w-6 text-sky-600 animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-bold text-slate-900">
          Executing Google OR-Tools CP-SAT Berth Allocation Engine...
        </h3>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Evaluating non-overlapping spatial-temporal matrix and hard compatibility constraints.
        </p>
      </div>
    );
  }

  if (optimizerQuery.isError || !optimizerQuery.data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center text-xs text-rose-800">
        <AlertTriangle className="h-6 w-6 text-rose-600 mx-auto mb-2" />
        <h3 className="font-bold text-sm">Failed to Load Berth Optimization Schedule</h3>
        <p className="mt-1">
          {optimizerQuery.error instanceof Error
            ? optimizerQuery.error.message
            : "An unexpected error occurred."}
        </p>
        <button
          onClick={() => optimizerQuery.refetch()}
          className="mt-3 px-3 py-1.5 rounded-lg bg-portos-navy text-white text-xs font-medium hover:bg-portos-navy-secondary transition-colors"
        >
          Retry Solver
        </button>
      </div>
    );
  }

  const optData = optimizerQuery.data;

  return (
    <div className="space-y-4">
      {/* 1. Operational Summary KPI Cards */}
      <BerthOperationalSummary
        summary={summaryQuery.data || null}
        isLoading={summaryQuery.isLoading}
      />

      {/* 2. Workspace Control Strip: Horizon & Awake.ai Split View Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200/90 p-3.5 rounded-2xl shadow-xs font-sans">
        {/* Horizon selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-sky-600" />
          <span className="text-xs font-bold text-slate-800">
            Horizon:
          </span>
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200">
            {[24, 48, 72, 168].map((h) => (
              <button
                key={h}
                onClick={() => setPlanningHorizonHours(h)}
                className={`px-3 py-1 text-xs rounded-full font-medium tabular-nums transition-all ${
                  planningHorizonHours === h
                    ? "bg-sky-600 text-white font-bold shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {h === 168 ? "7 Days" : `${h}h`}
              </button>
            ))}
          </div>
        </div>

        {/* Awake.ai Layout Mode Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100/80 p-1 rounded-full border border-slate-200 text-xs font-medium">
            <button
              onClick={() => setLayoutMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                layoutMode === "split"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              title="Split View (Awake.ai Style: Gantt + Synchronized Port Map)"
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => setLayoutMode("gantt")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                layoutMode === "gantt"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layout className="h-3.5 w-3.5" />
              <span>Gantt Only</span>
            </button>
            <button
              onClick={() => setLayoutMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                layoutMode === "map"
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              <span>Port Map Only</span>
            </button>
          </div>

          {/* Schedule Versions / Audit Modal button */}
          <button
            onClick={() => setIsVersionsModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-800 font-bold px-3.5 py-1.5 border border-slate-200 rounded-full bg-white hover:bg-slate-50 transition-all shadow-2xs"
            title="Inspect historical schedule versions and confirmation locks"
          >
            <History className="h-3.5 w-3.5 text-sky-600" />
            <span>Schedule Versions</span>
          </button>

          {/* Operational Loop Architecture Diagram button */}
          <button
            onClick={() => setIsSyncLoopOpen(true)}
            className="flex items-center gap-1.5 text-xs text-slate-700 font-bold px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 transition-all shadow-2xs"
            title="View PORTOS AI Closed Operational Decision Support Architecture"
          >
            <Workflow className="h-3.5 w-3.5 text-sky-600" />
            <span>Operational Loop</span>
          </button>

          {/* Transfer to Decision Lab (Scenario Lab) */}
          <Link
            href="/scenario-lab"
            className="flex items-center gap-1.5 text-xs text-slate-700 font-bold px-3.5 py-1.5 border border-slate-200 rounded-full bg-white hover:bg-slate-50 transition-all shadow-2xs"
            title="Stress-test current berth schedule under arrival surges, berth closures, and weather in Decision Lab"
          >
            <Sliders className="h-3.5 w-3.5 text-amber-600" />
            <span>Decision Lab</span>
          </Link>

          {/* Re-solve Solver */}
          <button
            onClick={() => optimizerQuery.refetch()}
            disabled={optimizerQuery.isFetching}
            className="flex items-center gap-1.5 text-xs text-white font-bold px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 transition-all shadow-xs hover:shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${optimizerQuery.isFetching ? "animate-spin" : ""}`} />
            <span>Re-solve Model</span>
          </button>
        </div>
      </div>

      {/* Confirmation Success Banner */}
      {confirmSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{confirmSuccessMsg}</span>
          </div>
          <button
            onClick={() => setConfirmSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Success banner if proposal was submitted */}
      {proposalSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-start justify-between gap-2 text-xs text-emerald-900">
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

      {/* 3. Main Workspace: Awake.ai Split View or Selected Single View */}
      {layoutMode === "split" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* Left: Gantt Timeline (60% / 7 cols) */}
          <div className="lg:col-span-7">
            <BerthGanttTimeline
              berths={berthsList}
              assignments={optData.optimized_schedule}
              baselineAssignments={optData.baseline_schedule}
              planningStart={optData.planning_start}
              planningHorizonHours={planningHorizonHours}
              viewMode={viewMode}
              selectedAssignment={selectedAssignment}
              onSelectAssignment={setSelectedAssignment}
              onViewModeChange={setViewMode}
              onSelectBerth={setSelectedBerthForInfo}
              onUpdateAssignment={(updated) => setSelectedAssignment(updated)}
            />
          </div>

          {/* Right: Synchronized Port GIS Map (40% / 5 cols) */}
          <div className="lg:col-span-5">
            <BerthMapSplitView
              berths={berthsList}
              assignments={optData.optimized_schedule}
              selectedAssignment={selectedAssignment}
              onSelectAssignment={setSelectedAssignment}
              selectedBerthId={selectedAssignment?.berth_id}
              onSelectBerthId={(bId) => {
                const b = berthsList.find((item) => item.id === bId);
                if (b) setSelectedBerthForInfo(b);
              }}
              calls={callsList}
            />
          </div>
        </div>
      ) : layoutMode === "gantt" ? (
        <div>
          <BerthGanttTimeline
            berths={berthsList}
            assignments={optData.optimized_schedule}
            baselineAssignments={optData.baseline_schedule}
            planningStart={optData.planning_start}
            planningHorizonHours={planningHorizonHours}
            viewMode={viewMode}
            selectedAssignment={selectedAssignment}
            onSelectAssignment={setSelectedAssignment}
            onViewModeChange={setViewMode}
            onSelectBerth={setSelectedBerthForInfo}
            onUpdateAssignment={(updated) => setSelectedAssignment(updated)}
          />
        </div>
      ) : (
        <div>
          <BerthMapSplitView
            berths={berthsList}
            assignments={optData.optimized_schedule}
            selectedAssignment={selectedAssignment}
            onSelectAssignment={setSelectedAssignment}
            selectedBerthId={selectedAssignment?.berth_id}
            onSelectBerthId={(bId) => {
              const b = berthsList.find((item) => item.id === bId);
              if (b) setSelectedBerthForInfo(b);
            }}
            calls={callsList}
          />
        </div>
      )}

      {/* 4. Vessel Queue & Compatibility Panel */}
      <VesselQueuePanel
        calls={callsList}
        berths={berthsList}
        assignments={optData.optimized_schedule}
        onSelectAssignmentByCallId={handleSelectAssignmentByCallId}
        onManualAssign={setCallForManualAssign}
      />

      {/* 5. Assignment Review Drawer */}
      <AssignmentReviewDrawer
        assignment={selectedAssignment}
        berth={selectedBerth}
        call={selectedCall}
        onClose={() => setSelectedAssignment(null)}
      />

      {/* 6. Berth Specifications Modal */}
      <BerthInfoModal
        berth={selectedBerthForInfo}
        assignments={optData.optimized_schedule}
        onClose={() => setSelectedBerthForInfo(null)}
      />

      {/* 7. Manual Assignment & Conflict Validator Modal */}
      <ManualAssignModal
        isOpen={!!callForManualAssign}
        onClose={() => setCallForManualAssign(null)}
        vesselCall={callForManualAssign}
        berths={berthsList}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["berth-optimization"] });
          queryClient.invalidateQueries({ queryKey: ["berth-planner-summary"] });
        }}
      />

      {/* 8. Schedule Versions & Locking History Modal */}
      <ScheduleVersionsModal
        isOpen={isVersionsModalOpen}
        onClose={() => setIsVersionsModalOpen(false)}
        onConfirmNewVersion={async (notes) => {
          await confirmMutation.mutateAsync(notes);
        }}
        isConfirming={confirmMutation.isPending}
      />

      {/* 9. Propose Review Modal */}
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

      {/* 10. Operational Sync & Decision Loop Modal */}
      <OperationalSyncLoopModal
        isOpen={isSyncLoopOpen}
        onClose={() => setIsSyncLoopOpen(false)}
        activeStep="Berth Planner"
      />
    </div>
  );
}
