"use client";

import React from "react";
import { ScenarioParameters } from "@/types/api";
import { Sliders, RefreshCw, RotateCcw, CloudRain, Anchor, Cpu, Wind, ShieldAlert, Sparkles } from "lucide-react";

interface ScenarioConfigPanelProps {
  parameters: ScenarioParameters;
  presets: ScenarioParameters[];
  isLoading: boolean;
  onParametersChange: (newParams: ScenarioParameters) => void;
  onSelectPreset: (preset: ScenarioParameters) => void;
  onResetToBaseline: () => void;
  onRunSimulation: () => void;
}

export function ScenarioConfigPanel({
  parameters,
  presets,
  isLoading,
  onParametersChange,
  onSelectPreset,
  onResetToBaseline,
  onRunSimulation,
}: ScenarioConfigPanelProps) {
  const updateParam = <K extends keyof ScenarioParameters>(key: K, value: ScenarioParameters[K]) => {
    onParametersChange({
      ...parameters,
      [key]: value,
    });
  };

  return (
    <div className="bg-white border border-portos-border rounded-lg shadow-xs overflow-hidden">
      {/* Header bar */}
      <div className="p-3.5 border-b border-portos-border flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Sliders className="h-4 w-4 text-portos-teal" />
          <h2 className="text-sm font-bold text-portos-navy">
            Decision Lab: Disruption & Parameter Modeling
          </h2>
          <span className="text-xs text-portos-muted font-mono">
            SimPy Discrete-Event Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onResetToBaseline}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-portos-border rounded text-portos-muted hover:text-portos-navy hover:bg-slate-100 transition-colors"
            title="Reset parameters to standard baseline"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset to Baseline</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 text-xs">
        {/* Preset benchmark scenarios */}
        <div>
          <label className="block text-portos-navy font-semibold mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-portos-teal" />
            Benchmark Disruption Presets:
          </label>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => {
              const isSelected = parameters.scenario_code === preset.scenario_code;
              return (
                <button
                  key={preset.scenario_code}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all border ${
                    isSelected
                      ? "bg-portos-navy text-white border-portos-navy shadow-xs font-semibold"
                      : "bg-slate-50 text-portos-navy border-portos-border hover:border-portos-teal hover:bg-teal-50/50"
                  }`}
                >
                  {preset.scenario_name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-portos-border/70">
          {/* Feeder Arrival Multiplier */}
          <div className="bg-slate-50/60 border border-portos-border/70 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-portos-navy flex items-center gap-1.5">
                <Anchor className="h-3.5 w-3.5 text-portos-teal" />
                Vessel Arrival Surge
              </span>
              <span className="font-mono font-bold text-portos-teal bg-teal-50 px-1.5 py-0.5 rounded">
                {parameters.vessel_arrival_multiplier.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={parameters.vessel_arrival_multiplier}
              onChange={(e) => updateParam("vessel_arrival_multiplier", parseFloat(e.target.value))}
              className="w-full accent-portos-teal cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-portos-muted font-mono">
              <span>0.50x (-50%)</span>
              <span>1.00x Nominal</span>
              <span>2.00x (+100%)</span>
            </div>
          </div>

          {/* Berth Outage Count */}
          <div className="bg-slate-50/60 border border-portos-border/70 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-portos-navy flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                Berths Offline (Outage)
              </span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                parameters.berth_outage_count > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
              }`}>
                {parameters.berth_outage_count} / 6 offline
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={parameters.berth_outage_count}
              onChange={(e) => updateParam("berth_outage_count", parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-portos-muted font-mono">
              <span>0 (All 6 Active)</span>
              <span>1 Outage</span>
              <span>2 Outages</span>
              <span>3 Outages</span>
            </div>
          </div>

          {/* STS Crane Outage Count */}
          <div className="bg-slate-50/60 border border-portos-border/70 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-portos-navy flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-portos-navy-secondary" />
                STS Cranes Offline
              </span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                parameters.crane_outage_count > 0 ? "bg-rose-100 text-rose-800" : "bg-slate-100 text-slate-700"
              }`}>
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
              className="w-full accent-rose-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-portos-muted font-mono">
              <span>0 (All 5 Active)</span>
              <span>1 Offline</span>
              <span>2 Offline</span>
              <span>3 Offline</span>
            </div>
          </div>

          {/* Crane Handling Service Rate Multiplier */}
          <div className="bg-slate-50/60 border border-portos-border/70 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-portos-navy flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-portos-teal" />
                Crane Handling Productivity
              </span>
              <span className="font-mono font-bold text-portos-navy bg-slate-100 px-1.5 py-0.5 rounded">
                {(parameters.crane_service_rate_multiplier * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={parameters.crane_service_rate_multiplier}
              onChange={(e) => updateParam("crane_service_rate_multiplier", parseFloat(e.target.value))}
              className="w-full accent-portos-navy cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-portos-muted font-mono">
              <span>50% (Degraded)</span>
              <span>100% (28 moves/h)</span>
              <span>150% (High Speed)</span>
            </div>
          </div>

          {/* Weather Disruption Factor */}
          <div className="bg-slate-50/60 border border-portos-border/70 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-portos-navy flex items-center gap-1.5">
                <CloudRain className="h-3.5 w-3.5 text-sky-600" />
                Monsoon Sea-State Factor
              </span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded ${
                parameters.weather_disruption_factor > 1.0 ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-700"
              }`}>
                {parameters.weather_disruption_factor.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="1.8"
              step="0.05"
              value={parameters.weather_disruption_factor}
              onChange={(e) => updateParam("weather_disruption_factor", parseFloat(e.target.value))}
              className="w-full accent-sky-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-portos-muted font-mono">
              <span>1.00x (Calm)</span>
              <span>1.35x (Squall)</span>
              <span>1.80x (Severe Gale)</span>
            </div>
          </div>

          {/* Random Seed & Horizon Controls */}
          <div className="bg-slate-50/60 border border-portos-border/70 rounded-lg p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-portos-navy">Repeatable Seed:</span>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={parameters.random_seed}
                  onChange={(e) => updateParam("random_seed", parseInt(e.target.value, 10) || 42)}
                  className="w-16 px-1.5 py-0.5 border border-portos-border rounded font-mono text-xs text-right"
                />
                <button
                  onClick={() => updateParam("random_seed", Math.floor(Math.random() * 9000) + 1000)}
                  className="px-2 py-0.5 bg-slate-200 hover:bg-slate-300 rounded text-[10px] font-mono transition-colors"
                  title="Generate new pseudo-random seed"
                >
                  Roll
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 pt-2 border-t border-portos-border/50">
              <span className="text-[11px] text-portos-muted">Simulation Horizon:</span>
              <div className="flex items-center gap-1">
                {[24, 48, 72].map((h) => (
                  <button
                    key={h}
                    onClick={() => updateParam("duration_hours", h)}
                    className={`px-2 py-0.5 text-[11px] rounded font-mono transition-colors ${
                      parameters.duration_hours === h
                        ? "bg-portos-navy text-white font-bold"
                        : "bg-slate-100 text-portos-muted hover:text-portos-navy"
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-portos-muted font-mono">
            Scenario: <span className="font-semibold text-portos-navy">{parameters.scenario_name}</span> ({parameters.duration_hours}h horizon, seed {parameters.random_seed})
          </p>

          <button
            onClick={onRunSimulation}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-md bg-portos-teal text-white text-xs font-semibold hover:bg-teal-700 transition-colors shadow-xs disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "Running SimPy Simulation..." : "Run Simulation Scenario"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

