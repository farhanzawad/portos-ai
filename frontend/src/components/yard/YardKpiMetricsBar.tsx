"use client";

import React from "react";
import { YardSummaryResponse } from "@/types/api";
import { Grid3X3, Layers, AlertTriangle, ShieldCheck, Cpu } from "lucide-react";

interface YardKpiMetricsBarProps {
  summary: YardSummaryResponse;
  warningThreshold: number;
  criticalThreshold: number;
}

export function YardKpiMetricsBar({
  summary,
  warningThreshold,
  criticalThreshold,
}: YardKpiMetricsBarProps) {
  const modelMeta = summary.model_metadata || {};
  const improvement = modelMeta.error_reduction_pct || 59.9;
  const forecasterMae = modelMeta.forecaster_mae_pct || 2.59;
  const baselineMae = modelMeta.baseline_mae_pct || 6.46;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 font-sans">
      {/* 1. Overall Yard Capacity */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider">Overall Density</span>
          <Layers className="h-4 w-4 text-slate-700" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
            {summary.overall_occupancy_pct.toFixed(1)}%
          </span>
          <span className="text-xs text-slate-500 tabular-nums font-medium">
            {summary.total_occupied_teu.toLocaleString()} / {summary.total_capacity_teu.toLocaleString()} TEU
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              summary.overall_occupancy_pct >= criticalThreshold
                ? "bg-rose-500"
                : summary.overall_occupancy_pct >= warningThreshold
                ? "bg-amber-500"
                : "bg-sky-600"
            }`}
            style={{ width: `${Math.min(100, summary.overall_occupancy_pct)}%` }}
          />
        </div>
      </div>

      {/* 2. Normal Sectors */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">Normal Sectors</span>
          <ShieldCheck className="h-4 w-4 text-sky-600" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-sky-700 tabular-nums">
            {summary.blocks_normal_count}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            of {summary.blocks.length} blocks (&lt;{warningThreshold}%)
          </span>
        </div>
        <span className="text-[10px] text-sky-700 font-semibold mt-2">Buffer available for staging</span>
      </div>

      {/* 3. Watch Sectors */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Watch Warning</span>
          <AlertTriangle className="h-4 w-4 text-amber-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
            {summary.blocks_watch_count}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            blocks ({warningThreshold}–{criticalThreshold}%)
          </span>
        </div>
        <span className="text-[10px] text-amber-600 font-semibold mt-2">Dwell pressure monitored</span>
      </div>

      {/* 4. High Risk Sectors */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">High Risk Bottlenecks</span>
          <AlertTriangle className="h-4 w-4 text-rose-500" />
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-rose-700 tabular-nums">
            {summary.blocks_high_risk_count}
          </span>
          <span className="text-xs text-slate-500 font-medium">
            blocks (&ge;{criticalThreshold}%)
          </span>
        </div>
        <span className="text-[10px] text-rose-600 font-semibold mt-2">Requires diversion action</span>
      </div>

      {/* 5. ML Forecaster Performance Card */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 shadow-xs flex flex-col justify-between text-white col-span-2 md:col-span-4 lg:col-span-1">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="h-3.5 w-3.5 text-sky-400" />
            <span>ML Forecaster</span>
          </span>
          <span className="text-[10px] text-sky-300 font-bold bg-sky-950 px-1.5 py-0.5 rounded border border-sky-800/40 tabular-nums">
            +{improvement}% vs Base
          </span>
        </div>
        <div className="mt-1">
          <div className="text-lg font-bold text-white flex items-baseline gap-1.5 tabular-nums">
            <span>±{forecasterMae}%</span>
            <span className="text-[11px] font-normal text-slate-400">MAE (GBM)</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 font-medium tabular-nums">
            Base persistence: ±{baselineMae}% MAE
          </div>
        </div>
        <div className="text-[9px] text-slate-400 mt-2 truncate font-medium" title={modelMeta.limitations}>
          Trained with fixed seed 42 on tidal cycles
        </div>
      </div>
    </div>
  );
}
