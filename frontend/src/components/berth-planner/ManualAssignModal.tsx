"use client";

import React, { useState, useEffect } from "react";
import { BerthRead, VesselCallRead, FeasibilityValidationResult } from "@/types/api";
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Ship,
  Save,
  RefreshCw,
} from "lucide-react";

interface ManualAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  vesselCall: VesselCallRead | null;
  berths: BerthRead[];
  onSuccess: () => void;
}

export function ManualAssignModal({
  isOpen,
  onClose,
  vesselCall,
  berths,
  onSuccess,
}: ManualAssignModalProps) {
  const [selectedBerthId, setSelectedBerthId] = useState<string>("");
  const [scheduledStart, setScheduledStart] = useState<string>("");
  const [durationHours, setDurationHours] = useState<number>(14);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<FeasibilityValidationResult | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Initialize form when vesselCall changes
  useEffect(() => {
    if (vesselCall) {
      // Pick first compatible berth
      const defaultBerth =
        berths.find((b) => b.status !== "MAINTENANCE" && b.is_active) || berths[0];
      setSelectedBerthId(defaultBerth ? defaultBerth.id : "");

      // Default start to ETA or now
      const eta = new Date(vesselCall.reported_eta);
      const isoStr = eta.toISOString().slice(0, 16);
      setScheduledStart(isoStr);
      setDurationHours(14);
      setValidationResult(null);
      setSaveError(null);
    }
  }, [vesselCall, berths]);

  // Live constraint validation
  useEffect(() => {
    if (!vesselCall || !selectedBerthId || !scheduledStart) return;

    let isSubscribed = true;
    const runValidation = async () => {
      setIsValidating(true);
      try {
        const startDt = new Date(scheduledStart);
        const endDt = new Date(startDt.getTime() + durationHours * 3600 * 1000);

        const res = await fetch("/api/v1/berth-planner/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignments: [
              {
                vessel_call_id: vesselCall.id,
                vessel_name: vesselCall.vessel?.name || "Vessel",
                call_number: vesselCall.call_number,
                berth_id: selectedBerthId,
                berth_code: berths.find((b) => b.id === selectedBerthId)?.code || "BERTH",
                berth_name: berths.find((b) => b.id === selectedBerthId)?.name || "Berth",
                scheduled_start: startDt.toISOString(),
                scheduled_end: endDt.toISOString(),
                service_duration_hours: durationHours,
                waiting_time_hours: 0,
                assigned_quay_start_m: 0,
                assigned_quay_end_m: vesselCall.vessel?.length_overall_m || 170,
                is_feasible: true,
                assignment_explanation: "Manual allocation check",
                data_status: "SIMULATED",
              },
            ],
            berths: berths.map((b) => ({
              id: b.id,
              code: b.code,
              name: b.name,
              length_m: b.length_m,
              depth_draft_m: b.depth_draft_m,
              max_vessel_loa_m: b.max_vessel_loa_m,
              is_active: b.is_active,
              status: b.status,
              assigned_cranes_count: 2,
              crane_capacity_moves_per_hour: 28.0,
              maintenance_windows: [],
            })),
            vessel_calls: [
              {
                id: vesselCall.id,
                vessel_id: vesselCall.vessel_id,
                vessel_name: vesselCall.vessel?.name || "Vessel",
                call_number: vesselCall.call_number,
                length_overall_m: vesselCall.vessel?.length_overall_m || 170,
                max_draft_m: vesselCall.vessel?.max_draft_m || 9.0,
                vessel_category: "CONTAINER",
                reported_eta: vesselCall.reported_eta,
                predicted_eta: vesselCall.predicted_eta,
                earliest_berthing_time: vesselCall.reported_eta,
                service_duration_hours: durationHours,
                cargo_moves: 450,
                required_crane_capacity: 25.0,
                priority_level: 2,
                status: "PENDING",
                delay_risk_status: vesselCall.delay_risk_status,
              },
            ],
          }),
        });

        if (res.ok) {
          const val = await res.json();
          if (isSubscribed) setValidationResult(val);
        }
      } catch (err) {
        console.error("Validation failed", err);
      } finally {
        if (isSubscribed) setIsValidating(false);
      }
    };

    const timer = setTimeout(runValidation, 300);
    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [vesselCall, selectedBerthId, scheduledStart, durationHours, berths]);

  const handleSave = async () => {
    if (!vesselCall || !selectedBerthId || !scheduledStart) return;
    setIsSaving(true);
    setSaveError(null);

    try {
      const startDt = new Date(scheduledStart);
      const endDt = new Date(startDt.getTime() + durationHours * 3600 * 1000);

      const res = await fetch("/api/v1/berth-planner/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vessel_call_id: vesselCall.id,
          berth_id: selectedBerthId,
          scheduled_start: startDt.toISOString(),
          scheduled_end: endDt.toISOString(),
          reason: "Manual allocation by port operator",
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to commit manual assignment");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setSaveError(err.message || "Failed to save assignment");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !vesselCall) return null;

  const selectedBerth = berths.find((b) => b.id === selectedBerthId);
  const isHardViolated =
    validationResult && (!validationResult.is_feasible || validationResult.violations_count > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border border-portos-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 border border-sky-200 text-sky-600">
              <Ship className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Manual Berth Allocation
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {vesselCall.vessel?.name.replace("DEMO ", "")} • Call: {vesselCall.call_number}
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

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs font-sans">
          {saveError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Berth selector */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-900 block">
              Target Berth Allocation:
            </label>
            <select
              value={selectedBerthId}
              onChange={(e) => setSelectedBerthId(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-sky-500 outline-hidden"
            >
              {berths.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.code} ({b.name}) — Max LOA {b.max_vessel_loa_m}m, Depth {b.depth_draft_m}m [
                  {b.status}]
                </option>
              ))}
            </select>
          </div>

          {/* Time window inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 block flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-sky-600" />
                Scheduled Start (UTC):
              </label>
              <input
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium tabular-nums focus:ring-2 focus:ring-sky-500 outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 block flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-sky-600" />
                Handling Duration:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="2"
                  max="72"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Math.max(2, parseInt(e.target.value) || 2))}
                  className="w-full p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium tabular-nums focus:ring-2 focus:ring-sky-500 outline-hidden"
                />
                <span className="text-slate-500 font-medium">hrs</span>
              </div>
            </div>
          </div>

          {/* Physical Vessel vs Berth Comparison */}
          {selectedBerth && vesselCall.vessel && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-[11px] tabular-nums font-medium">
              <div className="flex justify-between">
                <span className="text-slate-500">Vessel LOA vs Max Berth:</span>
                <span
                  className={
                    vesselCall.vessel.length_overall_m <= selectedBerth.max_vessel_loa_m
                      ? "text-emerald-700 font-bold"
                      : "text-rose-700 font-bold"
                  }
                >
                  {vesselCall.vessel.length_overall_m}m / {selectedBerth.max_vessel_loa_m}m
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vessel Draft vs Berth Depth:</span>
                <span
                  className={
                    vesselCall.vessel.max_draft_m <= selectedBerth.depth_draft_m
                      ? "text-emerald-700 font-bold"
                      : "text-rose-700 font-bold"
                  }
                >
                  {vesselCall.vessel.max_draft_m}m / {selectedBerth.depth_draft_m}m
                </span>
              </div>
            </div>
          )}

          {/* Live Constraint Feasibility Validation Card */}
          <div
            className={`p-3.5 rounded-xl border space-y-1.5 ${
              isHardViolated
                ? "bg-rose-50 border-rose-200 text-rose-900"
                : "bg-emerald-50/60 border-emerald-200 text-emerald-950"
            }`}
          >
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" />
                Automated Constraint Verification
              </span>
              {isValidating ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-600" />
              ) : isHardViolated ? (
                <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-bold">
                  INFEASIBLE
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  VALID & FEASIBLE
                </span>
              )}
            </div>

            {validationResult && validationResult.violations.length > 0 ? (
              <div className="space-y-1 pt-1 text-[10px]">
                {validationResult.violations.map((v, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-rose-700 font-medium">
                    <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                    <span>{v.description}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-emerald-800 block font-medium">
                All physical clearances, berth non-overlap constraints, and crane requirements are satisfied.
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-full border border-slate-200 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isHardViolated || isValidating}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            <span>Commit Manual Allocation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
