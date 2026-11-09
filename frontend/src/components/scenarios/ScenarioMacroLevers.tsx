"use client";

import React, { useState } from "react";
import { ScenarioParameters } from "@/types/api";
import {
  Sliders,
  RotateCcw,
  Play,
  BookmarkPlus,
  ChevronDown,
  ChevronUp,
  Search,
  Anchor,
  ShieldAlert,
  Cpu,
  Wind,
  Layers,
  Gauge,
} from "lucide-react";

interface ScenarioMacroLeversProps {
  parameters: ScenarioParameters;
  presets: ScenarioParameters[];
  isLoading: boolean;
  onParametersChange: (newParams: ScenarioParameters) => void;
  onResetToBaseline: () => void;
  onRunSimulation: () => void;
  onOpenSaveModal: () => void;
  sensitivityMode: boolean;
}

export function ScenarioMacroLevers({
  parameters,
  presets,
  isLoading,
  onParametersChange,
  onResetToBaseline,
  onRunSimulation,
  onOpenSaveModal,
  sensitivityMode,
}: ScenarioMacroLeversProps) {
  const [searchFilter, setSearchFilter] = useState("");
  const [openSections, setOpenSections] = useState({
    macro: true,
    surge: true,
    berths: false,
    cranes: false,
    weather: false,
    yard: false,
    cargo: false,
  });

  const toggleSection = (key: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const updateParam = <K extends keyof ScenarioParameters>(
    key: K,
    value: ScenarioParameters[K]
  ) => {
    onParametersChange({
      ...parameters,
      [key]: value,
    });
  };

  // Helper for quick surge presets
  const applySurgePreset = (pct: number) => {
    onParametersChange({
      ...parameters,
      arrival_surge_pct: pct,
      vessel_arrival_multiplier: parseFloat((1.0 + pct / 100.0).toFixed(2)),
    });
  };

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl p-4 shadow-sm text-slate-100 space-y-4 max-h-[820px] overflow-y-auto font-sans">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
            <Sliders className="h-4 w-4 text-sky-400" />
            <span>Macro Levers</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Operational levers & disruption modeling
          </p>
        </div>

        {sensitivityMode && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            Sensitivity On
          </span>
        )}
      </div>

      {/* Search Levers */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
        <input
          type="text"
          placeholder="Search levers (e.g. crane, surge, wind)..."
          value={searchFilter}
          onChange={(e) => setSearchFilter(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-800/80 border border-slate-700 rounded-xl text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
        />
      </div>

      {/* Accordion 1: Core Macro Operations */}
      <div className="border border-slate-800 rounded-xl bg-slate-800/40 overflow-hidden">
        <button
          onClick={() => toggleSection("macro")}
          className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-sky-400" />
            Operations Levers
          </span>
          {openSections.macro ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {openSections.macro && (
          <div className="p-3 pt-0 space-y-3.5 text-xs">
            {/* Reliability Target */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Target Reliability</span>
                <span className="font-semibold text-sky-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                  {parameters.target_reliability_pct ?? 85}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                step="5"
                value={parameters.target_reliability_pct ?? 85}
                onChange={(e) => updateParam("target_reliability_pct", parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>40% Degraded</span>
                <span>85% Core KPI</span>
                <span>100% Strict</span>
              </div>
            </div>

            {/* Delay Threshold */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Delay Threshold</span>
                <span className="font-semibold text-sky-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                  {parameters.delay_threshold_hours ?? 3.0} hrs
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="10.0"
                step="0.5"
                value={parameters.delay_threshold_hours ?? 3.0}
                onChange={(e) => updateParam("delay_threshold_hours", parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>1h Strict</span>
                <span>3h Standard</span>
                <span>10h Lenient</span>
              </div>
            </div>

            {/* Crane Productivity Multiplier */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Crane Productivity</span>
                <span className="font-semibold text-sky-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                  {(28.0 * parameters.crane_service_rate_multiplier).toFixed(0)} moves/h
                </span>
              </div>
              <input
                type="range"
                min="0.6"
                max="1.5"
                step="0.05"
                value={parameters.crane_service_rate_multiplier}
                onChange={(e) => updateParam("crane_service_rate_multiplier", parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>0.6x (17 m/h)</span>
                <span>1.0x (28 m/h)</span>
                <span>1.5x (42 m/h)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 2: Scenario A - Vessel Arrival Surge */}
      <div className="border border-slate-800 rounded-xl bg-slate-800/40 overflow-hidden">
        <button
          onClick={() => toggleSection("surge")}
          className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Anchor className="h-3.5 w-3.5 text-sky-400" />
            Scenario A: Vessel Arrival Surge
          </span>
          {openSections.surge ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {openSections.surge && (
          <div className="p-3 pt-0 space-y-3 text-xs">
            {/* Quick Preset Buttons */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">
                Surge Volume Presets:
              </span>
              <div className="grid grid-cols-5 gap-1">
                {[0, 10, 20, 30, 40].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => applySurgePreset(pct)}
                    className={`py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      Math.round(parameters.arrival_surge_pct || 0) === pct
                        ? "bg-sky-600 text-white border-sky-500 font-bold"
                        : "bg-slate-800 text-slate-300 border-slate-700 hover:border-sky-500/50"
                    }`}
                  >
                    +{pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Multiplier Slider */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Arrival Volume Multiplier</span>
                <span className="font-semibold text-sky-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                  {parameters.vessel_arrival_multiplier.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={parameters.vessel_arrival_multiplier}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  onParametersChange({
                    ...parameters,
                    vessel_arrival_multiplier: val,
                    arrival_surge_pct: Math.max(0, (val - 1.0) * 100),
                  });
                }}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Arrival Concentration Pattern */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">
                Arrival Concentration Pattern:
              </span>
              <div className="grid grid-cols-3 gap-1">
                {(["UNIFORM", "MORNING_PEAK", "TIDAL_WINDOW"] as const).map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => updateParam("arrival_concentration", pattern)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-medium border text-center transition-all ${
                      (parameters.arrival_concentration || "UNIFORM") === pattern
                        ? "bg-sky-500/20 text-sky-300 border-sky-500/60 font-bold"
                        : "bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white"
                    }`}
                  >
                    {pattern.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 3: Scenario B - Berth Unavailability */}
      <div className="border border-slate-800 rounded-xl bg-slate-800/40 overflow-hidden">
        <button
          onClick={() => toggleSection("berths")}
          className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
            Scenario B: Berth Unavailability
          </span>
          {openSections.berths ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {openSections.berths && (
          <div className="p-3 pt-0 space-y-3 text-xs">
            {/* Outage Count */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Berths Offline</span>
                <span className="font-semibold text-amber-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                  {parameters.berth_outage_count} / 6 closed
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={parameters.berth_outage_count}
                onChange={(e) => updateParam("berth_outage_count", parseInt(e.target.value, 10))}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            {/* Outage Reason */}
            <div>
              <span className="text-[10px] text-slate-400 block mb-1">
                Closure Reason:
              </span>
              <select
                value={parameters.berth_closure_reason || "MAINTENANCE"}
                onChange={(e) => updateParam("berth_closure_reason", e.target.value)}
                className="w-full p-1.5 text-xs bg-slate-800 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              >
                <option value="MAINTENANCE">Scheduled Quay Maintenance</option>
                <option value="FENDER_REPAIR">Fender & Bollard Damage Repair</option>
                <option value="DREDGING">Karnaphuli Channel Dredging</option>
                <option value="WEATHER_CLOSURE">Severe Sea State Closure</option>
                <option value="MANUAL">Manual Operational Closure</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 4: Scenario C - Crane Failure */}
      <div className="border border-slate-800 rounded-xl bg-slate-800/40 overflow-hidden">
        <button
          onClick={() => toggleSection("cranes")}
          className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Cpu className="h-3.5 w-3.5 text-rose-400" />
            Scenario C: Crane Equipment Failure
          </span>
          {openSections.cranes ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {openSections.cranes && (
          <div className="p-3 pt-0 space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Cranes Offline (STS / RTG)</span>
                <span className="font-semibold text-rose-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                  {parameters.crane_outage_count} / 5 offline
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={parameters.crane_outage_count}
                onChange={(e) => updateParam("crane_outage_count", parseInt(e.target.value, 10))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Repair Duration</span>
                <span className="font-semibold text-slate-200 tabular-nums">
                  {parameters.crane_repair_duration_hours ?? 24} hrs
                </span>
              </div>
              <input
                type="range"
                min="6"
                max="72"
                step="6"
                value={parameters.crane_repair_duration_hours ?? 24}
                onChange={(e) => updateParam("crane_repair_duration_hours", parseFloat(e.target.value))}
                className="w-full accent-rose-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Accordion 5: Scenario D - Severe Weather */}
      <div className="border border-slate-800 rounded-xl bg-slate-800/40 overflow-hidden">
        <button
          onClick={() => toggleSection("weather")}
          className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Wind className="h-3.5 w-3.5 text-sky-400" />
            Scenario D: Weather Disruption
          </span>
          {openSections.weather ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {openSections.weather && (
          <div className="p-3 pt-0 space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Weather Slowdown Factor</span>
                <span className="font-semibold text-sky-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                  {parameters.weather_disruption_factor.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.0"
                step="0.05"
                value={parameters.weather_disruption_factor}
                onChange={(e) => updateParam("weather_disruption_factor", parseFloat(e.target.value))}
                className="w-full accent-sky-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-400 block">Wind Speed (kts)</span>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={parameters.wind_speed_knots ?? 14}
                  onChange={(e) => updateParam("wind_speed_knots", parseFloat(e.target.value))}
                  className="w-full p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 tabular-nums"
                />
              </div>
              <div>
                <span className="text-slate-400 block">Wave Height (m)</span>
                <input
                  type="number"
                  min="0.2"
                  max="6.0"
                  step="0.1"
                  value={parameters.wave_height_meters ?? 1.2}
                  onChange={(e) => updateParam("wave_height_meters", parseFloat(e.target.value))}
                  className="w-full p-1.5 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 tabular-nums"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Accordion 6: Scenario E - Yard Congestion */}
      <div className="border border-slate-800 rounded-xl bg-slate-800/40 overflow-hidden">
        <button
          onClick={() => toggleSection("yard")}
          className="w-full p-3 flex items-center justify-between text-xs font-bold text-slate-200 hover:bg-slate-800/60 transition-colors"
        >
          <span className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-indigo-400" />
            Scenario E: Yard Congestion
          </span>
          {openSections.yard ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
        </button>

        {openSections.yard && (
          <div className="p-3 pt-0 space-y-3 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Initial Stack Occupancy</span>
                <span className="font-semibold text-indigo-300 bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700 tabular-nums">
                  {parameters.yard_initial_occupancy_pct ?? 65}%
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="95"
                step="5"
                value={parameters.yard_initial_occupancy_pct ?? 65}
                onChange={(e) => updateParam("yard_initial_occupancy_pct", parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-300">Gate Throughput Reduction</span>
                <span className="font-semibold text-slate-200 tabular-nums">
                  -{parameters.gate_throughput_reduction_pct ?? 0}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={parameters.gate_throughput_reduction_pct ?? 0}
                onChange={(e) => updateParam("gate_throughput_reduction_pct", parseFloat(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons Strip */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onResetToBaseline}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset All</span>
          </button>

          <button
            onClick={onOpenSaveModal}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all active:scale-95"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            <span>Save Scenario</span>
          </button>
        </div>

        <button
          onClick={onRunSimulation}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all active:scale-98 disabled:opacity-50"
        >
          <Play className={`h-4 w-4 fill-current ${isLoading ? "animate-spin" : ""}`} />
          <span>{isLoading ? "Running SimPy Runtime..." : "Preview & Run Simulation"}</span>
        </button>
      </div>
    </div>
  );
}
