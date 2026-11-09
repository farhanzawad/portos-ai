"use client";

import React from "react";
import { SelectedEntity, LayerVisibility } from "./types";
import {
  BerthRead,
  VesselCallRead,
  EquipmentRead,
  YardBlockRead,
} from "@/types/api";
import {
  Ship,
  Anchor,
  Cpu,
  Grid3X3,
  Waves,
  Compass,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface TerminalSchematic2DProps {
  berths: BerthRead[];
  vesselCalls: VesselCallRead[];
  equipment: EquipmentRead[];
  yardBlocks: YardBlockRead[];
  layers: LayerVisibility;
  selectedEntity: SelectedEntity | null;
  onSelectEntity: (entity: SelectedEntity) => void;
}

const MIN_2D_SCALE = 0.75; // 75% overview boundary (max zoom-out height ceiling)
const MAX_2D_SCALE = 1.35; // 135% close-up boundary (max zoom-in depth floor)
const STEP_2D_SCALE = 0.15;

export function TerminalSchematic2D({
  berths,
  vesselCalls,
  equipment,
  yardBlocks,
  layers,
  selectedEntity,
  onSelectEntity,
}: TerminalSchematic2DProps) {
  const berthedCalls = vesselCalls.filter((c) => c.status === "BERTHED");
  const queueCalls = vesselCalls.filter((c) => c.status !== "BERTHED");
  const [zoomScale, setZoomScale] = React.useState<number>(1.0);

  return (
    <div className="w-full h-full min-h-[640px] bg-slate-900 p-6 rounded-b-lg border border-portos-border text-slate-100 flex flex-col gap-6 overflow-y-auto">
      {/* Top Schematic Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Compass className="h-4 w-4 text-portos-teal" />
          <span className="font-semibold text-slate-200">
            Karnaphuli River Fairway & Terminal Spatial Schematic Plan
          </span>
          <span className="font-mono text-slate-400">· 2D Plan View</span>
        </div>
        <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
          <div className="hidden sm:flex items-center gap-2">
            <span>Quay: 140° SE</span>
            <span>·</span>
            <span>Datum: CD +0.0m</span>
          </div>

          {/* 2D Zoom Ceiling & Floor Controls */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-md px-2 py-1 shadow-sm">
            <span className="text-[10px] text-slate-400 font-mono mr-0.5">Scale</span>
            <button
              onClick={() => setZoomScale((s) => Math.max(MIN_2D_SCALE, Number((s - STEP_2D_SCALE).toFixed(2))))}
              disabled={zoomScale <= MIN_2D_SCALE}
              title={zoomScale <= MIN_2D_SCALE ? "Maximum zoom-out limit reached (75%)" : "Zoom Out 2D Plan"}
              aria-label="Zoom Out"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="font-mono text-[11px] font-bold text-portos-teal w-11 text-center select-none">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((s) => Math.min(MAX_2D_SCALE, Number((s + STEP_2D_SCALE).toFixed(2))))}
              disabled={zoomScale >= MAX_2D_SCALE}
              title={zoomScale >= MAX_2D_SCALE ? "Maximum zoom-in limit reached (135%)" : "Zoom In 2D Plan"}
              aria-label="Zoom In"
              className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            {zoomScale !== 1.0 && (
              <button
                onClick={() => setZoomScale(1.0)}
                title="Reset scale to 100%"
                aria-label="Reset Scale"
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors ml-0.5"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scaled 2D Schematic Content Wrapper */}
      <div
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "top center",
          transition: "transform 180ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className="flex flex-col gap-6"
      >

      {/* 1. Water Channel & Outer Anchorage Zone */}
      {layers.vessels && (
        <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
              <Waves className="h-4 w-4" />
              <span>Karnaphuli Channel & Outer Anchorage Vessel Queue</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {queueCalls.length} vessels awaiting tidal pilotage window
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {queueCalls.map((call) => {
              const isSelected =
                selectedEntity?.type === "vessel" &&
                selectedEntity.id === call.id;

              return (
                <button
                  key={call.id}
                  onClick={() =>
                    onSelectEntity({ type: "vessel", id: call.id, data: call })
                  }
                  className={`p-2.5 rounded text-left border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? "bg-sky-950/80 border-sky-400 ring-1 ring-sky-400 shadow-md"
                      : "bg-slate-900/90 border-slate-800 hover:border-sky-500/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-slate-200 truncate">
                      <Ship className="h-3.5 w-3.5 text-sky-400 flex-shrink-0" />
                      <span className="truncate">
                        {call.vessel?.name || "DEMO Vessel"}
                      </span>
                    </div>
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

                  <div className="text-[10px] font-mono text-slate-400 flex justify-between">
                    <span>LOA: {call.vessel?.length_overall_m}m</span>
                    <span
                      className={
                        call.predicted_delay_hours > 2
                          ? "text-portos-red font-bold"
                          : "text-portos-amber font-semibold"
                      }
                    >
                      +{call.predicted_delay_hours}h delay
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Quayside Berths & STS Cranes Area */}
      {layers.berths && (
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-portos-teal">
              <Anchor className="h-4 w-4" />
              <span>Quayside Berths & Ship-to-Shore (STS) Gantry Rail</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              6 Illustrative Karnaphuli Berths
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {berths.map((berth, index) => {
              const isSelected =
                selectedEntity?.type === "berth" &&
                selectedEntity.id === berth.id;
              const berthedVessel = berthedCalls[index];

              return (
                <div
                  key={berth.id}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-800 border-portos-teal ring-1 ring-portos-teal shadow-md"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <button
                    onClick={() =>
                      onSelectEntity({
                        type: "berth",
                        id: berth.id,
                        data: berth,
                      })
                    }
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                      <span className="font-mono text-xs font-bold text-white">
                        {berth.code}
                      </span>
                      <StatusBadge
                        status={
                          berth.status === "OCCUPIED"
                            ? "normal"
                            : berth.status === "MAINTENANCE"
                            ? "watch"
                            : "neutral"
                        }
                        label={berth.status}
                        size="sm"
                      />
                    </div>

                    <div className="text-[11px] font-mono text-slate-300 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Length:</span>
                        <span>{berth.length_m}m</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Draft:</span>
                        <span className="text-portos-teal font-semibold">
                          {berth.depth_draft_m}m
                        </span>
                      </div>
                    </div>
                  </button>

                  {/* Berthed Vessel Section */}
                  {berthedVessel && layers.vessels && (
                    <button
                      onClick={() =>
                        onSelectEntity({
                          type: "vessel",
                          id: berthedVessel.id,
                          data: berthedVessel,
                        })
                      }
                      className="mt-3 p-2 bg-slate-950/90 rounded border border-portos-teal/40 text-left hover:border-portos-teal transition-colors"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-portos-teal truncate">
                        <Ship className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">
                          {berthedVessel.vessel?.name || "Berthed Vessel"}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Cargo Ops Active
                      </div>
                    </button>
                  )}

                  {/* Crane Assignment */}
                  {layers.cranes && equipment[index] && (
                    <button
                      onClick={() =>
                        onSelectEntity({
                          type: "crane",
                          id: equipment[index].id,
                          data: equipment[index],
                        })
                      }
                      className="mt-2 p-1.5 bg-slate-800/80 rounded border border-slate-700 text-left hover:border-slate-500 transition-colors flex items-center justify-between text-[10px]"
                    >
                      <div className="flex items-center gap-1 font-mono text-slate-300">
                        <Cpu className="h-2.5 w-2.5 text-portos-teal" />
                        <span>{equipment[index].code}</span>
                      </div>
                      <span className="text-slate-400">
                        {equipment[index].rated_moves_per_hour} m/h
                      </span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Yard Blocks Grid */}
      {layers.yardBlocks && (
        <div className="p-4 bg-slate-950/60 rounded-lg border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Grid3X3 className="h-4 w-4" />
              <span>Container Yard Blocks & Stack Occupancy</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {yardBlocks.length} Terminal Storage Blocks
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {yardBlocks.map((block) => {
              const isSelected =
                selectedEntity?.type === "yard" &&
                selectedEntity.id === block.id;

              return (
                <button
                  key={block.id}
                  onClick={() =>
                    onSelectEntity({ type: "yard", id: block.id, data: block })
                  }
                  className={`p-2.5 rounded border text-left transition-all flex flex-col justify-between ${
                    isSelected
                      ? "bg-slate-800 border-amber-400 ring-1 ring-amber-400 shadow-md"
                      : "bg-slate-900 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-800">
                    <span className="font-mono text-xs font-bold text-white">
                      {block.code}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400 uppercase">
                      {block.zone}
                    </span>
                  </div>

                  <div className="text-[10px] text-slate-300 space-y-1">
                    <div className="flex justify-between font-mono">
                      <span className="text-slate-400">Cap:</span>
                      <span>{block.teu_capacity} TEU</span>
                    </div>
                    {/* Simulated visual stack bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          block.code === "YB-04"
                            ? "bg-portos-red w-[88%]"
                            : block.code === "YB-02"
                            ? "bg-portos-amber w-[74%]"
                            : "bg-portos-teal w-[58%]"
                        }`}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

