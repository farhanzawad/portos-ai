"use client";

import React from "react";
import { Ship, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

interface ActiveFairwayTrafficCardProps {
  onSelectVessel?: (vesselName: string) => void;
  selectedVessel?: string;
}

export function ActiveFairwayTrafficCard({
  onSelectVessel,
  selectedVessel = "MV OOCL Singapore",
}: ActiveFairwayTrafficCardProps) {
  const vessels = [
    {
      name: "MV OOCL Singapore",
      badge: "CRITICAL DRAFT",
      badgeType: "critical",
      speed: "8.4 kts",
      imo: "9460215",
      type: "Container Ship",
      loaBeam: "260m × 32m",
      draft: "10.4m Max",
      ukcMargin: "+0.62m",
      prediction: "Gradient Boosting Est. Berthing: 14:52 BST (On Time)",
    },
    {
      name: "MV Wan Hai 316",
      badge: "APPROACHING",
      badgeType: "normal",
      speed: "10.1 kts",
      imo: "9326419",
      type: "Container",
      loaBeam: "212m × 30m",
      draft: "9.1m",
      ukcMargin: "PILOT ETA: 13:45 BST",
      prediction: null,
    },
    {
      name: "Pacific Endeavor",
      badge: "OUTBOUND",
      badgeType: "warning",
      speed: "6.2 kts",
      imo: "9188207",
      type: "Bulk Carrier",
      loaBeam: "189m × 28m",
      draft: "7.8m",
      ukcMargin: "CLEARANCE: Clear Out",
      prediction: null,
    },
  ];

  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.08] shadow-xl overflow-hidden flex flex-col select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#161922] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-primary" />
          <span className="text-xs sm:text-sm font-bold font-mono text-white uppercase tracking-wider">
            Active Fairway Traffic
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#8e9bae]">
          ML ESTIMATOR: ±0.42h MAE
        </span>
      </div>

      {/* Vessel List */}
      <div className="p-3 space-y-2.5 divide-y divide-white/[0.06]">
        {vessels.map((v) => {
          const isSelected = selectedVessel === v.name;
          return (
            <div
              key={v.name}
              onClick={() => onSelectVessel && onSelectVessel(v.name)}
              className={`pt-2.5 first:pt-0 rounded-xl p-2.5 transition-all cursor-pointer ${
                isSelected
                  ? "bg-[#1c202a] border border-white/20 shadow-md ring-1 ring-primary/40"
                  : "hover:bg-white/[0.03] border border-transparent"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{v.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                      v.badgeType === "critical"
                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                        : v.badgeType === "warning"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-secondary-container/20 text-secondary border border-secondary-container/30"
                    }`}
                  >
                    {v.badge}
                  </span>
                </div>
                <span className="text-xs font-bold font-mono text-secondary">{v.speed}</span>
              </div>

              <div className="text-[10px] font-mono text-[#8e9bae] mt-0.5">
                IMO {v.imo} • {v.type}
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-3 gap-2 text-[10px] font-mono mt-2 pt-2 border-t border-white/[0.06] text-[#8e9bae]">
                <div>
                  <span className="block text-[8px] uppercase">LOA × BEAM</span>
                  <span className="text-white font-medium">{v.loaBeam}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase">DRAFT</span>
                  <span className="text-white font-medium">{v.draft}</span>
                </div>
                <div>
                  <span className="block text-[8px] uppercase">
                    {v.badgeType === "critical" ? "UKC MARGIN" : "STATUS"}
                  </span>
                  <span
                    className={`font-semibold ${
                      v.badgeType === "critical" ? "text-secondary" : "text-white"
                    }`}
                  >
                    {v.ukcMargin}
                  </span>
                </div>
              </div>

              {/* Machine Learning Prediction Ribbon */}
              {v.prediction && (
                <div className="mt-2.5 p-1.5 rounded-lg bg-[#222530] border border-secondary/30 flex items-center gap-1.5 text-[10px] font-mono text-secondary">
                  <Sparkles className="h-3 w-3 shrink-0 text-secondary" />
                  <span className="truncate">{v.prediction}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
