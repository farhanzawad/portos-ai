"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getBerths } from "@/lib/api-client";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { Box, ArrowUpRight, Anchor, ShieldCheck } from "lucide-react";

export function TerminalOverviewPreview() {
  const { data: berths, isLoading, isError } = useQuery({
    queryKey: ["terminal-berths"],
    queryFn: () => getBerths(),
  });

  return (
    <div className="rounded-lg border border-portos-border bg-portos-surface shadow-sm overflow-hidden flex flex-col">
      {/* Top Banner Header */}
      <div className="px-5 py-3.5 border-b border-portos-border bg-portos-surface flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-portos-navy text-portos-teal rounded">
            <Anchor className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-portos-navy">
                Quayside Berth Allocation & Digital Twin Preview
              </h3>
              <DataStatusBadge status="SIMULATED" size="sm" />
            </div>
            <p className="text-[11px] text-portos-muted">
              Spatial overview of 6 illustrative Karnaphuli container berth lanes.
            </p>
          </div>
        </div>

        <Link
          href="/digital-twin"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-portos-navy text-white hover:bg-portos-navy-secondary transition-colors"
        >
          <Box className="h-3.5 w-3.5 text-portos-teal" />
          <span>Launch 3D Digital Twin</span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
      </div>

      {/* Schematic Quayside Berth Map */}
      <div className="p-5 bg-portos-bg/40 flex-1">
        {isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="p-3 bg-white rounded border border-portos-border space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && (!berths || !Array.isArray(berths) || isError || berths.length === 0) && (
          <div className="p-8 text-center text-xs text-portos-muted">
            Could not load berth layout preview. Ensure backend is running.
          </div>
        )}

        {!isLoading && Array.isArray(berths) && berths.length > 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {berths.map((b) => {
                const isOccupied = b.status === "OCCUPIED";
                const isMaintenance = b.status === "MAINTENANCE";

                return (
                  <div
                    key={b.id}
                    className={`p-3.5 rounded-md border transition-all flex flex-col justify-between ${
                      isOccupied
                        ? "bg-portos-teal-light/40 border-portos-teal/40 shadow-xs"
                        : isMaintenance
                        ? "bg-portos-amber-light/30 border-portos-amber/40"
                        : "bg-white border-portos-border hover:border-portos-teal/50"
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-portos-border/60">
                      <span className="font-mono text-xs font-bold text-portos-navy">
                        {b.code}
                      </span>
                      <StatusBadge
                        status={isOccupied ? "normal" : isMaintenance ? "watch" : "neutral"}
                        label={b.status}
                        size="sm"
                      />
                    </div>

                    <div className="my-2.5 space-y-1 text-xs">
                      <div className="flex justify-between text-portos-muted text-[11px]">
                        <span>Length:</span>
                        <strong className="text-portos-navy font-mono tabular-nums">{b.length_m}m</strong>
                      </div>
                      <div className="flex justify-between text-portos-muted text-[11px]">
                        <span>Draft Depth:</span>
                        <strong className="text-portos-navy font-mono tabular-nums">{b.depth_draft_m}m</strong>
                      </div>
                      <div className="flex justify-between text-portos-muted text-[11px]">
                        <span>Max LOA:</span>
                        <strong className="text-portos-navy font-mono tabular-nums">{b.max_vessel_loa_m}m</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-portos-border/60 text-[10px] text-portos-muted flex items-center justify-between">
                      <span>{b.name}</span>
                      <span className="font-mono font-medium text-portos-navy-secondary">
                        {isOccupied ? "Gang Active" : isMaintenance ? "Offline" : "Free"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-3 bg-white rounded border border-portos-border flex flex-wrap items-center justify-between gap-3 text-[11px] text-portos-muted">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-portos-teal" />
                <span>
                  <strong>Illustrative Layout Notice:</strong> Berths, lengths, and depths represent synthetic models for decision-support evaluation, not official surveyed CPA data.
                </span>
              </div>
              <span className="font-mono text-portos-navy">Karnaphuli Channel Datum: CD + 0.0m</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

