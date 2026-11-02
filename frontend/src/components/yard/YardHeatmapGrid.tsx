"use client";

import React from "react";
import { YardBlockStatusRead } from "@/types/api";
import { ForecastHorizon, ZoneFilter, RiskFilter, SortOption } from "./YardControlsBar";
import {
  Thermometer,
  Layers,
  Sparkles,
  AlertTriangle,
  Snowflake,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface YardHeatmapGridProps {
  blocks: YardBlockStatusRead[];
  activeHorizon: ForecastHorizon;
  warningThreshold: number;
  criticalThreshold: number;
  zoneFilter: ZoneFilter;
  riskFilter: RiskFilter;
  sortBy: SortOption;
  selectedBlockId: string | null;
  onSelectBlock: (blockId: string) => void;
}

export function YardHeatmapGrid({
  blocks,
  activeHorizon,
  warningThreshold,
  criticalThreshold,
  zoneFilter,
  riskFilter,
  sortBy,
  selectedBlockId,
  onSelectBlock,
}: YardHeatmapGridProps) {
  // Helper to extract relevant occupancy % and details for active horizon
  const getBlockHorizonData = (b: YardBlockStatusRead) => {
    if (activeHorizon === 0) {
      const occPct = b.current_occupancy_pct;
      const occTeu = b.current_occupied_teu;
      const tier =
        occPct >= criticalThreshold
          ? "HIGH_RISK"
          : occPct >= warningThreshold
          ? "WATCH"
          : "NORMAL";
      return {
        occupancyPct: occPct,
        occupiedTeu: occTeu,
        riskTier: tier,
        confidenceLower: null,
        confidenceUpper: null,
        overflowRisk: false,
        capped: false,
        deltaPct: 0,
      };
    }

    const detail =
      activeHorizon === 6
        ? b.forecast_6h
        : activeHorizon === 12
        ? b.forecast_12h
        : b.forecast_24h;

    const occPct = detail.predicted_occupancy_pct;
    const occTeu = detail.predicted_occupied_teu;
    const tier =
      occPct >= criticalThreshold
        ? "HIGH_RISK"
        : occPct >= warningThreshold
        ? "WATCH"
        : "NORMAL";
    const deltaPct = round(occPct - b.current_occupancy_pct, 1);

    return {
      occupancyPct: occPct,
      occupiedTeu: occTeu,
      riskTier: tier,
      confidenceLower: detail.confidence_lower_pct,
      confidenceUpper: detail.confidence_upper_pct,
      overflowRisk: detail.overflow_risk,
      capped: detail.capped_at_capacity,
      deltaPct,
    };
  };

  function round(val: number, precision: number) {
    const factor = Math.pow(10, precision);
    return Math.round(val * factor) / factor;
  }

  // Filter blocks
  const filteredBlocks = blocks.filter((b) => {
    // Zone filter
    if (zoneFilter !== "ALL" && b.zone !== zoneFilter) return false;

    // Risk filter (evaluated against active horizon data)
    const { riskTier } = getBlockHorizonData(b);
    if (riskFilter !== "ALL" && riskTier !== riskFilter) return false;

    return true;
  });

  // Sort blocks
  const sortedBlocks = [...filteredBlocks].sort((a, b) => {
    const dataA = getBlockHorizonData(a);
    const dataB = getBlockHorizonData(b);

    if (sortBy === "OCCUPANCY_DESC") {
      return dataB.occupancyPct - dataA.occupancyPct;
    }
    if (sortBy === "OCCUPANCY_ASC") {
      return dataA.occupancyPct - dataB.occupancyPct;
    }
    if (sortBy === "CODE_ASC") {
      return a.code.localeCompare(b.code);
    }
    if (sortBy === "CAPACITY_DESC") {
      return b.teu_capacity - a.teu_capacity;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      {/* Top Schematic Orientation Banner (Minimal Quayside Reference) */}
      <div className="bg-slate-900 text-white rounded-lg px-4 py-2 flex items-center justify-between text-xs border border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-portos-teal" />
          <span className="font-semibold tracking-wide uppercase text-[11px] text-slate-200">
            Quayside Berth Face & Ship-to-Shore Cranes (Berths B-01 to B-06)
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 text-[11px]">
          <span>Viewing: <strong>{activeHorizon === 0 ? "Current State" : `+${activeHorizon}h Forecast`}</strong></span>
          <span className="text-slate-600">|</span>
          <span>Showing <strong>{sortedBlocks.length}</strong> of {blocks.length} Sectors</span>
        </div>
      </div>

      {/* Empty State */}
      {sortedBlocks.length === 0 && (
        <div className="bg-white rounded-lg border border-dashed border-portos-border p-12 text-center space-y-2">
          <Layers className="h-8 w-8 text-portos-muted mx-auto" />
          <h3 className="text-sm font-semibold text-portos-navy">No matching yard blocks</h3>
          <p className="text-xs text-portos-muted max-w-sm mx-auto">
            No container blocks match the current zone or risk status filter. Adjust your filter selection above.
          </p>
        </div>
      )}

      {/* 12-Block Top-Down Heatmap Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {sortedBlocks.map((block) => {
          const {
            occupancyPct,
            occupiedTeu,
            riskTier,
            confidenceLower,
            confidenceUpper,
            overflowRisk,
            capped,
            deltaPct,
          } = getBlockHorizonData(block);

          const isSelected = selectedBlockId === block.id;

          // Color tokens strictly based on Minimal Industrial Futurism guidelines
          const isHighRisk = riskTier === "HIGH_RISK";
          const isWatch = riskTier === "WATCH";

          const borderClass = isSelected
            ? "border-portos-navy ring-2 ring-portos-navy/30"
            : isHighRisk
            ? "border-rose-400 hover:border-rose-500"
            : isWatch
            ? "border-amber-400 hover:border-amber-500"
            : "border-portos-border hover:border-teal-500/70";

          const bgBarClass = isHighRisk
            ? "bg-rose-500"
            : isWatch
            ? "bg-amber-500"
            : "bg-portos-teal";

          const badgeBgClass = isHighRisk
            ? "bg-rose-50 text-rose-700 border-rose-200"
            : isWatch
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-teal-50 text-teal-700 border-teal-200";

          return (
            <div
              key={block.id}
              onClick={() => onSelectBlock(block.id)}
              className={`bg-white rounded-lg border p-4 shadow-xs hover:shadow-md cursor-pointer transition-all duration-150 flex flex-col justify-between relative group ${borderClass}`}
            >
              {/* Top Row: Block Code & Zone Badge */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-base font-bold tracking-tight text-portos-navy">
                      {block.code}
                    </span>
                    {block.zone === "REEFER" && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        <Snowflake className="h-2.5 w-2.5" />
                        <span>Reefer</span>
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${badgeBgClass}`}
                  >
                    {riskTier === "HIGH_RISK" ? "High Risk" : riskTier === "WATCH" ? "Watch" : "Normal"}
                  </span>
                </div>

                <div className="text-[11px] text-portos-muted mt-0.5 truncate" title={block.name}>
                  {block.name} • {block.zone}
                </div>
              </div>

              {/* Main Metric: Occupancy % and Capacity Gauge */}
              <div className="my-3 space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-bold font-mono text-portos-navy">
                      {occupancyPct.toFixed(1)}%
                    </span>
                    {activeHorizon > 0 && deltaPct !== 0 && (
                      <span
                        className={`text-xs font-mono font-medium flex items-center ${
                          deltaPct > 0 ? "text-rose-600" : "text-teal-600"
                        }`}
                      >
                        {deltaPct > 0 ? (
                          <TrendingUp className="h-3 w-3 inline mr-0.5" />
                        ) : (
                          <TrendingDown className="h-3 w-3 inline mr-0.5" />
                        )}
                        {deltaPct > 0 ? `+${deltaPct}%` : `${deltaPct}%`}
                      </span>
                    )}
                  </div>

                  <span className="text-xs font-mono text-portos-muted">
                    {occupiedTeu} / {block.teu_capacity} TEU
                  </span>
                </div>

                {/* Density Bar */}
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${bgBarClass}`}
                    style={{ width: `${Math.min(100, occupancyPct)}%` }}
                  />
                </div>

                {/* Confidence Range Badge if Forecast Active */}
                {confidenceLower !== null && confidenceUpper !== null && (
                  <div className="flex items-center justify-between text-[10px] text-portos-muted pt-0.5 font-mono">
                    <span>95% CI: [{confidenceLower}% – {confidenceUpper}%]</span>
                    {overflowRisk && (
                      <span className="text-rose-600 font-bold flex items-center gap-0.5">
                        <AlertTriangle className="h-2.5 w-2.5" />
                        <span>Overflow Risk</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Bottom Quick Affordance */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-portos-muted group-hover:text-portos-navy">
                <span className="truncate">
                  {block.zone === "REEFER"
                    ? `${block.reefer_occupied_count} Cold-plugs active`
                    : `Threshold: ${warningThreshold}% / ${criticalThreshold}%`}
                </span>
                <span className="inline-flex items-center gap-0.5 font-medium text-portos-navy-secondary shrink-0">
                  <span>Inspect</span>
                  <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
