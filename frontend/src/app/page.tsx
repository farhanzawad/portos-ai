"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { OverviewKPIStrip } from "@/components/overview/OverviewKPIStrip";
import { TerminalOverviewPreview } from "@/components/overview/TerminalOverviewPreview";
import { VesselQueueTable } from "@/components/overview/VesselQueueTable";
import { BerthUtilizationChart } from "@/components/overview/BerthUtilizationChart";
import { OperationalAlertsTimeline } from "@/components/overview/OperationalAlertsTimeline";
import { ContextualInsightPanel } from "@/components/overview/ContextualInsightPanel";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { RefreshCw, Clock } from "lucide-react";

export default function OverviewPage() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    setLastUpdated(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " BST");
    setTimeout(() => setIsRefreshing(false), 400);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Port Operations Overview
            </h1>
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Terminal Context: <strong>CCT / NCT Container Facility (Chattogram Corridors)</strong> · Channel Datum: CD +0.0m
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-portos-muted">
            <Clock className="h-3.5 w-3.5" />
            <span>Updated: <strong className="text-portos-navy tabular-nums">{lastUpdated}</strong></span>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded border border-portos-border bg-portos-surface text-portos-navy hover:bg-portos-bg disabled:opacity-50 transition-colors shadow-2xs"
            title="Refresh overview telemetry"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-portos-teal ${isRefreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Compact Metric KPI Strip */}
      <OverviewKPIStrip />

      {/* 2. Large Central Quayside & Digital Twin Overview Preview */}
      <TerminalOverviewPreview />

      {/* 3. Operational Two-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Vessel Queue Table (7 cols) */}
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
