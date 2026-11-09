"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getScenarioEmissionsComparison } from "@/lib/api-client";
import { ScenarioEmissionsComparison } from "@/types/api";
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  GitCompare,
  RotateCw,
} from "lucide-react";

interface ScenarioEmissionsComparePanelProps {
  initialComparison?: ScenarioEmissionsComparison;
}

const AVAILABLE_SCENARIOS = [
  { code: "monsoon_weather_squall", label: "Monsoon Weather Squall & Rough Sea" },
  { code: "berth_cct2_closure", label: "Berth CCT-2 Quay Maintenance Outage" },
  { code: "feeder_arrival_surge", label: "Feeder Vessel Arrival Surge (+50% Inflow)" },
  { code: "crane_sts02_outage", label: "Crane STS-02 Mechanical Breakdown" },
];

export function ScenarioEmissionsComparePanel({
  initialComparison,
}: ScenarioEmissionsComparePanelProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>(
    initialComparison?.comparison_scenario_code || "monsoon_weather_squall"
  );

  const { data: comparison, isFetching, refetch } = useQuery({
    queryKey: ["scenario-emissions-compare", selectedScenario],
    queryFn: () => getScenarioEmissionsComparison(selectedScenario),
    initialData:
      initialComparison?.comparison_scenario_code === selectedScenario
        ? initialComparison
        : undefined,
  });

  const comp = comparison || initialComparison;

  if (!comp) {
    return null;
  }

  const isIncrease = comp.delta_co2e_kg > 0;
  const isNeutral = comp.delta_co2e_kg === 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Header with Selector */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-sky-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Baseline vs. Disruption Scenario Emissions Variance
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Evaluate secondary carbon impact caused by queuing delays and equipment operational shifts.
          </p>
        </div>

        {/* Scenario Dropdown */}
        <div className="flex items-center gap-2">
          <label htmlFor="scenario-select" className="text-xs text-slate-500 font-medium shrink-0">
            Compare Against:
          </label>
          <select
            id="scenario-select"
            value={selectedScenario}
            onChange={(e) => setSelectedScenario(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-full px-3 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs"
          >
            {AVAILABLE_SCENARIOS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-full border border-slate-200 bg-white transition-colors shadow-2xs"
            title="Refresh comparison"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Audit & Integrity Verification Pill Strip */}
      <div className="px-4 py-2.5 bg-sky-50/50 border-b border-sky-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {comp.comparison_integrity_verified ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Scope Equality Verified
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-100/70 px-2.5 py-0.5 rounded-full border border-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              Scope Mismatch Warning
            </span>
          )}
          <span className="text-slate-600 font-medium text-[11px]">
            {comp.factor_count} identical emission factors applied ({comp.factor_set_id})
          </span>
        </div>
        <span className="text-[11px] text-slate-500 font-semibold tabular-nums">
          Horizon: {comp.duration_hours}h
        </span>
      </div>

      {/* High-Level Comparison Summary Cards */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 border-b border-slate-200 bg-white">
        {/* Baseline Total */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
            Baseline Normal
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {comp.baseline_total_co2e_mt.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-600">MT CO2e</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums block mt-0.5">
            {comp.baseline_total_co2e_kg.toLocaleString()} kg
          </span>
        </div>

        {/* Scenario Total */}
        <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-200/80">
          <span className="text-[10px] uppercase font-semibold text-slate-500 block">
            {comp.comparison_scenario_name}
          </span>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl font-bold text-slate-900 tabular-nums">
              {comp.comparison_total_co2e_mt.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-600">MT CO2e</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums block mt-0.5">
            {comp.comparison_total_co2e_kg.toLocaleString()} kg
          </span>
        </div>

        {/* Net Delta */}
        <div
          className={`p-3.5 rounded-2xl border flex flex-col justify-between ${
            isIncrease
              ? "bg-amber-50/50 border-amber-200"
              : isNeutral
              ? "bg-slate-50 border-slate-200"
              : "bg-emerald-50/50 border-emerald-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold text-slate-600">
              Estimated Delta
            </span>
            {isIncrease ? (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700">
                <TrendingUp className="h-3.5 w-3.5" />
                +{comp.delta_co2e_pct.toFixed(1)}%
              </span>
            ) : isNeutral ? (
              <span className="text-xs font-bold text-slate-600">0.0%</span>
            ) : (
              <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700">
                <TrendingDown className="h-3.5 w-3.5" />
                {comp.delta_co2e_pct.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span
              className={`text-xl font-bold tabular-nums ${
                isIncrease
                  ? "text-amber-800"
                  : isNeutral
                  ? "text-slate-900"
                  : "text-emerald-800"
              }`}
            >
              {isIncrease ? "+" : ""}
              {comp.delta_co2e_mt.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-600">MT CO2e</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums block mt-0.5">
            {isIncrease ? "+" : ""}
            {comp.delta_co2e_kg.toLocaleString()} kg net variance
          </span>
        </div>
      </div>

      {/* Activity Breakdown Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <th className="py-2.5 px-4 font-bold text-slate-900">Activity Category</th>
              <th className="py-2.5 px-3 text-right">Baseline Qty</th>
              <th className="py-2.5 px-3 text-right">Scenario Qty</th>
              <th className="py-2.5 px-3 text-right">Delta Activity</th>
              <th className="py-2.5 px-3 text-left">Formula & Applied Factor</th>
              <th className="py-2.5 px-4 text-right">Delta CO2e</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 tabular-nums">
            {comp.activity_deltas.map((act) => {
              const deltaQty = act.comparison_quantity - act.baseline_quantity;
              const deltaMt = act.delta_kg / 1000;
              const actIncrease = act.delta_kg > 0;
              const actNeutral = act.delta_kg === 0;

              return (
                <tr key={act.activity_name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    {act.activity_name}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-600 font-medium">
                    {act.baseline_quantity.toLocaleString()} {act.quantity_unit}
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">
                    {act.comparison_quantity.toLocaleString()} {act.quantity_unit}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium">
                    <span
                      className={
                        actIncrease
                          ? "text-amber-700 font-semibold"
                          : actNeutral
                          ? "text-slate-500"
                          : "text-emerald-700 font-semibold"
                      }
                    >
                      {actIncrease ? "+" : ""}
                      {deltaQty.toFixed(1)} {act.quantity_unit}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-left text-[11px] text-slate-600 font-medium">
                    {act.formula_expression}
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <span
                      className={`font-bold ${
                        actIncrease
                          ? "text-amber-800"
                          : actNeutral
                          ? "text-slate-600"
                          : "text-emerald-800"
                      }`}
                    >
                      {actIncrease ? "+" : ""}
                      {deltaMt.toFixed(3)} MT
                    </span>
                    <span className="text-[10px] text-slate-500 block font-normal">
                      ({actIncrease ? "+" : ""}
                      {act.delta_kg.toLocaleString()} kg)
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Disclaimer and Methodology Footer */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <span className="leading-relaxed font-medium">
          <strong className="text-slate-700">Calculation Method:</strong> {comp.calculation_method}. {comp.disclaimer}
        </span>
      </div>
    </div>
  );
}
