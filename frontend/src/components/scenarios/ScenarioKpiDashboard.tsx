"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { SimulationRunResponse } from "@/types/api";
import {
  TrendingUp,
  Clock,
  Gauge,
  Leaf,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Zap,
} from "lucide-react";

interface ScenarioKpiDashboardProps {
  baselineRun: SimulationRunResponse;
  activeRun: SimulationRunResponse;
}

export function ScenarioKpiDashboard({
  baselineRun,
  activeRun,
}: ScenarioKpiDashboardProps) {
  const baseM = baselineRun.metrics;
  const actM = activeRun.metrics;

  const waitDiff = actM.mean_waiting_time_hours - baseM.mean_waiting_time_hours;
  const turnaroundDiff = actM.average_turnaround_hours - baseM.average_turnaround_hours;
  const utilDiff = actM.berth_utilization_pct - baseM.berth_utilization_pct;
  const co2Diff = (actM.total_co2e_tonnes || actM.estimated_secondary_co2_tonnes) - (baseM.total_co2e_tonnes || baseM.estimated_secondary_co2_tonnes);

  // EChart Option 1: Queue Dynamics Comparison (Anchorage Queue vs Berth Occupancy)
  const queueOption = useMemo(() => {
    const hours = baselineRun.queue_length_series.map((s) => `${s.hour}h`);
    const baseQueue = baselineRun.queue_length_series.map((s) => s.value);
    const actQueue = activeRun.queue_length_series.map((s) => s.value);
    const actBerths = activeRun.berth_occupancy_series.map((s) => s.value);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#0F172A",
        borderColor: "#334155",
        textStyle: { color: "#F8FAFC", fontSize: 11, fontFamily: "sans-serif" },
      },
      legend: {
        textStyle: { color: "#94A3B8", fontSize: 10, fontFamily: "sans-serif" },
        right: 10,
        top: 0,
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "6%",
        top: "16%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: hours,
        axisLine: { lineStyle: { color: "#334155" } },
        axisLabel: { color: "#94A3B8", fontSize: 9, interval: 6, fontFamily: "sans-serif" },
      },
      yAxis: {
        type: "value",
        name: "Vessels",
        nameTextStyle: { color: "#94A3B8", fontSize: 10, fontFamily: "sans-serif" },
        splitLine: { lineStyle: { color: "#1E293B" } },
        axisLabel: { color: "#94A3B8", fontSize: 9, fontFamily: "sans-serif" },
      },
      series: [
        {
          name: "Baseline Queue",
          type: "line",
          data: baseQueue,
          smooth: true,
          lineStyle: { color: "#64748B", width: 2, type: "dashed" },
          showSymbol: false,
        },
        {
          name: "Scenario Queue",
          type: "line",
          data: actQueue,
          smooth: true,
          lineStyle: { color: "#F59E0B", width: 2.5 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(245, 158, 11, 0.35)" },
                { offset: 1, color: "rgba(245, 158, 11, 0.0)" },
              ],
            },
          },
          showSymbol: false,
        },
        {
          name: "Berths Occupied",
          type: "line",
          data: actBerths,
          smooth: true,
          lineStyle: { color: "#0284C7", width: 2 },
          showSymbol: false,
        },
      ],
    };
  }, [baselineRun, activeRun]);

  // EChart Option 2: Yard Dynamics & Congestion Stack
  const yardOption = useMemo(() => {
    const hours = (activeRun.yard_occupancy_series || []).map((s) => `${s.hour}h`);
    const yardValues = (activeRun.yard_occupancy_series || []).map((s) => s.value);
    const thresholdValues = hours.map(() => activeRun.parameters.yard_congestion_threshold_pct || 85);

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#0F172A",
        borderColor: "#334155",
        textStyle: { color: "#F8FAFC", fontSize: 11, fontFamily: "sans-serif" },
      },
      legend: {
        textStyle: { color: "#94A3B8", fontSize: 10, fontFamily: "sans-serif" },
        right: 10,
        top: 0,
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "6%",
        top: "16%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: hours,
        axisLine: { lineStyle: { color: "#334155" } },
        axisLabel: { color: "#94A3B8", fontSize: 9, interval: 6, fontFamily: "sans-serif" },
      },
      yAxis: {
        type: "value",
        name: "Occupancy %",
        min: 40,
        max: 100,
        nameTextStyle: { color: "#94A3B8", fontSize: 10, fontFamily: "sans-serif" },
        splitLine: { lineStyle: { color: "#1E293B" } },
        axisLabel: { color: "#94A3B8", fontSize: 9, fontFamily: "sans-serif" },
      },
      series: [
        {
          name: "Yard Stack Occupancy %",
          type: "line",
          data: yardValues,
          smooth: true,
          lineStyle: { color: "#38BDF8", width: 2.5 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(56, 189, 248, 0.35)" },
                { offset: 1, color: "rgba(56, 189, 248, 0.0)" },
              ],
            },
          },
          showSymbol: false,
        },
        {
          name: "Congestion Threshold (85%)",
          type: "line",
          data: thresholdValues,
          lineStyle: { color: "#F43F5E", width: 1.5, type: "dashed" },
          showSymbol: false,
        },
      ],
    };
  }, [activeRun]);

  return (
    <div className="space-y-4 font-sans">
      {/* 4 Primary KPI Cards matching Executive Maritime Style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Berth Utilization */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-sm text-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Berth Utilization</span>
            <span className="text-[10px] text-sky-400 font-semibold tabular-nums">Target &gt;60%</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-white">
              {actM.berth_utilization_pct}%
            </span>
            <span
              className={`text-[11px] font-semibold tabular-nums flex items-center gap-0.5 ${
                utilDiff >= 0 ? "text-sky-400" : "text-rose-400"
              }`}
            >
              {utilDiff >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {utilDiff >= 0 ? "+" : ""}
              {utilDiff.toFixed(1)}% vs base
            </span>
          </div>
        </div>

        {/* Turnaround Time */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-sm text-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Turnaround Time</span>
            <span className="text-[10px] text-sky-400 font-semibold tabular-nums">Target &lt;24h</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-white">
              {actM.average_turnaround_hours}h
            </span>
            <span
              className={`text-[11px] font-semibold tabular-nums flex items-center gap-0.5 ${
                turnaroundDiff <= 0 ? "text-sky-400" : "text-rose-400"
              }`}
            >
              {turnaroundDiff > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {turnaroundDiff > 0 ? "+" : ""}
              {turnaroundDiff.toFixed(1)}h vs base
            </span>
          </div>
        </div>

        {/* Outer Anchorage Queue */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-sm text-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Queue at Anchor</span>
            <span className="text-[10px] text-amber-400 font-semibold tabular-nums">
              Mean: {actM.mean_waiting_time_hours}h
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-amber-300">
              {actM.vessels_remaining_queue} vsl
            </span>
            <span
              className={`text-[11px] font-semibold tabular-nums flex items-center gap-0.5 ${
                waitDiff <= 0 ? "text-sky-400" : "text-amber-400"
              }`}
            >
              {waitDiff > 0 ? "+" : ""}
              {waitDiff.toFixed(1)}h wait
            </span>
          </div>
        </div>

        {/* Green Port Auxiliary CO2 */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-sm text-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1">
              <Leaf className="h-3.5 w-3.5 text-sky-400" />
              Green Port CO2e
            </span>
            <span className="text-[10px] text-sky-400 font-semibold">IMO GHG</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-1 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-sky-300">
              {actM.total_co2e_tonnes || actM.estimated_secondary_co2_tonnes}t
            </span>
            <span
              className={`text-[11px] font-semibold tabular-nums flex items-center gap-0.5 ${
                co2Diff <= 0 ? "text-sky-400" : "text-rose-400"
              }`}
            >
              {co2Diff > 0 ? "+" : ""}
              {co2Diff.toFixed(1)}t vs base
            </span>
          </div>
        </div>
      </div>

      {/* Two EChart Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Anchorage Queue Dynamics */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-amber-400" />
              <span>Anchorage Queue & Quayside Dynamics (72h Horizon)</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-medium">Hourly SimPy Step</span>
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={queueOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </div>

        {/* Chart 2: Yard Stack Occupancy */}
        <div className="bg-slate-900 border border-slate-700/80 rounded-xl p-4 shadow-sm space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h4 className="text-xs font-bold text-white flex items-center gap-2">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              <span>Yard Container Block Dynamics & Stack Congestion</span>
            </h4>
            <span className="text-[10px] text-sky-400 font-semibold tabular-nums">Peak: {actM.peak_yard_occupancy_pct}%</span>
          </div>
          <div className="h-64 w-full">
            <ReactECharts option={yardOption} style={{ height: "100%", width: "100%" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
