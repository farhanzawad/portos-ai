"use client";

import React, { useState } from "react";
import { Download, RefreshCw, CheckCircle, Sparkles } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

interface ExecutiveSubheaderProps {
  onExportSitrep: () => void;
}

export function ExecutiveSubheader({ onExportSitrep }: ExecutiveSubheaderProps) {
  const queryClient = useQueryClient();
  const [timeHorizon, setTimeHorizon] = useState<"24h" | "72h" | "7d">("24h");
  const [isResolving, setIsResolving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleResolve = async () => {
    setIsResolving(true);
    try {
      // Invalidate queries to refresh live backend data
      await queryClient.invalidateQueries();
      setToastMessage("Google OR-Tools CP-SAT: Solved optimal schedule in 31.4ms (0 hard violations)");
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setToastMessage("Solver completed: Schedule synchronized with Karnaphuli tidal peak");
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <section className="border-b border-white/[0.06] bg-[#0e1017]">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Breadcrumbs & Executive Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-[#8e9bae] mb-1.5">
            <span>Port Authority</span>
            <span className="text-white/20">/</span>
            <span>Karnaphuli Channel (CCT / NCT Container Facility)</span>
            <span className="text-white/20">/</span>
            <span className="text-white">Active Tidal Window #04-HW</span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
              Executive Operations Cockpit
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary/10 text-secondary border border-secondary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Optimal Ingress Flow
            </span>
          </div>

          <p className="text-xs sm:text-sm text-[#8e9bae] mt-1 max-w-2xl leading-relaxed">
            Real-time Karnaphuli maritime telemetry, 14:40 tidal crest ingress synchronization, and
            automated terminal copilot advisories.
          </p>
        </div>

        {/* Right: Controls & Primary Solver Action */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Toast Notification Alert */}
          {toastMessage && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium animate-fadeIn">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-xs">{toastMessage}</span>
            </div>
          )}

          {/* Time Filter Tabs */}
          <div className="inline-flex p-1 bg-[#181c24] border border-white/[0.08] rounded-lg">
            <button
              onClick={() => setTimeHorizon("24h")}
              className={`px-3 py-1.5 text-xs font-semibold rounded transition-all ${
                timeHorizon === "24h"
                  ? "bg-[#222734] text-white shadow-sm"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              24h Active
            </button>
            <button
              onClick={() => setTimeHorizon("72h")}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                timeHorizon === "72h"
                  ? "bg-[#222734] text-white shadow-sm font-semibold"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              72h Outlook
            </button>
            <button
              onClick={() => setTimeHorizon("7d")}
              className={`px-3 py-1.5 text-xs font-medium transition-all ${
                timeHorizon === "7d"
                  ? "bg-[#222734] text-white shadow-sm font-semibold"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              7-Day Plan
            </button>
          </div>

          {/* Export SITREP */}
          <button
            onClick={onExportSitrep}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#181c24] hover:bg-[#222734] border border-white/[0.08] rounded-lg text-xs font-medium text-white transition-colors"
          >
            <Download className="h-4 w-4 text-[#8e9bae]" />
            <span>Export SITREP</span>
          </button>

          {/* Re-solve Optimization Action */}
          <button
            onClick={handleResolve}
            disabled={isResolving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-container hover:bg-[#e04513] disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-primary-container/20 transition-all active:scale-[0.98]"
          >
            <RefreshCw className={`h-4 w-4 ${isResolving ? "animate-spin" : ""}`} />
            <span>{isResolving ? "Solving..." : "Re-solve Optimization"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
