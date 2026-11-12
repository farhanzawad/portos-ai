"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getYardStatus, getYardCongestionAlerts } from "@/lib/api-client";
import {
  Boxes,
  Layers,
  Thermometer,
  Truck,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Download,
  Shuffle,
  RefreshCw,
  Activity,
  ArrowUpRight,
  TrendingUp,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface YardBlock {
  id: string;
  code: string;
  zone: string;
  type: "DRY" | "REEFER" | "EMPTY" | "HAZMAT";
  currentTeu: number;
  capacityTeu: number;
  occupancyPct: number;
  dwellDays: number;
  rehandles: number;
  rtgAssigned: string;
  status: "NORMAL" | "WATCH" | "CRITICAL";
}

const DEFAULT_BLOCKS: YardBlock[] = [
  { id: "A1", code: "BLK A1", zone: "CCT Quayside", type: "DRY", currentTeu: 1820, capacityTeu: 2200, occupancyPct: 82.7, dwellDays: 3.8, rehandles: 24, rtgAssigned: "RTG-01", status: "NORMAL" },
  { id: "A2", code: "BLK A2", zone: "CCT Quayside", type: "DRY", currentTeu: 1940, capacityTeu: 2200, occupancyPct: 88.1, dwellDays: 4.2, rehandles: 48, rtgAssigned: "RTG-02", status: "WATCH" },
  { id: "A3", code: "BLK A3", zone: "CCT Quayside", type: "DRY", currentTeu: 1710, capacityTeu: 2200, occupancyPct: 77.7, dwellDays: 3.4, rehandles: 18, rtgAssigned: "RTG-03", status: "NORMAL" },
  { id: "A4", code: "BLK A4", zone: "CCT Cold Chain", type: "REEFER", currentTeu: 2120, capacityTeu: 2200, occupancyPct: 96.4, dwellDays: 5.6, rehandles: 142, rtgAssigned: "RTG-04", status: "CRITICAL" },
  { id: "B1", code: "BLK B1", zone: "NCT Ingress", type: "DRY", currentTeu: 1890, capacityTeu: 2400, occupancyPct: 78.8, dwellDays: 3.9, rehandles: 32, rtgAssigned: "RTG-05", status: "NORMAL" },
  { id: "B2", code: "BLK B2", zone: "NCT Ingress", type: "DRY", currentTeu: 2210, capacityTeu: 2400, occupancyPct: 92.1, dwellDays: 4.9, rehandles: 84, rtgAssigned: "RTG-06", status: "CRITICAL" },
  { id: "B3", code: "BLK B3", zone: "NCT Rail Head", type: "DRY", currentTeu: 1650, capacityTeu: 2400, occupancyPct: 68.8, dwellDays: 3.1, rehandles: 14, rtgAssigned: "RTG-07", status: "NORMAL" },
  { id: "B4", code: "BLK B4", zone: "NCT Cold Chain", type: "REEFER", currentTeu: 2010, capacityTeu: 2200, occupancyPct: 91.4, dwellDays: 5.1, rehandles: 96, rtgAssigned: "RTG-08", status: "CRITICAL" },
  { id: "C1", code: "BLK C1", zone: "GCB General", type: "DRY", currentTeu: 1420, capacityTeu: 2000, occupancyPct: 71.0, dwellDays: 3.2, rehandles: 12, rtgAssigned: "RTG-09", status: "NORMAL" },
  { id: "C2", code: "BLK C2", zone: "GCB General", type: "DRY", currentTeu: 1780, capacityTeu: 2000, occupancyPct: 89.0, dwellDays: 4.4, rehandles: 52, rtgAssigned: "RTG-10", status: "WATCH" },
  { id: "C3", code: "BLK C3", zone: "Off-Dock Buffer", type: "EMPTY", currentTeu: 1980, capacityTeu: 2500, occupancyPct: 79.2, dwellDays: 2.8, rehandles: 8, rtgAssigned: "RTG-11", status: "NORMAL" },
  { id: "C4", code: "BLK C4", zone: "Off-Dock Buffer", type: "EMPTY", currentTeu: 2040, capacityTeu: 2500, occupancyPct: 81.6, dwellDays: 2.9, rehandles: 10, rtgAssigned: "RTG-12", status: "NORMAL" },
  { id: "D1", code: "BLK D1", zone: "Patenga Transit", type: "HAZMAT", currentTeu: 820, capacityTeu: 1200, occupancyPct: 68.3, dwellDays: 2.1, rehandles: 6, rtgAssigned: "RTG-13", status: "NORMAL" },
  { id: "D2", code: "BLK D2", zone: "Patenga Transit", type: "DRY", currentTeu: 1950, capacityTeu: 2200, occupancyPct: 88.6, dwellDays: 4.3, rehandles: 44, rtgAssigned: "RTG-14", status: "WATCH" },
  { id: "D3", code: "BLK D3", zone: "Customs Hold", type: "DRY", currentTeu: 1430, capacityTeu: 1600, occupancyPct: 89.4, dwellDays: 6.8, rehandles: 62, rtgAssigned: "RTG-15", status: "WATCH" },
  { id: "D4", code: "BLK D4", zone: "Customs Hold", type: "DRY", currentTeu: 1390, capacityTeu: 1600, occupancyPct: 86.9, dwellDays: 6.4, rehandles: 58, rtgAssigned: "RTG-16", status: "WATCH" },
];

// Bay Micro-Profile Matrix: 5 Tiers x 15 Bays
const BAY_SLICES = [
  { tier: "T-5", slots: ["EMPTY", "RISK", "EMPTY", "20FT", "EMPTY", "RISK", "EMPTY", "EMPTY", "40HC", "RISK", "EMPTY", "20FT", "EMPTY", "RISK", "EMPTY"] },
  { tier: "T-4", slots: ["40RF", "40RF", "40RF", "20RF", "40HC", "40RF", "40RF", "EMPTY", "40RF", "40RF", "40RF", "20RF", "40RF", "40RF", "20RF"] },
  { tier: "T-3", slots: ["40RF", "40RF", "40RF", "20FT", "40HC", "40RF", "40RF", "40HC", "40RF", "40RF", "40RF", "20FT", "40RF", "40RF", "20FT"] },
  { tier: "T-2", slots: ["40HC", "40HC", "40HC", "20FT", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "20FT", "40HC", "40HC", "20FT"] },
  { tier: "T-1", slots: ["40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC", "40HC"] },
];

export function YardStackingCockpitView() {
  const [horizon, setHorizon] = useState<"live" | "6h" | "12h" | "24h">("live");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [selectedBlockId, setSelectedBlockId] = useState<string>("A4");
  const [isSimulatingShuffles, setIsSimulatingShuffles] = useState(false);

  const { data: yardStatus, refetch } = useQuery({
    queryKey: ["yard-status"],
    queryFn: () => getYardStatus(),
  });

  const selectedBlock = DEFAULT_BLOCKS.find((b) => b.id === selectedBlockId) || DEFAULT_BLOCKS[3];

  const filteredBlocks = DEFAULT_BLOCKS.filter((b) => {
    if (zoneFilter === "ALL") return true;
    if (zoneFilter === "CCT") return b.zone.includes("CCT");
    if (zoneFilter === "NCT") return b.zone.includes("NCT");
    if (zoneFilter === "REEFER") return b.type === "REEFER";
    return true;
  });

  const handleSimulateShuffle = () => {
    setIsSimulatingShuffles(true);
    setTimeout(() => {
      setIsSimulatingShuffles(false);
    }, 1200);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. Command Context & Time Horizon Subheader */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111318] border border-white/[0.08] shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase tracking-wider">
              Yard Management Core
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="font-mono text-xs text-secondary flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-secondary animate-pulse" />
              GBRT Model v4.2 Active
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="font-mono text-xs text-[#8e9bae]">Zone Chittagong CCT / NCT Matrix</span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Yard Stacking & Spatial Optimization
          </h1>
          <p className="font-sans text-xs text-[#8e9bae] max-w-3xl leading-relaxed">
            GBRT Spatial Optimization Engine v4.2 • Real-Time Yard Density, Stacking Tier Allocations &amp; Predictive Micro-Slotting.
          </p>
        </div>

        {/* Action Controls & Horizon Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center p-1 rounded-xl bg-[#0c0e12] border border-white/[0.08] text-xs font-mono">
            <button
              onClick={() => setHorizon("live")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                horizon === "live"
                  ? "bg-[#1e2024] text-white shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              <span className="size-1.5 rounded-full bg-secondary" />
              <span>Live Now</span>
            </button>
            <button
              onClick={() => setHorizon("6h")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                horizon === "6h"
                  ? "bg-[#1e2024] text-white shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              +6h Forecast
            </button>
            <button
              onClick={() => setHorizon("12h")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                horizon === "12h"
                  ? "bg-[#1e2024] text-white shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              +12h Projection
            </button>
            <button
              onClick={() => setHorizon("24h")}
              className={`px-3 py-1.5 rounded-lg transition-all hidden sm:inline-flex ${
                horizon === "24h"
                  ? "bg-[#1e2024] text-white shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              +24h Auto-Balance
            </button>
          </div>

          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-xl bg-[#1e2024] hover:bg-[#282a2e] text-[#8e9bae] hover:text-white border border-white/[0.08] transition-colors"
            title="Refresh Yard Telemetry"
          >
            <RefreshCw className="size-4" />
          </button>

          <button className="px-3.5 py-2 rounded-xl bg-[#1e2024] hover:bg-[#282a2e] text-white text-xs font-medium border border-white/[0.08] flex items-center gap-2 transition-colors shadow-xs">
            <Download className="size-4 text-[#8e9bae]" />
            <span>Export BAPLIE</span>
          </button>

          <button className="px-4 py-2 rounded-xl bg-primary-container text-white text-xs font-bold hover:opacity-90 flex items-center gap-2 transition-all shadow-lg shadow-primary-container/20">
            <Shuffle className="size-4" />
            <span>Auto-Balance Yard</span>
          </button>
        </div>
      </div>

      {/* 2. Hero KPI Telemetry Strip (4 Operational Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Yard Saturation */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative overflow-hidden shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#8e9bae] uppercase tracking-wider font-bold">
              Total Yard Saturation
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
              91.4% CRITICAL
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              38,420
            </span>
            <span className="font-mono text-xs text-[#8e9bae]">/ 42,000 TEU</span>
          </div>
          <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full w-[91.4%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8e9bae] pt-1">
            <span>Ground Slots: 23,000</span>
            <span className="text-amber-400">4-Tier Stack Limit</span>
          </div>
        </div>

        {/* Card 2: Active RTG Cranes */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative overflow-hidden shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#8e9bae] uppercase tracking-wider font-bold">
              Active RTG Cranes
            </span>
            <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary font-mono text-[10px] font-bold">
              85.7% HEALTH
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              24
            </span>
            <span className="font-mono text-xs text-[#8e9bae]">/ 28 In-Op</span>
          </div>
          <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
            <div className="bg-secondary h-full rounded-full w-[85.7%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8e9bae] pt-1">
            <span>21.4 Moves / hr</span>
            <span className="text-[#cbd5e1]">4 In Maintenance</span>
          </div>
        </div>

        {/* Card 3: Mean Dwell Time */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative overflow-hidden shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#8e9bae] uppercase tracking-wider font-bold">
              Mean Dwell Time
            </span>
            <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-mono text-[10px] font-bold">
              +1.3d DRIFT
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              4.8
            </span>
            <span className="font-mono text-xs text-[#8e9bae]">days</span>
          </div>
          <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary-container h-full rounded-full w-[70%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8e9bae] pt-1">
            <span>Target Benchmark: &lt;3.5d</span>
            <span className="text-primary font-bold">Import Backlog</span>
          </div>
        </div>

        {/* Card 4: Reefer Cold Chain */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative overflow-hidden shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#8e9bae] uppercase tracking-wider font-bold">
              Reefer Cold Chain
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold">
              92.4% PLUGGED
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              1,192
            </span>
            <span className="font-mono text-xs text-[#8e9bae]">/ 1,290 Plugs</span>
          </div>
          <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full w-[92.4%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8e9bae] pt-1">
            <span>Temp Alarms: 2 Critical</span>
            <span className="text-secondary">88 Gensets Active</span>
          </div>
        </div>
      </div>

      {/* 3. Main Operational Spatial Workspace Grid (7 cols / 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Terminal Spatial Matrix & Bay Micro-Profile (7 of 12 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Spatial Matrix Container */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#1e2024] text-secondary border border-white/[0.06]">
                  <Boxes className="size-4" />
                </div>
                <div>
                  <h2 className="font-headline text-base font-bold text-white">
                    Terminal Spatial Matrix (16 Blocks)
                  </h2>
                  <p className="font-sans text-xs text-[#8e9bae]">
                    CCT &amp; NCT Stacking Blocks • Real-time dwell, load % &amp; RTG deployment
                  </p>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#0c0e12] border border-white/[0.08] text-xs font-mono">
                <button
                  onClick={() => setZoneFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    zoneFilter === "ALL" ? "bg-[#1e2024] text-white font-bold" : "text-[#8e9bae] hover:text-white"
                  }`}
                >
                  All (16)
                </button>
                <button
                  onClick={() => setZoneFilter("CCT")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    zoneFilter === "CCT" ? "bg-[#1e2024] text-white font-bold" : "text-[#8e9bae] hover:text-white"
                  }`}
                >
                  CCT Quayside
                </button>
                <button
                  onClick={() => setZoneFilter("NCT")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    zoneFilter === "NCT" ? "bg-[#1e2024] text-white font-bold" : "text-[#8e9bae] hover:text-white"
                  }`}
                >
                  NCT Rail
                </button>
                <button
                  onClick={() => setZoneFilter("REEFER")}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    zoneFilter === "REEFER" ? "bg-[#1e2024] text-white font-bold" : "text-[#8e9bae] hover:text-white"
                  }`}
                >
                  Cold Chain
                </button>
              </div>
            </div>

            {/* 16 Blocks Clean Grid (4 cols on md) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {filteredBlocks.map((b) => {
                const isSelected = b.id === selectedBlockId;
                return (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBlockId(b.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between h-28 ${
                      isSelected
                        ? "bg-[#1e2024] border-primary-container ring-1 ring-primary-container shadow-md"
                        : "bg-[#0c0e12] border-white/[0.06] hover:border-white/20 hover:bg-[#14171f]"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-xs font-bold text-white">{b.code}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          b.status === "CRITICAL"
                            ? "bg-rose-500/20 text-rose-400"
                            : b.status === "WATCH"
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-secondary-container/20 text-secondary"
                        }`}
                      >
                        {b.occupancyPct.toFixed(0)}%
                      </span>
                    </div>

                    <div className="space-y-1 w-full my-1">
                      <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.status === "CRITICAL"
                              ? "bg-rose-500"
                              : b.status === "WATCH"
                              ? "bg-amber-400"
                              : "bg-secondary"
                          }`}
                          style={{ width: `${b.occupancyPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#8e9bae]">
                        <span>{b.currentTeu} TEU</span>
                        <span>{b.dwellDays}d</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[9px] font-mono text-[#64748b] w-full pt-1 border-t border-white/[0.04]">
                      <span>{b.type}</span>
                      <span className="text-[#8e9bae]">{b.rtgAssigned}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bay Micro-Profile Cross Section Elevation View (Bays 01-15 x 5 Tiers) */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container/20 text-primary uppercase">
                    {selectedBlock.code} SLICES
                  </span>
                  <h3 className="font-headline text-base font-bold text-white">
                    Bay Micro-Profile Elevation View
                  </h3>
                </div>
                <p className="font-sans text-xs text-[#8e9bae] mt-0.5">
                  Cross-sectional container stack across Bays 01 to 15 (5 Tiers high • 6 Rows deep)
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right font-mono text-xs">
                  <div className="text-[10px] text-[#8e9bae]">Re-handles Rate:</div>
                  <div className="text-rose-400 font-bold">{selectedBlock.rehandles} TEU / shift</div>
                </div>
                <button
                  onClick={handleSimulateShuffle}
                  disabled={isSimulatingShuffles}
                  className="px-3 py-1.5 rounded-xl bg-[#1e2024] hover:bg-[#282a2e] text-primary text-xs font-semibold border border-white/[0.08] flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Shuffle className={`size-3.5 ${isSimulatingShuffles ? "animate-spin" : ""}`} />
                  <span>{isSimulatingShuffles ? "Simulating..." : "Simulate Shuffling"}</span>
                </button>
              </div>
            </div>

            {/* Horizontal Compact Cross-Section Grid (Tier 5 down to Tier 1) */}
            <div className="w-full overflow-x-auto pb-2">
              <div className="min-w-[620px] space-y-1.5 font-mono">
                {BAY_SLICES.map((row) => (
                  <div key={row.tier} className="flex items-center gap-1.5">
                    <span className="w-10 text-[10px] text-[#8e9bae] font-bold text-right pr-1 shrink-0">
                      {row.tier}
                    </span>
                    <div
                      className="grid flex-1 gap-1"
                      style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
                    >
                      {row.slots.map((slot, sIdx) => {
                        const isRisk = slot === "RISK";
                        const isEmpty = slot === "EMPTY";
                        const isReefer = slot.includes("RF");
                        return (
                          <div
                            key={sIdx}
                            className={`h-7 rounded flex items-center justify-center text-[9px] font-bold transition-all ${
                              isRisk
                                ? "bg-rose-500 text-white animate-pulse shadow-xs"
                                : isEmpty
                                ? "bg-[#161a22] text-[#475569] border border-white/[0.03]"
                                : isReefer
                                ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/30"
                                : "bg-[#1f2633] text-cyan-300 border border-cyan-500/20"
                            }`}
                            title={`Bay ${String(sIdx + 1).padStart(2, "0")} • ${row.tier}: ${slot}`}
                          >
                            {slot}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Bay Column Numbers (01 - 15) */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-white/[0.06]">
                  <span className="w-10 shrink-0" />
                  <div
                    className="grid flex-1 gap-1 text-center text-[9px] text-[#64748b]"
                    style={{ gridTemplateColumns: "repeat(15, minmax(0, 1fr))" }}
                  >
                    {Array.from({ length: 15 }).map((_, i) => (
                      <span key={i}>B{String(i + 1).padStart(2, "0")}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Micro-profile legend */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[10px] font-mono text-[#8e9bae] border-t border-white/[0.06]">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded bg-rose-500" />
                  <span>Immediate Re-handle Risk (T-5)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded bg-emerald-950 border border-emerald-500/40" />
                  <span>Reefer Plug Active (RF)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded bg-[#1f2633] border border-cyan-500/30" />
                  <span>Dry Cargo Standard (HC/FT)</span>
                </span>
              </div>
              <span className="text-[#64748b]">Max Tier Envelope: 5 High</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected Block Inspector & Dispatches (5 of 12 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Block Deep-Dive Inspector Card */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-secondary animate-pulse" />
                <h3 className="font-headline text-base font-bold text-white">
                  {selectedBlock.code} Detailed Telemetry
                </h3>
              </div>
              <span
                className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                  selectedBlock.status === "CRITICAL"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "bg-secondary-container/20 text-secondary border border-secondary-container/30"
                }`}
              >
                {selectedBlock.type} PRIORITY
              </span>
            </div>

            {/* Metric Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e9bae]">CURRENT CAPACITY</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedBlock.currentTeu} <span className="text-xs text-[#8e9bae]">/ {selectedBlock.capacityTeu}</span>
                </div>
                <div className="text-[10px] text-amber-400 mt-0.5">
                  {selectedBlock.occupancyPct.toFixed(1)}% Stacking Density
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e9bae]">MEAN DWELL TIME</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {selectedBlock.dwellDays} <span className="text-xs text-[#8e9bae]">days</span>
                </div>
                <div className="text-[10px] text-[#4edea3] mt-0.5">
                  Target: &lt;3.5d
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e9bae]">COLD CHAIN PLUGS</div>
                <div className="text-base font-bold text-rose-400 mt-0.5">
                  {selectedBlock.type === "REEFER" ? "96.4% Load" : "N/A Dry"}
                </div>
                <div className="text-[10px] text-[#8e9bae] mt-0.5">
                  {selectedBlock.type === "REEFER" ? "2 Alarms Active" : "No monitoring"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e9bae]">TARGET VESSEL</div>
                <div className="text-xs font-bold text-white mt-0.5 truncate">
                  MV Maersk Karun
                </div>
                <div className="text-[10px] text-secondary mt-0.5">
                  Slot CCT-01 (18:30)
                </div>
              </div>
            </div>
          </div>

          {/* Assigned RTG Gantry Ops */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Truck className="size-4 text-secondary" />
                <h4 className="font-headline text-sm font-bold text-white">
                  Assigned RTG Gantry Cranes
                </h4>
              </div>
              <span className="font-mono text-[10px] text-[#8e9bae]">
                Active Shift: 14:00 - 22:00
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <span>{selectedBlock.rtgAssigned} (Hybrid E-RTG)</span>
                    <span className="px-1.5 py-0.2 rounded bg-secondary-container/20 text-secondary text-[9px]">
                      ACTIVE
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8e9bae] mt-0.5">
                    Operator: S. Rahman • Lift Capacity: 41 t
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-secondary font-bold text-sm">31.2</div>
                  <div className="text-[9px] text-[#8e9bae]">moves / hr</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-white font-bold">
                    <span>RTG-07 (Electric RTG)</span>
                    <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[9px]">
                      STAGED
                    </span>
                  </div>
                  <div className="text-[10px] text-[#8e9bae] mt-0.5">
                    Auxiliary Assist • Rail Crossing Transit
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold text-sm">18.5</div>
                  <div className="text-[9px] text-[#8e9bae]">moves / hr</div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Spatial Dispatch Recommendations */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <h4 className="font-headline text-sm font-bold text-white">
                  AI Spatial Dispatches &amp; Automation
                </h4>
              </div>
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container/20 text-primary">
                2 ADVISORIES
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-[#1e2024] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-primary flex items-center gap-1.5">
                    <Zap className="size-3 text-primary" />
                    REROUTE CHASSIS INGRESS
                  </span>
                  <span className="font-mono text-[10px] text-[#8e9bae]">ETA: 12 min</span>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  Divert 14 incoming export chassis from Block A4 to Yard C2 to prevent quayside RTG deadlocks.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[10px] text-secondary">
                    Congestion Mitigation: -18.4%
                  </span>
                  <button className="px-3 py-1 rounded-lg bg-primary-container text-white text-[11px] font-bold hover:opacity-90 transition-all">
                    Authorize Divert
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#1e2024] border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="size-3 text-amber-400" />
                    PRE-EMPTIVE COLD CHAIN SHUFFLE
                  </span>
                  <span className="font-mono text-[10px] text-[#8e9bae]">Bay 04 / 10</span>
                </div>
                <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
                  Trigger automated night shuffling for 8 buried reefers scheduled for MV OOCL Singapore.
                </p>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-[10px] text-secondary">
                    Turnaround Saved: 38 min
                  </span>
                  <button className="px-3 py-1 rounded-lg bg-[#282a2e] hover:bg-[#333539] text-white text-[11px] font-semibold border border-white/[0.08] transition-all">
                    Queue Move
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom System Health & Audit Protocol Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c0e12] border border-white/[0.08] text-xs font-mono text-[#8e9bae]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-secondary font-bold">
            <span className="size-2 rounded-full bg-secondary animate-pulse" />
            GBRT SPATIAL ENGINE: OPTIMAL
          </span>
          <span>•</span>
          <span>SOLVER LATENCY: 22.4 ms</span>
          <span>•</span>
          <span>TOTAL PHYSICAL SLOTS: 23,000 GROUND SPOTS</span>
        </div>
        <div className="flex items-center gap-3">
          <span>PORTOS ENGINE v4.2</span>
          <span>•</span>
          <span className="text-white font-semibold">CPA OFFICIAL MARITIME PROTOCOL</span>
        </div>
      </div>
    </div>
  );
}
