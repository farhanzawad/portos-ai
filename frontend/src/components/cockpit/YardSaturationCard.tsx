"use client";

import React from "react";
import Link from "next/link";
import { Grid3X3, ArrowRight } from "lucide-react";

export function YardSaturationCard() {
  const yardBlocks = [
    {
      id: "block-a",
      name: "Block A • Chittagong Container Terminal (CCT)",
      pct: 82,
      teuText: "(4,120 TEU)",
      barColor: "bg-primary-container",
      isWarning: true,
    },
    {
      id: "block-b",
      name: "Block B • New Mooring Container Terminal (NCT)",
      pct: 71,
      teuText: "(5,980 TEU)",
      barColor: "bg-[#2b3548]",
      isWarning: false,
    },
    {
      id: "block-c",
      name: "Block C • Reefer Cold Chain Monitoring",
      pct: 94,
      teuText: "(1,128/1,200)",
      barColor: "bg-secondary-container",
      isWarning: false,
      isReefer: true,
    },
    {
      id: "block-d",
      name: "Block D • Off-Dock ICD Transfer Queue",
      pct: 53,
      teuText: "(2,110 TEU)",
      barColor: "bg-[#2b3548]",
      isWarning: false,
    },
  ];

  return (
    <div className="bg-[#12151c] border border-white/[0.07] rounded-xl p-5 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
        <div>
          <h3 className="text-sm font-semibold text-white tracking-tight">
            Yard Saturation &amp; Dwell Index
          </h3>
          <p className="text-xs text-[#8e9bae]">Terminal container stack &amp; cold chain capacity</p>
        </div>
        <span className="text-xs font-mono text-white font-semibold bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.08]">
          Total: 74.2%
        </span>
      </div>

      {/* Progress Bars */}
      <div className="mt-4 space-y-3.5">
        {yardBlocks.map((b) => (
          <div key={b.id}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-white truncate max-w-[240px]">{b.name}</span>
              <span
                className={`font-mono font-semibold ${
                  b.isReefer ? "text-secondary" : "text-white"
                }`}
              >
                {b.pct}%{" "}
                <span className="text-[#64748b] text-[11px] font-normal">{b.teuText}</span>
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#181c24] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${b.barColor}`}
                style={{ width: `${b.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Footer Details */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#8e9bae]">
        <span>
          Average dwell time: <strong className="text-white">4.8 days</strong>
        </span>
        <span className="text-secondary font-medium">Reefer power status: 100% stable</span>
      </div>
    </div>
  );
}
