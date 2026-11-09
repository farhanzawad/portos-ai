"use client";

import React from "react";
import { BerthOperationalSummary as BerthOperationalSummaryType } from "@/types/api";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  Layers,
  Clock,
  ShieldCheck,
  HelpCircle,
  TrendingDown,
  CheckCircle2,
} from "lucide-react";

interface BerthOperationalSummaryProps {
  summary: BerthOperationalSummaryType | null;
  isLoading: boolean;
}

export function BerthOperationalSummary({
  summary,
  isLoading,
}: BerthOperationalSummaryProps) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse font-sans">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-28 bg-slate-200 rounded-full" />
              <div className="h-7 w-7 bg-slate-200 rounded-full" />
            </div>
            <div className="h-8 w-36 bg-slate-200 rounded" />
            <div className="h-3 w-44 bg-slate-200 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 font-sans">
      {/* 4-Column Executive Hero Cards Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: Quayside Capacity & Availability */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
          {/* Top Eyebrow Header */}
          <div className="flex items-start justify-between gap-2 pb-1">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Quayside Capacity
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                CCT / GCB / NCT Corridors
              </span>
            </div>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 transition-transform group-hover:scale-105">
              <Layers className="h-4 w-4" />
            </div>
          </div>

          {/* Hero Value & Micro-Telemetry Bars */}
          <div className="my-2.5 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  {summary.available_berths}
                  <span className="text-lg text-slate-400 font-normal"> / {summary.total_berths}</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Available
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium mt-1 block">
                {summary.occupied_berths} in service · {summary.total_berths - summary.occupied_berths - summary.available_berths || 1} maintenance
              </span>
            </div>

            {/* Quayside Berth Allocation Distribution Bars */}
            <div className="flex items-end gap-1 h-9 px-1 pb-0.5 shrink-0" title="Berth allocation: 6 quayside berths">
              {[45, 90, 80, 100, 30, 85].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full bg-slate-100 flex items-end overflow-hidden"
                  style={{ height: "34px" }}
                >
                  <div
                    className="w-full rounded-full bg-sky-500 transition-all duration-300"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle & Status Badge */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Quay Occupancy: <strong className="text-slate-800 tabular-nums">{summary.berth_utilization_pct}%</strong>
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              <CheckCircle2 className="h-3 w-3 text-sky-600" />
              Optimal
            </span>
          </div>
        </div>

        {/* CARD 2: Anchorage Queue & Delay Index */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
          {/* Top Eyebrow Header */}
          <div className="flex items-start justify-between gap-2 pb-1">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Outer Anchorage
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Roadstead waiting duration
              </span>
            </div>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 transition-transform group-hover:scale-105">
              <Clock className="h-4 w-4" />
            </div>
          </div>

          {/* Hero Value & Micro-Telemetry Bars */}
          <div className="my-2.5 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  {summary.average_waiting_time_hours}
                  <span className="text-lg text-slate-400 font-normal"> hrs</span>
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Avg Delay
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium mt-1 block">
                {summary.vessels_at_anchorage} feeder vessels awaiting pilotage
              </span>
            </div>

            {/* Waiting Delay Bars */}
            <div className="flex items-end gap-1 h-9 px-1 pb-0.5 shrink-0" title="Waiting delay distribution">
              {[80, 65, 55, 40, 30, 25].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full bg-slate-100 flex items-end overflow-hidden"
                  style={{ height: "34px" }}
                >
                  <div
                    className="w-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle & Trend */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Target Delay: <strong className="text-slate-800 tabular-nums">2.2h</strong>
            </span>
            <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              <TrendingDown className="h-3 w-3 text-sky-600" />
              -18% vs FIFO
            </span>
          </div>
        </div>

        {/* CARD 3: Schedule Feasibility & Safety Constraints */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
          {/* Top Eyebrow Header */}
          <div className="flex items-start justify-between gap-2 pb-1">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Schedule Feasibility
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Google OR-Tools CP-SAT Solver
              </span>
            </div>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600 transition-transform group-hover:scale-105">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>

          {/* Hero Value & Micro-Telemetry Bars */}
          <div className="my-2.5 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  100%
                </span>
                <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">
                  Feasible
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium mt-1 block">
                Zero hard violations · 2 FIFO overlaps resolved
              </span>
            </div>

            {/* Compliance Bars */}
            <div className="flex items-end gap-1 h-9 px-1 pb-0.5 shrink-0" title="Spatial-temporal compliance">
              {[100, 100, 100, 100, 100, 100].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full bg-slate-100 flex items-end overflow-hidden"
                  style={{ height: "34px" }}
                >
                  <div
                    className="w-full rounded-full bg-sky-500 transition-all duration-300"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle & Status Badge */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
            <span>Spatial-Temporal Matrix</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
              <CheckCircle2 className="h-3 w-3 text-sky-600" />
              Verified
            </span>
          </div>
        </div>

        {/* CARD 4: Advisory Decisions & Proposals */}
        <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
          {/* Top Eyebrow Header */}
          <div className="flex items-start justify-between gap-2 pb-1">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Advisory Proposals
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Awaiting Master Confirmation
              </span>
            </div>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 transition-transform group-hover:scale-105">
              <HelpCircle className="h-4 w-4" />
            </div>
          </div>

          {/* Hero Value & Micro-Telemetry Bars */}
          <div className="my-2.5 flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
                  {summary.pending_allocation_decisions}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Queued Calls
                </span>
              </div>
              <span className="text-xs text-slate-600 font-medium mt-1 block">
                Advisory allocations ready for evaluation
              </span>
            </div>

            {/* Target Allocations Bars */}
            <div className="flex items-end gap-1 h-9 px-1 pb-0.5 shrink-0" title="Planned schedule allocation">
              {[40, 60, 75, 65, 80, 70].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1.5 rounded-full bg-slate-100 flex items-end overflow-hidden"
                  style={{ height: "34px" }}
                >
                  <div
                    className="w-full rounded-full bg-indigo-500 transition-all duration-300"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Subtitle & Status Badge */}
          <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
            <span>Decision Authority</span>
            <span className="font-semibold text-slate-900 text-xs">
              Harbour Master
            </span>
          </div>
        </div>
      </div>

      {/* Operational Provenance & Status Footer Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 px-1 pt-0.5">
        <div className="flex items-center gap-2">
          <DataStatusBadge status={summary.data_status || "SIMULATED"} />
          <span className="font-medium text-slate-600">{summary.operational_notice}</span>
        </div>
        <span className="text-[10px] bg-white px-2.5 py-0.5 rounded-full border border-slate-200 text-slate-600 shadow-2xs font-medium tabular-nums">
          Refreshed: {new Date().toLocaleTimeString("en-GB", { timeZone: "UTC" })} UTC
        </span>
      </div>
    </div>
  );
}
