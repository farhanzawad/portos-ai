"use client";

import React, { Suspense, useState } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  getBerths,
  getVesselCalls,
  getEquipment,
  getYardBlocks,
} from "@/lib/api-client";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  Anchor,
  Ship,
  Cpu,
  Grid3X3,
  Clock,
  Layers,
  ShieldAlert,
} from "lucide-react";
import { EquipmentMaintenanceModal } from "@/components/digital-twin/EquipmentMaintenanceModal";

// Dynamically import Three.js Canvas to ensure zero server-side WebGL canvas errors
const TerminalCanvas = dynamic(
  () =>
    import("@/components/digital-twin/TerminalCanvas").then(
      (mod) => mod.TerminalCanvas
    ),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[660px] bg-slate-950 rounded-lg border border-portos-border flex items-center justify-center text-slate-400 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
          <span>Loading 3D Digital Twin Engine & Spatial Shaders...</span>
        </div>
      </div>
    ),
  }
);

function DigitalTwinContent() {
  const searchParams = useSearchParams();
  const blockParam = searchParams.get("block");
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  const { data: berths = [], isLoading: berthsLoading } = useQuery({
    queryKey: ["digital-twin-berths"],
    queryFn: () => getBerths(),
  });

  const { data: vesselData, isLoading: vesselsLoading } = useQuery({
    queryKey: ["digital-twin-vessels"],
    queryFn: () => getVesselCalls({ pageSize: 20 }),
  });

  const { data: equipment = [], isLoading: equipmentLoading } = useQuery({
    queryKey: ["digital-twin-equipment"],
    queryFn: () => getEquipment(),
  });

  const { data: yardBlocks = [], isLoading: yardLoading } = useQuery({
    queryKey: ["digital-twin-yard"],
    queryFn: () => getYardBlocks(),
  });

  const vesselCalls = vesselData?.items || [];
  const isLoading =
    berthsLoading || vesselsLoading || equipmentLoading || yardLoading;

  const berthedCount = vesselCalls.filter((v) => v.status === "BERTHED").length;
  const queueCount = vesselCalls.filter((v) => v.status !== "BERTHED").length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              Interactive Terminal Digital Twin
            </h1>
            <span className="text-slate-400 font-normal text-sm hidden md:inline">
              | Geospatial Port GIS
            </span>
            <DataStatusBadge status="SIMULATED" />
            <span className="hidden sm:inline-block px-2.5 py-0.5 text-[10px] bg-slate-100 text-slate-700 rounded-full border border-slate-300 font-semibold">
              RSGT PCT MASTERPLAN CONCEPTUAL
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            Synchronized 2D regional maritime GIS tracking of Karnaphuli fairway and interactive 3D digital twin of Patenga Container Terminal (PCT).
          </p>
        </div>

        {/* Operational Context Badges */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-800 rounded-full border border-slate-200 font-medium flex items-center gap-1.5 shadow-xs transition-colors"
            title="Inspect STS crane telemetry & Isolation Forest anomaly detection"
          >
            <Cpu className="h-3.5 w-3.5 text-sky-600" />
            <span>Equipment Health & Anomaly Detector</span>
          </button>
          <div className="px-3 py-1 bg-white rounded-full border border-slate-200 text-slate-800 font-medium flex items-center gap-1.5 shadow-xs">
            <Layers className="h-3.5 w-3.5 text-slate-600" />
            <span>Terminal: RSGT Patenga (PCT) & CCT/NCT</span>
          </div>
          <div className="px-3 py-1 bg-sky-50 text-sky-700 rounded-full border border-sky-200 font-medium text-[11px]">
            Datum: CD +0.0m
          </div>
        </div>
      </div>

      {/* Main Digital Twin Canvas Component */}
      <TerminalCanvas
        berths={berths}
        vesselCalls={vesselCalls}
        equipment={equipment}
        yardBlocks={yardBlocks}
        isLoading={isLoading}
        initialSelectedBlockCode={blockParam}
      />

      {/* Bottom Spatial Telemetry Quick Summary Bar (Fasto / Ref 2 Style) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 border border-slate-100">
            <Anchor className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Quayside Berths
            </span>
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {berths.length || 6} Berths
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Ship className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Berthed Vessels
            </span>
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {berthedCount} Active
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Anchorage Queue
            </span>
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {queueCount} Awaiting
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              STS Cranes
            </span>
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {equipment.length || 5} Gantry Units
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-xs col-span-2 sm:col-span-1 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <Grid3X3 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block">
              Yard Capacity
            </span>
            <div className="text-sm font-bold text-slate-900 tabular-nums">
              {yardBlocks.length || 12} Storage Blocks
            </div>
          </div>
        </div>
      </div>

      {/* Equipment Maintenance & Isolation Forest Anomaly Detection Modal */}
      <EquipmentMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
      />
    </div>
  );
}

export default function DigitalTwinPage() {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[660px] bg-slate-950 rounded-lg flex items-center justify-center text-slate-400 text-xs">
          Loading Digital Twin workspace...
        </div>
      }
    >
      <DigitalTwinContent />
    </Suspense>
  );
}
