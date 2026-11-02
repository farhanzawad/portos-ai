"use client";

import React, { useState } from "react";
import { YardCongestionAlert } from "@/types/api";
import { AlertTriangle, ChevronDown, ChevronUp, ShieldAlert, ArrowRight } from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface YardAlertStripProps {
  alerts: YardCongestionAlert[];
  onSelectBlock?: (blockId: string) => void;
}

export function YardAlertStrip({ alerts, onSelectBlock }: YardAlertStripProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!alerts || alerts.length === 0) return null;

  const criticalCount = alerts.filter((a) => a.risk_tier === "HIGH_RISK").length;

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-3.5 shadow-xs transition-all">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-rose-100 text-rose-700">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-rose-950">
                {criticalCount > 0 ? "Critical Yard Saturation Alerts" : "Yard Density Warning Notifications"}
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-200/80 text-rose-800">
                {alerts.length} Active
              </span>
              <DataStatusBadge status="SIMULATED" />
            </div>
            <p className="text-[11px] text-rose-800/80 mt-0.5">
              Proactive congestion triggers derived from multi-horizon predictive ML model.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-rose-700 hover:text-rose-900 font-medium flex items-center gap-1 px-2 py-1 rounded hover:bg-rose-100/60 transition-colors"
        >
          <span>{isExpanded ? "Collapse" : "Review All"}</span>
          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-2 pt-2 border-t border-rose-200/60">
          {alerts.map((alert) => (
            <div
              key={alert.block_id}
              className="bg-white/90 rounded border border-rose-200 p-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-portos-navy bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {alert.block_code}
                  </span>
                  <span
                    className={`font-semibold text-[11px] ${
                      alert.risk_tier === "HIGH_RISK" ? "text-rose-700" : "text-amber-700"
                    }`}
                  >
                    {alert.title}
                  </span>
                  <span className="text-[10px] text-portos-muted font-mono">
                    Current: {alert.current_pct}% &rarr; Peak: {alert.peak_forecast_pct}% (+{alert.peak_horizon_hrs}h)
                  </span>
                </div>
                <p className="text-portos-navy-secondary text-[11px] leading-relaxed">
                  <span className="font-semibold text-portos-navy">Recommendation:</span> {alert.recommended_action}
                </p>
              </div>

              {onSelectBlock && (
                <button
                  onClick={() => onSelectBlock(alert.block_id)}
                  className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-portos-navy bg-slate-50 hover:bg-slate-100 border border-portos-border rounded transition-colors self-start md:self-center"
                >
                  <span>Inspect Sector</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

