"use client";

import React, { useState } from "react";
import {
  SimulationRunResponse,
  ScenarioAnalystResponse,
  ScenarioParameters,
} from "@/types/api";
import {
  Bot,
  RefreshCw,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

interface ScenarioAnalystDrawerProps {
  baselineRun: SimulationRunResponse;
  scenarioRun: SimulationRunResponse;
  analystData: ScenarioAnalystResponse | null;
  isLoading: boolean;
  onRefreshAnalyst: () => void;
  onOpenProposeModal: () => void;
}

export function ScenarioAnalystDrawer({
  baselineRun,
  scenarioRun,
  analystData,
  isLoading,
  onRefreshAnalyst,
  onOpenProposeModal,
}: ScenarioAnalystDrawerProps) {
  const [activeTab, setActiveTab] = useState<"SUMMARY" | "COMMENTS">("SUMMARY");

  const baseM = baselineRun.metrics;
  const scenM = scenarioRun.metrics;
  const scenP = scenarioRun.parameters;

  const waitDiff = scenM.mean_waiting_time_hours - baseM.mean_waiting_time_hours;
  const turnaroundDiff = scenM.average_turnaround_hours - baseM.average_turnaround_hours;
  const utilDiff = scenM.berth_utilization_pct - baseM.berth_utilization_pct;
  const co2Diff = (scenM.total_co2e_tonnes || scenM.estimated_secondary_co2_tonnes) - (baseM.total_co2e_tonnes || baseM.estimated_secondary_co2_tonnes);

  return (
    <div className="flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-sm text-slate-100 space-y-4 max-h-[820px] overflow-y-auto font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>Output Summary</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-950 text-sky-300 border border-sky-800/40">
                AI Analyst
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Ground-truth decision synthesis
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshAnalyst}
          disabled={isLoading}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sky-400 text-xs transition-colors"
          title="Re-analyze scenario outcome"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabs: Changes | Comments */}
      <div className="flex p-1 bg-slate-800/90 rounded-xl border border-slate-700 text-xs">
        <button
          onClick={() => setActiveTab("SUMMARY")}
          className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all ${
            activeTab === "SUMMARY"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Changes & Impact
        </button>
        <button
          onClick={() => setActiveTab("COMMENTS")}
          className={`flex-1 py-1.5 rounded-lg text-center font-bold transition-all ${
            activeTab === "COMMENTS"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Comments & Strategy
        </button>
      </div>

      {/* Changes Applied Section */}
      {activeTab === "SUMMARY" ? (
        <div className="space-y-4 text-xs">
          {/* Key Modified Levers */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Changes Applied
            </h4>
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-3 space-y-2 text-[11px]">
              <div className="flex items-center justify-between text-slate-200">
                <span className="text-slate-400">Target Reliability:</span>
                <span className="font-semibold text-sky-300 tabular-nums">
                  {baseM.reliability_compliance_pct}% → {scenM.reliability_compliance_pct}%
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span className="text-slate-400">Arrival Surge Multiplier:</span>
                <span className="font-semibold text-amber-300 tabular-nums">
                  1.00x → {scenP.vessel_arrival_multiplier.toFixed(2)}x (+{scenP.arrival_surge_pct || 0}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span className="text-slate-400">Berth Outages:</span>
                <span className="font-semibold text-rose-300 tabular-nums">
                  {scenP.berth_outage_count} offline ({scenP.berth_closure_reason || "Nominal"})
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span className="text-slate-400">Crane Equipment Outages:</span>
                <span className="font-semibold text-rose-300 tabular-nums">
                  {scenP.crane_outage_count} offline ({scenP.crane_repair_duration_hours || 24}h repair)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-200">
                <span className="text-slate-400">Weather Slowdown:</span>
                <span className="font-semibold text-sky-300 tabular-nums">
                  {scenP.weather_disruption_factor.toFixed(2)}x ({scenP.wind_speed_knots || 14} kts)
                </span>
              </div>
            </div>
          </div>

          {/* Automated Bottleneck Diagnosis */}
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase text-slate-400 font-semibold">
                Automated Bottleneck Diagnosis
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  scenM.primary_bottleneck === "NONE"
                    ? "bg-slate-800 text-sky-300 border border-slate-700"
                    : "bg-amber-950/80 text-amber-300 border border-amber-800/40"
                }`}
              >
                {scenM.primary_bottleneck} ({scenM.bottleneck_severity})
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {analystData?.bottleneck_diagnosis ||
                `Operations bottleneck detected at ${scenM.primary_bottleneck}.`}
            </p>
          </div>

          {/* Optimal Path Recommendation */}
          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-sky-500/40 space-y-1.5 shadow-sm">
            <div className="flex items-center gap-1.5 text-sky-300 font-bold text-xs">
              <Sparkles className="h-3.5 w-3.5 text-sky-400" />
              <span>Optimal Path Recommendation</span>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed font-medium">
              {analystData?.optimal_path_recommendation ||
                "Adjust berth assignments and deploy secondary gantry gangs to accelerate quay turnover."}
            </p>
          </div>

          {/* Cascading Benefits */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-sky-400" />
              <span>Cascading Benefits</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-300 bg-slate-800/60 p-3 rounded-xl border border-slate-700/70">
              {(analystData?.cascading_benefits || [
                `Federated schedule adjustment resolves ${scenM.reliability_compliance_pct}% of anchorage queue bottlenecks.`,
                `Throughput maintained at ${scenM.total_teus_handled.toLocaleString()} TEUs over the 72-hour window.`,
                `Net emissions footprint accurately quantified: ${scenM.total_co2e_tonnes || scenM.estimated_secondary_co2_tonnes}t CO2e.`,
              ]).map((benefit, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-sky-400 shrink-0 mt-0.5">•</span>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Trade-offs Identified */}
          <div className="space-y-1.5">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
              <span>Trade-offs Identified</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-amber-200/90 bg-amber-950/30 p-3 rounded-xl border border-amber-800/40">
              {(analystData?.identified_trade_offs || [
                "Overtime crane labor required to compensate for equipment downtime.",
                "Peak yard stack density reduces flexible surge buffer for feeder barges.",
              ]).map((tradeoff, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <span className="text-amber-400 shrink-0 mt-0.5">•</span>
                  <span>{tradeoff}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        /* Comments & Strategic Actions Tab */
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-2">
            <h4 className="text-xs font-bold text-white">
              Executive Evaluation Briefing
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {analystData?.executive_summary ||
                "Discrete-event simulation completed with verified mathematical constraints."}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Suggested Action Items for Operations
            </h4>
            <div className="space-y-2">
              {(analystData?.suggested_action_items || [
                "Present advisory schedule recommendation to Harbour Master for pilotage coordination.",
                "Issue notice to feeder shipping agents regarding adjusted tidal berthing windows.",
                "Alert yard superintendent to pre-position empty container stacks for rapid turnarounds.",
              ]).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] text-slate-200"
                >
                  <span className="flex items-center justify-center h-4 w-4 rounded-full bg-sky-500/20 text-sky-400 font-bold shrink-0 text-[10px]">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Model Provenance & Status */}
          <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 text-[10px] space-y-1 text-slate-400">
            <div className="flex justify-between">
              <span>Model Runtime:</span>
              <span className="text-sky-300 font-medium">{analystData?.model_name || "portos-offline-analyst"}</span>
            </div>
            <div className="flex justify-between">
              <span>Execution Mode:</span>
              <span className="text-sky-300 font-medium">
                {analystData?.is_demo_mode ? "Offline Grounded Demo" : "Live Gemini 2.5 Flash"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Analytical Role:</span>
              <span className="text-indigo-300 font-medium">Advisory Synthesis (No Direct Control)</span>
            </div>
          </div>
        </div>
      )}

      {/* Advisory Proposal Action Button */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <button
          onClick={onOpenProposeModal}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md transition-all active:scale-98"
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>Propose for Harbour Master Authorization</span>
        </button>

        <p className="text-[10px] text-center text-slate-400">
          Advisory proposal. Requires qualified human sign-off.
        </p>
      </div>
    </div>
  );
}
