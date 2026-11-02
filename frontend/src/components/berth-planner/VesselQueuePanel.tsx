"use client";

import React from "react";
import { VesselCallRead, BerthRead, ScheduledAssignment } from "@/types/api";
import { Anchor, Clock, AlertTriangle, ArrowRight, ShieldCheck, Ship } from "lucide-react";

interface VesselQueuePanelProps {
  calls: VesselCallRead[];
  berths: BerthRead[];
  assignments: ScheduledAssignment[];
  onSelectAssignmentByCallId: (callId: string) => void;
}

export function VesselQueuePanel({
  calls,
  berths,
  assignments,
  onSelectAssignmentByCallId,
}: VesselQueuePanelProps) {
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

  return (
    <div className="bg-white border border-portos-border rounded-lg shadow-xs overflow-hidden">
      <div className="p-3.5 border-b border-portos-border flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Anchor className="h-4 w-4 text-portos-teal" />
          <h2 className="text-sm font-bold text-portos-navy">
            Vessel Queue & Berth Compatibility
          </h2>
        </div>
        <span className="text-xs text-portos-muted font-mono">
          {calls.length} Active Feeder Calls
        </span>
      </div>

      <div className="divide-y divide-portos-border/70 max-h-[380px] overflow-y-auto">
        {calls.map((call) => {
          const { compatible, incompatible, loa, draft } = getCompatibility(call);
          const assignment = assignments.find((a) => a.vessel_call_id === call.id);

          return (
            <div
              key={call.id}
              className="p-3 hover:bg-slate-50/60 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              {/* Vessel metadata */}
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-portos-navy flex items-center gap-1.5">
                    <Ship className="h-3.5 w-3.5 text-portos-teal" />
                    {call.vessel?.name.replace("DEMO ", "") || call.call_number}
                  </span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                    {call.call_number}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      call.delay_risk_status === "HIGH_RISK"
                        ? "bg-rose-50 text-rose-700 font-bold"
                        : call.delay_risk_status === "WATCH"
                        ? "bg-amber-50 text-amber-700 font-semibold"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {call.delay_risk_status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-portos-muted text-[11px] font-mono">
                  <span>LOA: {loa}m</span>
                  <span>Draft: {draft}m</span>
                  <span>TEU: {call.vessel?.teu_capacity || "—"}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    ETA: {new Date(call.reported_eta).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "UTC",
                    })}
                  </span>
                  {call.predicted_delay_hours > 0 && (
                    <span className="text-amber-700 font-medium">
                      Est. Delay: +{call.predicted_delay_hours}h
                    </span>
                  )}
                </div>
              </div>

              {/* Berth compatibility chips & assigned badge */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-portos-muted mr-1">Feasible Berths:</span>
                  {compatible.map((b) => (
                    <span
                      key={b.id}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-teal-50 text-teal-800 border border-teal-200/60"
                      title={`${b.name} (Max LOA ${b.max_vessel_loa_m}m, Draft ${b.depth_draft_m}m)`}
                    >
                      {b.code}
                    </span>
                  ))}
                  {incompatible.length > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-50 line-through"
                      title={`Incompatible berths: ${incompatible.map((b) => b.code).join(", ")}`}
                    >
                      {incompatible.map((b) => b.code).join(", ")}
                    </span>
                  )}
                </div>

                {/* Assignment status badge / button */}
                {assignment ? (
                  <button
                    onClick={() => onSelectAssignmentByCallId(call.id)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded bg-portos-navy text-white text-[11px] font-medium hover:bg-portos-navy-secondary transition-colors shrink-0"
                  >
                    <span>Assigned: {assignment.berth_code}</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ) : (
                  <span className="px-2 py-1 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-medium">
                    Awaiting Slot
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
