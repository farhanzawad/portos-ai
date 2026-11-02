"use client";

import React, { useMemo } from "react";
import { ScheduledAssignment, BerthRead } from "@/types/api";
import { Ship, Clock, AlertCircle, Eye, Check } from "lucide-react";

interface BerthGanttTimelineProps {
  berths: BerthRead[];
  assignments: ScheduledAssignment[];
  baselineAssignments: ScheduledAssignment[];
  planningStart: string;
  planningHorizonHours: number;
  viewMode: "optimized" | "baseline" | "comparison";
  selectedAssignment: ScheduledAssignment | null;
  onSelectAssignment: (assignment: ScheduledAssignment) => void;
  onViewModeChange: (mode: "optimized" | "baseline" | "comparison") => void;
}

export function BerthGanttTimeline({
  berths,
  assignments,
  baselineAssignments,
  planningStart,
  planningHorizonHours,
  viewMode,
  selectedAssignment,
  onSelectAssignment,
  onViewModeChange,
}: BerthGanttTimelineProps) {
  const pStart = useMemo(() => new Date(planningStart).getTime(), [planningStart]);
  const horizonMs = planningHorizonHours * 3600 * 1000;

  // Active assignments to display based on viewMode
  const activeAssignments = viewMode === "baseline" ? baselineAssignments : assignments;

  // Generate 4-hour tick marks across the horizon
  const tickMarks = useMemo(() => {
    const ticks: { hourOffset: number; timeLabel: string; isDayStart: boolean; dateLabel: string }[] = [];
    const stepHours = 4;
    for (let h = 0; h <= planningHorizonHours; h += stepHours) {
      const dt = new Date(pStart + h * 3600 * 1000);
      const isDayStart = dt.getUTCHours() === 0 || h === 0;
      ticks.push({
        hourOffset: h,
        timeLabel: `${dt.getUTCHours().toString().padStart(2, "0")}:00`,
        isDayStart,
        dateLabel: dt.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" }),
      });
    }
    return ticks;
  }, [pStart, planningHorizonHours]);

  // Group assignments by berth_id
  const assignmentsByBerth = useMemo(() => {
    const map = new Map<string, ScheduledAssignment[]>();
    for (const b of berths) {
      map.set(b.id, []);
    }
    for (const a of activeAssignments) {
      const list = map.get(a.berth_id);
      if (list) {
        list.push(a);
      }
    }
    return map;
  }, [berths, activeAssignments]);

  return (
    <div className="bg-white border border-portos-border rounded-lg shadow-xs overflow-hidden">
      {/* Header controls bar */}
      <div className="p-3.5 border-b border-portos-border flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-portos-teal" />
          <h2 className="text-sm font-bold text-portos-navy">
            Berth Allocation Timeline (Gantt View)
          </h2>
          <span className="text-xs text-portos-muted font-mono">
            Planning Horizon: {planningHorizonHours}h
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-portos-bg p-1 rounded-md border border-portos-border text-xs font-medium">
          <button
            onClick={() => onViewModeChange("optimized")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              viewMode === "optimized"
                ? "bg-white text-portos-navy font-bold shadow-xs"
                : "text-portos-muted hover:text-portos-navy"
            }`}
          >
            <span>Optimized (OR-Tools)</span>
          </button>
          <button
            onClick={() => onViewModeChange("baseline")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              viewMode === "baseline"
                ? "bg-white text-portos-navy font-bold shadow-xs"
                : "text-portos-muted hover:text-portos-navy"
            }`}
          >
            <span>Baseline (FIFO)</span>
          </button>
          <button
            onClick={() => onViewModeChange("comparison")}
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              viewMode === "comparison"
                ? "bg-white text-portos-navy font-bold shadow-xs"
                : "text-portos-muted hover:text-portos-navy"
            }`}
          >
            <span>Comparison Delta</span>
          </button>
        </div>
      </div>

      {/* Gantt Matrix Container with Horizontal Scroll */}
      <div className="overflow-x-auto">
        <div className="min-w-[950px]">
          {/* Time scale header */}
          <div className="flex border-b border-portos-border text-xs text-portos-muted bg-slate-100/70 font-mono">
            {/* Berth column header */}
            <div className="w-56 shrink-0 p-2.5 font-bold text-portos-navy border-r border-portos-border">
              Berth / Quay Zone
            </div>

            {/* Time ruler */}
            <div className="flex-1 relative h-9">
              {tickMarks.map((tick, idx) => {
                const leftPct = (tick.hourOffset / planningHorizonHours) * 100;
                return (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 border-l border-portos-border/70 pl-1 pt-1"
                    style={{ left: `${leftPct}%` }}
                  >
                    <span className="text-[10px] text-portos-navy font-semibold">
                      {tick.timeLabel}
                    </span>
                    {tick.isDayStart && (
                      <span className="text-[9px] text-portos-muted block leading-none">
                        {tick.dateLabel}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Berth rows */}
          <div className="divide-y divide-portos-border/70">
            {berths.map((berth) => {
              const berthCalls = assignmentsByBerth.get(berth.id) || [];
              const isMaintenance = berth.status === "MAINTENANCE";

              return (
                <div key={berth.id} className="flex min-h-[68px] hover:bg-slate-50/40 transition-colors">
                  {/* Berth spec info column */}
                  <div className="w-56 shrink-0 p-2.5 border-r border-portos-border flex flex-col justify-center bg-slate-50/20">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-portos-navy font-mono">
                        {berth.code}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${
                          isMaintenance
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-50 text-emerald-700"
                        }`}
                      >
                        {isMaintenance ? "MAINTENANCE" : "AVAILABLE"}
                      </span>
                    </div>
                    <span className="text-[11px] text-portos-muted truncate mt-0.5">
                      {berth.name}
                    </span>
                    <div className="flex items-center gap-2 text-[10px] text-portos-muted font-mono mt-0.5">
                      <span>Max LOA: {berth.max_vessel_loa_m}m</span>
                      <span>Draft: {berth.depth_draft_m}m</span>
                    </div>
                  </div>

                  {/* Timeline Lane with vessel blocks */}
                  <div className="flex-1 relative bg-white min-h-[68px]">
                    {/* Background Grid Lines for 4h intervals */}
                    {tickMarks.map((tick, idx) => {
                      const leftPct = (tick.hourOffset / planningHorizonHours) * 100;
                      return (
                        <div
                          key={idx}
                          className="absolute top-0 bottom-0 border-l border-slate-100 pointer-events-none"
                          style={{ left: `${leftPct}%` }}
                        />
                      );
                    })}

                    {/* Maintenance overlay if berth is in maintenance */}
                    {isMaintenance && (
                      <div className="absolute inset-0 bg-amber-50/40 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Berth unavailable due to scheduled quay maintenance
                        </span>
                      </div>
                    )}

                    {/* Render scheduled vessel assignment blocks */}
                    {berthCalls.map((assign) => {
                      const aStart = new Date(assign.scheduled_start).getTime();
                      const aEnd = new Date(assign.scheduled_end).getTime();

                      const startOffsetMs = Math.max(0, aStart - pStart);
                      const durationMs = Math.max(1800000, aEnd - aStart);

                      const leftPct = Math.max(0, Math.min(100, (startOffsetMs / horizonMs) * 100));
                      const widthPct = Math.max(2.5, Math.min(100 - leftPct, (durationMs / horizonMs) * 100));

                      const isSelected = selectedAssignment?.vessel_call_id === assign.vessel_call_id;

                      // Check if assignment shifted compared to baseline
                      const baseMatch = baselineAssignments.find(
                        (ba) => ba.vessel_call_id === assign.vessel_call_id
                      );
                      const hasShifted =
                        baseMatch &&
                        (baseMatch.berth_id !== assign.berth_id ||
                          Math.abs(new Date(baseMatch.scheduled_start).getTime() - aStart) > 1800000);

                      return (
                        <div
                          key={assign.vessel_call_id}
                          onClick={() => onSelectAssignment(assign)}
                          className={`absolute top-2 bottom-2 rounded-md border p-1.5 cursor-pointer transition-all flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md hover:z-10 ${
                            isSelected
                              ? "ring-2 ring-portos-teal border-portos-teal bg-teal-50/90 text-portos-navy"
                              : hasShifted && viewMode === "comparison"
                              ? "bg-emerald-50/90 border-emerald-400 text-emerald-950"
                              : "bg-portos-bg/95 border-portos-navy/20 hover:border-portos-teal text-portos-navy"
                          }`}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                          }}
                          title={`Click to review ${assign.vessel_name}`}
                        >
                          {/* Block header */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-xs truncate flex items-center gap-1">
                              <Ship className="h-3 w-3 text-portos-teal shrink-0" />
                              {assign.vessel_name.replace("DEMO ", "")}
                            </span>
                            <span className="text-[10px] font-mono px-1 rounded bg-white/80 shrink-0">
                              {assign.service_duration_hours}h
                            </span>
                          </div>

                          {/* Block timing and wait details */}
                          <div className="flex items-center justify-between text-[10px] text-portos-muted font-mono truncate">
                            <span>
                              {new Date(assign.scheduled_start).getUTCHours().toString().padStart(2, "0")}:00 -{" "}
                              {new Date(assign.scheduled_end).getUTCHours().toString().padStart(2, "0")}:00
                            </span>
                            {assign.waiting_time_hours > 0 && (
                              <span className="text-amber-700 font-medium">
                                Wait: {assign.waiting_time_hours}h
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Legend */}
      <div className="p-2.5 bg-slate-50 border-t border-portos-border flex flex-wrap items-center justify-between gap-3 text-xs text-portos-muted">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-portos-bg border border-portos-navy/20" />
            <span>Scheduled Container Call</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-teal-50 border border-portos-teal" />
            <span>Selected for Review</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-50 border border-emerald-400" />
            <span>Optimized Schedule Gain</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-50 border border-amber-300" />
            <span>Maintenance Closure</span>
          </div>
        </div>

        <span className="font-mono text-[11px]">
          Timezone: UTC (Operational Reference)
        </span>
      </div>
    </div>
  );
}

