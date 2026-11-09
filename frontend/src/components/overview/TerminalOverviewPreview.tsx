"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getBerths } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { Box, ArrowUpRight, Anchor, ShieldCheck, Radio } from "lucide-react";

export function TerminalOverviewPreview() {
  const [activeTab, setActiveTab] = useState<"schematic" | "radar">("schematic");

  const { data: berths, isLoading, isError } = useQuery({
    queryKey: ["terminal-berths"],
    queryFn: () => getBerths(),
  });

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Top Header Row */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <Anchor className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                Quayside Berth Allocation & Digital Twin Hub
              </h3>
              <DataStatusBadge status="SIMULATED" size="sm" />
            </div>
            <p className="text-xs text-slate-500">
              Spatial overview of 6 illustrative Karnaphuli container berth lanes.
            </p>
          </div>
        </div>

        {/* View Switcher Pills & Launch 3D Button */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-slate-100 p-1 rounded-full border border-slate-200 text-xs">
            <button
              onClick={() => setActiveTab("schematic")}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeTab === "schematic"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Berth Slots
            </button>
            <button
              onClick={() => setActiveTab("radar")}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                activeTab === "radar"
                  ? "bg-white text-slate-900 font-semibold shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Corridor Radar
            </button>
          </div>

          <Link
            href="/digital-twin"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-full bg-sky-600 hover:bg-sky-700 text-white transition-all shadow-xs active:scale-[0.98]"
          >
            <Box className="h-3.5 w-3.5 text-sky-200" />
            <span>Launch 3D Digital Twin</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 bg-slate-50/50 flex-1">
        {activeTab === "schematic" ? (
          <div>
            {isLoading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 space-y-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                    <Skeleton className="h-6 w-full rounded-md" />
                    <Skeleton className="h-3 w-20 rounded-full" />
                  </div>
                ))}
              </div>
            )}

            {!isLoading && (!berths || !Array.isArray(berths) || isError || berths.length === 0) && (
              <div className="p-8 text-center text-xs text-slate-500">
                Could not load berth layout preview. Ensure backend is running.
              </div>
            )}

            {!isLoading && Array.isArray(berths) && berths.length > 0 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                  {berths.map((b) => {
                    const isOccupied = b.status === "OCCUPIED";
                    const isMaintenance = b.status === "MAINTENANCE";

                    return (
                      <div
                        key={b.id}
                        className={`relative p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md hover:-translate-y-0.5 ${
                          isOccupied
                            ? "bg-white border-sky-300 ring-1 ring-sky-400/20"
                            : isMaintenance
                            ? "bg-amber-50/40 border-amber-300"
                            : "bg-white border-slate-200 hover:border-sky-300"
                        }`}
                      >
                        {/* Top Color Accent */}
                        <div
                          className={`absolute top-0 left-0 right-0 h-1 ${
                            isOccupied
                              ? "bg-sky-500"
                              : isMaintenance
                              ? "bg-amber-500"
                              : "bg-slate-300"
                          }`}
                        />

                        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                          <span className="text-xs font-bold text-slate-900">
                            {b.code}
                          </span>
                          <StatusBadge
                            status={isOccupied ? "normal" : isMaintenance ? "watch" : "neutral"}
                            label={b.status}
                            size="sm"
                          />
                        </div>

                        <div className="my-3 space-y-1.5 text-xs">
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Length:</span>
                            <strong className="text-slate-800 font-semibold tabular-nums">{b.length_m}m</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Draft:</span>
                            <strong className="text-slate-800 font-semibold tabular-nums">{b.depth_draft_m}m</strong>
                          </div>
                          <div className="flex justify-between text-slate-500 text-[11px]">
                            <span>Max LOA:</span>
                            <strong className="text-slate-800 font-semibold tabular-nums">{b.max_vessel_loa_m}m</strong>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-500 flex items-center justify-between">
                          <span className="truncate">{b.name}</span>
                          <span className={`font-semibold ${isOccupied ? "text-sky-700" : isMaintenance ? "text-amber-700" : "text-slate-500"}`}>
                            {isOccupied ? "Occupied" : isMaintenance ? "Maintenance" : "Available"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-sky-600 shrink-0" />
                    <span>
                      <strong className="text-slate-800">Operational Truthfulness Rule:</strong> Berths, lengths, and draft boundaries represent calibrated synthetic simulation parameters for evaluation.
                    </span>
                  </div>
                  <span className="text-xs text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200 font-medium">
                    Datum: CD + 0.0m
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Maritime Radar View */
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 relative overflow-hidden text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-sky-400 animate-pulse" />
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Karnaphuli Fairway Channel Radar & AIS Telemetry
                </h4>
              </div>
              <span className="text-[10px] font-bold tracking-wider text-sky-300 bg-sky-950/70 border border-sky-500/30 px-2.5 py-0.5 rounded-full">
                LIVE SWEEP: 24.5 NM
              </span>
            </div>

            {/* Radar Canvas Simulation Graphic */}
            <div className="relative h-48 sm:h-56 w-full my-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
              <div className="absolute h-24 w-24 rounded-full border border-sky-500/15" />
              <div className="absolute h-40 w-40 rounded-full border border-sky-500/10" />
              <div className="absolute h-52 w-52 rounded-full border border-sky-500/10" />
              <div className="absolute h-full w-[1px] bg-sky-500/10" />
              <div className="absolute w-full h-[1px] bg-sky-500/10" />

              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M 60 180 Q 200 130 350 110 T 700 70"
                  fill="none"
                  stroke="#0284C7"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                  className="opacity-70"
                />
                <circle cx="160" cy="140" r="5" fill="#0284C7" className="animate-ping opacity-60" />
                <circle cx="160" cy="140" r="4" fill="#38BDF8" />
                <circle cx="340" cy="112" r="4" fill="#0EA5E9" />
                <circle cx="520" cy="85" r="4" fill="#F59E0B" />
              </svg>

              <div className="absolute bottom-3 left-4 text-[11px] text-slate-300 font-medium">
                OUTER ANCHORAGE: <strong className="text-sky-300">3 Vessels</strong> · PILOT BOARDING: <strong className="text-white">Active</strong>
              </div>
              <div className="absolute bottom-3 right-4">
                <Link
                  href="/digital-twin"
                  className="text-[11px] font-semibold text-sky-400 hover:text-sky-300 underline"
                >
                  Inspect in 3D →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
