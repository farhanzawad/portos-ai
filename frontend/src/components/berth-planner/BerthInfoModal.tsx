"use client";

import React from "react";
import { BerthRead, ScheduledAssignment, BerthMaintenanceRead } from "@/types/api";
import {
  X,
  Layers,
  Ruler,
  Anchor,
  Wrench,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Ship,
} from "lucide-react";

interface BerthInfoModalProps {
  berth: BerthRead | null;
  assignments: ScheduledAssignment[];
  onClose: () => void;
}

export function BerthInfoModal({
  berth,
  assignments,
  onClose,
}: BerthInfoModalProps) {
  if (!berth) return null;

  const berthAssignments = assignments.filter((a) => a.berth_id === berth.id);
  const currentAssignment = berthAssignments[0] || null;
  const isMaintenance = berth.status === "MAINTENANCE";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-portos-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  {berth.code}
                </h3>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isMaintenance
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {berth.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">{berth.name} • Chattogram Terminal</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs font-sans">
          {/* Physical Specifications */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Ruler className="h-3 w-3 text-sky-600" />
                Usable Berth Length
              </span>
              <span className="text-base font-bold text-slate-900 block tabular-nums">
                {berth.length_m} meters
              </span>
              <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                Max Allowed LOA: {berth.max_vessel_loa_m}m
              </span>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1">
              <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                <Anchor className="h-3 w-3 text-slate-700" />
                Water Depth / Max Draft
              </span>
              <span className="text-base font-bold text-slate-900 block tabular-nums">
                {berth.depth_draft_m} meters
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Chart Datum (LAT)
              </span>
            </div>
          </div>

          {/* Permitted Categories & Assigned Cranes */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="font-bold text-slate-900 block text-xs">
              Permitted Categories & Assigned Cranes
            </span>
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium">
                Container Feeders
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-medium">
                Geared General Cargo
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-medium">
                2x STS Cranes (40t SWL)
              </span>
            </div>
          </div>

          {/* Current Occupancy & Scheduled Calls */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-2">
            <span className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
              <Ship className="h-3.5 w-3.5 text-sky-600" />
              Scheduled Vessel Calls ({berthAssignments.length})
            </span>

            {berthAssignments.length === 0 ? (
              <span className="text-slate-400 italic text-[11px]">
                No vessels scheduled within the current planning window.
              </span>
            ) : (
              <div className="space-y-1.5">
                {berthAssignments.map((a) => (
                  <div
                    key={a.vessel_call_id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-[11px]"
                  >
                    <div>
                      <span className="font-bold text-slate-900">
                        {a.vessel_name.replace("DEMO ", "")}
                      </span>
                      <span className="text-slate-500 block text-[10px] font-medium tabular-nums">
                        {new Date(a.scheduled_start).toLocaleDateString("en-GB", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })} -{" "}
                        {new Date(a.scheduled_end).toLocaleDateString("en-GB", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })}
                      </span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] tabular-nums">
                      {a.service_duration_hours}h service
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Maintenance Window info */}
          {isMaintenance && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50/60 space-y-1 text-rose-950">
              <span className="font-bold text-xs flex items-center gap-1.5 text-rose-800">
                <Wrench className="h-3.5 w-3.5 text-rose-600" />
                Active Maintenance Closure
              </span>
              <p className="text-[11px] leading-relaxed">
                Fender refurbishment & quay wall inspection. Berth temporarily unavailable for berthing allocations until scheduled window completion.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-portos-border bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-portos-navy text-white text-xs font-semibold hover:bg-portos-navy-secondary transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
