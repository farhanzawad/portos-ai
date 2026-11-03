"use client";

import React, { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getVesselCalls, getVesselTrack } from "@/lib/api-client";
import { VesselCallRead } from "@/types/api";
import { VesselFilterState } from "@/components/vessels/types";
import { AnchorageQueueSummary } from "@/components/vessels/AnchorageQueueSummary";
import { VesselListPanel } from "@/components/vessels/VesselListPanel";
import { VesselDetailDrawer } from "@/components/vessels/VesselDetailDrawer";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  Ship,
  Map,
  ListFilter,
  FileText,
  Box,
  PanelLeftClose,
  PanelLeftOpen,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";

// Dynamically import unified MapLibre GL Geospatial Port Map
const GeospatialPortMap = dynamic(
  () =>
    import("@/components/geospatial/GeospatialPortMap").then(
      (mod) => mod.GeospatialPortMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[640px] bg-slate-950 rounded-lg border border-portos-border flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-portos-teal animate-ping" />
          <span>Loading MapLibre Geographic Engine & Maritime Layers...</span>
        </div>
      </div>
    ),
  }
);

export default function VesselsPage() {
  const router = useRouter();
  const [selectedCall, setSelectedCall] = useState<VesselCallRead | null>(null);
  const [mobileTab, setMobileTab] = useState<"list" | "map" | "detail">("list");
  const [isQueueCollapsed, setIsQueueCollapsed] = useState(false);
  const [isMaximizedMap, setIsMaximizedMap] = useState(false);

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
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileTab("map");
    }
  };

  // Convert selectedCall to Geospatial SelectedEntity for 2D Map synchronization
  const selectedEntity = useMemo(() => {
    if (!selectedCall) return null;
    const latestPos = trackData?.positions?.[trackData.positions.length - 1];
    return {
      type: "vessel" as const,
      id: selectedCall.id,
      coordinates: latestPos ? { lat: latestPos.latitude, lon: latestPos.longitude } : undefined,
      data: selectedCall,
    };
  }, [selectedCall, trackData]);

  // Handle entity clicked directly on the 2D GIS map
  const handleMapEntitySelect = (entity: any) => {
    if (!entity) return;
    const targetId = entity.id;
    const match = calls.find(
      (c) =>
        c.id === targetId ||
        c.vessel?.id === targetId ||
        `feat_vessel_${c.id}` === targetId ||
        c.vessel?.name?.toLowerCase() === entity.properties?.vessel_name?.toLowerCase()
    );
    if (match) {
      setSelectedCall(match);
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setMobileTab("detail");
      }
    }
  };

  // Open vessel in 3D digital twin
  const handleOpen3DView = (entityId?: string) => {
    const targetId = entityId || selectedCall?.id;
    router.push(targetId ? `/digital-twin?vessel=${targetId}` : "/digital-twin");
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
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded border border-slate-300 font-mono">
              DEMO ENVIRONMENT
            </span>
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Geographic track tracking, bathymetric fairway corridors, and predictive delay analysis along the
            Karnaphuli River approach.
          </p>
        </div>

        {/* Operational Context Badges & Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Quick 3D Digital Twin Button */}
          <button
            onClick={() => handleOpen3DView()}
            className="px-2.5 py-1 bg-white hover:bg-slate-50 text-portos-navy rounded border border-portos-border font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            title="Inspect terminal and vessels in 3D Digital Twin"
          >
            <Box className="h-3.5 w-3.5 text-portos-teal" />
            <span>3D Terminal Twin</span>
          </button>

          {/* Map Layout Toggle */}
          <button
            onClick={() => setIsMaximizedMap(!isMaximizedMap)}
            className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded border font-medium transition-colors shadow-xs ${
              isMaximizedMap
                ? "bg-portos-teal text-white border-portos-teal"
                : "bg-white hover:bg-slate-50 text-portos-navy border-portos-border"
            }`}
            title={isMaximizedMap ? "Restore split layout" : "Maximize GIS map"}
          >
            {isMaximizedMap ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Split View</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Max Map</span>
              </>
            )}
          </button>

          <div className="px-2.5 py-1 bg-white rounded border border-portos-border text-portos-navy font-medium flex items-center gap-1.5 shadow-xs">
            <Ship className="h-3.5 w-3.5 text-portos-teal" />
            <span>Chattogram Port Approach</span>
          </div>
          <div className="px-2.5 py-1 bg-portos-teal-light text-portos-teal rounded border border-portos-teal/30 font-medium font-mono text-[11px]">
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

      {/* Main Geographic & Operational Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[740px]">
        {/* Left: Vessel Queue Table / List */}
        {!isMaximizedMap && (
          <div
            className={`transition-all duration-300 h-full ${
              isQueueCollapsed
                ? "hidden"
                : selectedCall
                ? "lg:col-span-3 xl:col-span-3"
                : "lg:col-span-4 xl:col-span-4"
            } ${mobileTab !== "list" ? "hidden lg:block" : "block"}`}
          >
            <div className="relative h-full">
              <VesselListPanel
                calls={calls}
                selectedCallId={selectedCall?.id || null}
                onSelectCall={handleSelectCall}
                filters={filters}
                onFiltersChange={setFilters}
              />
              {/* Collapse Queue Sidebar Toggle Button */}
              <button
                onClick={() => setIsQueueCollapsed(true)}
                className="hidden lg:flex absolute top-3 right-3 p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors z-10"
                title="Collapse vessel list to expand map"
              >
                <PanelLeftClose className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Center: Integrated MapLibre GL Regional Port Geospatial Map */}
        <div
          className={`relative h-full transition-all duration-300 ${
            isMaximizedMap
              ? "lg:col-span-12"
              : isQueueCollapsed
              ? selectedCall
                ? "lg:col-span-9 xl:col-span-9"
                : "lg:col-span-12"
              : selectedCall
              ? "lg:col-span-6 xl:col-span-6"
              : "lg:col-span-8 xl:col-span-8"
          } ${mobileTab !== "map" ? "hidden lg:block" : "block"}`}
        >
          {/* Quick Floating Restore Queue Button when collapsed */}
          {!isMaximizedMap && isQueueCollapsed && (
            <button
              onClick={() => setIsQueueCollapsed(false)}
              className="hidden lg:flex absolute top-3 left-3 z-30 items-center gap-1.5 px-2.5 py-1.5 bg-portos-navy/90 hover:bg-portos-navy text-white text-xs font-medium rounded-md shadow-lg border border-portos-navy-secondary backdrop-blur-xs transition-colors"
              title="Show vessel list"
            >
              <PanelLeftOpen className="h-3.5 w-3.5 text-portos-teal" />
              <span>Vessel Queue ({calls.length})</span>
            </button>
          )}

          <GeospatialPortMap
            selectedEntity={selectedEntity}
            onSelectEntity={handleMapEntitySelect}
            onOpen3DView={handleOpen3DView}
            className="w-full h-full shadow-sm"
            height="h-full"
          />
        </div>

        {/* Right: Selected Vessel Detail & Track Timeline */}
        {selectedCall && !isMaximizedMap && (
          <div
            className={`transition-all duration-300 h-full ${
              isQueueCollapsed ? "lg:col-span-3 xl:col-span-3" : "lg:col-span-3 xl:col-span-3"
            } ${mobileTab !== "detail" ? "hidden lg:block" : "block"}`}
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
