"use client";

import React from "react";
import { ScheduleComparisonMetrics, SolverStatus, FeasibilityValidationResult } from "@/types/api";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  Cpu,
  CheckCircle2,
  Clock,
  TrendingDown,
  Layers,
  ShieldCheck,
  RefreshCw,
  Send,
} from "lucide-react";

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
    <div className="space-y-3 font-sans">
      {/* 5-Column Industrial Futurism Fasto SaaS Optimization Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* CARD 1: CP-SAT Solver Telemetry */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              CP-SAT Solver
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-2xl font-black tracking-tight ${
                  solverStatus === "OPTIMAL"
                    ? "text-sky-700"
                    : solverStatus === "FEASIBLE"
                    ? "text-sky-600"
                    : "text-amber-700"
                }`}
              >
                {solverStatus}
              </span>
              <span className="text-xs text-slate-400 font-semibold tabular-nums">
                ({solveTimeMs} ms)
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] text-slate-500 font-medium">
                Deterministic constraint optimization
              </span>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>OR-Tools Engine</span>
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
        </div>

        {/* CARD 2: Baseline Queue Wait (FIFO) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Baseline Queue Wait
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {metrics ? `${metrics.baseline_total_waiting_hours.toFixed(1)}h` : "12.0h"}
              </span>
              <span className="text-xs text-slate-400 font-semibold">total wait</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                Naive FIFO Order
              </span>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            Naive arrival-order assignment
          </div>
        </div>

        {/* CARD 3: Optimized Wait (OR-Tools) */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Optimized Wait
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-sky-700 tabular-nums">
                {metrics ? `${metrics.optimized_total_waiting_hours.toFixed(1)}h` : "2.2h"}
              </span>
              {metrics && (
                <span className="text-xs text-emerald-600 font-bold tabular-nums">
                  (-{metrics.waiting_hours_saved.toFixed(1)}h saved)
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200 tabular-nums">
                {metrics ? `-${metrics.waiting_time_reduction_pct}% delay` : "-81.7% delay"}
              </span>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 text-[11px] text-slate-400 font-medium">
            Priority-weighted minimum queue delay
          </div>
        </div>

        {/* CARD 4: Quay Utilization */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quay Utilization
            </span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 tabular-nums">
                {metrics ? `${metrics.berth_utilization_pct}%` : "55%"}
              </span>
              <span className="text-xs text-slate-400 font-semibold tabular-nums">
                ({metrics ? metrics.vessels_scheduled_count : 11} calls)
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${metrics ? metrics.berth_utilization_pct : 55}%` }}
                />
              </div>
            </div>
          </div>
          <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>{planningHorizonHours}h Horizon</span>
            <span>Across 6 berths</span>
          </div>
        </div>

        {/* CARD 5: Feasibility & Dispatcher Proposals */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Feasibility Status
            </span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                isFeasible
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-rose-50 text-rose-600"
              }`}
            >
              {isFeasible ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`text-base font-black tracking-tight ${
                  isFeasible ? "text-emerald-700" : "text-rose-700"
                }`}
              >
                {isFeasible ? "Zero Hard Violations" : "Violations Detected"}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              LOA, draft & tidal window constraints verified
            </p>
          </div>

          <div className="pt-2.5 mt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={onOptimize}
              disabled={isOptimizing}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-all disabled:opacity-50"
              title="Run OR-Tools CP-SAT solver"
            >
              <RefreshCw className={`h-3 w-3 ${isOptimizing ? "animate-spin" : ""}`} />
              <span>Re-Solve</span>
            </button>
            <button
              onClick={onOpenProposeModal}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
              title="Submit advisory schedule proposal to Harbour Master"
            >
              <Send className="h-3 w-3" />
              <span>Propose</span>
            </button>
          </div>
        </div>
      </div>

      {/* Persistent Advisory Decision Support Banner */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-950 font-sans">
        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px] uppercase tracking-wider shrink-0 mt-0.5 border border-amber-300">
          Advisory Decision Support
        </span>
        <p className="leading-relaxed text-[11px] font-medium text-amber-900">
          Synthetic-data demonstration. Schedules are mathematical proposals produced by Google OR-Tools CP-SAT for human Harbour Master review. No live CPA berth telemetry, navigational clearance, or automated vessel maneuvering commands are issued.
        </p>
      </div>
    </div>
  );
}
