"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ScenarioComparisonResponse, SimulationRunResponse } from "@/types/api";
import {
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Download,
  Zap,
  CheckCircle2,
  Workflow,
  Box,
} from "lucide-react";
import { OperationalSyncLoopModal } from "@/components/layout/OperationalSyncLoopModal";

interface ScenarioComparisonTableProps {
  comparisonData: ScenarioComparisonResponse;
  onOpenProposeModal: () => void;
}

export function ScenarioComparisonTable({
  comparisonData,
  onOpenProposeModal,
}: ScenarioComparisonTableProps) {
  const [isLoopModalOpen, setIsLoopModalOpen] = useState(false);
  const base = comparisonData.baseline_run;
  const alts = comparisonData.alternative_runs;
  const baseM = base.metrics;

  const handleExportCsv = () => {
    const headers = [
      "Metric",
      `Baseline (${base.scenario_name})`,
      ...alts.map((a) => a.scenario_name),
    ];

    const rows = [
      [
        "Reliability Compliance (%)",
        baseM.reliability_compliance_pct,
        ...alts.map((a) => a.metrics.reliability_compliance_pct),
      ],
      [
        "Mean Waiting Time (h)",
        baseM.mean_waiting_time_hours,
        ...alts.map((a) => a.metrics.mean_waiting_time_hours),
      ],
      [
        "Avg Turnaround Time (h)",
        baseM.average_turnaround_hours,
        ...alts.map((a) => a.metrics.average_turnaround_hours),
      ],
      [
        "Berth Utilization (%)",
        baseM.berth_utilization_pct,
        ...alts.map((a) => a.metrics.berth_utilization_pct),
      ],
      [
        "Crane Utilization (%)",
        baseM.crane_utilization_pct,
        ...alts.map((a) => a.metrics.crane_utilization_pct),
      ],
      [
        "Peak Yard Occupancy (%)",
        baseM.peak_yard_occupancy_pct,
        ...alts.map((a) => a.metrics.peak_yard_occupancy_pct),
      ],
      [
        "Total TEUs Handled",
        baseM.total_teus_handled,
        ...alts.map((a) => a.metrics.total_teus_handled),
      ],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `portos_scenario_comparison_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderDelta = (
    baseVal: number,
    altVal: number,
    lowerIsBetter = false,
    unit = ""
  ) => {
    const diff = altVal - baseVal;
    if (Math.abs(diff) < 0.01) {
      return (
        <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400">
          <Minus className="h-3 w-3" />
          <span>0.0{unit}</span>
        </span>
      );
    }

    const isPositiveOutcome = lowerIsBetter ? diff < 0 : diff > 0;
    const sign = diff > 0 ? "+" : "";

    return (
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold tabular-nums ${
          isPositiveOutcome
            ? "bg-sky-500/20 text-sky-300 border border-sky-500/30"
            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
        }`}
      >
        {diff > 0 ? (
          <ArrowUpRight className="h-3 w-3" />
        ) : (
          <ArrowDownRight className="h-3 w-3" />
        )}
        <span>
          {sign}
          {diff.toFixed(1)}
          {unit}
        </span>
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 shadow-sm text-slate-100 space-y-4 font-sans">
      {/* Table Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="h-4 w-4 text-sky-400" />
            <span>Scenario Comparison Matrix</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Deterministic comparative evaluation against standard baseline
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Operational Loop Architecture Diagram button */}
          <button
            onClick={() => setIsLoopModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
            title="View PORTOS AI closed operational sync loop"
          >
            <Workflow className="h-3.5 w-3.5 text-sky-400" />
            <span>Operational Loop</span>
          </button>

          {/* Direct link to Digital Twin Playback */}
          <Link
            href="/digital-twin?mode=playback"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900 border border-indigo-700/50 text-indigo-300 text-xs font-semibold transition-all"
            title="Inspect SimPy simulation timeline frames in 3D Digital Twin"
          >
            <Box className="h-3.5 w-3.5 text-indigo-400" />
            <span>Digital Twin Playback</span>
          </Link>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenProposeModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Zap className="h-3.5 w-3.5 fill-current" />
            <span>Propose Scenario</span>
          </button>
        </div>
      </div>

      <OperationalSyncLoopModal
        isOpen={isLoopModalOpen}
        onClose={() => setIsLoopModalOpen(false)}
        activeStep="Scenario Comparison"
      />

      {/* Comparison Matrix */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-800/60">
              <th className="py-2.5 px-3 font-semibold rounded-l-lg">KPI / Metric</th>
              <th className="py-2.5 px-3 font-semibold">
                {base.scenario_name} (Baseline)
              </th>
              {alts.map((alt) => (
                <th key={alt.run_id} className="py-2.5 px-3 font-semibold text-sky-200">
                  {alt.scenario_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-[11px]">
            {/* Reliability */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Reliability Compliance (%)
              </td>
              <td className="py-3 px-3 text-sky-300 font-bold tabular-nums">
                {baseM.reliability_compliance_pct}%
              </td>
              {alts.map((alt) => (
                <td key={alt.run_id} className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tabular-nums">
                      {alt.metrics.reliability_compliance_pct}%
                    </span>
                    {renderDelta(baseM.reliability_compliance_pct, alt.metrics.reliability_compliance_pct, false, "%")}
                  </div>
                </td>
              ))}
            </tr>

            {/* Mean Waiting Time */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Mean Waiting Time (Hours)
              </td>
              <td className="py-3 px-3 text-sky-300 font-bold tabular-nums">
                {baseM.mean_waiting_time_hours} hrs
              </td>
              {alts.map((alt) => (
                <td key={alt.run_id} className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tabular-nums">
                      {alt.metrics.mean_waiting_time_hours} hrs
                    </span>
                    {renderDelta(baseM.mean_waiting_time_hours, alt.metrics.mean_waiting_time_hours, true, "h")}
                  </div>
                </td>
              ))}
            </tr>

            {/* Turnaround Time */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Average Turnaround Time (Hours)
              </td>
              <td className="py-3 px-3 text-sky-300 font-bold tabular-nums">
                {baseM.average_turnaround_hours} hrs
              </td>
              {alts.map((alt) => (
                <td key={alt.run_id} className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tabular-nums">
                      {alt.metrics.average_turnaround_hours} hrs
                    </span>
                    {renderDelta(baseM.average_turnaround_hours, alt.metrics.average_turnaround_hours, true, "h")}
                  </div>
                </td>
              ))}
            </tr>

            {/* Berth Utilization */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Berth Utilization (%)
              </td>
              <td className="py-3 px-3 text-sky-300 font-bold tabular-nums">
                {baseM.berth_utilization_pct}%
              </td>
              {alts.map((alt) => (
                <td key={alt.run_id} className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tabular-nums">
                      {alt.metrics.berth_utilization_pct}%
                    </span>
                    {renderDelta(baseM.berth_utilization_pct, alt.metrics.berth_utilization_pct, false, "%")}
                  </div>
                </td>
              ))}
            </tr>

            {/* Crane Utilization */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Crane Utilization (%)
              </td>
              <td className="py-3 px-3 text-sky-300 font-bold tabular-nums">
                {baseM.crane_utilization_pct}%
              </td>
              {alts.map((alt) => (
                <td key={alt.run_id} className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tabular-nums">
                      {alt.metrics.crane_utilization_pct}%
                    </span>
                    {renderDelta(baseM.crane_utilization_pct, alt.metrics.crane_utilization_pct, false, "%")}
                  </div>
                </td>
              ))}
            </tr>

            {/* Peak Yard Occupancy */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Peak Yard Stack (%)
              </td>
              <td className="py-3 px-3 text-sky-300 font-bold tabular-nums">
                {baseM.peak_yard_occupancy_pct}%
              </td>
              {alts.map((alt) => (
                <td key={alt.run_id} className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tabular-nums">
                      {alt.metrics.peak_yard_occupancy_pct}%
                    </span>
                    {renderDelta(baseM.peak_yard_occupancy_pct, alt.metrics.peak_yard_occupancy_pct, true, "%")}
                  </div>
                </td>
              ))}
            </tr>

            {/* Total Throughput */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Total Container Throughput (TEUs)
              </td>
              <td className="py-3 px-3 text-sky-300 font-bold tabular-nums">
                {baseM.total_teus_handled.toLocaleString()} TEUs
              </td>
              {alts.map((alt) => (
                <td key={alt.run_id} className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white tabular-nums">
                      {alt.metrics.total_teus_handled.toLocaleString()} TEUs
                    </span>
                    {renderDelta(baseM.total_teus_handled, alt.metrics.total_teus_handled, false, "")}
                  </div>
                </td>
              ))}
            </tr>

            {/* Auxiliary CO2e */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Auxiliary CO2e Emissions (Tonnes)
              </td>
              <td className="py-3 px-3 text-sky-300 font-bold tabular-nums">
                {baseM.total_co2e_tonnes || baseM.estimated_secondary_co2_tonnes} t
              </td>
              {alts.map((alt) => {
                const altCo2 = alt.metrics.total_co2e_tonnes || alt.metrics.estimated_secondary_co2_tonnes;
                const baseCo2 = baseM.total_co2e_tonnes || baseM.estimated_secondary_co2_tonnes;
                return (
                  <td key={alt.run_id} className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white tabular-nums">
                        {altCo2} t
                      </span>
                      {renderDelta(baseCo2, altCo2, true, "t")}
                    </div>
                  </td>
                );
              })}
            </tr>

            {/* Primary Bottleneck */}
            <tr className="hover:bg-slate-800/40 transition-colors">
              <td className="py-3 px-3 font-semibold text-slate-300">
                Primary Identified Bottleneck
              </td>
              <td className="py-3 px-3">
                <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-800 text-sky-300 border border-slate-700">
                  {baseM.primary_bottleneck}
                </span>
              </td>
              {alts.map((alt) => (
                <td key={alt.run_id} className="py-3 px-3">
                  <span
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                      alt.metrics.primary_bottleneck === "NONE"
                        ? "bg-slate-800 text-sky-300 border-slate-700"
                        : "bg-amber-950/80 text-amber-300 border-amber-800/40"
                    }`}
                  >
                    {alt.metrics.primary_bottleneck} ({alt.metrics.bottleneck_severity})
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Structured Trade-Off Bullet Statements */}
      <div className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/80 space-y-2">
        <h4 className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-sky-400" />
          <span>Operational Trade-Off Synthesis</span>
        </h4>
        <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
          {comparisonData.trade_off_summary.map((stmt, idx) => (
            <li key={idx} className="leading-relaxed">
              {stmt}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
