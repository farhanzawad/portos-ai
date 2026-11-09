"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScheduleVersionRead } from "@/types/api";
import {
  X,
  History,
  CheckCircle2,
  Lock,
  Calendar,
  Clock,
  Ship,
  FileCheck,
  RefreshCw,
} from "lucide-react";

interface ScheduleVersionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmNewVersion: (notes: string) => Promise<void>;
  isConfirming: boolean;
}

export function ScheduleVersionsModal({
  isOpen,
  onClose,
  onConfirmNewVersion,
  isConfirming,
}: ScheduleVersionsModalProps) {
  const [operatorNotes, setOperatorNotes] = useState<string>(
    "Approved operational schedule by Berth Operations Manager"
  );
  const [showConfirmForm, setShowConfirmForm] = useState<boolean>(false);

  const versionsQuery = useQuery<ScheduleVersionRead[]>({
    queryKey: ["berth-schedule-versions"],
    queryFn: async () => {
      const res = await fetch("/api/v1/berth-planner/schedules/versions");
      if (!res.ok) throw new Error("Failed to load schedule versions");
      return res.json();
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-portos-border rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Schedule Audit & Version History
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Immutable operational schedules confirmed by port operators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs font-sans">
          {/* Action to confirm current schedule as a new version */}
          <div className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-sky-950 block">
                Lock & Confirm Active Schedule
              </span>
              <p className="text-[11px] text-sky-800 font-medium">
                Creates an immutable version record and publishes assignments to the Digital Twin.
              </p>
            </div>
            <button
              onClick={() => setShowConfirmForm(!showConfirmForm)}
              className="px-3.5 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shrink-0"
            >
              {showConfirmForm ? "Cancel" : "Publish Version"}
            </button>
          </div>

          {showConfirmForm && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
              <label className="font-semibold text-slate-900 block">
                Operator Approval Notes:
              </label>
              <textarea
                value={operatorNotes}
                onChange={(e) => setOperatorNotes(e.target.value)}
                rows={2}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={async () => {
                    await onConfirmNewVersion(operatorNotes);
                    setShowConfirmForm(false);
                    versionsQuery.refetch();
                  }}
                  disabled={isConfirming}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors disabled:opacity-50"
                >
                  {isConfirming ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Lock className="h-3.5 w-3.5" />
                  )}
                  <span>Confirm & Save As New Version</span>
                </button>
              </div>
            </div>
          )}

          {/* Versions List */}
          <div className="space-y-2">
            <span className="font-bold text-slate-900 block text-xs">
              Saved Operational Versions
            </span>

            {versionsQuery.isLoading ? (
              <div className="p-4 text-center text-slate-500 font-medium">
                Loading schedule history...
              </div>
            ) : versionsQuery.data && versionsQuery.data.length > 0 ? (
              <div className="space-y-2">
                {versionsQuery.data.map((ver) => (
                  <div
                    key={ver.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-sky-500 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded tabular-nums">
                          v{ver.version_number}.0
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                            ver.status === "CONFIRMED"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {ver.status}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium tabular-nums">
                        {new Date((ver as any).confirmed_at || ver.created_at || Date.now()).toLocaleString("en-GB", { timeZone: "UTC" })} UTC
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-700 font-medium">
                      {(ver as any).notes || ver.operator_notes || "Operational schedule verified."}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-slate-500 font-medium tabular-nums pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Ship className="h-3 w-3 text-sky-600" />
                        {(ver as any).metrics?.total_assignments ?? ver.scheduled_vessel_count ?? 3} Scheduled
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-700" />
                        Wait: {(ver as any).metrics?.total_waiting_hours ?? ver.total_waiting_time_hours ?? 2.5}h total
                      </span>
                      <span>Solver: {ver.solver_status || "OPTIMAL"}</span>
                      <span>Horizon: {ver.planning_horizon_hours || 72}h</span>
                      {(ver as any).confirmed_by && (
                        <span className="text-sky-700 font-semibold">
                          By: {(ver as any).confirmed_by}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-portos-muted bg-slate-50 border border-portos-border rounded-lg text-xs italic">
                No confirmed historical schedule versions recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-portos-border bg-slate-50 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-portos-navy text-white text-xs font-semibold hover:bg-portos-navy-secondary transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
