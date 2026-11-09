"use client";

import React from "react";
import { GreenPortOverviewResponse } from "@/types/api";
import { Leaf, Ship, Anchor, Zap, Truck, Scale } from "lucide-react";

interface GreenPortKpiBarProps {
  overview: GreenPortOverviewResponse;
}

export function GreenPortKpiBar({ overview }: GreenPortKpiBarProps) {
  const co2Summary = overview.pollutant_summaries.find((p) => p.pollutant === "CO2E");
  const activities = co2Summary?.activities || [];

  const berthedActivity = activities.find(
    (a) => a.activity_type === "VESSEL_HOTELING_AUX_ENGINE" && a.activity_name.includes("Berth")
  );
  const queueActivity = activities.find(
    (a) => a.activity_type === "VESSEL_HOTELING_AUX_ENGINE" && a.activity_name.includes("Anchorage")
  );
  const stsActivity = activities.find((a) => a.activity_type === "STS_CRANE_ELECTRIC");
  const yardActivity = activities.find((a) => a.activity_type === "YARD_EQUIPMENT_DIESEL");

  const totalMt = overview.total_co2e_mt;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 font-sans">
      {/* 1. Total Estimated Scope Emissions */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-900">
            Total Modeled CO2e
          </span>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
            <Scale className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {totalMt.toFixed(2)}
            </span>
            <span className="text-xs font-semibold text-slate-700">MT CO2e</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums block mt-0.5">
            {overview.total_co2e_kg.toLocaleString()} kg total
          </span>
        </div>
        <span className="text-[10px] text-sky-700 font-semibold mt-2.5">
          {overview.reporting_period_hours}h operational horizon
        </span>
      </div>

      {/* 2. Vessel Berth Hoteling */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Berth Hoteling</span>
          <div className="p-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-600">
            <Ship className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {(berthedActivity?.estimated_mt || 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-medium">MT</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums block mt-0.5">
            {berthedActivity?.activity_quantity.toFixed(1)} hrs alongside
          </span>
        </div>
        <span className="text-[10px] text-sky-700 font-semibold mt-2.5">
          {totalMt > 0 ? (((berthedActivity?.estimated_mt || 0) / totalMt) * 100).toFixed(1) : 0}% of scope (Scope 3)
        </span>
      </div>

      {/* 3. Outer Anchorage Waiting */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Anchorage Queue</span>
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
            <Anchor className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-amber-700 tabular-nums">
              {(queueActivity?.estimated_mt || 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-medium">MT</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums block mt-0.5">
            {queueActivity?.activity_quantity.toFixed(1)} hrs waiting
          </span>
        </div>
        <span className="text-[10px] text-amber-700 font-semibold mt-2.5">
          {totalMt > 0 ? (((queueActivity?.estimated_mt || 0) / totalMt) * 100).toFixed(1) : 0}% of scope (Avoidable)
        </span>
      </div>

      {/* 4. Electric STS Cranes */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Electric Cranes</span>
          <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
            <Zap className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {(stsActivity?.estimated_mt || 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-medium">MT</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums block mt-0.5">
            {stsActivity?.activity_quantity.toLocaleString()} moves (Grid)
          </span>
        </div>
        <span className="text-[10px] text-indigo-700 font-semibold mt-2.5">
          {totalMt > 0 ? (((stsActivity?.estimated_mt || 0) / totalMt) * 100).toFixed(1) : 0}% of scope (Scope 2)
        </span>
      </div>

      {/* 5. Yard Diesel Transfers */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between col-span-2 md:col-span-4 lg:col-span-1">
        <div className="flex items-center justify-between text-slate-500">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700">Yard Diesel</span>
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
            <Truck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-3">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
              {(yardActivity?.estimated_mt || 0).toFixed(2)}
            </span>
            <span className="text-xs text-slate-500 font-medium">MT</span>
          </div>
          <span className="text-[10px] text-slate-500 font-medium tabular-nums block mt-0.5">
            {yardActivity?.activity_quantity.toLocaleString()} RTG moves
          </span>
        </div>
        <span className="text-[10px] text-slate-600 font-semibold mt-2.5">
          {totalMt > 0 ? (((yardActivity?.estimated_mt || 0) / totalMt) * 100).toFixed(1) : 0}% of scope (Scope 1)
        </span>
      </div>
    </div>
  );
}
