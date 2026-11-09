"use client";

import React from "react";
import { VesselCallRead } from "@/types/api";
import {
  Ship,
  Anchor,
  Clock,
  Radio,
  Compass,
  ArrowUpRight,
  ShieldAlert,
  Navigation,
  Waves,
  ArrowRight,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface AnchorageQueueSummaryProps {
  calls: VesselCallRead[];
  selectedStatus?: string;
  onSelectStatus?: (status: string) => void;
  selectedRisk?: string;
  onSelectRisk?: (risk: string) => void;
  onOpenAISDiagnostics?: () => void;
}

export function AnchorageQueueSummary({
  calls,
  selectedStatus = "ALL",
  onSelectStatus,
  selectedRisk = "ALL",
  onSelectRisk,
  onOpenAISDiagnostics,
}: AnchorageQueueSummaryProps) {
  const total = calls.length;
  const anchored = calls.filter((c) => c.status === "OUTER_ANCHORAGE").length;
  const pilot = calls.filter((c) => c.status === "PILOT_BOARDING").length;
  const berthed = calls.filter((c) => c.status === "BERTHED").length;
  const highRiskCount = calls.filter((c) => c.delay_risk_status === "HIGH_RISK").length;

  const totalDelay = calls.reduce((acc, c) => acc + (c.predicted_delay_hours || 0), 0);
  const avgDelay = total > 0 ? (totalDelay / total).toFixed(1) : "0.0";

  return (
    <div className="space-y-3 font-sans">
      {/* AIS Connection Notice & Grounding Banner */}
      <div className="p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 flex items-center justify-center shrink-0">
            <Radio className="h-4 w-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-xs">
                Hydrographic Replay Simulation Active
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                Demo Feed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Vessel coordinates, track trajectories, and arrival timestamps are synthetically simulated for decision evaluation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-full font-semibold text-[11px]">
            Datum: CD +0.0m
          </div>
          <DataStatusBadge status="SIMULATED" size="sm" />
          {onOpenAISDiagnostics && (
            <button
              onClick={onOpenAISDiagnostics}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-medium text-[11px] transition-colors flex items-center gap-1 shadow-xs"
            >
              <span>AIS Diagnostics</span>
              <ArrowUpRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Corridor Quick Metrics Strip (Fasto SaaS Theme) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Card 1: Total Corridor */}
        <button
          onClick={() => {
            onSelectStatus?.("ALL");
            onSelectRisk?.("ALL");
          }}
          className={`p-3.5 bg-white rounded-2xl border transition-all text-left group shadow-xs hover:shadow-md ${
            selectedStatus === "ALL" && selectedRisk === "ALL"
              ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Corridor Inflow
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Ship className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {total}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mt-1">
            Active fleet monitored
          </span>
        </button>

        {/* Card 2: Outer Anchorage */}
        <button
          onClick={() => {
            onSelectStatus?.("OUTER_ANCHORAGE");
            onSelectRisk?.("ALL");
          }}
          className={`p-3.5 bg-white rounded-2xl border transition-all text-left group shadow-xs hover:shadow-md ${
            selectedStatus === "OUTER_ANCHORAGE"
              ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/20"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Outer Roadstead
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Anchor className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-extrabold text-amber-600 tabular-nums">
              {anchored}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mt-1">
            Awaiting tidal slot
          </span>
        </button>

        {/* Card 3: Pilotage Boarding */}
        <button
          onClick={() => {
            onSelectStatus?.("PILOT_BOARDING");
            onSelectRisk?.("ALL");
          }}
          className={`p-3.5 bg-white rounded-2xl border transition-all text-left group shadow-xs hover:shadow-md ${
            selectedStatus === "PILOT_BOARDING"
              ? "border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/20"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Pilotage Boarding
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Compass className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-extrabold text-sky-600 tabular-nums">
              {pilot}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mt-1">
            Gupta Bend transit
          </span>
        </button>

        {/* Card 4: Quayside Berthed */}
        <button
          onClick={() => {
            onSelectStatus?.("BERTHED");
            onSelectRisk?.("ALL");
          }}
          className={`p-3.5 bg-white rounded-2xl border transition-all text-left group shadow-xs hover:shadow-md ${
            selectedStatus === "BERTHED"
              ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Quayside Berthed
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Ship className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span className="text-2xl font-extrabold text-emerald-600 tabular-nums">
              {berthed}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mt-1">
            CCT & NCT discharge
          </span>
        </button>

        {/* Card 5: Mean Delay Variance */}
        <button
          onClick={() => {
            onSelectRisk?.(selectedRisk === "HIGH_RISK" ? "ALL" : "HIGH_RISK");
          }}
          className={`p-3.5 bg-white rounded-2xl border transition-all text-left group shadow-xs hover:shadow-md col-span-2 sm:col-span-1 ${
            selectedRisk === "HIGH_RISK"
              ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20"
              : "border-slate-200/90 hover:border-slate-300"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Mean Delay Variance
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center transition-transform group-hover:scale-105">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-1">
            <span
              className={`text-2xl font-extrabold tabular-nums ${
                Number(avgDelay) > 2.0 ? "text-rose-600" : "text-sky-600"
              }`}
            >
              +{avgDelay}h
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 block mt-1">
            {highRiskCount > 0 ? `${highRiskCount} vessels high risk` : "Schedule nominal"}
          </span>
        </button>
      </div>

      {/* Dynamic Corridor Spatial Flow & Tidal Gate Pipeline */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="font-extrabold text-slate-900 text-xs">
            Karnaphuli Corridor Spatial Pipeline
          </span>
          <span className="font-mono text-[10px] text-slate-400">· 15.2 NM Total Approach</span>
        </div>

        {/* 4-Sector Flow Pipeline */}
        <div className="flex items-center gap-1.5 font-mono text-[11px] overflow-x-auto py-1">
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold whitespace-nowrap">
            <Anchor className="h-3 w-3 text-amber-600" />
            <span>Outer Roads: {anchored}</span>
          </div>
          <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200 font-bold whitespace-nowrap">
            <Compass className="h-3 w-3 text-sky-600" />
            <span>Pilot Boarding: {pilot}</span>
          </div>
          <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold whitespace-nowrap">
            <Navigation className="h-3 w-3 text-indigo-600" />
            <span>Fairway Transit: {Math.max(0, total - anchored - pilot - berthed)}</span>
          </div>
          <ArrowRight className="h-3 w-3 text-slate-300 shrink-0" />
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold whitespace-nowrap">
            <Ship className="h-3 w-3 text-emerald-600" />
            <span>Alongside Quay: {berthed}</span>
          </div>
        </div>

        {/* Live Tidal Gate Window Badge */}
        <div className="flex items-center gap-2 ml-auto text-[11px] font-mono">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-900 border border-sky-200 font-semibold">
            <Waves className="h-3.5 w-3.5 text-sky-600" />
            <span>High Tide Window: <strong>+3.8m @ 14:30 BST</strong></span>
            <span className="text-slate-400">·</span>
            <span className="text-emerald-700 font-bold">Max Draft 9.5m</span>
          </div>
        </div>
      </div>
    </div>
  );
}
