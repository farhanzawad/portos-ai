"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { OverviewKPIStrip } from "@/components/overview/OverviewKPIStrip";
import { TerminalOverviewPreview } from "@/components/overview/TerminalOverviewPreview";
import { VesselQueueTable } from "@/components/overview/VesselQueueTable";
import { BerthUtilizationChart } from "@/components/overview/BerthUtilizationChart";
import { OperationalAlertsTimeline } from "@/components/overview/OperationalAlertsTimeline";
import { ContextualInsightPanel } from "@/components/overview/ContextualInsightPanel";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { RefreshCw, Clock, CalendarRange, FlaskConical, Sparkles } from "lucide-react";

export default function OverviewPage() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setLastUpdated(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }) + " BST"
    );
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* Executive Clean Header & Action Pills */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              Port Operations Workspace
            </h1>
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Corridor Focus: <strong className="text-slate-800">CCT / NCT Container Terminal (Karnaphuli River Approach)</strong> · Tidal Datum: CD +0.0m
          </p>
        </div>

        {/* Action Pills Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-2xs">
            <Clock className="h-3.5 w-3.5 text-sky-600" />
            <span>Updated: <strong className="text-slate-900 font-semibold tabular-nums">{lastUpdated}</strong></span>
          </div>

          <Link
            href="/berth-planner"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100 transition-all shadow-2xs"
          >
            <CalendarRange className="h-3.5 w-3.5 text-sky-600" />
            <span>Berth Planner</span>
          </Link>

          <Link
            href="/scenario-lab"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-2xs"
          >
            <FlaskConical className="h-3.5 w-3.5 text-indigo-600" />
            <span>Scenario Lab</span>
          </Link>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-full bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 transition-all shadow-2xs active:scale-[0.98]"
            title="Refresh overview telemetry"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 text-sky-600 ${isRefreshing ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Metric KPI Strip with Telemetry Sparklines (Ref 1 + Ref 2) */}
      <OverviewKPIStrip />

      {/* 2. Quayside Digital Twin Hub Preview */}
      <TerminalOverviewPreview />

      {/* 3. Operational Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vessel Queue Table & Alerts Timeline (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <VesselQueueTable />
          <OperationalAlertsTimeline />
        </div>

        {/* Right Column: Physical Constraints Chart & Insights (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <BerthUtilizationChart />
          <ContextualInsightPanel />
        </div>
      </div>
    </div>
  );
}
