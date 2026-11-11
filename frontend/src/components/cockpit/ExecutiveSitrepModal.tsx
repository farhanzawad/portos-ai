"use client";

import React, { useState } from "react";
import { X, Copy, Check, Download, FileText, ShieldAlert } from "lucide-react";

interface ExecutiveSitrepModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutiveSitrepModal({ isOpen, onClose }: ExecutiveSitrepModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sitrepText = `================================================================================
CHITTAGONG PORT AUTHORITY (CPA) — OPERATIONAL SITUATION REPORT (SITREP)
REF: CPA-OPS-SITREP-2026-11-12 | BST (UTC+6)
================================================================================
STATUS: SIMULATED ENVIRONMENT DEMONSTRATION
CORRIDOR: Karnaphuli Navigational Channel (Karnaphuli Approach to CCT/NCT)
ACTIVE TIDAL WINDOW: #04-HW (High Water Peak: 14:40 BST, Gauge Height: +4.62m)

1. FAIRWAY & HYDROGRAPHIC STATUS:
   • Total Vessels in System: 42 (Ingress: 18 | Anchorage: 16 | Egress: 8)
   • Fairway Controlling Depth: 12.1m (Gauge Stn #3: +4.64m above chart datum)
   • Tidal Stream: 3.1 kts Flood
   • Minimum Underkeel Clearance (UKC): +1.25m verified

2. BERTH & TERMINAL QUAYSIDE:
   • Terminal Berth Occupancy: 88.4% (3 Available Berths)
   • CCT-01: MV MAERSK CHITTAGONG (Draft 10.9m, Discharging 82%)
   • CCT-02: CMA CGM CHATTOGRAM (Clearing 12:45) -> EVER GLOBE Ingress
   • NCT-01: MSC ALESSIA (Draft 11.5m, 460 moves left)
   • NCT-02: BERTH IDLE (40m available) -> X-PRESS BENGAL Assigned

3. ACTIVE INGRESS & PILOT QUEUE:
   • Slot #1: MV OOCL SINGAPORE (11.4m d) - Pilot In-Transit (PB-02)
   • Slot #2: MV WAN HAI 316 (10.6m d) - Pre-cleared (PB-04)
   • Slot #3: PACIFIC ENDEAVOR (9.7m d) - Pilot On Board (PB-01)
   • Slot #4: MV MEGHNA TRADER (8.4m d) - Customs Check

4. OPERATIONAL AI ADVISORY (GEMINI-PORT-v4.2):
   • Ingress Sequence Swap Slot #1 & #2 recommended.
   • Advancing OOCL SINGAPORE to 14:40 tidal peak secures +1.42m UKC buffer.
   • Projected Savings: 8.6 MT Bunker Fuel (~$5,200) | 27.1 tCO2e Mitigated.

5. YARD & REEFER TELEMETRY:
   • Total Saturation: 74.2% (Dwell: 4.8 days)
   • Reefer Plug Status: 94% utilized (1,128/1,200), Power 100% stable.
================================================================================
AUTHORITY: Harbor Master Office, Chittagong Port Authority (CPA)
================================================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sitrepText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownload = () => {
    const blob = new Blob([sitrepText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CPA_SITREP_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#12151c] border border-white/10 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.08] bg-[#161a24]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary-container/20 text-primary-container border border-primary-container/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Official Operational SITREP Export
              </h3>
              <p className="text-xs text-[#8e9bae]">
                Chittagong Port Authority Protocol • Formatted for Naval/VTS Telemetry
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8e9bae] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body / Preformatted SITREP Text */}
        <div className="p-5 overflow-y-auto flex-1 bg-[#090b0f]">
          <pre className="text-xs font-mono text-[#cbd5e1] leading-relaxed whitespace-pre-wrap select-all bg-[#0d0f14] p-4 rounded-xl border border-white/[0.06]">
            {sitrepText}
          </pre>
        </div>

        {/* Modal Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-white/[0.08] bg-[#161a24]">
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <ShieldAlert className="h-4 w-4" />
            <span>Simulated demonstration data for Blue AI Challenge.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#222734] hover:bg-[#2b3548] text-white text-xs font-semibold border border-white/10 transition-colors"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? "Copied" : "Copy to Clipboard"}</span>
            </button>

            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary-container hover:bg-[#e04513] text-white text-xs font-semibold shadow-md shadow-primary-container/20 transition-all"
            >
              <Download className="h-4 w-4" />
              <span>Download SITREP</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
