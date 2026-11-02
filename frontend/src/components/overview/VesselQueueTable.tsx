"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVesselCalls } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { TableRowSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Ship, Clock, AlertTriangle } from "lucide-react";
import { VesselCallRead } from "@/types/api";

export function VesselQueueTable() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["vessel-queue", statusFilter],
    queryFn: () =>
      getVesselCalls({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        pageSize: 15,
      }),
  });

  const filterButtons = [
    { label: "All Vessels", value: "ALL" },
    { label: "Outer Anchorage", value: "OUTER_ANCHORAGE" },
    { label: "Berthed", value: "BERTHED" },
    { label: "En Route", value: "EN_ROUTE" },
  ];

  return (
    <div className="rounded-lg border border-portos-border bg-portos-surface shadow-sm overflow-hidden flex flex-col">
      {/* Header & Filter Controls */}
      <div className="px-5 py-3.5 border-b border-portos-border flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-portos-navy-secondary" />
          <h3 className="text-sm font-bold text-portos-navy">
            Incoming Vessel Queue & Outer Anchorage Arrivals
          </h3>
          <DataStatusBadge status="SIMULATED" size="sm" />
        </div>

        <div className="flex items-center gap-1.5 bg-portos-bg p-0.5 rounded border border-portos-border text-xs">
          {filterButtons.map((fb) => (
            <button
              key={fb.value}
              onClick={() => setStatusFilter(fb.value)}
              className={`px-2.5 py-1 rounded transition-colors text-[11px] font-medium ${
                statusFilter === fb.value
                  ? "bg-white text-portos-navy font-semibold shadow-xs"
                  : "text-portos-muted hover:text-portos-navy"
              }`}
            >
              {fb.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-portos-border bg-portos-bg/60 text-[11px] font-semibold text-portos-muted uppercase tracking-wider">
              <th className="py-2.5 px-4">Vessel & Call</th>
              <th className="py-2.5 px-4">Dimensions</th>
              <th className="py-2.5 px-4">Reported ETA</th>
              <th className="py-2.5 px-4">Predicted Delay</th>
              <th className="py-2.5 px-4">Status</th>
              <th className="py-2.5 px-4">Delay Risk</th>
              <th className="py-2.5 px-4 text-right">Data Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-portos-border/60">
            {isLoading && (
              <>
                <TableRowSkeleton columns={7} />
                <TableRowSkeleton columns={7} />
                <TableRowSkeleton columns={7} />
                <TableRowSkeleton columns={7} />
              </>
            )}

            {!isLoading && isError && (
              <tr>
                <td colSpan={7} className="p-6">
                  <ErrorState
                    title="Failed to load vessel queue"
                    message={error instanceof Error ? error.message : "API request failed."}
                    onRetry={() => refetch()}
                  />
                </td>
              </tr>
            )}

            {!isLoading && !isError && (!data?.items || data.items.length === 0) && (
              <tr>
                <td colSpan={7} className="p-8">
                  <EmptyState
                    title="No vessels found"
                    description={`No vessels currently match the '${statusFilter}' operational filter.`}
                    icon={Ship}
                  />
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              data?.items &&
              data.items.map((call: VesselCallRead) => {
                const repDate = new Date(call.reported_eta);
                const hasDelay = call.predicted_delay_hours > 0;

                return (
                  <tr key={call.id} className="hover:bg-portos-bg/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-portos-navy">
                        {call.vessel?.name || "DEMO Feeder Vessel"}
                      </div>
                      <div className="text-[11px] text-portos-muted font-mono flex items-center gap-1.5">
                        <span>{call.call_number}</span>
                        <span>·</span>
                        <span>IMO: {call.vessel?.imo_number}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono tabular-nums text-[11px] text-portos-navy">
                      <div>LOA: {call.vessel?.length_overall_m}m</div>
                      <div className="text-portos-muted">Draft: {call.vessel?.max_draft_m}m</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="text-portos-navy font-mono tabular-nums text-[11px]">
                        {repDate.toLocaleDateString("en-GB", { month: "short", day: "numeric" })}{" "}
                        {repDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="text-[10px] text-portos-muted">BST (UTC+6)</div>
                    </td>

                    <td className="py-3 px-4">
                      {hasDelay ? (
                        <div className="font-semibold text-portos-red font-mono tabular-nums text-[11px]">
                          +{call.predicted_delay_hours} hrs
                        </div>
                      ) : (
                        <div className="font-medium text-portos-teal font-mono tabular-nums text-[11px]">
                          On Schedule
                        </div>
                      )}
                      <div className="text-[10px] text-portos-muted">ML Forecast</div>
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge
                        status={
                          call.status === "BERTHED"
                            ? "normal"
                            : call.status === "OUTER_ANCHORAGE"
                            ? "watch"
                            : "neutral"
                        }
                        label={call.status ? call.status.replace("_", " ") : "UNKNOWN"}
                        size="sm"
                      />
                    </td>

                    <td className="py-3 px-4">
                      <StatusBadge
                        status={
                          call.delay_risk_status === "HIGH_RISK"
                            ? "danger"
                            : call.delay_risk_status === "WATCH"
                            ? "watch"
                            : "normal"
                        }
                        label={call.delay_risk_status ? call.delay_risk_status.replace("_", " ") : "NORMAL"}
                        size="sm"
                      />
                    </td>

                    <td className="py-3 px-4 text-right">
                      <DataStatusBadge status={call.data_status} size="sm" />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

