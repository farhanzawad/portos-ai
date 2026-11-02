"use client";

import React from "react";
import { VesselCallRead } from "@/types/api";
import { Ship, Anchor, Clock, AlertTriangle, Radio } from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface AnchorageQueueSummaryProps {
  calls: VesselCallRead[];
}

export function AnchorageQueueSummary({ calls }: AnchorageQueueSummaryProps) {
  const total = calls.length;
  const anchored = calls.filter((c) => c.status === "OUTER_ANCHORAGE").length;
  const pilot = calls.filter((c) => c.status === "PILOT_BOARDING").length;
  const berthed = calls.filter((c) => c.status === "BERTHED").length;

  const totalDelay = calls.reduce((acc, c) => acc + (c.predicted_delay_hours || 0), 0);
  const avgDelay = total > 0 ? (totalDelay / total).toFixed(1) : "0.0";

  return (
    <div className="space-y-3">
      {/* Missing AIS Connection Warning Banner (Prompt 07 Requirement) */}
      <div className="p-3 bg-portos-amber-light/30 border border-portos-amber/40 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-portos-navy font-medium">
          <div className="p-1 rounded bg-portos-amber text-white">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
          </div>
          <span>
            <strong>No live AIS connection — demo track only.</strong> Vessel
            positions, track progressions, and arrival timestamps are
            synthetically simulated for decision evaluation.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <DataStatusBadge status="SIMULATED" size="sm" />
          <span className="font-mono text-[10px] text-portos-muted">
            Karnaphuli Channel Datum (CD +0.0m)
          </span>
        </div>
      </div>

      {/* Corridor Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs">
          <span className="text-[10px] font-semibold text-portos-muted uppercase tracking-wider block">
            Vessels in Corridor
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {total}
            </span>
            <Ship className="h-4 w-4 text-portos-navy-secondary" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs">
          <span className="text-[10px] font-semibold text-portos-muted uppercase tracking-wider block">
            Outer Anchorage
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-portos-amber">
              {anchored}
            </span>
            <Anchor className="h-4 w-4 text-portos-amber" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs">
          <span className="text-[10px] font-semibold text-portos-muted uppercase tracking-wider block">
            Pilotage Boarding
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-sky-600">
              {pilot}
            </span>
            <Ship className="h-4 w-4 text-sky-600" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs">
          <span className="text-[10px] font-semibold text-portos-muted uppercase tracking-wider block">
            Berthed at Quayside
          </span>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xl font-bold font-mono text-portos-teal">
              {berthed}
            </span>
            <Anchor className="h-4 w-4 text-portos-teal" />
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs col-span-2 sm:col-span-1">
          <span className="text-[10px] font-semibold text-portos-muted uppercase tracking-wider block">
            Mean Predicted Delay
          </span>
          <div className="flex items-center justify-between mt-1">
            <span
              className={`text-xl font-bold font-mono ${
                Number(avgDelay) > 2.0 ? "text-portos-red" : "text-portos-teal"
              }`}
            >
              +{avgDelay}h
            </span>
            <Clock className="h-4 w-4 text-portos-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

