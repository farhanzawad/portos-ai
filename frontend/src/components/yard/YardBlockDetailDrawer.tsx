"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getYardBlockDetail } from "@/lib/api-client";
import {
  X,
  Layers,
  ArrowRight,
  TrendingUp,
  Clock,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  History,
  Box,
  HelpCircle,
  FileText,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Skeleton } from "@/components/ui/LoadingSkeleton";

interface YardBlockDetailDrawerProps {
  blockId: string | null;
  onClose: () => void;
  warningThreshold: number;
  criticalThreshold: number;
}

export function YardBlockDetailDrawer({
  blockId,
  onClose,
  warningThreshold,
  criticalThreshold,
}: YardBlockDetailDrawerProps) {
  const { data: detail, isLoading, error } = useQuery({
    queryKey: ["yard-block-detail", blockId],
    queryFn: () => (blockId ? getYardBlockDetail(blockId) : null),
    enabled: Boolean(blockId),
  });

  if (!blockId) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl bg-white border-l border-portos-border shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-4 border-b border-portos-border bg-portos-bg/50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-portos-navy text-white">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-portos-navy font-mono">
                {detail?.block.code || "Sector Detail"}
              </h2>
              {detail && <DataStatusBadge status={detail.data_status} />}
            </div>
            <p className="text-xs text-portos-muted">
              {detail ? `${detail.block.name} • Zone: ${detail.block.zone}` : "Loading sector telemetry..."}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-md hover:bg-slate-200 text-portos-muted hover:text-portos-navy transition-colors"
          title="Close drawer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs">
            Failed to load sector telemetry. Please check the network connection.
          </div>
        )}

        {detail && (
          <>
            {/* Quick 3D Twin Deep-Link Button */}
            <div className="bg-slate-900 rounded-lg p-3 text-white flex items-center justify-between shadow-xs">
              <div>
                <span className="text-xs font-semibold block text-slate-100">
                  3D Spatial Twin Integration
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Focus sector {detail.block.code} in interactive digital twin.
                </span>
              </div>
              <Link
                href={`/digital-twin?block=${encodeURIComponent(detail.block.code)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-portos-teal hover:bg-teal-600 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <span>Inspect in 3D</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Current Utilization Card */}
            <div className="bg-white rounded-lg border border-portos-border p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-portos-muted">
                  Current Density & Capacity
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    detail.current_status.current_occupancy_pct >= criticalThreshold
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : detail.current_status.current_occupancy_pct >= warningThreshold
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-teal-50 text-teal-700 border border-teal-200"
                  }`}
                >
                  {detail.current_status.current_risk_tier}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-2.5 rounded bg-portos-bg border border-portos-border/60">
                  <span className="text-[10px] text-portos-muted uppercase font-medium">Occupied TEU</span>
                  <div className="text-xl font-bold font-mono text-portos-navy mt-0.5">
                    {detail.current_status.current_occupied_teu}
                    <span className="text-xs text-portos-muted font-normal"> / {detail.block.teu_capacity}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-portos-bg border border-portos-border/60">
                  <span className="text-[10px] text-portos-muted uppercase font-medium">Occupancy Rate</span>
                  <div className="text-xl font-bold font-mono text-portos-navy mt-0.5">
                    {detail.current_status.current_occupancy_pct.toFixed(1)}%
                  </div>
                </div>
              </div>

              {detail.block.zone === "REEFER" && (
                <div className="text-xs text-blue-700 bg-blue-50/70 p-2 rounded border border-blue-200 flex items-center justify-between">
                  <span>Reefer Plugged Containers:</span>
                  <span className="font-mono font-bold">{detail.current_status.reefer_occupied_count} TEU</span>
                </div>
              )}
            </div>

            {/* Multi-Horizon Projections Matrix */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-portos-navy flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-portos-navy-secondary" />
                  <span>Multi-Horizon Forecasts</span>
                </h3>
                <span className="text-[10px] text-portos-muted font-mono">
                  Model: {detail.model_metadata.model_name || "GBM"}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {[detail.current_status.forecast_6h, detail.current_status.forecast_12h, detail.current_status.forecast_24h].map(
                  (fc) => (
                    <div
                      key={fc.horizon_hrs}
                      className="p-3 rounded-lg border border-portos-border bg-slate-50/70 space-y-1.5 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-portos-navy">+{fc.horizon_hrs}h</span>
                        <span
                          className={`text-[9px] font-bold px-1 rounded uppercase ${
                            fc.predicted_occupancy_pct >= criticalThreshold
                              ? "bg-rose-100 text-rose-800"
                              : fc.predicted_occupancy_pct >= warningThreshold
                              ? "bg-amber-100 text-amber-800"
                              : "bg-teal-100 text-teal-800"
                          }`}
                        >
                          {fc.risk_tier}
                        </span>
                      </div>

                      <div>
                        <div className="text-lg font-bold font-mono text-portos-navy">
                          {fc.predicted_occupancy_pct.toFixed(1)}%
                        </div>
                        <div className="text-[10px] text-portos-muted font-mono">
                          {fc.predicted_occupied_teu} TEU
                        </div>
                      </div>

                      <div className="text-[9px] text-portos-muted font-mono border-t border-slate-200 pt-1">
                        95% CI: [{fc.confidence_lower_pct}%–{fc.confidence_upper_pct}%]
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Explanatory Factors Breakdown */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-portos-navy flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-portos-navy-secondary" />
                <span>Forecasting Explainability & Factors (+6h)</span>
              </h3>

              <div className="space-y-2">
                {detail.current_status.forecast_6h.explanatory_factors.map((f, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded border border-portos-border bg-white text-xs flex items-start justify-between gap-2 shadow-2xs"
                  >
                    <div>
                      <span className="font-semibold text-portos-navy block">{f.factor}</span>
                      <p className="text-[11px] text-portos-muted mt-0.5">{f.description}</p>
                    </div>
                    <span
                      className={`font-mono font-bold px-1.5 py-0.5 rounded text-xs shrink-0 ${
                        f.impact_teu > 0
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-teal-50 text-teal-700 border border-teal-200"
                      }`}
                    >
                      {f.impact_teu > 0 ? `+${f.impact_teu}` : f.impact_teu} TEU
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Historical Observations (Past 24h) */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-portos-navy flex items-center gap-1.5">
                <History className="h-3.5 w-3.5 text-portos-navy-secondary" />
                <span>Historical Occupancy Timeline (Last 24h)</span>
              </h3>

              <div className="max-h-44 overflow-y-auto rounded border border-portos-border divide-y divide-slate-100 text-xs">
                {detail.history_observations.map((obs) => {
                  const date = new Date(obs.timestamp);
                  return (
                    <div key={obs.id} className="p-2 flex items-center justify-between hover:bg-slate-50">
                      <span className="font-mono text-portos-muted text-[11px]">
                        {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        <span className="text-[10px] text-slate-400 ml-1">({date.toLocaleDateString()})</span>
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-portos-navy">{obs.occupancy_pct}%</span>
                        <span className="text-portos-muted font-mono text-[11px]">
                          {obs.occupied_teu} TEU
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Container Movements */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-portos-navy flex items-center gap-1.5">
                <Box className="h-3.5 w-3.5 text-portos-navy-secondary" />
                <span>Recent Container Movements (TOS Transfers)</span>
              </h3>

              <div className="max-h-40 overflow-y-auto rounded border border-portos-border divide-y divide-slate-100 text-xs">
                {detail.recent_movements.map((mov) => (
                  <div key={mov.id} className="p-2 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <span className="font-semibold text-portos-navy">{mov.movement_type}</span>
                      {mov.vessel_call_id && (
                        <span className="text-[10px] text-portos-muted font-mono block">
                          Call: {mov.vessel_call_id}
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-bold text-portos-navy bg-slate-100 px-1.5 py-0.5 rounded">
                      {mov.teu_count} TEU
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Provenance & Limitations Card */}
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50 text-xs space-y-1.5 text-portos-muted">
              <div className="flex items-center gap-1.5 font-semibold text-portos-navy">
                <FileText className="h-3.5 w-3.5" />
                <span>Operational Data Provenance & Audit Trail</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                <strong>Data Source:</strong> {detail.block.source_name} ({detail.data_status})
              </p>
              <p className="text-[11px] leading-relaxed">
                <strong>Model:</strong> {detail.model_metadata.model_name} (v{detail.model_metadata.model_version})
                with ±{detail.model_metadata.uncertainty_margin_pct}% uncertainty bounds.
              </p>
              <p className="text-[10px] text-slate-500 pt-1 border-t border-slate-200 italic">
                {detail.model_metadata.limitations}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

