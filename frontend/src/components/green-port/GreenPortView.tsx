"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGreenPortOverview } from "@/lib/api-client";
import { GreenPortKpiBar } from "@/components/green-port/GreenPortKpiBar";
import { ScopeBoundaryBanner } from "@/components/green-port/ScopeBoundaryBanner";
import { EmissionsCategoryCards } from "@/components/green-port/EmissionsCategoryCards";
import { ScenarioEmissionsComparePanel } from "@/components/green-port/ScenarioEmissionsComparePanel";
import { EnvironmentalContextCard } from "@/components/green-port/EnvironmentalContextCard";
import { AssumptionFactorDrawer } from "@/components/green-port/AssumptionFactorDrawer";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Leaf, FileSpreadsheet, RotateCw, ShieldCheck } from "lucide-react";

export function GreenPortView() {
  const [isFactorDrawerOpen, setIsFactorDrawerOpen] = useState(false);

  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["green-port-overview"],
    queryFn: () => getGreenPortOverview(),
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-slate-100 rounded-lg animate-pulse" />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <ErrorState
        title="Failed to Load Green Port Analytics"
        message={
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while loading emissions estimates and factor dictionary."
        }
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="pb-4 border-b border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-portos-teal/15 text-portos-teal">
              <Leaf className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
                  Green Port Analytics
                </h1>
                <DataStatusBadge status={overview.data_status} />
              </div>
              <p className="text-xs text-portos-muted mt-0.5">
                Auditable operational carbon and air quality estimates derived from transparent factor models.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsFactorDrawerOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-portos-navy bg-white border border-portos-border rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-portos-teal" />
            <span>Emission Factors ({overview.factors.length})</span>
          </button>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-portos-border rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
            title="Refresh emissions calculation"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin text-portos-teal" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Scope Boundary Banner */}
      <ScopeBoundaryBanner scope={overview.scope_definition} />

      {/* 2. Primary KPI Strip */}
      <GreenPortKpiBar overview={overview} />

      {/* 3. Category Breakdown with Pollutant Tabs */}
      <EmissionsCategoryCards
        pollutantSummaries={overview.pollutant_summaries}
        onOpenFactorDrawer={() => setIsFactorDrawerOpen(true)}
      />

      {/* 4. Baseline vs Scenario Comparison Panel */}
      <ScenarioEmissionsComparePanel
        initialComparison={overview.baseline_comparison}
      />

      {/* 5. Environmental Context Card (with navigation disclaimer) */}
      <EnvironmentalContextCard context={overview.environmental_context} />

      {/* 6. Emission Factor Drawer */}
      <AssumptionFactorDrawer
        isOpen={isFactorDrawerOpen}
        onClose={() => setIsFactorDrawerOpen(false)}
        factors={overview.factors}
      />
    </div>
  );
}
