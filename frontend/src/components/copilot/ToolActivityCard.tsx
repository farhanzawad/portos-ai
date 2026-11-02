"use client";

import React, { useState } from "react";
import { ToolCallRecord } from "@/types/api";
import { Terminal, CheckCircle2, ChevronDown, ChevronUp, Clock, Code } from "lucide-react";

interface ToolActivityCardProps {
  toolCalls: ToolCallRecord[];
}

export function ToolActivityCard({ toolCalls }: ToolActivityCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!toolCalls || toolCalls.length === 0) return null;

  return (
    <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/70 overflow-hidden text-xs">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-100/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-portos-navy" />
          <span className="font-semibold text-portos-navy">
            Grounded Tool Execution
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-300 text-slate-700">
            {toolCalls.length} {toolCalls.length === 1 ? "call" : "calls"} executed
          </span>
        </div>

        <div className="flex items-center gap-1 text-[11px] text-portos-muted font-medium">
          <span>{isOpen ? "Hide traces" : "Inspect traces"}</span>
          {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </div>
      </button>

      {isOpen && (
        <div className="p-3 border-t border-slate-200 bg-white space-y-2.5">
          {toolCalls.map((call, idx) => (
            <div
              key={`${call.tool_name}-${idx}`}
              className="p-2.5 rounded border border-slate-100 bg-slate-50/50 space-y-1.5"
            >
              <div className="flex items-center justify-between flex-wrap gap-1">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span className="font-mono font-semibold text-portos-navy text-[11px]">
                    {call.tool_name}()
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{new Date(call.timestamp).toLocaleTimeString()}</span>
                  <span className="ml-1 px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-sans font-medium text-[9px]">
                    {call.status}
                  </span>
                </div>
              </div>

              {/* Arguments if any */}
              {call.arguments && Object.keys(call.arguments).length > 0 && (
                <div className="text-[10px] bg-white p-1.5 rounded border border-slate-200 font-mono text-slate-600 flex items-start gap-1">
                  <Code className="h-3 w-3 text-slate-400 mt-0.5 shrink-0" />
                  <span className="break-all">{JSON.stringify(call.arguments)}</span>
                </div>
              )}

              {/* Summary of retrieved data */}
              {call.result_summary && (
                <p className="text-[11px] text-slate-600 leading-relaxed italic">
                  &ldquo;{call.result_summary}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
