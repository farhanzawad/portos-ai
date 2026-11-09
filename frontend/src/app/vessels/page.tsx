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
import { FleetDirectoryTable } from "@/components/vessels/FleetDirectoryTable";
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
  Radio,
  Waves,
  Wind,
  ShieldCheck,
  Calendar,
  LayoutGrid,
  Table as TableIcon,
  Columns3,
  X,
} from "lucide-react";
import { AISDiagnosticsModal } from "@/components/vessels/AISDiagnosticsModal";

// Dynamically import unified MapLibre GL Geospatial Port Map
const GeospatialPortMap = dynamic(
  () =>
    import("@/components/geospatial/GeospatialPortMap").then(
      (mod) => mod.GeospatialPortMap
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[640px] bg-slate-900 rounded-2xl border border-slate-200/80 flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
          <span>Loading MapLibre Geographic Engine & Maritime Layers...</span>
        </div>
      </div>
    ),
  }
);

export default function VesselsPage() {
  const router = useRouter();
  const [selectedCall, setSelectedCall] = useState<VesselCallRead | null>(null);
  const [viewMode, setViewMode] = useState<"split" | "table">("split");
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAISModalOpen, setIsAISModalOpen] = useState(false);

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
    setIsDrawerOpen(true);
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
      setIsDrawerOpen(true);
    }
  };

  // Open vessel in 3D digital twin
  const handleOpen3DView = (entityId?: string) => {
    const targetId = entityId || selectedCall?.id;
    router.push(targetId ? `/digital-twin?vessel=${targetId}` : "/digital-twin");
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Executive Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Vessel Intelligence & Fairway Track
            </h1>
            <DataStatusBadge status="SIMULATED" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full border border-slate-300 font-bold">
              DEMO ENVIRONMENT
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Geographic radar tracking, bathymetric fairway corridors, and predictive delay analysis along the Karnaphuli River approach.
          </p>
        </div>

        {/* Operational Context Badges & Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Hydrographic Tide Gate Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 text-slate-700 font-medium shadow-2xs">
            <Waves className="h-3.5 w-3.5 text-sky-600" />
            <span>Tide Gate: <strong className="text-slate-900 font-bold">+3.8m @ 14:30 BST</strong></span>
          </div>

          {/* Meteorological Conditions Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-slate-200 text-slate-700 font-medium shadow-2xs">
            <Wind className="h-3.5 w-3.5 text-amber-500" />
            <span>12 kts SW · Sea State 2</span>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center p-0.5 bg-slate-100 rounded-full border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                viewMode === "split"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Columns3 className="h-3.5 w-3.5 text-sky-600" />
              <span>Radar & Map</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all ${
                viewMode === "table"
                  ? "bg-white text-slate-900 font-bold shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <TableIcon className="h-3.5 w-3.5 text-slate-700" />
              <span>Fleet Directory</span>
            </button>
          </div>

          {/* Quick Overlay Toggles in Header */}
          {viewMode === "split" && (
            <div className="hidden xl:flex items-center gap-1.5">
              <button
                onClick={() => setIsQueueOpen(!isQueueOpen)}
                className={`px-3 py-1.5 rounded-full border font-semibold flex items-center gap-1.5 shadow-2xs transition-colors ${
                  isQueueOpen
                    ? "bg-sky-50 text-sky-700 border-sky-300"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
                title="Toggle vessel radar overlay"
              >
                <Ship className="h-3.5 w-3.5 text-sky-600" />
                <span>Radar Queue</span>
              </button>

              {selectedCall && (
                <button
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  className={`px-3 py-1.5 rounded-full border font-semibold flex items-center gap-1.5 shadow-2xs transition-colors ${
                    isDrawerOpen
                      ? "bg-sky-50 text-sky-700 border-sky-300"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                  title="Toggle vessel dossier overlay"
                >
                  <FileText className="h-3.5 w-3.5 text-sky-600" />
                  <span>Dossier</span>
                </button>
              )}
            </div>
          )}

          {/* AIS Diagnostics Modal Button */}
          <button
            onClick={() => setIsAISModalOpen(true)}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-full border border-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Inspect commercial AIS provider connection & transponder stream"
          >
            <Radio className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            <span>AIS Diagnostics</span>
          </button>

          {/* Quick 3D Digital Twin Button */}
          <button
            onClick={() => handleOpen3DView()}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-800 rounded-full border border-slate-200 font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            title="Inspect terminal and vessels in 3D Digital Twin"
          >
            <Box className="h-3.5 w-3.5 text-sky-600" />
            <span>3D Terminal Twin</span>
          </button>
        </div>
      </div>

      {/* Top Anchorage Queue & Fasto SaaS Metric Cards */}
      <AnchorageQueueSummary
        calls={calls}
        selectedStatus={filters.status}
        onSelectStatus={(status) => setFilters((prev) => ({ ...prev, status }))}
        selectedRisk={filters.delayRisk}
        onSelectRisk={(delayRisk) => setFilters((prev) => ({ ...prev, delayRisk }))}
        onOpenAISDiagnostics={() => setIsAISModalOpen(true)}
      />

      {/* Main Operational Body */}
      {viewMode === "table" ? (
        <div className="space-y-4">
          <FleetDirectoryTable
            calls={calls}
            onSelectCall={handleSelectCall}
            selectedCallId={selectedCall?.id || null}
          />

          {/* Slide-over Detail Drawer when in table view */}
          {selectedCall && isDrawerOpen && (
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg p-4 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
              <div className="w-full h-full max-w-md shadow-2xl">
                <VesselDetailDrawer
                  call={selectedCall}
                  trackData={trackData}
                  isTrackLoading={trackLoading}
                  onClose={() => setIsDrawerOpen(false)}
                  onOpenAISDiagnostics={() => setIsAISModalOpen(true)}
                />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Full GIS Workspace with Dual Floating Overlays (Both Left & Right are Overlays!) */
        <div className="relative w-full h-[760px] rounded-2xl overflow-hidden border border-slate-200/90 shadow-xs bg-slate-900">
          {/* Full Container GIS Map (occupies 100% of container) */}
          <GeospatialPortMap
            selectedEntity={selectedEntity}
            onSelectEntity={handleMapEntitySelect}
            onOpen3DView={handleOpen3DView}
            className="w-full h-full"
            height="h-full"
          />

          {/* Left Overlay: Vessel Radar Queue */}
          {isQueueOpen ? (
            <div className="absolute top-12 left-3 bottom-3 z-30 w-full max-w-[400px] xl:max-w-[420px] shadow-2xl animate-in slide-in-from-left duration-200">
              <VesselListPanel
                calls={calls}
                selectedCallId={selectedCall?.id || null}
                onSelectCall={handleSelectCall}
                filters={filters}
                onFiltersChange={setFilters}
                onClose={() => setIsQueueOpen(false)}
              />
            </div>
          ) : (
            <button
              onClick={() => setIsQueueOpen(true)}
              className="absolute top-12 left-3 z-30 flex items-center gap-2 px-3.5 py-2 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-xl shadow-lg border border-slate-200 backdrop-blur-xs transition-all hover:scale-102"
              title="Open vessel radar queue"
            >
              <Ship className="h-4 w-4 text-sky-600" />
              <span>Vessel Radar ({calls.length})</span>
            </button>
          )}

          {/* Right Overlay: Vessel Detail Dossier Drawer */}
          {selectedCall && isDrawerOpen ? (
            <div className="absolute top-12 right-3 bottom-3 z-30 w-full max-w-[470px] xl:max-w-[490px] shadow-2xl animate-in slide-in-from-right duration-200">
              <VesselDetailDrawer
                call={selectedCall}
                trackData={trackData}
                isTrackLoading={trackLoading}
                onClose={() => setIsDrawerOpen(false)}
                onOpenAISDiagnostics={() => setIsAISModalOpen(true)}
              />
            </div>
          ) : (
            selectedCall && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="absolute top-12 right-3 z-30 flex items-center gap-2 px-3.5 py-2 bg-white/95 hover:bg-white text-slate-800 text-xs font-bold rounded-xl shadow-lg border border-slate-200 backdrop-blur-xs transition-all hover:scale-102"
                title="Open vessel telemetry dossier"
              >
                <FileText className="h-4 w-4 text-sky-600" />
                <span>Dossier: {selectedCall.vessel?.name}</span>
              </button>
            )
          )}
        </div>
      )}

      {/* Commercial AIS Provider Diagnostics Modal */}
      <AISDiagnosticsModal
        isOpen={isAISModalOpen}
        onClose={() => setIsAISModalOpen(false)}
      />
    </div>
  );
}
