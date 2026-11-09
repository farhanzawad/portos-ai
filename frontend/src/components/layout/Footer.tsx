"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Info, Database, Activity, Sparkles, Scale } from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

export function Footer() {
  return (
    <footer
      className="w-full border-t border-portos-border bg-portos-surface text-xs text-portos-muted py-5 px-4 sm:px-6 lg:px-8 mt-auto"
      role="contentinfo"
      aria-label="System operational and AI disclosures"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left: Operational Truthfulness & Advisory Notice */}
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 font-bold text-slate-900 text-xs">
              <ShieldCheck className="h-4 w-4 text-sky-600" />
              PORTOS AI Operational Decision Support
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-semibold">
              v0.1.0 (Demo Mode)
            </span>
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500 font-medium">
            PORTOS AI is an illustrative research and competition prototype for the{" "}
            <strong>Blue AI Challenge 2026–27</strong>. It operates on calibrated synthetic Chattogram
            container terminal datasets. <em>Not connected to CPA TOS, customs, or physical port machinery.</em>{" "}
            All schedule allocations and simulation outputs are <strong>purely advisory proposals</strong>{" "}
            requiring human review.
          </p>
        </div>

        {/* Right: Architectural Stack & Responsible-AI Navigation */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center gap-3 sm:gap-4 text-[11px] shrink-0 font-medium">
          <div className="flex items-center gap-3">
            <Link
              href="/data-centre"
              className="inline-flex items-center gap-1 hover:text-slate-900 underline underline-offset-2 transition-colors"
            >
              <Database className="h-3 w-3 text-sky-600" />
              <span>Data Lineage</span>
            </Link>
            <span className="text-slate-200">|</span>
            <Link
              href="/copilot"
              className="inline-flex items-center gap-1 hover:text-slate-900 underline underline-offset-2 transition-colors"
            >
              <Sparkles className="h-3 w-3 text-sky-600" />
              <span>Tool Allowlist</span>
            </Link>
            <span className="text-slate-200">|</span>
            <Link
              href="/events"
              className="inline-flex items-center gap-1 hover:text-slate-900 underline underline-offset-2 transition-colors"
            >
              <Activity className="h-3 w-3 text-sky-600" />
              <span>Event Stream</span>
            </Link>
            <span className="text-slate-200">|</span>
            <Link
              href="/scenario-lab"
              className="inline-flex items-center gap-1 hover:text-slate-900 underline underline-offset-2 transition-colors"
            >
              <Scale className="h-3 w-3 text-sky-600" />
              <span>Decision Lab</span>
            </Link>
          </div>

          <div className="text-[10px] text-slate-500 font-semibold tabular-nums">
            Timezone: Asia/Dhaka (BST, UTC+6)
          </div>
        </div>
      </div>
    </footer>
  );
}

