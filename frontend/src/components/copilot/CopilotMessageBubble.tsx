"use client";

import React from "react";
import { CopilotChatResponse } from "@/types/api";
import { ToolActivityCard } from "./ToolActivityCard";
import { EvidenceReferenceChips } from "./EvidenceReferenceChips";
import {
  User,
  Bot,
  Database,
  TrendingUp,
  Cpu,
  AlertCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export interface ChatMessage {
  id: string;
  sender: "user" | "copilot";
  content: string;
  responsePayload?: CopilotChatResponse;
  timestamp: string;
  isError?: boolean;
}

interface CopilotMessageBubbleProps {
  message: ChatMessage;
}

export function CopilotMessageBubble({ message }: CopilotMessageBubbleProps) {
  const isUser = message.sender === "user";
  const payload = message.responsePayload;

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 items-start">
        <div className="max-w-[85%] sm:max-w-[75%] rounded-lg p-3 bg-portos-navy text-white text-xs leading-relaxed shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-1 text-[10px] text-slate-300">
            <span className="font-semibold uppercase tracking-wider">Port Controller</span>
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        <div className="h-7 w-7 rounded-full bg-portos-navy/10 text-portos-navy flex items-center justify-center shrink-0 border border-portos-border">
          <User className="h-4 w-4" />
        </div>
      </div>
    );
  }

  // Copilot Assistant Bubble
  const isSafetyRefusal =
    message.content.includes("SAFETY CRITICAL REFUSAL") ||
    payload?.summary.includes("SAFETY CRITICAL REFUSAL");

  return (
    <div className="flex justify-start gap-2.5 items-start">
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 border ${
          isSafetyRefusal
            ? "bg-amber-100 text-amber-800 border-amber-300"
            : message.isError
            ? "bg-rose-100 text-rose-800 border-rose-300"
            : "bg-portos-navy text-white border-portos-navy"
        }`}
      >
        {isSafetyRefusal ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      <div
        className={`max-w-[95%] sm:max-w-[85%] rounded-lg p-3 sm:p-4 bg-white border ${
          isSafetyRefusal
            ? "border-amber-300 bg-amber-50/30"
            : message.isError
            ? "border-rose-300 bg-rose-50/20"
            : "border-portos-border"
        } shadow-xs text-xs space-y-3`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="font-bold text-portos-navy">Port Intelligence Copilot</span>
            {payload?.model_name && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                {payload.model_name}
              </span>
            )}
            {payload?.is_demo_mode && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                Demo Fallback
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-[10px] text-portos-muted font-mono">
            <Clock className="h-3 w-3" />
            <span>{new Date(message.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Main Answer Summary */}
        <div className="text-slate-800 leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>

        {/* Structured Operational Breakdown */}
        {payload && (
          <div className="space-y-2.5 pt-1">
            {/* 1. Retrieved Facts (Database Grounding) */}
            {payload.retrieved_facts && payload.retrieved_facts.length > 0 && (
              <div className="p-2.5 rounded bg-sky-50/60 border border-sky-100 space-y-1">
                <div className="flex items-center gap-1.5 text-sky-900 font-semibold text-[11px]">
                  <Database className="h-3.5 w-3.5 text-sky-700" />
                  <span>Retrieved Facts (Database Grounding)</span>
                </div>
                <ul className="list-disc pl-4 text-sky-800 space-y-0.5 text-[11px]">
                  {payload.retrieved_facts.map((fact, idx) => (
                    <li key={idx} className="leading-relaxed">{fact}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 2. Model Predictions (scikit-learn) */}
            {payload.model_predictions && payload.model_predictions.length > 0 && (
              <div className="p-2.5 rounded bg-emerald-50/60 border border-emerald-100 space-y-1">
                <div className="flex items-center gap-1.5 text-emerald-900 font-semibold text-[11px]">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-700" />
                  <span>Model Predictions (scikit-learn)</span>
                </div>
                <ul className="list-disc pl-4 text-emerald-800 space-y-0.5 text-[11px]">
                  {payload.model_predictions.map((pred, idx) => (
                    <li key={idx} className="leading-relaxed">{pred}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. Simulated Results (SimPy / OR-Tools) */}
            {payload.simulated_results && payload.simulated_results.length > 0 && (
              <div className="p-2.5 rounded bg-indigo-50/60 border border-indigo-100 space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-900 font-semibold text-[11px]">
                  <Cpu className="h-3.5 w-3.5 text-indigo-700" />
                  <span>Simulated Results (OR-Tools / SimPy)</span>
                </div>
                <ul className="list-disc pl-4 text-indigo-800 space-y-0.5 text-[11px]">
                  {payload.simulated_results.map((res, idx) => (
                    <li key={idx} className="leading-relaxed">{res}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 4. Limitations & Boundary Notices */}
            {payload.limitations && payload.limitations.length > 0 && (
              <div className="p-2.5 rounded bg-amber-50/70 border border-amber-200/80 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-[11px]">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-700" />
                  <span>Analytical Limitations & Synthetic Assumptions</span>
                </div>
                <ul className="list-disc pl-4 text-amber-800 space-y-0.5 text-[11px]">
                  {payload.limitations.map((lim, idx) => (
                    <li key={idx} className="leading-relaxed">{lim}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tool Executions Trace */}
            {payload.tool_calls && payload.tool_calls.length > 0 && (
              <ToolActivityCard toolCalls={payload.tool_calls} />
            )}

            {/* Evidence & References Links */}
            {payload.references && payload.references.length > 0 && (
              <EvidenceReferenceChips references={payload.references} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

