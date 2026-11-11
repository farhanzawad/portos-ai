"use client";

import React from "react";
import {
  Sparkles,
  Columns,
  CalendarRange,
  Map,
  RotateCw,
} from "lucide-react";

export type ScheduleOptimizationMode = "optimized" | "baseline" | "comparison";
export type WorkspaceLayoutMode = "split" | "gantt" | "map";

interface BerthPlannerHeaderStripProps {
  optimizationMode: ScheduleOptimizationMode;
  onSelectOptimizationMode: (mode: ScheduleOptimizationMode) => void;
  layoutMode: WorkspaceLayoutMode;
  onSelectLayoutMode: (mode: WorkspaceLayoutMode) => void;
  onResolve: () => void;
  isResolving?: boolean;
  planningHorizonHours?: number;
}

export function BerthPlannerHeaderStrip({
  optimizationMode,
  onSelectOptimizationMode,
  layoutMode,
  onSelectLayoutMode,
  onResolve,
  isResolving = false,
  planningHorizonHours = 72,
}: BerthPlannerHeaderStripProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/[0.08] select-none">
      {/* Title & Mathematical Solver Metadata */}
      <div className="space-y-1">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Berth Planner &amp; Quayside Allocation
          </h1>
          <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#1a1d24] text-white/90 border border-white/15">
            {planningHorizonHours}H HORIZON
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#8e9bae] flex-wrap">
          <span className="flex items-center gap-1.5 text-secondary font-medium">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span>Google OR-Tools CP-SAT</span>
          </span>
          <span>•</span>
          <span>Deterministic Multi-Berth Optimization (&lt;35ms)</span>
          <span className="hidden sm:inline">•</span>
          <span className="hidden sm:inline font-mono">
            Planning Window: Oct 24, 00:00 - Oct 27, 00:00 BST
          </span>
        </div>
      </div>

      {/* View Switchers & Re-Solve Action Button */}
      <div className="flex flex-col items-start lg:items-end gap-2.5">
        {/* Row 1: Solver Comparison Segmented Toggle */}
        <div className="flex items-center bg-[#171a22] p-0.5 rounded-lg border border-white/[0.08] text-xs">
          <button
            onClick={() => onSelectOptimizationMode("optimized")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              optimizationMode === "optimized"
                ? "bg-[#282d38] text-white shadow-xs font-semibold"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Optimized (Current)
          </button>
          <button
            onClick={() => onSelectOptimizationMode("baseline")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              optimizationMode === "baseline"
                ? "bg-[#282d38] text-white shadow-xs font-semibold"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Baseline (FIFO)
          </button>
          <button
            onClick={() => onSelectOptimizationMode("comparison")}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              optimizationMode === "comparison"
                ? "bg-[#282d38] text-white shadow-xs font-semibold"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            Side-by-Side Compare
          </button>
        </div>

        {/* Row 2: Layout Switcher & Re-Solve Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#171a22] p-0.5 rounded-lg border border-white/[0.08] text-xs">
            <button
              onClick={() => onSelectLayoutMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                layoutMode === "split"
                  ? "bg-[#282d38] text-white shadow-xs font-semibold"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              <Columns className="h-3.5 w-3.5" />
              <span>Split View</span>
            </button>
            <button
              onClick={() => onSelectLayoutMode("gantt")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                layoutMode === "gantt"
                  ? "bg-[#282d38] text-white shadow-xs font-semibold"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              <CalendarRange className="h-3.5 w-3.5" />
              <span>Gantt Only</span>
            </button>
            <button
              onClick={() => onSelectLayoutMode("map")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
                layoutMode === "map"
                  ? "bg-[#282d38] text-white shadow-xs font-semibold"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              <Map className="h-3.5 w-3.5" />
              <span>GIS Map</span>
            </button>
          </div>

          <button
            onClick={onResolve}
            disabled={isResolving}
            className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-primary-container hover:bg-[#b02f00] text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isResolving ? "animate-spin" : ""}`} />
            <span>Re-Solve</span>
          </button>
        </div>
      </div>
    </div>
  );
}
