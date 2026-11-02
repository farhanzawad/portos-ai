"use client";

import React from "react";
import Link from "next/link";
import { Bot, Lightbulb, ShieldAlert, ArrowRight } from "lucide-react";

export function ContextualInsightPanel() {
  return (
    <div className="rounded-lg border border-portos-border bg-portos-surface shadow-sm p-5 space-y-3.5">
      <div className="flex items-center justify-between pb-2.5 border-b border-portos-border">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-portos-navy-secondary text-white rounded">
            <Lightbulb className="h-4 w-4 text-portos-amber" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-portos-navy">
              Operational Decision Insights
            </h3>
            <span className="text-[10px] font-mono text-portos-muted uppercase">
              Deterministic Rule Engine · Pre-Gemini Mode
            </span>
          </div>
        </div>

        <Link
          href="/copilot"
          className="text-xs font-semibold text-portos-navy hover:text-portos-teal flex items-center gap-1 transition-colors"
        >
          <Bot className="h-3.5 w-3.5 text-portos-teal" />
          <span>Copilot Workspace</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="space-y-2.5 text-xs text-portos-navy/90">
        <div className="p-2.5 rounded bg-portos-bg border border-portos-border space-y-1">
          <div className="font-semibold text-portos-navy flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-portos-red" />
            <span>Feeder Arrival Delay Shock</span>
          </div>
          <p className="text-[11px] text-portos-muted leading-relaxed">
            <strong>MV Karnaphuli Express</strong> delay (+4.2h) shifts pilotage into the Karnaphuli low-water period. Google OR-Tools recommends reallocating Berth B-03 to prevent cascading waiting time.
          </p>
        </div>

        <div className="p-2.5 rounded bg-portos-bg border border-portos-border space-y-1">
          <div className="font-semibold text-portos-navy flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-portos-amber" />
            <span>Equipment Capacity Bottleneck</span>
          </div>
          <p className="text-[11px] text-portos-muted leading-relaxed">
            <strong>STS-02 Crane</strong> degraded to 18 moves/hour on Berth B-02. Reassigning internal haulage gang to NCT Berth 4 recovers 2.1 vessel waiting hours in SimPy simulation.
          </p>
        </div>

        <div className="p-2.5 rounded bg-portos-bg border border-portos-border space-y-1">
          <div className="font-semibold text-portos-navy flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-portos-teal" />
            <span>Yard Block YB-04 Congestion Alert</span>
          </div>
          <p className="text-[11px] text-portos-muted leading-relaxed">
            Block YB-04 occupancy at <strong>88%</strong> exceeds the 85% warning threshold. Divert import discharges from Berth 1 to Block YB-03.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-portos-border flex items-center gap-2 text-[10px] text-portos-muted">
        <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-portos-muted" />
        <span>
          <strong>Operational Truthfulness Rule:</strong> These insights are computed deterministically from active terminal telemetry. They are not labeled as AI-generated until the Gemini Copilot is integrated in Milestone 14.
        </span>
      </div>
    </div>
  );
}

