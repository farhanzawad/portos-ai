"use client";

import React, { Suspense } from "react";
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
          <span className="w-2 h-2 rounded-full bg-portos-teal animate-ping" />
          <span>Loading 3D Digital Twin Engine & Spatial Shaders...</span>
        </div>
      </div>
    ),
  }
);

function DigitalTwinContent() {
  const searchParams = useSearchParams();
  const blockParam = searchParams.get("block");

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
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Interactive Terminal Digital Twin
            </h1>
            <span className="text-portos-muted font-normal text-sm hidden md:inline">
              | Geospatial Port GIS
            </span>
            <DataStatusBadge status="SIMULATED" />
            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-slate-100 text-slate-600 rounded border border-slate-300 font-mono">
              RSGT PCT MASTERPLAN CONCEPTUAL
            </span>
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Synchronized 2D regional maritime GIS tracking of Karnaphuli fairway and interactive 3D digital twin of Patenga Container Terminal (PCT).
          </p>
        </div>

        {/* Operational Context Badges */}
        <div className="flex items-center gap-2 text-xs">
          <div className="px-2.5 py-1 bg-white rounded border border-portos-border text-portos-navy font-medium flex items-center gap-1.5 shadow-xs">
            <Layers className="h-3.5 w-3.5 text-portos-navy-secondary" />
            <span>Terminal: RSGT Patenga (PCT) & CCT/NCT</span>
          </div>
          <div className="px-2.5 py-1 bg-portos-teal-light text-portos-teal rounded border border-portos-teal/30 font-medium">
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

      {/* Bottom Spatial Telemetry Quick Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 pt-1">
        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs flex items-center gap-3">
          <div className="p-2 rounded bg-portos-bg text-portos-navy-secondary">
            <Anchor className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-portos-muted uppercase font-semibold">
              Quayside Berths
            </span>
            <div className="text-sm font-bold font-mono text-portos-navy">
              {berths.length || 6} Berths
            </div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs flex items-center gap-3">
          <div className="p-2 rounded bg-portos-bg text-portos-teal">
            <Ship className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-portos-muted uppercase font-semibold">
              Berthed Vessels
            </span>
            <div className="text-sm font-bold font-mono text-portos-navy">
              {berthedCount} Active
            </div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs flex items-center gap-3">
          <div className="p-2 rounded bg-portos-bg text-portos-amber">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-portos-muted uppercase font-semibold">
              Anchorage Queue
            </span>
            <div className="text-sm font-bold font-mono text-portos-navy">
              {queueCount} Awaiting
            </div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs flex items-center gap-3">
          <div className="p-2 rounded bg-portos-bg text-sky-600">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-portos-muted uppercase font-semibold">
              STS Cranes
            </span>
            <div className="text-sm font-bold font-mono text-portos-navy">
              {equipment.length || 5} Gantry Units
            </div>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border border-portos-border shadow-xs col-span-2 sm:col-span-1 flex items-center gap-3">
          <div className="p-2 rounded bg-portos-bg text-emerald-600">
            <Grid3X3 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] text-portos-muted uppercase font-semibold">
              Yard Capacity
            </span>
            <div className="text-sm font-bold font-mono text-portos-navy">
              {yardBlocks.length || 12} Storage Blocks
            </div>
          </div>
        </div>
      </div>
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
