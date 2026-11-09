"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import { ScheduledAssignment, BerthRead } from "@/types/api";
import {
  Ship,
  Clock,
  AlertCircle,
  Lock,
  Unlock,
  ChevronDown,
  ChevronRight,
  Wrench,
  ZoomIn,
  ZoomOut,
  Info,
  Calendar,
  Search,
  Filter,
  ArrowLeftRight,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  MoveHorizontal,
  ChevronLeft,
} from "lucide-react";

interface BerthGanttTimelineProps {
  berths: BerthRead[];
  assignments: ScheduledAssignment[];
  baselineAssignments: ScheduledAssignment[];
  planningStart: string;
  planningHorizonHours: number;
  viewMode: "optimized" | "baseline" | "comparison";
  selectedAssignment: ScheduledAssignment | null;
  onSelectAssignment: (assignment: ScheduledAssignment | null) => void;
  onViewModeChange: (mode: "optimized" | "baseline" | "comparison") => void;
  onSelectBerth?: (berth: BerthRead) => void;
  onUpdateAssignment?: (updated: ScheduledAssignment) => void;
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
  onSelectBerth,
  onUpdateAssignment,
}: BerthGanttTimelineProps) {
  const [zoomFactor, setZoomFactor] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedQuayFilter, setSelectedQuayFilter] = useState<string>("ALL");
  const [expandedQuays, setExpandedQuays] = useState<{ [key: string]: boolean }>({
    "Quay CCT": true,
    "Quay NCT": true,
  });

  // Local mutable schedule state for live operator management & what-if testing
  const [managedAssignments, setManagedAssignments] = useState<ScheduledAssignment[]>(assignments);
  const [lockedCalls, setLockedCalls] = useState<Set<string>>(new Set());
  const [hasManualEdits, setHasManualEdits] = useState(false);

  // Sync with incoming assignments if not manually edited
  useEffect(() => {
    if (!hasManualEdits) {
      setManagedAssignments(viewMode === "baseline" ? baselineAssignments : assignments);
    }
  }, [assignments, baselineAssignments, viewMode, hasManualEdits]);

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const pStart = useMemo(() => new Date(planningStart).getTime(), [planningStart]);
  const horizonMs = planningHorizonHours * 3600 * 1000;

  // Active assignments to display
  const activeAssignments = managedAssignments;

  // Real-Time Hard Conflict & Overlap Detection Engine
  const conflictsByCallId = useMemo(() => {
    const conflictMap = new Map<string, { type: "OVERLAP" | "SPEC_VIOLATION"; message: string }>();

    // 1. Check for time overlaps on the same berth
    const byBerth = new Map<string, ScheduledAssignment[]>();
    for (const a of activeAssignments) {
      const list = byBerth.get(a.berth_id) || [];
      list.push(a);
      byBerth.set(a.berth_id, list);
    }

    byBerth.forEach((assigns, berthId) => {
      for (let i = 0; i < assigns.length; i++) {
        for (let j = i + 1; j < assigns.length; j++) {
          const a1 = assigns[i];
          const a2 = assigns[j];
          const start1 = new Date(a1.scheduled_start).getTime();
          const end1 = new Date(a1.scheduled_end).getTime();
          const start2 = new Date(a2.scheduled_start).getTime();
          const end2 = new Date(a2.scheduled_end).getTime();

          // Overlap condition
          if (Math.max(start1, start2) < Math.min(end1, end2)) {
            conflictMap.set(a1.vessel_call_id, {
              type: "OVERLAP",
              message: `Time overlap on berth with ${a2.vessel_name}`,
            });
            conflictMap.set(a2.vessel_call_id, {
              type: "OVERLAP",
              message: `Time overlap on berth with ${a1.vessel_name}`,
            });
          }
        }
      }
    });

    // 2. Check for physical berth specification violations (LOA / Depth)
    const berthMap = new Map(berths.map((b) => [b.id, b]));
    activeAssignments.forEach((a) => {
      const b = berthMap.get(a.berth_id);
      if (b) {
        const vesselLoa = a.assigned_quay_end_m - a.assigned_quay_start_m || 170;
        if (vesselLoa > b.max_vessel_loa_m) {
          conflictMap.set(a.vessel_call_id, {
            type: "SPEC_VIOLATION",
            message: `Vessel LOA (${vesselLoa}m) exceeds berth limit (${b.max_vessel_loa_m}m)`,
          });
        }
      }
    });

    return conflictMap;
  }, [activeAssignments, berths]);

  const totalConflictsCount = conflictsByCallId.size;

  // Group berths by Quay zones
  const quayGroups = useMemo(() => {
    const groups: { [key: string]: BerthRead[] } = {
      "Quay CCT": [],
      "Quay NCT": [],
    };
    for (const b of berths) {
      if (b.code.includes("01") || b.code.includes("02") || b.code.includes("03") || b.name.includes("CCT")) {
        groups["Quay CCT"].push(b);
      } else {
        groups["Quay NCT"].push(b);
      }
    }
    return groups;
  }, [berths]);

  // Current time position relative to timeline
  const now = Date.now();
  const currentOffsetHours = (now - pStart) / (3600 * 1000);
  const currentTimePct = Math.max(0, Math.min(100, (currentOffsetHours / planningHorizonHours) * 100));

  // Generate tick marks across the horizon
  const tickMarks = useMemo(() => {
    const ticks: { hourOffset: number; timeLabel: string; isDayStart: boolean; dateLabel: string; isNight: boolean }[] = [];
    const stepHours = planningHorizonHours > 72 ? 12 : planningHorizonHours > 24 ? 4 : 2;

    for (let h = 0; h <= planningHorizonHours; h += stepHours) {
      const dt = new Date(pStart + h * 3600 * 1000);
      const isDayStart = dt.getUTCHours() === 0 || h === 0;
      const hour = dt.getUTCHours();
      const isNight = hour < 6 || hour >= 18;
      ticks.push({
        hourOffset: h,
        timeLabel: `${hour.toString().padStart(2, "0")}:00`,
        isDayStart,
        dateLabel: dt.toLocaleDateString("en-GB", { month: "short", day: "numeric", timeZone: "UTC" }),
        isNight,
      });
    }
    return ticks;
  }, [pStart, planningHorizonHours]);

  // Group filtered assignments by berth_id
  const assignmentsByBerth = useMemo(() => {
    const map = new Map<string, ScheduledAssignment[]>();
    for (const b of berths) {
      map.set(b.id, []);
    }
    for (const a of activeAssignments) {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = a.vessel_name.toLowerCase().includes(q);
        const matchesCode = (a.berth_code || "").toLowerCase().includes(q);
        const matchesCall = a.vessel_call_id.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCall) continue;
      }

      const list = map.get(a.berth_id);
      if (list) {
        list.push(a);
      }
    }
    return map;
  }, [berths, activeAssignments, searchQuery]);

  // Operator Action Handlers: Shift Start Time
  const handleShiftTime = (vesselCallId: string, hoursDelta: number) => {
    setHasManualEdits(true);
    setManagedAssignments((prev) =>
      prev.map((a) => {
        if (a.vessel_call_id !== vesselCallId) return a;
        const curStart = new Date(a.scheduled_start).getTime();
        const curEnd = new Date(a.scheduled_end).getTime();
        const duration = curEnd - curStart;

        const newStart = new Date(curStart + hoursDelta * 3600 * 1000).toISOString();
        const newEnd = new Date(curStart + hoursDelta * 3600 * 1000 + duration).toISOString();

        const updated = {
          ...a,
          scheduled_start: newStart,
          scheduled_end: newEnd,
          waiting_time_hours: Math.max(0, a.waiting_time_hours + hoursDelta),
        };
        if (onUpdateAssignment) onUpdateAssignment(updated);
        return updated;
      })
    );
  };

  // Operator Action Handlers: Reassign Berth
  const handleReassignBerth = (vesselCallId: string, targetBerthId: string) => {
    const targetBerth = berths.find((b) => b.id === targetBerthId);
    if (!targetBerth) return;

    setHasManualEdits(true);
    setManagedAssignments((prev) =>
      prev.map((a) => {
        if (a.vessel_call_id !== vesselCallId) return a;
        const updated = {
          ...a,
          berth_id: targetBerth.id,
          berth_code: targetBerth.code,
        };
        if (onUpdateAssignment) onUpdateAssignment(updated);
        return updated;
      })
    );
  };

  // Operator Action Handlers: Adjust Service Duration
  const handleAdjustDuration = (vesselCallId: string, deltaHours: number) => {
    setHasManualEdits(true);
    setManagedAssignments((prev) =>
      prev.map((a) => {
        if (a.vessel_call_id !== vesselCallId) return a;
        const curStart = new Date(a.scheduled_start).getTime();
        const newDurationHours = Math.max(2, a.service_duration_hours + deltaHours);
        const newEnd = new Date(curStart + newDurationHours * 3600 * 1000).toISOString();

        const updated = {
          ...a,
          service_duration_hours: newDurationHours,
          scheduled_end: newEnd,
        };
        if (onUpdateAssignment) onUpdateAssignment(updated);
        return updated;
      })
    );
  };

  // Toggle Operator Schedule Lock
  const toggleLock = (vesselCallId: string) => {
    setLockedCalls((prev) => {
      const next = new Set(prev);
      if (next.has(vesselCallId)) {
        next.delete(vesselCallId);
      } else {
        next.add(vesselCallId);
      }
      return next;
    });
  };

  // Reset to Solver Baseline / Optimal
  const handleResetSchedule = () => {
    setHasManualEdits(false);
    setManagedAssignments(viewMode === "baseline" ? baselineAssignments : assignments);
    setLockedCalls(new Set());
  };

  // Smooth Horizontal Scroll to Current Real-Time Datum
  const handleJumpToNow = () => {
    if (!timelineContainerRef.current) return;
    const container = timelineContainerRef.current;
    const scrollWidth = container.scrollWidth;
    const targetScroll = (scrollWidth * currentTimePct) / 100 - container.clientWidth / 2;
    container.scrollTo({ left: Math.max(0, targetScroll), behavior: "smooth" });
  };

  const toggleQuay = (quayName: string) => {
    setExpandedQuays((prev) => ({
      ...prev,
      [quayName]: !prev[quayName],
    }));
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden font-sans">
      {/* 1. Header Toolbar with Management Controls */}
      <div className="p-4 border-b border-slate-200/80 bg-white space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                  Berth Allocation Gantt Matrix
                </h2>
                {hasManualEdits && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                    Manual Edits Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Interactive spatial-temporal berth assignment matrix with conflict detection & inline adjustments.
              </p>
            </div>
          </div>

          {/* Quick Real-Time Status & Jump To Now */}
          <div className="flex items-center gap-2">
            {totalConflictsCount > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-full text-xs font-bold animate-pulse">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>{totalConflictsCount} Conflict{totalConflictsCount > 1 ? "s" : ""} Detected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Feasible Schedule</span>
              </div>
            )}

            <button
              onClick={handleJumpToNow}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-bold transition-all shadow-2xs"
              title="Center timeline at live real-time datum"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              <span>Jump to Now</span>
            </button>

            {hasManualEdits && (
              <button
                onClick={handleResetSchedule}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-bold transition-all"
                title="Discard manual adjustments and restore solver baseline"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset to Optimal</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Secondary Filter & Resolution Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Search Input */}
          <div className="flex items-center gap-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search vessel name, IMO, call sign..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sky-500 font-medium"
              />
            </div>
          </div>

          {/* Quay Zone Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-full border border-slate-200 text-xs font-medium">
            {["ALL", "Quay CCT", "Quay NCT"].map((quay) => (
              <button
                key={quay}
                onClick={() => setSelectedQuayFilter(quay)}
                className={`px-3 py-1 rounded-full transition-all text-xs ${
                  selectedQuayFilter === quay
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {quay === "ALL" ? "All Quays" : quay}
              </button>
            ))}
          </div>

          {/* Mode Switcher & Zoom */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-full border border-slate-200 text-xs font-medium">
              <button
                onClick={() => onViewModeChange("optimized")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  viewMode === "optimized"
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Optimized (CP-SAT)
              </button>
              <button
                onClick={() => onViewModeChange("baseline")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  viewMode === "baseline"
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Baseline (FIFO)
              </button>
              <button
                onClick={() => onViewModeChange("comparison")}
                className={`px-3 py-1 rounded-full transition-colors ${
                  viewMode === "comparison"
                    ? "bg-white text-slate-900 font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Delta Comparison
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-full p-0.5">
              <button
                onClick={() => setZoomFactor((z) => Math.max(0.75, z - 0.25))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded-full"
                title="Zoom Out Gantt"
              >
                <ZoomOut className="h-3 w-3" />
              </button>
              <span className="text-[10px] tabular-nums px-1 font-bold text-slate-800">
                {Math.round(zoomFactor * 100)}%
              </span>
              <button
                onClick={() => setZoomFactor((z) => Math.min(2.25, z + 0.25))}
                className="p-1 text-slate-600 hover:text-slate-900 rounded-full"
                title="Zoom In Gantt"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Gantt Timeline Scrollable Canvas */}
      <div ref={timelineContainerRef} className="overflow-x-auto relative">
        <div
          className="relative min-w-[980px]"
          style={{ width: `${Math.max(100, zoomFactor * 100)}%` }}
        >
          {/* Time Scale Ruler Header */}
          <div className="flex border-b border-slate-200 text-xs text-slate-600 bg-slate-100/90 font-medium sticky top-0 z-20 backdrop-blur-xs">
            {/* Berth Column Header */}
            <div className="w-72 shrink-0 p-3 font-bold text-slate-900 border-r border-slate-200 bg-slate-100 flex items-center justify-between">
              <span className="uppercase text-[11px] tracking-wider text-slate-500 font-bold">
                Quayside Berth
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                LOA • Depth • STS
              </span>
            </div>

            {/* Time Ruler Ticks */}
            <div className="flex-1 relative h-11">
              {tickMarks.map((tick, idx) => {
                const leftPct = (tick.hourOffset / planningHorizonHours) * 100;
                return (
                  <div
                    key={idx}
                    className={`absolute top-0 bottom-0 border-l pl-1.5 pt-1 transition-colors ${
                      tick.isDayStart
                        ? "border-slate-300 bg-sky-50/40"
                        : "border-slate-200/80"
                    }`}
                    style={{ left: `${leftPct}%` }}
                  >
                    <span className="text-[10px] text-slate-900 font-bold block tabular-nums">
                      {tick.timeLabel}
                    </span>
                    {tick.isDayStart && (
                      <span className="text-[9px] text-sky-700 block leading-none font-extrabold uppercase">
                        {tick.dateLabel}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Current Time Red Vertical Header Pill */}
              {currentTimePct >= 0 && currentTimePct <= 100 && (
                <div
                  className="absolute top-1 bottom-0 z-30 pointer-events-none flex flex-col items-center -translate-x-1/2"
                  style={{ left: `${currentTimePct}%` }}
                >
                  <span className="bg-rose-600 text-white text-[9px] font-black tabular-nums px-2 py-0.5 rounded-full shadow-md">
                    NOW {new Date(now).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Current Time Red Vertical Line passing through all berth lanes */}
          {currentTimePct >= 0 && currentTimePct <= 100 && (
            <div
              className="absolute top-11 bottom-0 z-10 pointer-events-none border-l-2 border-rose-500 border-dashed"
              style={{ left: `calc(18rem + (100% - 18rem) * ${currentTimePct / 100})` }}
            />
          )}

          {/* Berth Rows Grouped by Quay */}
          <div className="divide-y divide-slate-200">
            {Object.entries(quayGroups).map(([quayName, quayBerths]) => {
              if (selectedQuayFilter !== "ALL" && selectedQuayFilter !== quayName) {
                return null;
              }

              const isExpanded = expandedQuays[quayName] ?? true;

              return (
                <div key={quayName} className="divide-y divide-slate-100">
                  {/* Quay Section Header */}
                  <div
                    onClick={() => toggleQuay(quayName)}
                    className="flex items-center justify-between p-2.5 bg-slate-50/90 hover:bg-slate-100 cursor-pointer font-bold text-xs text-slate-900 transition-colors select-none border-y border-slate-200/60"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-sky-600" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-slate-400" />
                      )}
                      <span className="font-extrabold">{quayName}</span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        ({quayBerths.length} Container Berths)
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span>Standard Draft: 9.5m - 11.0m CD</span>
                      <span className="text-slate-300">|</span>
                      <span>Total Quay: {quayName.includes("CCT") ? "580m" : "850m"}</span>
                    </div>
                  </div>

                  {/* Render Berths within this Quay */}
                  {isExpanded &&
                    quayBerths.map((berth) => {
                      const berthCalls = assignmentsByBerth.get(berth.id) || [];
                      const isMaintenance = berth.status === "MAINTENANCE";

                      // Calculate berth utilization % for visual meter
                      const totalServiceHours = berthCalls.reduce((acc, c) => acc + c.service_duration_hours, 0);
                      const utilPct = Math.min(100, Math.round((totalServiceHours / planningHorizonHours) * 100));

                      return (
                        <div
                          key={berth.id}
                          className="flex min-h-[105px] hover:bg-slate-50/40 transition-colors relative group/row"
                        >
                          {/* Berth Specification Info Header Column */}
                          <div
                            onClick={() => onSelectBerth && onSelectBerth(berth)}
                            className="w-72 shrink-0 p-3 border-r border-slate-200 flex flex-col justify-between bg-slate-50/40 cursor-pointer hover:bg-slate-100/60 transition-colors"
                            title="Click to view detailed Berth specifications"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                                  {berth.code}
                                </span>
                                <span className="font-bold text-xs text-slate-800 truncate max-w-[130px]">
                                  {berth.name}
                                </span>
                              </div>
                              <span
                                className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                  isMaintenance
                                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                }`}
                              >
                                {isMaintenance ? "MAINTENANCE" : "AVAILABLE"}
                              </span>
                            </div>

                            {/* Capacity & Dimensions */}
                            <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-500 font-medium tabular-nums mt-1">
                              <div>
                                <span className="text-slate-400 block text-[9px]">MAX LOA</span>
                                <span className="font-bold text-slate-800">{berth.max_vessel_loa_m}m</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px]">DRAFT</span>
                                <span className="font-bold text-slate-800">{berth.depth_draft_m}m</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[9px]">EQUIPMENT</span>
                                <span className="font-bold text-sky-700">3x STS</span>
                              </div>
                            </div>

                            {/* Occupancy Utilization Progress Bar */}
                            <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
                              <span>Occupancy</span>
                              <div className="flex items-center gap-1.5 flex-1 max-w-[120px] ml-2">
                                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      utilPct > 80 ? "bg-amber-500" : "bg-sky-600"
                                    }`}
                                    style={{ width: `${utilPct}%` }}
                                  />
                                </div>
                                <span className="font-bold text-slate-800 tabular-nums text-[10px]">
                                  {utilPct}%
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Timeline Lane with Vessel Allocation Blocks */}
                          <div className="flex-1 relative bg-white min-h-[105px]">
                            {/* Alternate Shift Background Bands (Day 06:00-18:00 vs Night 18:00-06:00) */}
                            {tickMarks.map((tick, idx) => {
                              const leftPct = (tick.hourOffset / planningHorizonHours) * 100;
                              return (
                                <div
                                  key={idx}
                                  className={`absolute top-0 bottom-0 border-l pointer-events-none ${
                                    tick.isNight
                                      ? "bg-slate-50/20 border-slate-100"
                                      : "bg-white border-slate-100"
                                  }`}
                                  style={{ left: `${leftPct}%` }}
                                />
                              );
                            })}

                            {/* Berth Maintenance Closure Overlay */}
                            {isMaintenance && (
                              <div
                                className="absolute top-2 bottom-2 left-[12%] w-[42%] rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/85 p-2.5 flex items-center justify-between shadow-2xs z-5"
                                title="Scheduled fender rehabilitation - berth closed to navigation"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 font-bold text-xs text-rose-800">
                                    <Wrench className="h-4 w-4" />
                                    <span>Berth Fender Maintenance Window</span>
                                  </div>
                                  <span className="text-[10px] text-rose-700 block font-medium">
                                    Quay unavailable • Window 08:00 - 20:00 UTC
                                  </span>
                                </div>
                                <span className="text-[9px] bg-rose-200 text-rose-900 font-bold px-2 py-0.5 rounded-full uppercase">
                                  Berth Closed
                                </span>
                              </div>
                            )}

                            {/* Render Vessel Allocation Blocks */}
                            {berthCalls.map((assign) => {
                              const aStart = new Date(assign.scheduled_start).getTime();
                              const aEnd = new Date(assign.scheduled_end).getTime();

                              const startOffsetMs = Math.max(0, aStart - pStart);
                              const durationMs = Math.max(1800000, aEnd - aStart);

                              const leftPct = Math.max(0, Math.min(100, (startOffsetMs / horizonMs) * 100));
                              const widthPct = Math.max(8.5, Math.min(100 - leftPct, (durationMs / horizonMs) * 100));

                              const isSelected = selectedAssignment?.vessel_call_id === assign.vessel_call_id;
                              const isLocked = lockedCalls.has(assign.vessel_call_id);
                              const conflict = conflictsByCallId.get(assign.vessel_call_id);

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
                                  onClick={() => onSelectAssignment(isSelected ? null : assign)}
                                  className={`absolute top-2 bottom-2 rounded-xl border p-2 cursor-pointer transition-all flex flex-col justify-between overflow-visible shadow-xs hover:shadow-lg hover:z-30 select-none ${
                                    conflict
                                      ? "border-rose-500 bg-rose-50/95 text-rose-950 ring-2 ring-rose-400"
                                      : isSelected
                                      ? "ring-2 ring-sky-500 border-sky-500 bg-sky-50/95 text-slate-900"
                                      : hasShifted && viewMode === "comparison"
                                      ? "bg-indigo-50/90 border-indigo-400 text-indigo-950"
                                      : "bg-white border-slate-200/90 hover:border-sky-400 text-slate-900"
                                  }`}
                                  style={{
                                    left: `${leftPct}%`,
                                    width: `${widthPct}%`,
                                  }}
                                  title={`Click to manage allocation for ${assign.vessel_name}`}
                                >
                                  {/* Top Color Accent Line */}
                                  <div
                                    className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                                      conflict
                                        ? "bg-rose-500 animate-pulse"
                                        : isLocked
                                        ? "bg-amber-500"
                                        : isSelected
                                        ? "bg-sky-500"
                                        : assign.waiting_time_hours > 0
                                        ? "bg-amber-400"
                                        : "bg-emerald-500"
                                    }`}
                                  />

                                  {/* Vessel Block Header: Name + Duration + Lock */}
                                  <div className="flex items-center justify-between gap-1 pt-0.5">
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Ship
                                        className={`h-3.5 w-3.5 shrink-0 ${
                                          conflict ? "text-rose-600" : "text-sky-600"
                                        }`}
                                      />
                                      <span className="font-extrabold text-xs truncate text-slate-900">
                                        {assign.vessel_name.replace("DEMO ", "")}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      {isLocked && (
                                        <span title="Schedule allocation locked by operator">
                                          <Lock className="h-3 w-3 text-amber-600" />
                                        </span>
                                      )}
                                      <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded-md tabular-nums border border-slate-200">
                                        {assign.service_duration_hours}h
                                      </span>
                                    </div>
                                  </div>

                                  {/* Middle Line: LOA + Berth Code + Conflict Alert */}
                                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium truncate">
                                    <span>
                                      {assign.assigned_quay_end_m - assign.assigned_quay_start_m || 165}m LOA • {assign.berth_code}
                                    </span>
                                    {conflict && (
                                      <span className="px-1.5 py-0.2 rounded-xs bg-rose-600 text-white font-extrabold text-[8px] uppercase tracking-wide">
                                        {conflict.type === "OVERLAP" ? "OVERLAP" : "VIOLATION"}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bottom Line: Arrival Timestamp + Delay Pill */}
                                  <div className="flex flex-wrap items-center justify-between gap-1 pt-1 border-t border-slate-100 text-[9px]">
                                    <div className="flex items-center gap-1 text-slate-700">
                                      <span className="bg-sky-600 text-white px-1 rounded-xs font-bold">
                                        ARR
                                      </span>
                                      <span className="font-bold tabular-nums">
                                        {new Date(assign.scheduled_start).toLocaleDateString("en-GB", {
                                          day: "numeric",
                                          month: "short",
                                        })}{" "}
                                        {new Date(assign.scheduled_start).getUTCHours().toString().padStart(2, "0")}:00
                                      </span>
                                    </div>

                                    {assign.waiting_time_hours > 0 ? (
                                      <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.2 rounded-full tabular-nums">
                                        +{assign.waiting_time_hours}h
                                      </span>
                                    ) : (
                                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold px-1.5 py-0.2 rounded-full">
                                        On Time
                                      </span>
                                    )}
                                  </div>

                                  {/* Interactive Operator Action Controls (Visible on Selection) */}
                                  {isSelected && (
                                    <div
                                      onClick={(e) => e.stopPropagation()}
                                      className="absolute -bottom-14 left-0 z-40 bg-slate-900 text-white p-2 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs font-sans animate-in fade-in zoom-in-95 duration-150 min-w-[340px]"
                                    >
                                      {/* Shift Start Time */}
                                      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                          Shift:
                                        </span>
                                        <button
                                          onClick={() => handleShiftTime(assign.vessel_call_id, -1)}
                                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold"
                                          title="Shift arrival 1 hour earlier"
                                        >
                                          -1h
                                        </button>
                                        <button
                                          onClick={() => handleShiftTime(assign.vessel_call_id, 1)}
                                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold"
                                          title="Shift arrival 1 hour later"
                                        >
                                          +1h
                                        </button>
                                      </div>

                                      {/* Reassign Berth Dropdown */}
                                      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                          Berth:
                                        </span>
                                        <select
                                          value={assign.berth_id}
                                          onChange={(e) => handleReassignBerth(assign.vessel_call_id, e.target.value)}
                                          className="bg-slate-800 text-white text-[10px] font-bold py-0.5 px-1.5 rounded border border-slate-600 focus:outline-hidden"
                                        >
                                          {berths.map((b) => (
                                            <option key={b.id} value={b.id}>
                                              {b.code} ({b.max_vessel_loa_m}m)
                                            </option>
                                          ))}
                                        </select>
                                      </div>

                                      {/* Duration Adjust */}
                                      <div className="flex items-center gap-1 border-r border-slate-700 pr-2">
                                        <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                          Dur:
                                        </span>
                                        <button
                                          onClick={() => handleAdjustDuration(assign.vessel_call_id, -1)}
                                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold"
                                          title="Decrease service duration by 1 hour"
                                        >
                                          -1h
                                        </button>
                                        <button
                                          onClick={() => handleAdjustDuration(assign.vessel_call_id, 1)}
                                          className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[10px] font-bold"
                                          title="Increase service duration by 1 hour"
                                        >
                                          +1h
                                        </button>
                                      </div>

                                      {/* Lock / Pin Toggle */}
                                      <button
                                        onClick={() => toggleLock(assign.vessel_call_id)}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${
                                          isLocked
                                            ? "bg-amber-500 text-slate-900"
                                            : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                        }`}
                                        title={isLocked ? "Unlock allocation" : "Lock allocation"}
                                      >
                                        {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                                        <span>{isLocked ? "Locked" : "Pin"}</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Footer Legend & Status Bar */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 font-medium">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-white border border-slate-300" />
            <span>Scheduled Vessel</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-sky-50 border border-sky-500" />
            <span>Selected for Review & Adjustment</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-rose-50 border border-rose-500" />
            <span>Berth Conflict / Violation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-md bg-amber-50 border border-amber-400" />
            <span>Operator Pinned (Locked)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-0.5 bg-rose-500" />
            <span>Live Real-Time Datum (UTC)</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Click any vessel card to shift arrival, change berth, or adjust duration.</span>
        </div>
      </div>
    </div>
  );
}
