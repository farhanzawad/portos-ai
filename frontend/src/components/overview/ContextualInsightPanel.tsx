"use client";

import React from "react";
import Link from "next/link";
import { Bot, Lightbulb, ShieldAlert, ArrowRight } from "lucide-react";

export function ContextualInsightPanel() {
  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs p-5 space-y-4 font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Operational Decision Insights
            </h3>
            <span className="text-[11px] text-slate-500 font-medium">
              Deterministic Rule Engine · Advisory Decision Support
            </span>
          </div>
        </div>

        <Link
          href="/copilot"
          className="text-xs font-semibold text-sky-700 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full hover:bg-sky-100 flex items-center gap-1.5 transition-all"
        >
          <Bot className="h-3.5 w-3.5 text-sky-600" />
          <span>Copilot</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-3 text-xs text-slate-800">
        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            <span>Feeder Arrival Delay Shock</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            <strong className="text-slate-900">MV Karnaphuli Express</strong> delay (+4.2h) shifts pilotage into the Karnaphuli low-water period. Google OR-Tools recommends reallocating Berth B-03 to prevent cascading waiting time.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span>Equipment Capacity Bottleneck</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            <strong className="text-slate-900">STS-02 Crane</strong> degraded to 18 moves/hour on Berth B-02. Reassigning internal haulage gang to NCT Berth 4 recovers 2.1 vessel waiting hours in SimPy simulation.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/70 space-y-1">
          <div className="font-semibold text-slate-900 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>Yard Block YB-04 Congestion Alert</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
            Block YB-04 occupancy at <strong className="text-slate-900">88%</strong> exceeds the 85% warning threshold. Divert import discharges from Berth 1 to Block YB-03.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-medium">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-slate-400" />
        <span>
          <strong className="text-slate-700">Operational Truthfulness:</strong> Insights computed deterministically from active telemetry.
        </span>
      </div>
    </div>
  );
}
