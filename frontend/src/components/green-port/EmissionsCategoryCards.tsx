"use client";

import React, { useState } from "react";
import { PollutantBreakdown, PollutantType } from "@/types/api";
import {
  Ship,
  Anchor,
  Compass,
  Zap,
  Truck,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Calculator,
  AlertTriangle,
} from "lucide-react";

interface EmissionsCategoryCardsProps {
  pollutantSummaries: PollutantBreakdown[];
  onOpenFactorDrawer: () => void;
}

export function EmissionsCategoryCards({
  pollutantSummaries,
  onOpenFactorDrawer,
}: EmissionsCategoryCardsProps) {
  const [selectedPollutant, setSelectedPollutant] = useState<PollutantType>("CO2E");

  const currentSummary =
    pollutantSummaries.find((p) => p.pollutant === selectedPollutant) || pollutantSummaries[0];

  const getActivityIcon = (type: string, name: string) => {
    if (type === "VESSEL_HOTELING_AUX_ENGINE") {
      return name.includes("Anchorage") ? (
        <Anchor className="h-4 w-4 text-amber-600" />
      ) : (
        <Ship className="h-4 w-4 text-sky-600" />
      );
    }
    if (type === "VESSEL_MANEUVERING") {
      return <Compass className="h-4 w-4 text-indigo-600" />;
    }
    if (type === "STS_CRANE_ELECTRIC") {
      return <Zap className="h-4 w-4 text-sky-600" />;
    }
    if (type === "YARD_EQUIPMENT_DIESEL") {
      return <Truck className="h-4 w-4 text-slate-700" />;
    }
    return <Ship className="h-4 w-4 text-slate-900" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Pollutant Tabs Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="h-4 w-4 text-sky-600" />
            <span>Activity Emissions by Pollutant / Gas</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Transparent factor equations for modeled quayside, anchorage, and yard operations.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-full self-start sm:self-auto">
          {pollutantSummaries.map((summary) => {
            const isActive = summary.pollutant === selectedPollutant;
            return (
              <button
                key={summary.pollutant}
                onClick={() => setSelectedPollutant(summary.pollutant)}
                className={`px-3.5 py-1 text-xs font-semibold rounded-full transition-colors ${
                  isActive
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {summary.pollutant}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Pollutant Overview Strip */}
      <div className="px-4 py-3 bg-white border-b border-portos-border flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs text-portos-muted block uppercase tracking-wider font-semibold">
            Active Pollutant Scope
          </span>
          <span className="text-sm font-bold text-portos-navy">
            {currentSummary.pollutant_name}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Modeled Total</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {currentSummary.total_mt.toFixed(3)}
              </span>
              <span className="text-xs font-semibold text-slate-700">MT</span>
              <span className="text-xs text-slate-500 font-medium tabular-nums">
                ({currentSummary.total_kg.toLocaleString()} {currentSummary.unit})
              </span>
            </div>
          </div>
          <button
            onClick={onOpenFactorDrawer}
            className="px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-full border border-sky-200 transition-colors shadow-2xs"
          >
            Factor Dictionary
          </button>
        </div>
      </div>

      {/* Activities Grid */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentSummary.activities.map((act) => {
          const isConfigured = act.is_configured;
          const isVerified = act.factor_status === "VERIFIED_SOURCE";

          return (
            <div
              key={act.activity_type + act.activity_name}
              className={`p-4 rounded-2xl border flex flex-col justify-between transition-colors ${
                isConfigured
                  ? "bg-slate-50/70 border-slate-200 hover:border-sky-500 hover:bg-white"
                  : "bg-slate-50/40 border-dashed border-slate-300"
              }`}
            >
              <div>
                {/* Activity Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-white border border-slate-200">
                      {getActivityIcon(act.activity_type, act.activity_name)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-portos-navy">
                        {act.activity_name}
                      </h3>
                      <span className="text-[10px] text-portos-muted block">
                        {act.scope_category}
                      </span>
                    </div>
                  </div>

                  {/* Factor Status Badge */}
                  {isConfigured ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                        isVerified
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {isVerified ? (
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <HelpCircle className="h-3 w-3 text-amber-600" />
                      )}
                      <span>
                        {isVerified ? "Verified Source" : "Illustrative Assumption"}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      <AlertTriangle className="h-3 w-3 text-slate-500" />
                      <span>Not configured</span>
                    </span>
                  )}
                </div>

                {/* Quantitative Value */}
                {isConfigured ? (
                  <div className="my-3 py-2.5 px-3.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Estimated Emissions
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-bold text-slate-900 tabular-nums">
                          {(act.estimated_mt ?? 0).toFixed(3)}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">MT</span>
                        <span className="text-xs text-slate-500 font-medium tabular-nums">
                          ({(act.estimated_kg ?? 0).toLocaleString()} kg)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                        Modeled Activity
                      </span>
                      <span className="text-xs font-semibold text-slate-800 tabular-nums">
                        {act.activity_quantity.toLocaleString()} {act.activity_unit}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="my-3 py-3 px-3 bg-white/70 rounded-xl border border-dashed border-slate-300 text-center">
                    <span className="text-xs font-medium text-slate-500 italic block">
                      No verified or defensible factor configured for this combination
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Value not fabricated or hallucinated
                    </span>
                  </div>
                )}

                {/* Mathematical Formula String */}
                <div className="mb-2">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-0.5">
                    Equation & Applied Factor
                  </span>
                  <div className="px-2.5 py-1 rounded-lg bg-slate-100 font-medium text-[11px] text-slate-800 break-all border border-slate-200">
                    {act.formula_expression}
                  </div>
                </div>
              </div>

              {/* Source Lineage */}
              {isConfigured && act.source_reference && (
                <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-start justify-between gap-2 mt-1">
                  <span className="line-clamp-2 leading-relaxed">
                    Source: <strong className="text-slate-700">{act.source_reference}</strong>
                  </span>
                  {act.source_url && (
                    <a
                      href={act.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 shrink-0 inline-flex items-center gap-0.5 font-medium"
                      title="Inspect published methodology"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
