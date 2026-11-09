"use client";

import React, { useState } from "react";
import { VesselCallRead, BerthRead, ScheduledAssignment } from "@/types/api";
import { Anchor, Clock, AlertTriangle, ArrowRight, ShieldCheck, Ship, CheckCircle2, ChevronRight, Sliders } from "lucide-react";

interface VesselQueuePanelProps {
  calls: VesselCallRead[];
  berths: BerthRead[];
  assignments: ScheduledAssignment[];
  onSelectAssignmentByCallId: (callId: string) => void;
  onManualAssign?: (call: VesselCallRead) => void;
}

export function VesselQueuePanel({
  calls,
  berths,
  assignments,
  onSelectAssignmentByCallId,
  onManualAssign,
}: VesselQueuePanelProps) {
  const [filter, setFilter] = useState<"all" | "waiting" | "berthed">("all");

  // Check compatibility of a call against berths
  const getCompatibility = (call: VesselCallRead) => {
    const loa = call.vessel?.length_overall_m ?? 170.0;
    const draft = call.vessel?.max_draft_m ?? 9.0;

    const compatible = berths.filter(
      (b) => b.is_active && b.status !== "MAINTENANCE" && loa <= b.max_vessel_loa_m && draft <= b.depth_draft_m
    );
    const incompatible = berths.filter(
      (b) => loa > b.max_vessel_loa_m || draft > b.depth_draft_m
    );

    return { compatible, incompatible, loa, draft };
  };

  const filteredCalls = calls.filter((call) => {
    const isAssigned = assignments.some((a) => a.vessel_call_id === call.id);
    if (filter === "waiting") return !isAssigned;
    if (filter === "berthed") return isAssigned;
    return true;
  });

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden font-sans">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Anchor className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Vessel Queue & Berth Physical Compatibility
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              Automated draft & LOA boundary validation against Chattogram quays
            </p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200 text-xs font-medium">
          {(["all", "waiting", "berthed"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3 py-1 rounded-full capitalize transition-all ${
                filter === tab
                  ? "bg-white text-slate-900 font-bold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab === "all" ? `All (${calls.length})` : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Vessel List */}
      <div className="divide-y divide-slate-100 max-h-[420px] overflow-y-auto p-2 space-y-1">
        {filteredCalls.map((call) => {
          const { compatible, incompatible, loa, draft } = getCompatibility(call);
          const assignment = assignments.find((a) => a.vessel_call_id === call.id);
          const isHighRisk = call.delay_risk_status === "HIGH_RISK";

          return (
            <div
              key={call.id}
              className="p-3.5 rounded-xl hover:bg-slate-50/80 border border-transparent hover:border-slate-200/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs group"
            >
              {/* Vessel metadata & Icon */}
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                    isHighRisk
                      ? "bg-rose-50 text-rose-600 border border-rose-200"
                      : assignment
                      ? "bg-sky-50 text-sky-600 border border-sky-200"
                      : "bg-amber-50 text-amber-600 border border-amber-200"
                  }`}
                >
                  <Ship className="h-4 w-4" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">
                      {call.vessel?.name.replace("DEMO ", "") || call.call_number}
                    </span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {call.call_number}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        isHighRisk
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : call.delay_risk_status === "WATCH"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : "bg-sky-50 text-sky-700 border border-sky-200"
                      }`}
                    >
                      {call.delay_risk_status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-slate-500 text-[11px] font-medium">
                    <span>LOA: <strong className="text-slate-900 tabular-nums">{loa}m</strong></span>
                    <span>Draft: <strong className="text-slate-900 tabular-nums">{draft}m</strong></span>
                    <span>Capacity: {call.vessel?.teu_capacity ? `${call.vessel.teu_capacity} TEU` : "—"}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-sky-600" />
                      ETA: {new Date(call.reported_eta).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "UTC",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Compatibility & Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 shrink-0">
                {/* Compatible Berth Pills */}
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500 font-semibold mr-1">Compatible:</span>
                  <div className="flex items-center gap-1">
                    {compatible.slice(0, 3).map((b) => (
                      <span
                        key={b.id}
                        className="text-[10px] font-bold bg-sky-50 text-sky-800 px-2 py-0.5 rounded-full border border-sky-200"
                      >
                        {b.code}
                      </span>
                    ))}
                    {compatible.length > 3 && (
                      <span className="text-[10px] text-slate-500 px-1 font-bold">
                        +{compatible.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status or Manual Assign Action */}
                {assignment ? (
                  <button
                    onClick={() => onSelectAssignmentByCallId(call.id)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 transition-all shadow-2xs"
                  >
                    <span>Allocated: {assignment.berth_code}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-sky-600" />
                  </button>
                ) : (
                  <button
                    onClick={() => onManualAssign && onManualAssign(call)}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition-all shadow-2xs"
                  >
                    <span>Allocate Berth</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
