"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getYardStatus, getYardCongestionAlerts } from "@/lib/api-client";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { Grid3X3, Layers, AlertCircle, RefreshCw } from "lucide-react";
import { YardKpiMetricsBar } from "./YardKpiMetricsBar";
import { YardAlertStrip } from "./YardAlertStrip";
import { YardControlsBar, ForecastHorizon, ZoneFilter, RiskFilter, SortOption } from "./YardControlsBar";
import { YardHeatmapGrid } from "./YardHeatmapGrid";
import { YardBlockDetailDrawer } from "./YardBlockDetailDrawer";

export function YardIntelligenceView() {
  const [activeHorizon, setActiveHorizon] = useState<ForecastHorizon>(0);
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("ALL");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("OCCUPANCY_DESC");
  const [warningThreshold, setWarningThreshold] = useState<number>(85);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(95);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const {
    data: summary,
    isLoading: summaryLoading,
    error: summaryError,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ["yard-status"],
    queryFn: () => getYardStatus(),
  });

  const {
    data: alerts = [],
    isLoading: alertsLoading,
    refetch: refetchAlerts,
  } = useQuery({
    queryKey: ["yard-congestion-alerts"],
    queryFn: () => getYardCongestionAlerts(),
  });

  const handleResetThresholds = () => {
    setWarningThreshold(85);
    setCriticalThreshold(95);
  };

  const handleRefresh = () => {
    refetchSummary();
    refetchAlerts();
  };

  if (summaryLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-72 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  if (summaryError || !summary) {
    return (
      <div className="p-8 rounded-lg border border-rose-200 bg-rose-50 text-center space-y-3">
        <AlertCircle className="h-8 w-8 text-rose-600 mx-auto" />
        <h3 className="text-sm font-bold text-rose-950">Unable to load Yard Intelligence telemetry</h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto">
          Ensure the PORTOS AI backend service is online and database records are seeded.
        </p>
        <button
          onClick={handleRefresh}
          className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-xs"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Yard Intelligence & Congestion Heatmap
            </h1>
            <DataStatusBadge status={summary.data_status} />
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Predictive container density analysis, threshold watch monitoring, and multi-horizon bottleneck forecasting.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-1.5 text-xs text-portos-muted hover:text-portos-navy border border-portos-border rounded bg-white hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh Yard Telemetry"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Top Aggregate KPI Metrics Bar */}
      <YardKpiMetricsBar
        summary={summary}
        warningThreshold={warningThreshold}
        criticalThreshold={criticalThreshold}
      />

      {/* Congestion Alert Strip if Bottlenecks Active */}
      <YardAlertStrip
        alerts={alerts}
        onSelectBlock={(blockId) => setSelectedBlockId(blockId)}
      />

      {/* Main Interactive Controls Toolbar */}
      <YardControlsBar
        activeHorizon={activeHorizon}
        onHorizonChange={setActiveHorizon}
        zoneFilter={zoneFilter}
        onZoneFilterChange={setZoneFilter}
        riskFilter={riskFilter}
        onRiskFilterChange={setRiskFilter}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        warningThreshold={warningThreshold}
        onWarningThresholdChange={setWarningThreshold}
        criticalThreshold={criticalThreshold}
        onCriticalThresholdChange={setCriticalThreshold}
        onResetThresholds={handleResetThresholds}
      />

      {/* 12-Block Top-Down Yard Heatmap Grid */}
      <YardHeatmapGrid
        blocks={summary.blocks}
        activeHorizon={activeHorizon}
        warningThreshold={warningThreshold}
        criticalThreshold={criticalThreshold}
        zoneFilter={zoneFilter}
        riskFilter={riskFilter}
        sortBy={sortBy}
        selectedBlockId={selectedBlockId}
        onSelectBlock={(blockId) => setSelectedBlockId(blockId)}
      />

      {/* Block Inspection Slide-Out Drawer */}
      <YardBlockDetailDrawer
        blockId={selectedBlockId}
        onClose={() => setSelectedBlockId(null)}
        warningThreshold={warningThreshold}
        criticalThreshold={criticalThreshold}
      />
    </div>
  );
}
