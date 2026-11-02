"use client";

import React from "react";
import { VesselCallRead } from "@/types/api";
import { VesselFilterState } from "./types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Search, Ship, Filter, Clock, AlertTriangle } from "lucide-react";

interface VesselListPanelProps {
  calls: VesselCallRead[];
  selectedCallId: string | null;
  onSelectCall: (call: VesselCallRead) => void;
  filters: VesselFilterState;
  onFiltersChange: React.Dispatch<React.SetStateAction<VesselFilterState>>;
}

export function VesselListPanel({
  calls,
  selectedCallId,
  onSelectCall,
  filters,
  onFiltersChange,
}: VesselListPanelProps) {
  const filteredCalls = calls.filter((call) => {
    // Search query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = call.vessel?.name.toLowerCase().includes(q);
      const matchImo = call.vessel?.imo_number.toLowerCase().includes(q);
      const matchCall = call.call_number.toLowerCase().includes(q);
      if (!matchName && !matchImo && !matchCall) return false;
    }

    // Status filter
    if (filters.status !== "ALL" && call.status !== filters.status) {
      return false;
    }

    // Delay risk filter
    if (
      filters.delayRisk !== "ALL" &&
      call.delay_risk_status !== filters.delayRisk
    ) {
      return false;
    }

    return true;
  });

  const statusOptions = [
    { label: "All Status", value: "ALL" },
    { label: "Anchorage", value: "OUTER_ANCHORAGE" },
    { label: "Pilotage", value: "PILOT_BOARDING" },
    { label: "Berthed", value: "BERTHED" },
    { label: "En Route", value: "EN_ROUTE" },
  ];

  const riskOptions = [
    { label: "All Risk", value: "ALL" },
    { label: "Normal", value: "NORMAL" },
    { label: "Watch", value: "WATCH" },
    { label: "High Risk", value: "HIGH_RISK" },
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-portos-border shadow-sm overflow-hidden text-xs">
      {/* Search & Filter Header */}
      <div className="p-3 border-b border-portos-border bg-portos-surface space-y-2.5">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-portos-muted" />
          <input
            type="text"
            placeholder="Search vessel name, IMO, or call..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-8 pr-3 py-1.5 rounded bg-portos-bg border border-portos-border text-xs text-portos-navy placeholder:text-portos-muted focus:outline-none focus:ring-1 focus:ring-portos-teal"
          />
        </div>

        {/* Filter Selectors */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 text-[11px] text-portos-muted font-medium">
            <Filter className="h-3 w-3" />
            <span>Filters:</span>
          </div>

          <select
            value={filters.status}
            onChange={(e) =>
              onFiltersChange((prev) => ({ ...prev, status: e.target.value }))
            }
            aria-label="Filter vessels by operational status"
            className="px-2 py-1 bg-white rounded border border-portos-border text-[11px] text-portos-navy font-medium focus:outline-none focus:ring-1 focus:ring-portos-teal"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={filters.delayRisk}
            onChange={(e) =>
              onFiltersChange((prev) => ({ ...prev, delayRisk: e.target.value }))
            }
            aria-label="Filter vessels by delay risk tier"
            className="px-2 py-1 bg-white rounded border border-portos-border text-[11px] text-portos-navy font-medium focus:outline-none focus:ring-1 focus:ring-portos-teal"
          >
            {riskOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <span className="ml-auto font-mono text-[10px] text-portos-muted">
            {filteredCalls.length} / {calls.length}
          </span>
        </div>
      </div>

      {/* Vessel List Cards */}
      <div className="flex-1 overflow-y-auto divide-y divide-portos-border/60">
        {filteredCalls.length === 0 ? (
          <div className="p-8 text-center text-portos-muted">
            <Ship className="h-6 w-6 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-xs">No vessels match filter</p>
            <p className="text-[11px] mt-1">
              Try adjusting your search query or status criteria.
            </p>
          </div>
        ) : (
          filteredCalls.map((call) => {
            const isSelected = selectedCallId === call.id;
            const repDate = new Date(call.reported_eta);
            const hasDelay = call.predicted_delay_hours > 0;

            return (
              <button
                key={call.id}
                onClick={() => onSelectCall(call)}
                className={`w-full p-3 text-left transition-all hover:bg-portos-bg/60 flex flex-col gap-1.5 ${
                  isSelected
                    ? "bg-portos-teal-light/40 border-l-4 border-l-portos-teal shadow-xs"
                    : "border-l-4 border-l-transparent"
                }`}
              >
                {/* Vessel Name & Status Row */}
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-portos-navy truncate text-xs">
                    {call.vessel?.name || "DEMO Vessel"}
                  </span>
                  <StatusBadge
                    status={
                      call.delay_risk_status === "HIGH_RISK"
                        ? "danger"
                        : call.delay_risk_status === "WATCH"
                        ? "watch"
                        : "normal"
                    }
                    label={call.delay_risk_status || "NORMAL"}
                    size="sm"
                  />
                </div>

                {/* Subtitle: Call Number & IMO */}
                <div className="text-[11px] font-mono text-portos-muted flex items-center gap-1.5">
                  <span>{call.call_number}</span>
                  <span>·</span>
                  <span>{call.vessel?.imo_number}</span>
                  <span>·</span>
                  <span>{call.vessel?.flag_country || "Bangladesh"}</span>
                </div>

                {/* Dimensions & ETA Strip */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-portos-border/40 font-mono">
                  <span className="text-portos-muted">
                    LOA {call.vessel?.length_overall_m}m · Draft{" "}
                    {call.vessel?.max_draft_m}m
                  </span>

                  <span
                    className={
                      call.predicted_delay_hours > 2
                        ? "text-portos-red font-bold"
                        : hasDelay
                        ? "text-portos-amber font-semibold"
                        : "text-portos-teal font-medium"
                    }
                  >
                    +{call.predicted_delay_hours}h delay
                  </span>
                </div>

                {/* Navigational status badge */}
                <div className="flex items-center justify-between text-[10px] text-portos-muted pt-0.5">
                  <span className="font-semibold text-portos-navy-secondary">
                    {call.status.replace("_", " ")}
                  </span>
                  <DataStatusBadge status="SIMULATED" size="sm" />
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

