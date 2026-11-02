"use client";

import React, { useState } from "react";
import { Info, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";

export function TwinLegend() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-10 max-w-xs bg-portos-navy/90 backdrop-blur-md text-white rounded-lg border border-portos-navy-secondary shadow-lg text-[11px] overflow-hidden transition-all">
      {/* Legend Toggle Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between p-2.5 hover:bg-portos-navy-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-1.5 font-semibold text-xs text-portos-teal">
          <Info className="h-3.5 w-3.5" />
          <span>Operational Legend & Spatial Datum</span>
        </div>
        {collapsed ? (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>

      {!collapsed && (
        <div className="p-3 pt-1 space-y-2.5 border-t border-portos-navy-secondary/60 text-slate-300">
          {/* Status Color Guide */}
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-portos-teal flex-shrink-0" />
              <span>Normal / Active Flow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-portos-amber flex-shrink-0" />
              <span>Watch / Elevated Delay</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-portos-red flex-shrink-0" />
              <span>Risk / Bottleneck</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400 flex-shrink-0" />
              <span>Available / Idle</span>
            </div>
          </div>

          {/* Spatial Grounding Disclaimer */}
          <div className="p-2 bg-portos-navy-secondary/50 rounded border border-portos-navy-secondary/60 text-[10px] space-y-1">
            <div className="flex items-center gap-1 text-slate-200 font-semibold">
              <ShieldCheck className="h-3 w-3 text-portos-teal" />
              <span>Illustrative Model Disclaimer</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Geometry, quay lengths, and water depths represent synthetic
              procedural models for decision support, not certified CPA nautical
              charts. Channel: Karnaphuli River (Datum CD +0.0m).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

