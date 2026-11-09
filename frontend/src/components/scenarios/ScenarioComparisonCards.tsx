"use client";

import React from "react";
import { SimulationRunResponse, ScenarioComparisonResponse } from "@/types/api";
import { Clock, Layers, Ship, Leaf, Send, AlertCircle } from "lucide-react";

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
    <div className="space-y-4 font-sans">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Mean Queue Waiting Time */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-900">
              <Clock className="h-3.5 w-3.5 text-sky-600" />
              Mean Queue Wait
            </span>
            {waitDelta && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                  waitDelta.absolute_delta > 0
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-sky-50 text-sky-700 border border-sky-200"
                }`}
              >
                {waitDelta.absolute_delta > 0 ? "+" : ""}
                {waitDelta.absolute_delta}h ({waitDelta.percentage_delta > 0 ? "+" : ""}
                {waitDelta.percentage_delta}%)
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {alt.metrics.mean_waiting_time_hours.toFixed(1)}h
            </span>
            <span className="text-xs text-slate-500 tabular-nums font-medium">
              (Base: {base.metrics.mean_waiting_time_hours.toFixed(1)}h)
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100 font-medium">
            <span>Median: {alt.metrics.median_waiting_time_hours.toFixed(1)}h</span>
            <span>P90: {alt.metrics.p90_waiting_time_hours.toFixed(1)}h</span>
          </div>
        </div>

        {/* Total Vessel Waiting Hours */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-900">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              Total Waiting Hours
            </span>
            {totalWaitDelta && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                  totalWaitDelta.absolute_delta > 0
                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                    : "bg-sky-50 text-sky-700 border border-sky-200"
                }`}
              >
                {totalWaitDelta.absolute_delta > 0 ? "+" : ""}
                {totalWaitDelta.absolute_delta}h
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {alt.metrics.total_waiting_hours.toFixed(0)}h
            </span>
            <span className="text-xs text-slate-500 tabular-nums font-medium">
              (Base: {base.metrics.total_waiting_hours.toFixed(0)}h)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100 font-medium">
            Cumulative Outer Anchorage delay
          </p>
        </div>

        {/* Quayside Berth Utilization */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-900">
              <Layers className="h-3.5 w-3.5 text-slate-700" />
              Berth Utilization
            </span>
            {berthDelta && (
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-1.5 py-0.5 rounded border border-slate-200 tabular-nums">
                {berthDelta.absolute_delta > 0 ? "+" : ""}
                {berthDelta.absolute_delta}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {alt.metrics.berth_utilization_pct}%
            </span>
            <span className="text-xs text-slate-500 tabular-nums font-medium">
              (Base: {base.metrics.berth_utilization_pct}%)
            </span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100 font-medium">
            <span>Crane Util: {alt.metrics.crane_utilization_pct}%</span>
          </div>
        </div>

        {/* Vessels Served & Queue Backlog */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="flex items-center gap-1 font-semibold text-slate-900">
              <Ship className="h-3.5 w-3.5 text-sky-600" />
              Served / Backlog
            </span>
            {servedDelta && (
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                  servedDelta.absolute_delta < 0
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-sky-50 text-sky-700 border border-sky-200"
                }`}
              >
                {servedDelta.absolute_delta > 0 ? "+" : ""}
                {servedDelta.absolute_delta} calls
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {alt.metrics.vessels_served_count} served
            </span>
            <span className="text-xs text-rose-700 font-semibold tabular-nums">
              ({alt.metrics.vessels_remaining_queue} waiting)
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2 pt-1.5 border-t border-slate-100 font-medium">
            Horizon: {alt.duration_hours}h simulated
          </p>
        </div>

        {/* Secondary Environmental Impact: Auxiliary CO2 */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span className="flex items-center gap-1 font-semibold text-slate-900">
                <Leaf className="h-3.5 w-3.5 text-sky-600" />
                Auxiliary CO₂
              </span>
              {co2Delta && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums ${
                    co2Delta.absolute_delta > 0
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-sky-50 text-sky-700 border border-sky-200"
                  }`}
                >
                  {co2Delta.absolute_delta > 0 ? "+" : ""}
                  {co2Delta.absolute_delta}t
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {alt.metrics.estimated_secondary_co2_tonnes.toFixed(1)}t
              </span>
              <span className="text-xs text-slate-500 tabular-nums font-medium">
                (Base: {base.metrics.estimated_secondary_co2_tonnes.toFixed(1)}t)
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">
              0.18 t/h auxiliary engine idling (IMO GHG 4th Study)
            </p>
          </div>

          <div className="pt-2 border-t border-slate-100 mt-2">
            <button
              onClick={onOpenProposeModal}
              className="w-full flex items-center justify-center gap-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors shadow-xs"
            >
              <Send className="h-3 w-3" />
              <span>Propose Recovery Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Trade-Off Summary Box */}
      <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 text-xs space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-slate-900">
          <AlertCircle className="h-4 w-4 text-sky-600" />
          <span>Operational Trade-Off Analysis & Bottleneck Diagnostics</span>
        </div>
        <ul className="space-y-1.5 text-slate-700 pl-1">
          {comparisonData.trade_off_summary.map((statement, idx) => (
            <li key={idx} className="flex items-start gap-2 text-[11px] leading-relaxed font-medium">
              <span className="text-sky-600 font-bold shrink-0">•</span>
              <span>{statement}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
