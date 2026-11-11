"use client";

import React from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Terminal, Ship, Cpu } from "lucide-react";

interface VesselOptimizationDetailCardProps {
  vesselName?: string;
  berthCode?: string;
  imoNumber?: string;
  vesselType?: string;
  flag?: string;
  loaBeam?: string;
  arrivalDraft?: string;
  manifestLoad?: string;
  reeferPlugs?: string;
  craneGang?: string;
  productivity?: string;
  targetClearance?: string;
}

export function VesselOptimizationDetailCard({
  vesselName = "MV Maersk Karun",
  berthCode = "BERTH CCT-01",
  imoNumber = "9845210",
  vesselType = "Feeder Container Carrier",
  flag = "Singapore",
  loaBeam = "186.2m / 32m",
  arrivalDraft = "9.40 m",
  manifestLoad = "1,850 TEU",
  reeferPlugs = "420 Active",
  craneGang = "2x ZPMC Neo-Panamax (STS-01, STS-02)",
  productivity = "54.2 Gross Moves / Hour",
  targetClearance = "Today, 18:30 BST (Depart on Falling Tide)",
}: VesselOptimizationDetailCardProps) {
  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.08] shadow-xl overflow-hidden flex flex-col select-none">
      {/* Header with Vessel Identity & Verdict */}
      <div className="p-3.5 sm:p-4 border-b border-white/[0.08] bg-[#171a22] flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
              {vesselName}
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary-container text-white">
              {berthCode}
            </span>
          </div>
          <p className="text-[11px] font-mono text-[#8e9bae] mt-0.5">
            IMO {imoNumber} • {vesselType} • Flag: {flag}
          </p>
        </div>

        {/* Optimization Verdict */}
        <div className="text-right">
          <div className="text-[9px] font-mono uppercase text-[#8e9bae]">Optimization Verdict</div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-secondary mt-0.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
            <span>Zero Delay</span>
          </div>
        </div>
      </div>

      {/* 4-Stat Metric Grid */}
      <div className="p-3.5 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#14171f] border-b border-white/[0.06] text-xs font-mono">
        <div className="p-2.5 rounded-lg bg-[#1a1d26] border border-white/[0.06]">
          <div className="text-[10px] text-[#8e9bae]">LOA / Beam</div>
          <div className="text-white font-bold mt-0.5">{loaBeam}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#1a1d26] border border-white/[0.06]">
          <div className="text-[10px] text-[#8e9bae]">Arrival Draft</div>
          <div className="text-white font-bold mt-0.5">{arrivalDraft}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#1a1d26] border border-white/[0.06]">
          <div className="text-[10px] text-[#8e9bae]">Manifest Load</div>
          <div className="text-white font-bold mt-0.5">{manifestLoad}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[#1a1d26] border border-white/[0.06]">
          <div className="text-[10px] text-[#8e9bae]">Reefer Plugs</div>
          <div className="text-secondary font-bold mt-0.5">{reeferPlugs}</div>
        </div>
      </div>

      {/* Operational Gang & Productivity Details */}
      <div className="p-3.5 sm:p-4 space-y-2.5 text-xs font-mono bg-[#111318]">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[#8e9bae]">Assigned Quayside Crane Gang:</span>
          <span className="text-white font-semibold text-right">{craneGang}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[#8e9bae]">Current Gross Productivity:</span>
          <span className="text-secondary font-bold">{productivity}</span>
        </div>
        <div className="flex items-start justify-between gap-3">
          <span className="text-[#8e9bae]">Target Schedule Clearance:</span>
          <span className="text-white font-medium text-right">{targetClearance}</span>
        </div>
      </div>

      {/* Footer with Engine Audit & Manifest Link */}
      <div className="p-3 border-t border-white/[0.08] bg-[#14171f] flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[11px] text-[#8e9bae]">
          <Terminal className="h-3.5 w-3.5 text-secondary" />
          <span>Version v4.2-revC • Audited by CP-SAT Engine</span>
        </div>
        <Link
          href="/vessels"
          className="flex items-center gap-1 text-primary hover:text-white transition-colors font-medium text-xs"
        >
          <span>View Full Manifest</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
