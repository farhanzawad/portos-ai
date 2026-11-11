"use client";

import React from "react";
import { UserCheck, Anchor, Compass, UserPlus, Send } from "lucide-react";

interface PilotageTugDossierCardProps {
  onAssignPilot?: () => void;
  onDirectTug?: () => void;
}

export function PilotageTugDossierCard({
  onAssignPilot,
  onDirectTug,
}: PilotageTugDossierCardProps) {
  return (
    <div className="rounded-2xl bg-[#111318] border border-white/[0.08] shadow-xl overflow-hidden flex flex-col select-none">
      {/* Header */}
      <div className="p-3.5 border-b border-white/[0.08] bg-[#161922] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-secondary" />
          <span className="text-xs sm:text-sm font-bold font-mono text-white uppercase tracking-wider">
            Pilotage &amp; Tugboat Dossier
          </span>
        </div>
        <span className="text-[10px] font-mono text-secondary font-semibold">
          4 Pilots Stationed
        </span>
      </div>

      <div className="p-3.5 space-y-3.5 text-xs font-mono">
        {/* Pilot Stations */}
        <div className="space-y-2">
          {/* Station 01 */}
          <div className="p-2.5 rounded-xl bg-[#171a22] border border-white/[0.06] flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-secondary animate-pulse" />
                <span>Station #01 (Patenga Outer)</span>
              </div>
              <div className="text-[10px] text-[#8e9bae] mt-0.5">
                Capt. R. Al-Mamun • Onboard OOCL S&apos;pore
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary border border-secondary-container/30">
              ENGAGED
            </span>
          </div>

          {/* Station 02 */}
          <div className="p-2.5 rounded-xl bg-[#171a22] border border-white/[0.06] flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-white/40" />
                <span>Station #02 (Gupta Pilot Cut)</span>
              </div>
              <div className="text-[10px] text-[#8e9bae] mt-0.5">
                Capt. S. Qureshi • Ready for MV Wan Hai 316
              </div>
            </div>
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-white/[0.06] text-[#8e9bae] border border-white/10">
              STANDBY
            </span>
          </div>
        </div>

        {/* Active Escort Tugs */}
        <div className="pt-2 border-t border-white/[0.06] space-y-2">
          <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#8e9bae]">
            Active Escort Tugs
          </div>

          {/* Tug 1 */}
          <div className="p-2 rounded-lg bg-[#14171f] border border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#222530] text-primary shrink-0">
                <Anchor className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Tug PB-01 &apos;Karnaphuli Express&apos;</div>
                <div className="text-[9px] text-[#8e9bae]">Attached Stern OOCL</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-secondary">55 T</span>
              <div className="text-[8px] text-[#8e9bae]">Bollard Pull</div>
            </div>
          </div>

          {/* Tug 2 */}
          <div className="p-2 rounded-lg bg-[#14171f] border border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-[#222530] text-amber-400 shrink-0">
                <Anchor className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Tug PB-02 &apos;Meghna Guard&apos;</div>
                <div className="text-[9px] text-[#8e9bae]">Station Patrol Gupta</div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-amber-400">45 T</span>
              <div className="text-[8px] text-[#8e9bae]">Bollard Pull</div>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 border-t border-white/[0.06] grid grid-cols-2 gap-2">
          <button
            onClick={onAssignPilot}
            className="h-8 px-2.5 rounded-lg bg-[#222530] hover:bg-[#2b303d] text-white text-[11px] font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5 text-[#8e9bae]" />
            <span>Assign Pilot</span>
          </button>
          <button
            onClick={onDirectTug}
            className="h-8 px-2.5 rounded-lg bg-primary-container hover:bg-[#b02f00] text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Direct Tug PB-02</span>
          </button>
        </div>
      </div>
    </div>
  );
}
