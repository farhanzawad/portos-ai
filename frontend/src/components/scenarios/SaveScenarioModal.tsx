"use client";

import React, { useState } from "react";
import { ScenarioParameters, ScenarioCreateRequest } from "@/types/api";
import { BookmarkPlus, X, ShieldAlert } from "lucide-react";

interface SaveScenarioModalProps {
  isOpen: boolean;
  parameters: ScenarioParameters;
  onClose: () => void;
  onSave: (payload: ScenarioCreateRequest) => Promise<void>;
  isSaving: boolean;
}

export function SaveScenarioModal({
  isOpen,
  parameters,
  onClose,
  onSave,
  isSaving,
}: SaveScenarioModalProps) {
  const [name, setName] = useState(parameters.scenario_name || "Custom Disruption Scenario");
  const [code, setCode] = useState(
    parameters.scenario_code.startsWith("custom_")
      ? parameters.scenario_code
      : `scen_${parameters.scenario_code}_${Date.now().toString().slice(-4)}`
  );
  const [description, setDescription] = useState(
    parameters.description || "Custom operational disruption scenario configuration."
  );

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      code,
      name,
      description,
      parameters: {
        ...parameters,
        scenario_code: code,
        scenario_name: name,
        description,
        is_baseline: false,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl text-slate-100 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="h-5 w-5 text-sky-400" />
            <h3 className="text-sm font-bold text-white">
              Save Disruption Scenario
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg leading-none p-1"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-200 font-semibold mb-1">
              Scenario Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 font-sans"
              placeholder="e.g., Heavy Monsoon + 2 STS Cranes Down"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1">
              Unique Scenario Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 text-xs focus:outline-none focus:border-sky-500"
              placeholder="e.g., monsoon_dual_crane_outage"
            />
          </div>

          <div>
            <label className="block text-slate-200 font-semibold mb-1">
              Description & Operational Assumptions
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 text-xs font-sans leading-relaxed"
              placeholder="Document reason for disruption, duration, and target mitigations..."
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-300 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Saved scenarios are persisted to the PORTOS Decision Lab database and can be re-run, duplicated, or compared against the standard baseline.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save to Decision Lab"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
