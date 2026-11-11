"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Sparkles, Check, ArrowRight, FlaskConical } from "lucide-react";

export function OperationalAIAdvisoryCard() {
  const [isApplied, setIsApplied] = useState(false);

  const handleApplySwap = () => {
    setIsApplied(true);
  };

  return (
    <div className="bg-gradient-to-br from-[#161a24] to-[#12151c] border border-white/[0.09] rounded-xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary-container/20 border border-primary-container/40 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-xs font-semibold text-white tracking-wide uppercase">
            Operational AI Advisory
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#8e9bae] bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06]">
          MODEL: GEMINI-PORT-v4.2
        </span>
      </div>

      {/* Advisory Content */}
      <div className="mt-4 space-y-3">
        <h4 className="text-sm font-semibold text-white leading-snug">
          Ingress Sequence Swap Recommended: Slot #1 &amp; #2
        </h4>
        <p className="text-xs text-[#8e9bae] leading-relaxed">
          Advancing <span className="text-white font-medium">MV OOCL SINGAPORE</span> (11.4m draft) by
          25 minutes to lock into the exact tidal peak (14:40 BST) generates an Underkeel Clearance
          buffer of +1.42m and avoids a 4.5-hour delay.
        </p>

        {/* Quantified Savings Box */}
        <div className="p-3 bg-[#0d0f14] rounded-lg border border-white/[0.06] text-xs space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[#8e9bae]">Bunker Fuel Saved:</span>
            <span className="font-mono text-white font-semibold">8.6 MT (~$5,200)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[#8e9bae]">Carbon Mitigation:</span>
            <span className="font-mono text-secondary font-semibold">27.1 tCO2e</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2">
          <button
            onClick={handleApplySwap}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold shadow-sm transition-all text-center flex items-center justify-center gap-1.5 active:scale-[0.98] ${
              isApplied
                ? "bg-emerald-600 text-white"
                : "bg-primary-container hover:bg-[#e04513] text-white shadow-primary-container/20"
            }`}
          >
            {isApplied ? (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Sequence Swapped</span>
              </>
            ) : (
              <span>Apply Sequence Swap</span>
            )}
          </button>

          <Link
            href="/scenario-lab"
            className="py-2 px-3 bg-[#181c24] hover:bg-white/10 text-[#8e9bae] hover:text-white rounded-lg text-xs font-medium border border-white/[0.08] transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Simulate</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
