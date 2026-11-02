"use client";

import React, { useState } from "react";
import { SimulationRunResponse, ProposeScenarioResponse } from "@/types/api";
import { AlertCircle, ShieldAlert, Send } from "lucide-react";

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
      onSuccess(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to record scenario proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white border border-portos-border rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-portos-border bg-slate-50 flex items-center gap-2.5">
          <ShieldAlert className="h-5 w-5 text-portos-teal" />
          <div>
            <h3 className="text-sm font-bold text-portos-navy">
              Propose Scenario Recovery Plan for Harbour Master Review
            </h3>
            <span className="text-xs text-portos-muted font-mono">
              Decision Lab Advisory Protocol
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5 text-xs">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              Operational Protocol & Governance Notice
            </span>
            <p className="text-[11px] leading-relaxed">
              This action records an internal recovery recommendation proposal in the system audit database with status <span className="font-mono font-bold">PROPOSED</span>.
              In accordance with PORTOS AI core safety rules, <strong>no real-world navigational clearances, tug mobilizations, crane sensor overrides, or vessel orders are issued</strong>.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-portos-navy mb-1">
              Advisory Operational Notes & Mitigation Strategy:
            </label>
            <textarea
              value={advisoryNotes}
              onChange={(e) => setAdvisoryNotes(e.target.value)}
              rows={3}
              className="w-full text-xs font-mono p-2 border border-portos-border rounded-md focus:outline-none focus:ring-1 focus:ring-portos-teal"
              placeholder="Enter operational rationale for harbour master evaluation..."
            />
          </div>

          <div className="p-2.5 bg-slate-50 border border-portos-border rounded-lg flex items-center justify-between text-portos-muted font-mono text-[11px]">
            <span>Scenario Evaluated:</span>
            <span className="font-bold text-portos-navy">{simulationRun.scenario_name}</span>
          </div>

          {error && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-mono">
              {error}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-portos-border bg-slate-50 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-3.5 py-1.5 rounded border border-portos-border text-portos-navy text-xs font-medium hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handlePropose}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-portos-teal text-white text-xs font-medium hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{isSubmitting ? "Submitting..." : "Submit Proposal"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
