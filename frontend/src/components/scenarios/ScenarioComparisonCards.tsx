"use client";

import React from "react";
import { SimulationRunResponse, ScenarioComparisonResponse } from "@/types/api";
import { Clock, Layers, Cpu, Ship, Leaf, TrendingUp, TrendingDown, AlertCircle, Send } from "lucide-react";

interface ScenarioComparisonCardsProps {
  comparisonData: ScenarioComparisonResponse;
  onOpenProposeModal: () => void;
}

export function ScenarioComparisonCards({
  comparisonData,
  onOpenProposeModal,
}: ScenarioComparisonCardsProps) {
  const base = comparisonData.baseline_run;
  const alt = comparisonData.alternative_runs[0] || base;
  const deltas = comparisonData.comparisons[alt.scenario_code] || {};

  const waitDelta = deltas["mean_waiting_time_hours"];
  const totalWaitDelta = deltas["total_waiting_hours"];
  const berthDelta = deltas["berth_utilization_pct"];
  const servedDelta = deltas["vessels_served_count"];
  const co2Delta = deltas["estimated_secondary_co2_tonnes"];

  return (
    <div className="space-y-4">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Mean Queue Waiting Time */}
        <div className="bg-white border border-portos-border rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
            <span className="flex items-center gap-1 font-medium text-portos-navy">
              <Clock className="h-3.5 w-3.5 text-portos-teal" />
              Mean Queue Wait
            </span>
            {waitDelta && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  waitDelta.absolute_delta > 0
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {waitDelta.absolute_delta > 0 ? "+" : ""}
                {waitDelta.absolute_delta}h ({waitDelta.percentage_delta > 0 ? "+" : ""}
                {waitDelta.percentage_delta}%)
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {alt.metrics.mean_waiting_time_hours.toFixed(1)}h
            </span>
            <span className="text-xs text-portos-muted font-mono">
              (Base: {base.metrics.mean_waiting_time_hours.toFixed(1)}h)
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-portos-muted font-mono mt-1 pt-1 border-t border-slate-100">
            <span>Median: {alt.metrics.median_waiting_time_hours.toFixed(1)}h</span>
            <span>P90: {alt.metrics.p90_waiting_time_hours.toFixed(1)}h</span>
          </div>
        </div>

        {/* Total Vessel Waiting Hours */}
        <div className="bg-white border border-portos-border rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
            <span className="flex items-center gap-1 font-medium text-portos-navy">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Total Waiting Hours
            </span>
            {totalWaitDelta && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  totalWaitDelta.absolute_delta > 0
                    ? "bg-amber-100 text-amber-800"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {totalWaitDelta.absolute_delta > 0 ? "+" : ""}
                {totalWaitDelta.absolute_delta}h
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {alt.metrics.total_waiting_hours.toFixed(0)}h
            </span>
            <span className="text-xs text-portos-muted font-mono">
              (Base: {base.metrics.total_waiting_hours.toFixed(0)}h)
            </span>
          </div>
          <p className="text-[11px] text-portos-muted mt-1 pt-1 border-t border-slate-100">
            Cumulative Outer Anchorage delay
          </p>
        </div>

        {/* Quayside Berth Utilization */}
        <div className="bg-white border border-portos-border rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
            <span className="flex items-center gap-1 font-medium text-portos-navy">
              <Layers className="h-3.5 w-3.5 text-portos-navy-secondary" />
              Berth Utilization
            </span>
            {berthDelta && (
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded font-mono">
                {berthDelta.absolute_delta > 0 ? "+" : ""}
                {berthDelta.absolute_delta}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {alt.metrics.berth_utilization_pct}%
            </span>
            <span className="text-xs text-portos-muted font-mono">
              (Base: {base.metrics.berth_utilization_pct}%)
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-portos-muted font-mono mt-1 pt-1 border-t border-slate-100">
            <span>Crane Util: {alt.metrics.crane_utilization_pct}%</span>
          </div>
        </div>

        {/* Vessels Served & Queue Backlog */}
        <div className="bg-white border border-portos-border rounded-lg p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
            <span className="flex items-center gap-1 font-medium text-portos-navy">
              <Ship className="h-3.5 w-3.5 text-portos-teal" />
              Served / Backlog
            </span>
            {servedDelta && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                  servedDelta.absolute_delta < 0
                    ? "bg-rose-50 text-rose-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {servedDelta.absolute_delta > 0 ? "+" : ""}
                {servedDelta.absolute_delta} calls
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {alt.metrics.vessels_served_count} served
            </span>
            <span className="text-xs text-rose-700 font-mono font-medium">
              ({alt.metrics.vessels_remaining_queue} waiting)
            </span>
          </div>
          <p className="text-[11px] text-portos-muted mt-1 pt-1 border-t border-slate-100 font-mono">
            Horizon: {alt.duration_hours}h simulated
          </p>
        </div>

        {/* Secondary Environmental Impact: Auxiliary CO2 */}
        <div className="bg-white border border-portos-border rounded-lg p-3.5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-portos-muted mb-1">
              <span className="flex items-center gap-1 font-medium text-emerald-900">
                <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                Auxiliary CO₂
              </span>
              {co2Delta && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                    co2Delta.absolute_delta > 0
                      ? "bg-rose-50 text-rose-700"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {co2Delta.absolute_delta > 0 ? "+" : ""}
                  {co2Delta.absolute_delta}t
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-800">
                {alt.metrics.estimated_secondary_co2_tonnes.toFixed(1)}t
              </span>
              <span className="text-xs text-portos-muted font-mono">
                (Base: {base.metrics.estimated_secondary_co2_tonnes.toFixed(1)}t)
              </span>
            </div>
            <p className="text-[10px] text-portos-muted mt-1 leading-tight">
              0.18 t/h auxiliary engine idling (IMO GHG 4th Study)
            </p>
          </div>

          <div className="pt-2 border-t border-portos-border/60 mt-2">
            <button
              onClick={onOpenProposeModal}
              className="w-full flex items-center justify-center gap-1.5 bg-portos-teal text-white text-xs font-medium py-1.5 px-2 rounded hover:bg-teal-700 transition-colors shadow-xs"
            >
              <Send className="h-3 w-3" />
              <span>Propose Recovery Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trade-Off Summary Box */}
      <div className="bg-slate-50 border border-portos-border rounded-lg p-3.5 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-portos-navy">
          <AlertCircle className="h-4 w-4 text-portos-teal" />
          <span>Operational Trade-Off Analysis & Bottleneck Diagnostics</span>
        </div>
        <ul className="space-y-1.5 text-portos-navy pl-1">
          {comparisonData.trade_off_summary.map((statement, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed">
              <span className="text-portos-teal font-bold shrink-0">•</span>
              <span>{statement}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

