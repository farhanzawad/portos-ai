"use client";

import React, { useState } from "react";
import { SlidersHorizontal, Clock, Filter, ArrowDownUp, ShieldAlert, RotateCcw } from "lucide-react";

export type ForecastHorizon = 0 | 6 | 12 | 24;
export type ZoneFilter = "ALL" | "IMPORT" | "EXPORT" | "REEFER";
export type RiskFilter = "ALL" | "NORMAL" | "WATCH" | "HIGH_RISK";
export type SortOption = "OCCUPANCY_DESC" | "OCCUPANCY_ASC" | "CODE_ASC" | "CAPACITY_DESC";

interface YardControlsBarProps {
  activeHorizon: ForecastHorizon;
  onHorizonChange: (h: ForecastHorizon) => void;
  zoneFilter: ZoneFilter;
  onZoneFilterChange: (z: ZoneFilter) => void;
  riskFilter: RiskFilter;
  onRiskFilterChange: (r: RiskFilter) => void;
  sortBy: SortOption;
  onSortByChange: (s: SortOption) => void;
  warningThreshold: number;
  onWarningThresholdChange: (val: number) => void;
  criticalThreshold: number;
  onCriticalThresholdChange: (val: number) => void;
  onResetThresholds: () => void;
}

export function YardControlsBar({
  activeHorizon,
  onHorizonChange,
  zoneFilter,
  onZoneFilterChange,
  riskFilter,
  onRiskFilterChange,
  sortBy,
  onSortByChange,
  warningThreshold,
  onWarningThresholdChange,
  criticalThreshold,
  onCriticalThresholdChange,
  onResetThresholds,
}: YardControlsBarProps) {
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-portos-border p-3.5 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Horizon Selector Tabs */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-portos-navy flex items-center gap-1 mr-1">
            <Clock className="h-3.5 w-3.5 text-portos-navy-secondary" />
            <span>Horizon:</span>
          </span>
          <div className="inline-flex rounded-md p-0.5 bg-slate-100 border border-portos-border text-xs">
            <button
              onClick={() => onHorizonChange(0)}
              className={`px-3 py-1 font-medium rounded transition-all ${
                activeHorizon === 0
                  ? "bg-white text-portos-navy shadow-xs font-semibold"
                  : "text-portos-muted hover:text-portos-navy"
              }`}
            >
              Current (0h)
            </button>
            <button
              onClick={() => onHorizonChange(6)}
              className={`px-3 py-1 font-medium rounded transition-all ${
                activeHorizon === 6
                  ? "bg-portos-teal text-white shadow-xs font-semibold"
                  : "text-portos-muted hover:text-portos-navy"
              }`}
            >
              +6h Forecast
            </button>
            <button
              onClick={() => onHorizonChange(12)}
              className={`px-3 py-1 font-medium rounded transition-all ${
                activeHorizon === 12
                  ? "bg-portos-teal text-white shadow-xs font-semibold"
                  : "text-portos-muted hover:text-portos-navy"
              }`}
            >
              +12h Forecast
            </button>
            <button
              onClick={() => onHorizonChange(24)}
              className={`px-3 py-1 font-medium rounded transition-all ${
                activeHorizon === 24
                  ? "bg-portos-teal text-white shadow-xs font-semibold"
                  : "text-portos-muted hover:text-portos-navy"
              }`}
            >
              +24h Forecast
            </button>
          </div>
        </div>

        {/* Right: Threshold Config Toggle Button */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThresholdConfig(!showThresholdConfig)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors ${
              showThresholdConfig
                ? "bg-slate-100 border-portos-navy text-portos-navy"
                : "bg-white border-portos-border text-portos-muted hover:text-portos-navy"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Thresholds ({warningThreshold}% / {criticalThreshold}%)</span>
          </button>
        </div>
      </div>

      {/* Threshold Configuration Drawer / Expansion */}
      {showThresholdConfig && (
        <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs flex flex-wrap items-center gap-4 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-portos-navy">Warning Threshold (Watch):</span>
            <input
              type="range"
              min="50"
              max="90"
              step="1"
              value={warningThreshold}
              onChange={(e) => onWarningThresholdChange(Number(e.target.value))}
              className="w-24 accent-amber-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
              {warningThreshold}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-portos-navy">Critical Threshold (High Risk):</span>
            <input
              type="range"
              min="80"
              max="99"
              step="1"
              value={criticalThreshold}
              onChange={(e) => onCriticalThresholdChange(Number(e.target.value))}
              className="w-24 accent-rose-500 cursor-pointer"
            />
            <span className="font-mono font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
              {criticalThreshold}%
            </span>
          </div>

          <button
            onClick={onResetThresholds}
            className="text-[11px] text-portos-muted hover:text-portos-navy flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-white ml-auto"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset (85% / 95%)</span>
          </button>
        </div>
      )}

      {/* Filters and Sorting Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
        {/* Left: Zone & Risk Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Zone Filter */}
          <div className="flex items-center gap-1">
            <span className="text-portos-muted font-medium">Zone:</span>
            <select
              value={zoneFilter}
              onChange={(e) => onZoneFilterChange(e.target.value as ZoneFilter)}
              className="bg-white border border-portos-border rounded px-2 py-1 text-portos-navy font-medium focus:outline-none focus:ring-1 focus:ring-portos-teal"
            >
              <option value="ALL">All Sectors (12 Blocks)</option>
              <option value="IMPORT">Import Staging</option>
              <option value="EXPORT">Export Aggregation</option>
              <option value="REEFER">Reefer Cold-Chain</option>
            </select>
          </div>

          {/* Risk Tier Filter */}
          <div className="flex items-center gap-1">
            <span className="text-portos-muted font-medium">Risk Status:</span>
            <select
              value={riskFilter}
              onChange={(e) => onRiskFilterChange(e.target.value as RiskFilter)}
              className="bg-white border border-portos-border rounded px-2 py-1 text-portos-navy font-medium focus:outline-none focus:ring-1 focus:ring-portos-teal"
            >
              <option value="ALL">All States</option>
              <option value="NORMAL">Normal Only</option>
              <option value="WATCH">Watch Only</option>
              <option value="HIGH_RISK">High Risk Only</option>
            </select>
          </div>
        </div>

        {/* Right: Sort By */}
        <div className="flex items-center gap-1.5">
          <ArrowDownUp className="h-3.5 w-3.5 text-portos-muted" />
          <span className="text-portos-muted font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as SortOption)}
            className="bg-white border border-portos-border rounded px-2 py-1 text-portos-navy font-medium focus:outline-none focus:ring-1 focus:ring-portos-teal"
          >
            <option value="OCCUPANCY_DESC">Highest Occupancy %</option>
            <option value="OCCUPANCY_ASC">Lowest Occupancy %</option>
            <option value="CODE_ASC">Block Code (YB-01 to YB-12)</option>
            <option value="CAPACITY_DESC">Total Capacity TEU</option>
          </select>
        </div>
      </div>
    </div>
  );
}

