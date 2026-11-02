"use client";

import React from "react";
import { ScheduleComparisonMetrics, SolverStatus, FeasibilityValidationResult } from "@/types/api";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Cpu, CheckCircle2, AlertTriangle, Clock, TrendingDown, Layers, ShieldCheck } from "lucide-react";

interface SolverMetricsBarProps {
  solverStatus: SolverStatus;
  solveTimeMs: number;
  metrics?: ScheduleComparisonMetrics;
  validation?: FeasibilityValidationResult;
  planningHorizonHours: number;
  isOptimizing: boolean;
  onOptimize: () => void;
  onOpenProposeModal: () => void;
}

export function SolverMetricsBar({
  solverStatus,
  solveTimeMs,
  metrics,
  validation,
  planningHorizonHours,
  isOptimizing,
  onOptimize,
  onOpenProposeModal,
}: SolverMetricsBarProps) {
  const isFeasible = validation ? validation.is_feasible : true;

  return (
    <div className="space-y-3">
      {/* Primary KPI & Solver Bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Solver Telemetry Card */}
        <div className="bg-white border border-portos-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
            <span className="flex items-center gap-1 font-medium text-portos-navy">
              <Cpu className="h-3.5 w-3.5 text-portos-teal" />
              CP-SAT Solver
            </span>
            <DataStatusBadge status="SIMULATED" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-lg font-bold font-mono ${
              solverStatus === "OPTIMAL" ? "text-emerald-700" : (solverStatus === "FEASIBLE" ? "text-portos-teal" : "text-amber-700")
            }`}>
              {solverStatus}
            </span>
            <span className="text-xs text-portos-muted font-mono">
              ({solveTimeMs} ms)
            </span>
          </div>
          <p className="text-[11px] text-portos-muted mt-1">
            Deterministic OR-Tools constraint optimization
          </p>
        </div>

        {/* Baseline Waiting Hours */}
        <div className="bg-white border border-portos-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Clock className="h-3.5 w-3.5 text-portos-muted" />
              Baseline Queue Wait
            </span>
            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-mono">
              FIFO
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-portos-navy">
              {metrics ? `${metrics.baseline_total_waiting_hours.toFixed(1)}h` : "—"}
            </span>
            <span className="text-xs text-portos-muted">total queue wait</span>
          </div>
          <p className="text-[11px] text-portos-muted mt-1">
            Naive arrival-order assignment
          </p>
        </div>

        {/* Optimized Waiting Hours & Reduction */}
        <div className="bg-white border border-portos-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
            <span className="flex items-center gap-1 font-medium text-emerald-800">
              <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
              Optimized Wait
            </span>
            {metrics && (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded font-mono">
                -{metrics.waiting_time_reduction_pct}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-emerald-700">
              {metrics ? `${metrics.optimized_total_waiting_hours.toFixed(1)}h` : "—"}
            </span>
            <span className="text-xs text-emerald-600 font-medium">
              ({metrics ? `-${metrics.waiting_hours_saved.toFixed(1)}h saved` : "—"})
            </span>
          </div>
          <p className="text-[11px] text-portos-muted mt-1">
            Priority-weighted minimum queue delay
          </p>
        </div>

        {/* Berth Utilization */}
        <div className="bg-white border border-portos-border rounded-lg p-3 shadow-xs">
          <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
            <span className="flex items-center gap-1 font-medium">
              <Layers className="h-3.5 w-3.5 text-portos-navy-secondary" />
              Quay Utilization
            </span>
            <span className="text-[10px] text-portos-muted font-mono">{planningHorizonHours}h Horizon</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-bold font-mono text-portos-navy">
              {metrics ? `${metrics.berth_utilization_pct}%` : "—"}
            </span>
            <span className="text-xs text-portos-muted">
              ({metrics ? `${metrics.vessels_scheduled_count} calls` : "—"})
            </span>
          </div>
          <p className="text-[11px] text-portos-muted mt-1">
            Across 6 illustrative container berths
          </p>
        </div>

        {/* Independent Feasibility Verification */}
        <div className="bg-white border border-portos-border rounded-lg p-3 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
              <span className="flex items-center gap-1 font-medium">
                <ShieldCheck className="h-3.5 w-3.5 text-portos-teal" />
                Feasibility Status
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                isFeasible ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
              }`}>
                {isFeasible ? "VERIFIED" : "VIOLATION"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {isFeasible ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              )}
              <span className="text-xs font-semibold text-portos-navy">
                {isFeasible ? "Zero Hard Violations" : `${validation?.violations_count} Conflict(s)`}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-portos-border/60">
            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="flex-1 bg-portos-navy text-white text-xs font-medium py-1.5 px-2 rounded hover:bg-portos-navy-secondary transition-colors disabled:opacity-50 text-center"
            >
              {isOptimizing ? "Solving..." : "Re-Optimize"}
            </button>
            <button
              onClick={onOpenProposeModal}
              className="flex-1 bg-portos-teal text-white text-xs font-medium py-1.5 px-2 rounded hover:bg-teal-700 transition-colors text-center"
            >
              Propose for Review
            </button>
          </div>
        </div>
      </div>

      {/* Operational Notice Banner */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">ADVISORY DECISION SUPPORT: </span>
          <span>
            Synthetic-data demonstration. Schedules are mathematical proposals produced by Google OR-Tools CP-SAT for human Harbour Master review.
            No live CPA berth telemetry, navigational clearance, or automated vessel maneuvering commands are issued.
          </span>
        </div>
      </div>
    </div>
  );
}

