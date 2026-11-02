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
    <div className="rounded-lg border border-portos-border bg-portos-surface shadow-sm overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-portos-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-portos-amber" />
          <h3 className="text-sm font-bold text-portos-navy">
            Operational Alerts & Disruption Timeline
          </h3>
          <DataStatusBadge status="SIMULATED" size="sm" />
        </div>

        <Link
          href="/scenario-lab"
          className="text-xs font-medium text-portos-navy hover:text-portos-teal flex items-center gap-1 transition-colors"
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

