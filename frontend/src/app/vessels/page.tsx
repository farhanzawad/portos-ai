"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { getVesselCalls, getVesselTrack } from "@/lib/api-client";
import { VesselCallRead } from "@/types/api";
import { VesselFilterState } from "@/components/vessels/types";
import { AnchorageQueueSummary } from "@/components/vessels/AnchorageQueueSummary";
import { VesselListPanel } from "@/components/vessels/VesselListPanel";
import { VesselDetailDrawer } from "@/components/vessels/VesselDetailDrawer";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Ship, Map, ListFilter, FileText } from "lucide-react";

// Dynamically import MapLibre GL map container to guarantee client-only execution
const VesselMap = dynamic(
  () =>
    import("@/components/vessels/VesselMap").then((mod) => mod.VesselMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[580px] bg-slate-950 rounded-lg border border-portos-border flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-portos-teal animate-ping" />
          <span>Loading MapLibre Geographic Engine & Maritime Layers...</span>
        </div>
      </div>
    ),
  }
);

export default function VesselsPage() {
  const [selectedCall, setSelectedCall] = useState<VesselCallRead | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map" | "detail">("list");

  const [filters, setFilters] = useState<VesselFilterState>({
    search: "",
    status: "ALL",
    delayRisk: "ALL",
  });

  // Query vessel calls list
  const { data: callsResponse, isLoading: callsLoading } = useQuery({
    queryKey: ["vessel-calls", filters.status, filters.delayRisk],
    queryFn: () =>
      getVesselCalls({
        pageSize: 50,
        status: filters.status === "ALL" ? undefined : filters.status,
        delayRiskStatus:
          filters.delayRisk === "ALL" ? undefined : filters.delayRisk,
      }),
  });

  const calls = useMemo(
    () => callsResponse?.items || [],
    [callsResponse?.items]
  );

  // Default select the first vessel once data is loaded
  useEffect(() => {
    if (!selectedCall && calls.length > 0) {
      setSelectedCall(calls[0]);
    }
  }, [calls, selectedCall]);

  // Query track data for currently selected vessel
  const { data: trackData, isLoading: trackLoading } = useQuery({
    queryKey: ["vessel-track", selectedCall?.id],
    queryFn: () =>
      selectedCall ? getVesselTrack(selectedCall.id) : Promise.reject(),
    enabled: !!selectedCall?.id,
  });

  const handleSelectCall = (call: VesselCallRead) => {
    setSelectedCall(call);
    // On mobile, automatically show the map when selecting
    if (window.innerWidth < 1024) {
      setMobileTab("map");
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Vessel Intelligence & Fairway Track
            </h1>
            <DataStatusBadge status="SIMULATED" />
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Geographic track tracking and predictive delay analysis along the
            Karnaphuli River approach fairway.
          </p>
        </div>

        {/* Operational Context Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 bg-white rounded border border-portos-border text-portos-navy font-medium flex items-center gap-1.5 shadow-xs">
            <Ship className="h-3.5 w-3.5 text-portos-teal" />
            <span>Chattogram Port Approach</span>
          </div>
          <div className="px-2.5 py-1 bg-portos-teal-light text-portos-teal rounded border border-portos-teal/30 font-medium">
            Datum: CD +0.0m
          </div>
        </div>
      </div>

      {/* Top Anchorage Queue & Warning Notice */}
      <AnchorageQueueSummary calls={calls} />

      {/* Mobile View Switcher Tabs (Prompt 07 Requirement) */}
      <div className="flex lg:hidden bg-portos-bg p-1 rounded-lg border border-portos-border text-xs font-medium">
        <button
          onClick={() => setMobileTab("list")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-colors ${
            mobileTab === "list"
              ? "bg-white text-portos-navy font-bold shadow-xs"
              : "text-portos-muted"
          }`}
        >
          <ListFilter className="h-3.5 w-3.5" />
          <span>Vessel List ({calls.length})</span>
        </button>
        <button
          onClick={() => setMobileTab("map")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-colors ${
            mobileTab === "map"
              ? "bg-white text-portos-navy font-bold shadow-xs"
              : "text-portos-muted"
          }`}
        >
          <Map className="h-3.5 w-3.5" />
          <span>Geographic Map</span>
        </button>
        <button
          onClick={() => setMobileTab("detail")}
          disabled={!selectedCall}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded transition-colors ${
            mobileTab === "detail"
              ? "bg-white text-portos-navy font-bold shadow-xs"
              : "text-portos-muted disabled:opacity-40"
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>Vessel Detail</span>
        </button>
      </div>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[720px]">
        {/* Left: Vessel Queue Table / List */}
        <div
          className={`lg:col-span-4 h-full ${
            mobileTab !== "list" ? "hidden lg:block" : "block"
          }`}
        >
          <VesselListPanel
            calls={calls}
            selectedCallId={selectedCall?.id || null}
            onSelectCall={handleSelectCall}
            filters={filters}
            onFiltersChange={setFilters}
          />
        </div>

        {/* Center: MapLibre Geographic Map */}
        <div
          className={`h-full ${
            selectedCall ? "lg:col-span-5" : "lg:col-span-8"
          } ${mobileTab !== "map" ? "hidden lg:block" : "block"}`}
        >
          <VesselMap
            calls={calls}
            selectedCall={selectedCall}
            trackData={trackData}
            onSelectCall={handleSelectCall}
          />
        </div>

        {/* Right: Selected Vessel Detail & Track Timeline */}
        {selectedCall && (
          <div
            className={`lg:col-span-3 h-full ${
              mobileTab !== "detail" ? "hidden lg:block" : "block"
            }`}
          >
            <VesselDetailDrawer
              call={selectedCall}
              trackData={trackData}
              isTrackLoading={trackLoading}
              onClose={() => setSelectedCall(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
