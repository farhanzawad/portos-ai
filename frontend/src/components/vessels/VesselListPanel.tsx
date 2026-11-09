"use client";

import React from "react";
import { VesselCallRead } from "@/types/api";
import { VesselFilterState } from "./types";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  Search,
  Ship,
  Clock,
  AlertTriangle,
  X,
  SlidersHorizontal,
  Anchor,
  Compass,
  ArrowRight,
  ShieldCheck,
  Navigation,
  Waves,
  Radio,
  Activity,
  Target,
} from "lucide-react";

interface VesselListPanelProps {
  calls: VesselCallRead[];
  selectedCallId: string | null;
  onSelectCall: (call: VesselCallRead) => void;
  filters: VesselFilterState;
  onFiltersChange: React.Dispatch<React.SetStateAction<VesselFilterState>>;
  onClose?: () => void;
}

export function VesselListPanel({
  calls,
  selectedCallId,
  onSelectCall,
  filters,
  onFiltersChange,
  onClose,
}: VesselListPanelProps) {
  const [corridorRadarMode, setCorridorRadarMode] = React.useState<"fairway" | "tidal" | "radar">("fairway");

  const getCorridorDistanceNM = (call: VesselCallRead) => {
    if (call.status === "BERTHED") return 0.0;
    if (call.status === "PILOT_BOARDING") return 5.2;
    if (call.status === "OUTER_ANCHORAGE") {
      const num = parseInt(call.id.replace(/\D/g, "") || "1", 10);
      return Number((12.5 + (num % 5) * 0.7).toFixed(1));
    }
    return 8.6;
  };

  const getCorridorSectorLabel = (call: VesselCallRead) => {
    if (call.status === "BERTHED") return "Sector 5 · Quayside Berth";
    if (call.status === "PILOT_BOARDING") return "Sector 3 · Pilot Station";
    if (call.status === "OUTER_ANCHORAGE") return "Sector 1 · Outer Roadstead";
    return "Sector 2 · Fairway Approach";
  };

  const filteredCalls = calls.filter((call) => {
    // Search query
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchName = call.vessel?.name?.toLowerCase().includes(q);
      const matchImo = call.vessel?.imo_number?.toLowerCase().includes(q);
      const matchCall = call.call_number?.toLowerCase().includes(q);
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

  const displayCalls = [...filteredCalls].sort((a, b) => {
    if (corridorRadarMode === "fairway") {
      return getCorridorDistanceNM(b) - getCorridorDistanceNM(a);
    }
    if (corridorRadarMode === "tidal") {
      const draftA = a.vessel?.max_draft_m || 0;
      const draftB = b.vessel?.max_draft_m || 0;
      return draftB - draftA;
    }
    return 0;
  });

  const counts = {
    all: calls.length,
    anchorage: calls.filter((c) => c.status === "OUTER_ANCHORAGE").length,
    pilotage: calls.filter((c) => c.status === "PILOT_BOARDING").length,
    berthed: calls.filter((c) => c.status === "BERTHED").length,
    highRisk: calls.filter((c) => c.delay_risk_status === "HIGH_RISK").length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OUTER_ANCHORAGE":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            ANCHORAGE
          </span>
        );
      case "PILOT_BOARDING":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
            PILOTAGE
          </span>
        );
      case "BERTHED":
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            BERTHED
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            {status.replace("_", " ")}
          </span>
        );
    }
  };

  const getRiskBadge = (risk: string, delayHours: number) => {
    if (risk === "HIGH_RISK" || delayHours >= 3.0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          +{delayHours}h Delay
        </span>
      );
    }
    if (risk === "WATCH" || delayHours > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          +{delayHours}h Delay
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        Nominal
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden text-xs font-sans">
      {/* Search & Header Section */}
      <div className="p-3.5 border-b border-slate-200/80 bg-slate-50/50 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Ship className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-xs">
                Vessel Radar Queue
              </h3>
              <p className="text-[10px] text-slate-500 font-medium">
                Fairway approach & Karnaphuli roadstead
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700 font-bold text-[10px] tabular-nums">
              {filteredCalls.length} / {calls.length}
            </span>
            {onClose && (
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 flex items-center justify-center transition-colors"
                title="Collapse vessel radar overlay"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search vessel name, IMO, call..."
            value={filters.search}
            onChange={(e) =>
              onFiltersChange((prev) => ({ ...prev, search: e.target.value }))
            }
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-2xs"
          />
          {filters.search && (
            <button
              onClick={() => onFiltersChange((prev) => ({ ...prev, search: "" }))}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Corridor Radar Variations Switcher */}
        <div className="flex items-center p-0.5 bg-slate-200/60 rounded-xl border border-slate-200 text-[10px] font-bold">
          <button
            onClick={() => setCorridorRadarMode("fairway")}
            className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
              corridorRadarMode === "fairway"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Sort along geographical fairway corridor by distance to berth"
          >
            <Navigation className="h-3 w-3 text-sky-600" />
            <span>Fairway Order</span>
          </button>
          <button
            onClick={() => setCorridorRadarMode("tidal")}
            className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
              corridorRadarMode === "tidal"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Group by Tidal Window requirement and safe draft limits"
          >
            <Waves className="h-3 w-3 text-amber-600" />
            <span>Tidal Window</span>
          </button>
          <button
            onClick={() => setCorridorRadarMode("radar")}
            className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
              corridorRadarMode === "radar"
                ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                : "text-slate-500 hover:text-slate-800"
            }`}
            title="Tactical VTS telemetry, heading vectors, and collision avoidance"
          >
            <Radio className="h-3 w-3 text-emerald-600" />
            <span>Tactical Radar</span>
          </button>
        </div>

        {/* Fasto SaaS Segmented Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-semibold">
          <button
            onClick={() => onFiltersChange((prev) => ({ ...prev, status: "ALL", delayRisk: "ALL" }))}
            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all ${
              filters.status === "ALL" && filters.delayRisk === "ALL"
                ? "bg-slate-900 text-white font-bold shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            All ({counts.all})
          </button>
          <button
            onClick={() => onFiltersChange((prev) => ({ ...prev, status: "OUTER_ANCHORAGE", delayRisk: "ALL" }))}
            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all ${
              filters.status === "OUTER_ANCHORAGE"
                ? "bg-amber-600 text-white font-bold shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Anchorage ({counts.anchorage})
          </button>
          <button
            onClick={() => onFiltersChange((prev) => ({ ...prev, status: "PILOT_BOARDING", delayRisk: "ALL" }))}
            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all ${
              filters.status === "PILOT_BOARDING"
                ? "bg-sky-600 text-white font-bold shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Pilotage ({counts.pilotage})
          </button>
          <button
            onClick={() => onFiltersChange((prev) => ({ ...prev, status: "BERTHED", delayRisk: "ALL" }))}
            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all ${
              filters.status === "BERTHED"
                ? "bg-emerald-600 text-white font-bold shadow-2xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            Berthed ({counts.berthed})
          </button>
          <button
            onClick={() => onFiltersChange((prev) => ({ ...prev, delayRisk: "HIGH_RISK", status: "ALL" }))}
            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all ${
              filters.delayRisk === "HIGH_RISK"
                ? "bg-rose-600 text-white font-bold shadow-2xs"
                : "bg-white text-rose-700 border border-rose-200 hover:bg-rose-50"
            }`}
          >
            High Risk ({counts.highRisk})
          </button>
        </div>
      </div>

      {/* Vessel List Cards Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {filteredCalls.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-500">
            <Ship className="h-7 w-7 mx-auto mb-2 text-slate-400" />
            <p className="font-bold text-xs text-slate-700">No vessels match criteria</p>
            <p className="text-[11px] mt-1 text-slate-500">
              Clear search or switch status filter pills above.
            </p>
            <button
              onClick={() => onFiltersChange({ search: "", status: "ALL", delayRisk: "ALL" })}
              className="mt-3 px-3 py-1 bg-white border border-slate-200 text-slate-700 rounded-full font-semibold text-[11px] hover:bg-slate-100 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          displayCalls.map((call) => {
            const isSelected = selectedCallId === call.id;
            const eta = new Date(call.reported_eta);
            const draft = call.vessel?.max_draft_m || 0;
            const isTidalConstrained = draft >= 8.8;
            const distanceNM = getCorridorDistanceNM(call);
            const sectorLabel = getCorridorSectorLabel(call);

            return (
              <button
                key={call.id}
                onClick={() => onSelectCall(call)}
                className={`w-full p-3 rounded-xl border transition-all text-left flex flex-col gap-2 group ${
                  isSelected
                    ? "bg-sky-50/40 border-sky-500 ring-2 ring-sky-500/20 shadow-xs"
                    : "bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-2xs"
                }`}
              >
                {/* Header Row: Vessel Name & Status */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 text-xs sm:text-sm leading-snug group-hover:text-sky-600 transition-colors">
                        {call.vessel?.name || "DEMO Vessel"}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 truncate">
                      <span className="font-semibold text-slate-600">{call.call_number}</span>
                      <span>·</span>
                      <span>IMO {call.vessel?.imo_number}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {getStatusBadge(call.status)}
                  </div>
                </div>

                {/* Variation 1: Fairway Spatial Corridor Sector Banner */}
                {corridorRadarMode === "fairway" && (
                  <div className="flex items-center justify-between text-[10px] font-mono px-2.5 py-1 rounded-lg bg-sky-50 text-sky-900 border border-sky-100 shadow-2xs">
                    <span className="font-semibold flex items-center gap-1 truncate">
                      <Navigation className="h-3 w-3 text-sky-600 flex-shrink-0" />
                      <span className="truncate">{sectorLabel}</span>
                    </span>
                    <span className="font-extrabold text-sky-800 shrink-0 ml-1">
                      {distanceNM === 0 ? "Berthed (0 NM)" : `${distanceNM} NM to Quay`}
                    </span>
                  </div>
                )}

                {/* Variation 2: Tactical VTS Radar Matrix */}
                {corridorRadarMode === "radar" && (
                  <div className="grid grid-cols-3 gap-1.5 p-2 rounded-lg bg-slate-900 text-slate-100 text-[10px] font-mono border border-slate-800 shadow-inner">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[9px] uppercase">Speed / COG</span>
                      <span className="font-bold text-emerald-400">
                        {call.status === "BERTHED" ? "0.0 kn" : "12.4 kn · 038°"}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[9px] uppercase">CPA Range</span>
                      <span className="font-bold text-sky-400">&gt; 1.8 NM</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[9px] uppercase">Transponder</span>
                      <span className="font-bold text-teal-400">Class A VHF</span>
                    </div>
                  </div>
                )}

                {/* Technical Dimensions & Karnaphuli Channel Clearance Gauge */}
                <div className="p-2 rounded-lg bg-slate-50/80 border border-slate-100 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                    <span>
                      LOA <strong className="text-slate-800 font-bold">{call.vessel?.length_overall_m}m</strong> · Beam{" "}
                      <strong className="text-slate-800 font-bold">{call.vessel?.beam_m}m</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      Draft <strong className="text-slate-900 font-extrabold">{draft}m</strong>
                    </span>
                  </div>

                  {/* Draft Progress vs Karnaphuli 9.5m Maximum Datum Limit */}
                  <div className="space-y-0.5">
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden flex">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isTidalConstrained ? "bg-amber-500" : "bg-sky-500"
                        }`}
                        style={{ width: `${Math.min(100, (draft / 9.5) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400">
                      <span>0m</span>
                      <span className={isTidalConstrained ? "text-amber-600 font-semibold" : "text-slate-400"}>
                        {isTidalConstrained ? "High Tide Gate Window Req." : "Channel Clear (Max 9.5m)"}
                      </span>
                      <span>9.5m limit</span>
                    </div>
                  </div>
                </div>

                {/* Footer: ETA & Delay Pill */}
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <span>
                      {eta.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      {eta.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div>{getRiskBadge(call.delay_risk_status, call.predicted_delay_hours)}</div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
