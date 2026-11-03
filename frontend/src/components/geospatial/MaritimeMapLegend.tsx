"use client";

import React, { useState } from "react";
import {
  Compass,
  ChevronDown,
  ChevronUp,
  X,
  Layers,
  Ship,
  Anchor,
  ShieldCheck,
  AlertTriangle,
  Info,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface MaritimeMapLegendProps {
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export function MaritimeMapLegend({
  isOpen,
  onClose,
  className = "",
}: MaritimeMapLegendProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "vessels" | "navigation" | "yard">("all");

  if (!isOpen) return null;

  return (
    <div
      className={`absolute bottom-10 left-3 z-20 w-80 max-h-[82%] bg-portos-navy/95 backdrop-blur-md border border-portos-navy-secondary rounded-lg shadow-2xl flex flex-col text-xs overflow-hidden transition-all duration-200 ${className}`}
    >
      {/* Header with Title and Window Controls */}
      <div className="flex items-center justify-between p-2.5 border-b border-portos-navy-secondary bg-portos-navy">
        <div className="flex items-center gap-1.5 font-bold text-white text-[11px] uppercase tracking-wider">
          <Compass className="h-3.5 w-3.5 text-portos-teal" />
          <span>Maritime Cartographic Legend</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-portos-navy-secondary/60 transition-colors"
            title={collapsed ? "Expand legend" : "Collapse legend"}
            aria-label="Toggle legend collapse"
          >
            {collapsed ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-portos-navy-secondary/60 transition-colors"
              title="Close legend overlay"
              aria-label="Close legend"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Quick Filter Tabs */}
          <div className="flex items-center justify-between px-2 py-1.5 bg-portos-navy-secondary/40 border-b border-portos-navy-secondary/60 text-[10px]">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === "all" ? "bg-portos-teal text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Layers
            </button>
            <button
              onClick={() => setActiveTab("vessels")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === "vessels" ? "bg-portos-teal text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Vessels
            </button>
            <button
              onClick={() => setActiveTab("navigation")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === "navigation" ? "bg-portos-teal text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Fairway
            </button>
            <button
              onClick={() => setActiveTab("yard")}
              className={`px-2 py-0.5 rounded transition-colors ${
                activeTab === "yard" ? "bg-portos-teal text-white font-medium" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Yards
            </button>
          </div>

          {/* Scrollable Legend Content */}
          <div className="p-3 space-y-3.5 overflow-y-auto max-h-[460px] text-slate-300">
            {/* 1. VESSEL AIS TELEMETRY */}
            {(activeTab === "all" || activeTab === "vessels") && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Ship className="h-3 w-3 text-portos-teal" />
                  <span>Vessels (AIS Telemetry & Status)</span>
                </div>
                <div className="space-y-1.5 text-[11px] bg-slate-900/60 p-2 rounded border border-portos-navy-secondary/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#16a394] border-2 border-white flex-shrink-0" />
                      <span>Berthed Alongside Quay</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">CCT/NCT/PCT</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#38bdf8] border-2 border-white flex-shrink-0" />
                      <span>Inbound / Fairway Transit</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">Underway</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#f59e0b] border-2 border-white flex-shrink-0" />
                      <span>Outer Anchorage Waiting</span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono">At Anchor</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. NAVIGATION FAIRWAY & VESSEL TRACKS */}
            {(activeTab === "all" || activeTab === "navigation") && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="h-3 w-3 text-portos-amber" />
                  <span>Fairway Channels & Vessel Tracks</span>
                </div>
                <div className="space-y-2 text-[11px] bg-slate-900/60 p-2 rounded border border-portos-navy-secondary/50">
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-0 border-t-2 border-dashed border-[#eab308] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-200">Main Navigation Fairway</div>
                      <div className="text-[9px] text-slate-400">Karnaphuli Channel (-11.0m CD)</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-0 border-t-2 border-[#38bdf8] flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-200">Historical AIS Fairway Track</div>
                      <div className="text-[9px] text-slate-400">Observed vessel river trajectory</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-3 rounded border border-dashed border-[#eab308] bg-[#eab308]/15 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-200">Dredged Channel Corridor</div>
                      <div className="text-[9px] text-slate-400">240m navigational width limits</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-4 h-4 rounded-full border border-portos-teal bg-portos-teal/20 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-slate-200">Karnaphuli Turning Basin</div>
                      <div className="text-[9px] text-slate-400">Ø 600m feeder turnaround zone</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. BATHYMETRIC DEPTH CONTOURS */}
            {(activeTab === "all" || activeTab === "navigation") && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-cyan-400" />
                  <span>Bathymetric Depth Contours (CD)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900/60 p-2 rounded border border-portos-navy-secondary/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#0369a1] border border-slate-700 flex-shrink-0" />
                    <span>-14.0m Outer Deep</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#0e7490] border border-slate-700 flex-shrink-0" />
                    <span>-11.0m Turning Basin</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#164e63] border border-slate-700 flex-shrink-0" />
                    <span>-9.0m Nav Fairway</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#1e3a5f] border border-slate-700 flex-shrink-0" />
                    <span>&lt; 5.0m Shoal Hazard</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ANCHORAGES & BERTHS */}
            {(activeTab === "all" || activeTab === "navigation") && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Anchor className="h-3 w-3 text-amber-400" />
                  <span>Anchorages & Quayside Frontage</span>
                </div>
                <div className="space-y-1.5 text-[11px] bg-slate-900/60 p-2 rounded border border-portos-navy-secondary/50">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-3 rounded border border-dashed border-[#f59e0b] bg-[#f59e0b]/20 flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-slate-200">Anchorage Waiting Zones</span>
                      <span className="block text-[9px] text-slate-400">Alpha (Cargo), Bravo (Tankers), Charlie</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-0 border-t-4 border-[#38bdf8] flex-shrink-0" />
                    <div className="flex-1">
                      <span className="text-slate-200">Quayside Berths & Jetties</span>
                      <span className="block text-[9px] text-slate-400">CCT, NCT, GCB, and PCT quays</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. CONTAINER YARD BLOCKS (C01-C12) */}
            {(activeTab === "all" || activeTab === "yard") && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-portos-teal" />
                  <span>Container Yard Blocks (C01–C12)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] bg-slate-900/60 p-2 rounded border border-portos-navy-secondary/50">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#3b82f6] flex-shrink-0" />
                    <span>Import (C01, C02, C07)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#10b981] flex-shrink-0" />
                    <span>Export (C03, C04, C08)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#8b5cf6] flex-shrink-0" />
                    <span>Transshipment (C05)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#0284c7] flex-shrink-0" />
                    <span>Reefer Plugs (C11)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#ef4444] flex-shrink-0" />
                    <span>Hazardous IMO (C12)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-[#64748b] flex-shrink-0" />
                    <span>Empty Stacks (C06, C10)</span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. OPERATIONAL SAFETY & HAZARDS */}
            {activeTab === "all" && (
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 text-red-400" />
                  <span>Operational Alerts & Safety</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-slate-900/60 rounded border border-portos-navy-secondary/50 text-[11px]">
                  <span className="w-3 h-3 rounded-full bg-[#ef4444] border-2 border-[#fee2e2] animate-pulse flex-shrink-0" />
                  <div className="flex-1">
                    <span className="text-slate-200">Active Navigational Hazard</span>
                    <span className="block text-[9px] text-slate-400">Notice to Mariners & wind advisory</span>
                  </div>
                </div>
              </div>
            )}

            {/* 7. DATUM & PROVENANCE FOOTNOTE */}
            <div className="p-2 bg-portos-navy-secondary/40 rounded border border-portos-navy-secondary/60 text-[9px] space-y-1 text-slate-400">
              <div className="flex items-center justify-between text-slate-300 font-semibold">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-portos-teal" />
                  <span>Cartographic Provenance</span>
                </span>
                <DataStatusBadge status="OBSERVED" size="sm" />
              </div>
              <p className="leading-relaxed">
                Horizontal Datum: WGS84 (EPSG:4326). Vertical Datum: Karnaphuli Chart Datum (CD +0.00m). Source: CPA Hydrography & RSGT Masterplan.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

