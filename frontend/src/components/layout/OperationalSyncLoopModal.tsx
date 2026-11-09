"use client";

import React from "react";
import Link from "next/link";
import {
  X,
  Workflow,
  Ship,
  CalendarRange,
  Lock,
  FlaskConical,
  Sliders,
  Cpu,
  Layers,
  Box,
  Bot,
  ShieldCheck,
  ArrowDown,
  ArrowRight,
  ExternalLink,
} from "lucide-react";

interface OperationalSyncLoopModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStep?: string;
}

export function OperationalSyncLoopModal({
  isOpen,
  onClose,
  activeStep = "Berth Planner",
}: OperationalSyncLoopModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
              <Workflow className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  PORTOS AI Operational Synchronization & Decision Loop
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Closed Loop
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                End-to-end integration architecture: Vessel Intelligence → CP-SAT → Baseline → SimPy → Gemini → Approval
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Interactive Diagram Canvas */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Top Branch: Comparison -> (Gemini | Digital Twin) */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Post-Simulation Analysis & Visualization Branches
              </span>
              <span className="text-[10px] bg-sky-500/10 text-sky-400 px-2.5 py-0.5 rounded-full border border-sky-500/20 font-semibold">
                Divergent Execution
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Branch A: Scenario Analyst - Gemini */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sky-300 font-bold">
                    <Bot className="h-4 w-4 text-sky-400" />
                    <span>Scenario Analyst (Gemini)</span>
                  </div>
                  <span className="text-[9px] font-semibold bg-sky-950 text-sky-300 px-2 py-0.5 rounded border border-sky-800/40">
                    GenAI SDK
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Diagnoses operational bottlenecks, quantifies cascading risks, and drafts structured mitigation recommendations.
                </p>
                <div className="pt-1 flex items-center gap-1.5 text-sky-400 font-semibold text-[10px]">
                  <ArrowDown className="h-3.5 w-3.5" />
                  <span>Feeds Advisory Proposal to Human Review</span>
                </div>
              </div>

              {/* Branch B: Digital Twin Playback */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold">
                    <Box className="h-4 w-4 text-indigo-400" />
                    <span>Digital Twin Playback</span>
                  </div>
                  <span className="text-[9px] font-semibold bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800/40">
                    3D Visual Hub
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Renders spatial timeline frames of simulated vessel queuing, berthing maneuvers, and STS crane operations.
                </p>
                <div className="pt-1">
                  <Link
                    href="/digital-twin?mode=playback"
                    onClick={onClose}
                    className="inline-flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-200 font-semibold"
                  >
                    <span>Launch 3D Playback View</span>
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Core Sequential Chain */}
          <div className="space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Core Closed-Loop Operational Chain
            </span>

            <div className="space-y-2.5">
              {/* Step 1: Human Review & Approval */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      Human Review and Approval
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Harbour Master evaluates trade-offs, validates pilotage feasibility, and confirms schedule mitigation.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Human Authority
                </span>
              </div>

              {/* Step 2: Berth Planner & Vessel Intelligence */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
                <div className="md:col-span-4 p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
                  <div className="flex items-center gap-2 text-sky-300 font-bold mb-1">
                    <Ship className="h-3.5 w-3.5 text-sky-400" />
                    <span>Vessel Intelligence</span>
                  </div>
                  <span className="text-[10px] text-slate-300 block">
                    Feeder calls, AIS coordinates, reported ETAs, and ML delay predictions.
                  </span>
                </div>

                <div className="md:col-span-1 flex justify-center text-sky-400">
                  <ArrowRight className="h-4 w-4 hidden md:block" />
                  <ArrowDown className="h-4 w-4 md:hidden" />
                </div>

                <div className="md:col-span-7 p-3.5 rounded-xl bg-slate-800/90 border border-sky-500/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2 text-white font-bold">
                      <CalendarRange className="h-4 w-4 text-sky-400" />
                      <span>Berth Planner (OR-Tools CP-SAT)</span>
                    </div>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                      Mathematical Engine
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-300 block">
                    Solves zero-overlap spatial-temporal berth allocation, crane capacities, and draft constraints deterministically.
                  </span>
                </div>
              </div>

              {/* Step 3: Baseline Berth Schedule */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-700/50 text-slate-300">
                    <Lock className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      Baseline Berth Schedule
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Confirmed operational schedule version (e.g. v1.0). Preserved as immutable benchmark for all simulation runs.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                  Immutable Baseline
                </span>
              </div>

              {/* Step 4: Scenario Planning & Configuration */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Sliders className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      Scenario Planning & Configuration
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Operator injects disruption levers (arrival surges, crane outages, berth maintenance, storm gates, yard congestion).
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Disruption Matrix
                </span>
              </div>

              {/* Step 5: SimPy Simulation Engine */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                    <Cpu className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      SimPy Simulation Engine
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Simulates queue stochasticity, berth dwell times, crane handling, container stack density, and secondary emissions.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">
                  Discrete-Event Runtime
                </span>
              </div>

              {/* Step 6: Scenario Comparison */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400">
                    <Layers className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white text-xs block">
                      Scenario Comparison Matrix
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Calculates exact delta between Baseline Schedule and Simulated Scenario across reliability %, turnaround, delay, and TEUs.
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Comparative Delta
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-400 font-medium text-[11px]">
            Strict Rule: LLMs never invent simulation numbers; SimPy & OR-Tools solve deterministically.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all shadow-xs"
          >
            Close Operational Loop
          </button>
        </div>
      </div>
    </div>
  );
}
