"use client";

import React from "react";
import { ScenarioRead, ScenarioParameters } from "@/types/api";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  FlaskConical,
  Copy,
  Plus,
} from "lucide-react";

interface ScenarioHeaderProps {
  scenarios: ScenarioRead[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  sensitivityMode: boolean;
  onToggleSensitivity: () => void;
  onOpenCreateModal: () => void;
  onDuplicateScenario: () => void;
  onOpenSaveModal: () => void;
}

export function ScenarioHeader({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  sensitivityMode,
  onToggleSensitivity,
  onOpenCreateModal,
  onDuplicateScenario,
}: ScenarioHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl border border-slate-700/80 bg-slate-900 shadow-sm text-slate-100 font-sans">
      {/* Title & Scenario Selector Dropdown */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shadow-xs">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                Decision Lab
              </h1>
              <DataStatusBadge status="SIMULATED" />
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              SimPy Discrete-Event Simulation & Scenario Planning
            </p>
          </div>
        </div>

        {/* Active Scenario Selector Dropdown */}
        <div className="flex items-center gap-2 pl-2 sm:border-l border-slate-800">
          <span className="text-xs text-slate-400 font-semibold hidden md:inline">
            Scenario:
          </span>
          <select
            value={activeScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            className="text-xs font-semibold py-1.5 px-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer max-w-xs truncate"
          >
            {scenarios.map((scen) => (
              <option key={scen.id} value={scen.id}>
                {scen.name} {scen.is_baseline ? "(Default)" : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Controls: Sensitivity Toggle + Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sensitivity Mode Toggle */}
        <div className="flex items-center gap-2 bg-slate-800 py-1.5 px-3 rounded-xl border border-slate-700 text-xs">
          <span className="text-slate-300 font-medium text-[11px]">
            Sensitivity Mode
          </span>
          <button
            onClick={onToggleSensitivity}
            className={`w-9 h-5 flex items-center rounded-full p-0.5 transition-colors ${
              sensitivityMode ? "bg-sky-500" : "bg-slate-700"
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                sensitivityMode ? "translate-x-4" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onDuplicateScenario}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
            title="Duplicate current scenario"
          >
            <Copy className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Scenario</span>
          </button>
        </div>
      </div>
    </div>
  );
}
