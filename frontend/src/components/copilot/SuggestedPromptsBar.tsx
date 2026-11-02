"use client";

import React from "react";
import { CopilotSuggestedPrompt } from "@/types/api";
import { Sparkles, ArrowRight } from "lucide-react";

interface SuggestedPromptsBarProps {
  prompts: CopilotSuggestedPrompt[];
  onSelectPrompt: (query: string) => void;
  disabled?: boolean;
}

export function SuggestedPromptsBar({
  prompts,
  onSelectPrompt,
  disabled,
}: SuggestedPromptsBarProps) {
  if (!prompts || prompts.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-portos-muted uppercase tracking-wider">
        <Sparkles className="h-3 w-3 text-portos-teal" />
        <span>Operational Inquiries</span>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {prompts.map((p, idx) => {
          const displayLabel = p.title || p.label || "Operational Inquiry";
          const queryText = p.prompt || p.query || "";
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(queryText)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-portos-border text-portos-navy hover:bg-slate-50 hover:border-portos-teal transition-all text-left whitespace-nowrap shadow-2xs group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{displayLabel}</span>
              <ArrowRight className="h-3 w-3 text-portos-muted group-hover:text-portos-teal group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
