"use client";

import React, { useState } from "react";
import { CopilotStatusResponse } from "@/types/api";
import { Bot, ShieldCheck, Cpu, Key, HelpCircle, CheckCircle2, AlertTriangle } from "lucide-react";

interface CopilotStatusBannerProps {
  status: CopilotStatusResponse | null;
  isLoading?: boolean;
}

export function CopilotStatusBanner({ status, isLoading }: CopilotStatusBannerProps) {
  const [showConfigHelp, setShowConfigHelp] = useState(false);

  const isDemo = status?.demo_mode ?? true;
  const modelName = status?.model_name || "gemini-2.5-flash";
  const toolsCount = status?.tools_count ?? 10;

  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden">
      <div className="p-3 sm:p-4 bg-slate-50 border-b border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Assistant Identity & Core Role */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-portos-navy text-white shrink-0">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-portos-navy">
                Port Intelligence Copilot
              </h2>
              {/* Live vs Offline Demo Mode Indicator */}
              {isDemo ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Offline Demo Mode
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Live Gemini Grounded
                </span>
              )}

              {/* Model Badge */}
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <Cpu className="h-3 w-3 text-slate-500" />
                {modelName}
              </span>
            </div>

            <p className="text-xs text-portos-muted mt-0.5">
              Strictly advisory decision support powered by typed tool allowlists. Refuses real-world navigational clearances and equipment actions.
            </p>
          </div>
        </div>

        {/* Right: Badges & Config Guidance Toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 flex-wrap">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-portos-teal/10 text-portos-teal border border-portos-teal/20">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{toolsCount} Allowlisted Tools</span>
          </span>

          <button
            onClick={() => setShowConfigHelp(!showConfigHelp)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-portos-border rounded hover:bg-slate-50 transition-colors shadow-2xs"
            title="Inspect API Key & Tool Configuration"
          >
            <Key className="h-3.5 w-3.5 text-slate-500" />
            <span>{showConfigHelp ? "Hide Configuration" : "API Status"}</span>
          </button>
        </div>
      </div>

      {/* Expandable Configuration Guidance */}
      {showConfigHelp && (
        <div className="p-4 bg-white border-t border-portos-border text-xs text-slate-700 space-y-3 animate-in fade-in duration-150">
          <div className="flex items-start gap-2 p-2.5 rounded bg-slate-50 border border-slate-200">
            <HelpCircle className="h-4 w-4 text-portos-navy shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-portos-navy">
                {isDemo ? "Running in Offline Demo Mode" : "Connected to Google Gemini Live API"}
              </div>
              <p className="text-portos-muted leading-relaxed">
                {isDemo
                  ? "GEMINI_API_KEY is not configured in backend/.env. The copilot operates in Offline Demo Mode using deterministic rule-based tool orchestration and synthetic template reasoning. No external requests are made."
                  : "Server-side GEMINI_API_KEY detected. The copilot communicates with the official google-genai SDK using function calling against the verified tool allowlist."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            <div className="p-2.5 rounded border border-portos-border bg-white">
              <div className="font-semibold text-portos-navy mb-1 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-portos-teal" />
                <span>Enforced Allowlist Functions</span>
              </div>
              <div className="text-[11px] text-portos-muted font-mono space-y-0.5">
                {status?.allowlist && status.allowlist.length > 0 ? (
                  status.allowlist.map((tool) => (
                    <div key={tool} className="truncate">• {tool}</div>
                  ))
                ) : (
                  <div>• 10 active operational query and simulation functions</div>
                )}
              </div>
            </div>

            <div className="p-2.5 rounded border border-portos-border bg-white">
              <div className="font-semibold text-portos-navy mb-1 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                <span>Operational Safety Guardrails</span>
              </div>
              <ul className="text-[11px] text-portos-muted space-y-1 list-disc pl-4">
                <li>No navigational vessel maneuver or pilotage clearance execution</li>
                <li>No physical crane, RTG, or spreader equipment commands</li>
                <li>No ungrounded calculation or estimation of simulation numbers</li>
                <li>API keys stored strictly on server backend; never leaked to client</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
