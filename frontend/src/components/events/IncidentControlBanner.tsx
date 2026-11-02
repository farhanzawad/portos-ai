"use client";

import React, { useState } from "react";
import { useEventStream } from "@/context/EventStreamContext";
import {
  AlertTriangle,
  Play,
  RotateCcw,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";

export function IncidentControlBanner() {
  const {
    presets,
    activeIncident,
    injectIncidentAction,
    resetIncidentAction,
    isInjecting,
    isResetting,
  } = useEventStream();

  const [selectedPresetId, setSelectedPresetId] = useState<string>("monsoon_surge_delay");
  const [delayHours, setDelayHours] = useState<number>(6.5);
  const [notification, setNotification] = useState<string | null>(null);

  const activePreset = presets.find((p) => p.id === selectedPresetId) || presets[0];

  const handleInject = async () => {
    setNotification(null);
    const resp = await injectIncidentAction(selectedPresetId, delayHours);
    if (resp) {
      setNotification(`Incident injected: ${resp.summary}`);
    }
  };

  const handleReset = async () => {
    setNotification(null);
    const resp = await resetIncidentAction();
    if (resp) {
      setNotification("Baseline restored. Injected delays and disruptions cleared.");
    }
  };

  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden">
      {/* Banner Top Strip */}
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-amber-500/10 text-amber-700 shrink-0">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-portos-navy">
                Deterministic Incident Injection & Cross-Module Sync
              </h2>
              {activeIncident ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                  Incident Active: {activeIncident}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                  Clean Baseline State
                </span>
              )}
            </div>
            <p className="text-xs text-portos-muted mt-0.5">
              Inject synthetic disruptions to demonstrate synchronized propagation across Overview alerts, ML predictions, OR-Tools berth schedules, Decision Lab trade-offs, and Copilot explanations.
            </p>
          </div>
        </div>

        {/* Global Reset Button */}
        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <button
            onClick={handleReset}
            disabled={isResetting || isInjecting || !activeIncident}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-portos-navy hover:text-emerald-800 bg-white border border-portos-border hover:border-emerald-300 rounded transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            title="Roll back all injected disruptions and return to deterministic baseline"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin" : ""}`} />
            <span>{isResetting ? "Restoring..." : "Reset to Baseline"}</span>
          </button>
        </div>
      </div>

      {/* Preset Selector & Controls */}
      <div className="p-4 bg-white grid grid-cols-1 lg:grid-cols-3 gap-4 text-xs">
        {/* Left Column: Preset Select & Impact */}
        <div className="space-y-2 lg:col-span-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-portos-muted">
            Select Operational Disruption Preset:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {presets.map((p) => {
              const isSelected = p.id === selectedPresetId;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPresetId(p.id)}
                  className={`p-2.5 rounded-md border text-left transition-all shadow-2xs flex flex-col justify-between ${
                    isSelected
                      ? "border-portos-navy bg-portos-navy/5 ring-1 ring-portos-navy"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="font-semibold text-portos-navy text-[11px] flex items-center justify-between">
                    <span>{p.title.split(":")[0]}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                        p.severity === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.severity}
                    </span>
                  </div>
                  <div className="text-[10px] text-portos-muted mt-1 line-clamp-2">
                    {p.description}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Preset Description Card */}
          {activePreset && (
            <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] space-y-1">
              <div className="font-bold text-portos-navy flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>{activePreset.title}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">{activePreset.description}</p>
              <div className="pt-1 flex items-center gap-3 text-slate-500 font-mono text-[10px] flex-wrap">
                <span>Target: {activePreset.target_entity}</span>
                <span>•</span>
                <span>Impact: {activePreset.expected_impact}</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Execution Action Card */}
        <div className="p-3 rounded-md border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="font-bold text-portos-navy flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-portos-teal" />
              <span>Execution Parameters</span>
            </div>

            {selectedPresetId === "monsoon_surge_delay" && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-600">
                  <span>Injected Delay Duration:</span>
                  <span className="font-bold font-mono text-portos-navy">+{delayHours} hours</span>
                </div>
                <input
                  type="range"
                  min={2}
                  max={24}
                  step={0.5}
                  value={delayHours}
                  onChange={(e) => setDelayHours(parseFloat(e.target.value))}
                  className="w-full accent-portos-navy cursor-pointer"
                />
              </div>
            )}

            <div className="text-[10px] text-portos-muted leading-tight">
              Injecting will emit sequenced events across the SSE stream and trigger cross-module reactive synchronization.
            </div>
          </div>

          <button
            onClick={handleInject}
            disabled={isInjecting || isResetting}
            className="w-full py-2 px-3 bg-portos-navy text-white text-xs font-semibold rounded hover:bg-portos-navy/90 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className={`h-3.5 w-3.5 ${isInjecting ? "animate-spin" : ""}`} />
            <span>{isInjecting ? "Broadcasting..." : "Inject Incident"}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {notification && (
        <div className="px-4 py-2 bg-emerald-50 border-t border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}
