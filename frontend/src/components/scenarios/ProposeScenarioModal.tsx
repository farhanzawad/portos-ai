"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SimulationRunResponse, ProposeScenarioResponse } from "@/types/api";
import { AlertCircle, Send, Zap, CheckCircle2, ArrowRight, CalendarRange } from "lucide-react";

interface ProposeScenarioModalProps {
  isOpen: boolean;
  simulationRun: SimulationRunResponse;
  onClose: () => void;
  onSuccess: (data: ProposeScenarioResponse) => void;
}

export function ProposeScenarioModal({
  isOpen,
  simulationRun,
  onClose,
  onSuccess,
}: ProposeScenarioModalProps) {
  const [advisoryNotes, setAdvisoryNotes] = useState(
    `Recovery strategy for ${simulationRun.scenario_name}: Recommend dynamic berth assignment and buffer allocation to absorb simulated ${simulationRun.metrics.total_waiting_hours.toFixed(0)}h queue backlog.`
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<ProposeScenarioResponse | null>(null);

  if (!isOpen) return null;

  const handlePropose = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/scenarios/propose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          run_id: simulationRun.run_id,
          scenario_code: simulationRun.scenario_code,
          scenario_name: simulationRun.scenario_name,
          advisory_notes: advisoryNotes,
          metrics: simulationRun.metrics,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server returned ${res.status}`);
      }

      const data: ProposeScenarioResponse = await res.json();
      setSubmittedData(data);
      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record scenario proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 animate-in fade-in zoom-in-95">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                Human Review & Decision Authorization
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                Gemini Advisory Proposal → Harbour Master Sign-off
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none p-1"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-3.5 text-xs">
          {submittedData ? (
            <div className="space-y-4 text-center py-2">
              <div className="h-12 w-12 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">
                  Advisory Proposal Authorized
                </h4>
                <p className="text-[11px] text-slate-300 mt-1">
                  Proposal record <span className="font-semibold text-sky-400 tabular-nums">{submittedData.proposal_id}</span> logged in audit database.
                </p>
              </div>

              {/* Closed Loop Action: Apply to Berth Schedule */}
              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-left space-y-2">
                <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                  <CalendarRange className="h-4 w-4 text-sky-400" />
                  <span>Next Step: Update Berth Schedule</span>
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  Apply the authorized recovery allocation directly to the Berth Planner Gantt Matrix to resolve simulated queuing delays.
                </p>
                <Link
                  href="/berth-planner"
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow-md"
                >
                  <span>Apply to Berth Schedule (Berth Planner)</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="bg-amber-950/30 border border-amber-800/50 rounded-xl p-3.5 text-amber-200 space-y-1">
                <span className="font-bold flex items-center gap-1.5 text-amber-300">
                  <AlertCircle className="h-4 w-4 text-amber-400" />
                  Operational Protocol & Governance Notice
                </span>
                <p className="text-[11px] leading-relaxed text-amber-200/90 font-medium">
                  This action records an internal recovery recommendation proposal in the system audit database with status <span className="font-bold text-amber-300">PROPOSED</span>.
                  In accordance with PORTOS AI core safety rules, <strong>no real-world navigational clearances, tug mobilizations, crane sensor overrides, or vessel orders are issued</strong>.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-200 mb-1">
                  Advisory Operational Notes & Mitigation Strategy:
                </label>
                <textarea
                  value={advisoryNotes}
                  onChange={(e) => setAdvisoryNotes(e.target.value)}
                  rows={3}
                  className="w-full text-xs p-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 font-sans leading-relaxed"
                  placeholder="Enter operational rationale for harbour master evaluation..."
                />
              </div>

              <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between text-slate-300 text-[11px]">
                <span className="text-slate-400">Scenario Evaluated:</span>
                <span className="font-bold text-sky-200">{simulationRun.scenario_name}</span>
              </div>

              {error && (
                <div className="p-3 bg-rose-950/50 border border-rose-900/60 rounded-xl text-rose-300 text-xs font-medium">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        {!submittedData && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-850 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePropose}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 active:scale-95"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Submitting..." : "Authorize Advisory Proposal"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
