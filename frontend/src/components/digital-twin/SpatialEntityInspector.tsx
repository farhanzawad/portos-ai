"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Ship,
  SlidersHorizontal,
  Crosshair,
  Gauge,
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SpatialEntityInspectorProps {
  onOpenMaintenanceModal: () => void;
  onFocusEntity?: () => void;
}

export function SpatialEntityInspector({
  onOpenMaintenanceModal,
  onFocusEntity,
}: SpatialEntityInspectorProps) {
  const [selectedCrane, setSelectedCrane] = useState("STS-02");
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <aside className="absolute top-5 right-5 z-20 flex items-center gap-2.5 px-3 py-2 bg-[#0c0e12]/92 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl select-none pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-secondary animate-pulse" />
          <span className="text-xs font-bold text-white font-mono">STS-02</span>
          <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary text-[10px] font-mono">
            0 Anomalies
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1 rounded-md bg-white/[0.06] hover:bg-white/[0.12] text-[#8e9bae] hover:text-white transition-colors"
          title="Expand Entity Inspector"
        >
          <ChevronLeft className="size-4" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="absolute top-5 right-5 bottom-20 w-80 z-20 flex flex-col bg-[#0c0e12]/92 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden select-none pointer-events-auto">
      {/* Inspector Header */}
      <div className="p-4 border-b border-white/[0.08] bg-[#161a24]/60">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-sans font-bold text-[#8e9bae] uppercase tracking-wider">
            Spatial Entity Inspector
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary text-[10px] font-mono border border-secondary-container/30">
              <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
              <span>Online • Live</span>
            </div>
            <button
              onClick={() => setIsCollapsed(true)}
              className="p-1 rounded-md text-[#8e9bae] hover:text-white hover:bg-white/[0.08] transition-colors ml-1"
              title="Collapse Inspector"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
        <h2 className="text-white text-base font-bold tracking-tight">STS Crane #02</h2>
        <p className="text-[#8e9bae] text-xs">ZPMC Dual-Trolley Super Post-Panamax</p>
      </div>

      {/* Card Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* ML Model Card: scikit-learn Isolation Forest */}
        <div className="p-3 rounded-xl bg-[#181c24] border border-white/[0.08] shadow-sm">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-[#8e9bae] font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-secondary" />
              <span>Isolation Forest Health</span>
            </span>
            <span className="text-xs font-bold text-secondary font-mono">0 Anomalies</span>
          </div>
          <p className="text-[11px] text-[#cbd5e1] leading-relaxed">
            Continuous multi-variate telemetry inference across 48 mechanical strain gauges. Risk score{" "}
            <span className="font-mono text-white font-semibold">0.03 / 1.00</span>.
          </p>
        </div>

        {/* Real-Time Dynamic Telemetry Readouts */}
        <div className="space-y-2.5">
          <div className="text-[10px] font-sans font-bold text-[#8e9bae] uppercase tracking-wider">
            Real-time Telemetry Metrics
          </div>

          {/* Metric 1: Spreader Motor Vibration */}
          <div className="p-2.5 rounded-lg bg-[#181c24] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8e9bae]">Spreader Vibration</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                1.4 <span className="text-xs font-normal text-[#8e9bae]">mm/s</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary text-[10px] font-mono font-medium">
                Normal (&lt;2.8)
              </span>
              <div className="w-16 bg-[#282a2e] h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "35%" }} />
              </div>
            </div>
          </div>

          {/* Metric 2: Hydraulic Pressure */}
          <div className="p-2.5 rounded-lg bg-[#181c24] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8e9bae]">Hydraulic Main Pressure</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                210 <span className="text-xs font-normal text-[#8e9bae]">bar</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary text-[10px] font-mono font-medium">
                Optimal (200-220)
              </span>
              <div className="w-16 bg-[#282a2e] h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "78%" }} />
              </div>
            </div>
          </div>

          {/* Metric 3: Hoist Wire Tension */}
          <div className="p-2.5 rounded-lg bg-[#181c24] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8e9bae]">Hoist Wire Tension</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                84 <span className="text-xs font-normal text-[#8e9bae]">% rated</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-mono font-medium">
                Under Load
              </span>
              <div className="w-16 bg-[#282a2e] h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "84%" }} />
              </div>
            </div>
          </div>

          {/* Metric 4: Motor Core Temp */}
          <div className="p-2.5 rounded-lg bg-[#181c24] border border-white/[0.06] flex items-center justify-between">
            <div>
              <div className="text-xs text-[#8e9bae]">Motor Core Temperature</div>
              <div className="text-sm font-bold font-mono text-white mt-0.5">
                48.2 <span className="text-xs font-normal text-[#8e9bae]">°C</span>
              </div>
            </div>
            <div className="text-right">
              <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary text-[10px] font-mono font-medium">
                Nominal
              </span>
              <div className="w-16 bg-[#282a2e] h-1 rounded-full mt-1.5 overflow-hidden">
                <div className="bg-secondary h-full rounded-full" style={{ width: "48%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Associated Berth & Vessel */}
        <div className="pt-2 border-t border-white/[0.08] space-y-2">
          <div className="text-[10px] font-sans font-bold text-[#8e9bae] uppercase tracking-wider">
            Associated Berth &amp; Vessel
          </div>
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[#181c24] border border-white/[0.08]">
            <div className="size-8 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container shrink-0">
              <Ship className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">MV Maersk Karun (Bay 14)</div>
              <div className="text-[10px] font-mono text-[#8e9bae]">40ft HC High-Cube Stacks</div>
            </div>
          </div>
        </div>
      </div>

      {/* Inspector Drawer Footer Actions */}
      <div className="p-3 border-t border-white/[0.08] bg-[#161a24]/80 flex gap-2">
        <button
          onClick={onFocusEntity}
          className="flex-1 h-9 rounded-lg bg-primary-container hover:bg-[#e04513] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-primary-container/20 active:scale-[0.98]"
        >
          <Crosshair className="h-3.5 w-3.5" />
          <span>Focus Crane</span>
        </button>

        <button
          onClick={onOpenMaintenanceModal}
          className="h-9 px-3 rounded-lg bg-[#1e2024] hover:bg-[#282a2e] border border-white/10 text-white text-xs font-medium flex items-center justify-center transition-colors"
          title="Open Anomaly Settings & Derate Levers"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
