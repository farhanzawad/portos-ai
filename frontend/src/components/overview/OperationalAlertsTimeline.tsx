"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getOperationalEvents } from "@/lib/api-client";
import { AlertRow, AlertSeverity } from "@/components/ui/AlertRow";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { OperationalEventRead } from "@/types/api";

export function OperationalAlertsTimeline() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["operational-events"],
    queryFn: () => getOperationalEvents({ pageSize: 5 }),
  });

  const mapSeverity = (sev: string): AlertSeverity => {
    switch (sev) {
      case "CRITICAL":
        return "critical";
      case "WARNING":
        return "warning";
      case "NORMAL":
        return "normal";
      default:
        return "info";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden flex flex-col font-sans">
      <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Operational Alerts & Disruption Timeline
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Real-time bottleneck telemetry & channel advisories
            </p>
          </div>
          <DataStatusBadge status="SIMULATED" size="sm" />
        </div>

        <Link
          href="/scenario-lab"
          className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full hover:bg-sky-100 flex items-center gap-1 transition-all"
        >
          <span>Scenario Lab</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="p-4 space-y-2.5">
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        )}

        {!isLoading && (isError || !data?.items || data.items.length === 0) && (
          <EmptyState
            title="No operational disruptions logged"
            description="Terminal operations are proceeding normally under baseline conditions."
            icon={AlertTriangle}
          />
        )}

        {!isLoading &&
          !isError &&
          data?.items &&
          data.items.map((event: OperationalEventRead) => {
            const evDate = new Date(event.timestamp);
            const timeStr =
              evDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " BST";

            return (
              <AlertRow
                key={event.id}
                severity={mapSeverity(event.severity)}
                title={event.title}
                description={event.description}
                timestamp={timeStr}
                source={event.source_name}
                dataStatus={event.data_status}
                actionLabel="Inspect"
                onAction={() => alert(`Reviewing alert: ${event.title}`)}
              />
            );
          })}
      </div>
    </div>
  );
}
