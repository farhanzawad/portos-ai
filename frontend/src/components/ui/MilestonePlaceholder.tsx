import React from "react";
import { Layers, Calendar, CheckSquare, ArrowRight } from "lucide-react";
import Link from "next/link";
import { DataStatusBadge } from "./DataStatusBadge";

interface MilestonePlaceholderProps {
  moduleName: string;
  milestoneNumber: string;
  milestoneTitle: string;
  description: string;
  plannedFeatures: string[];
  prerequisites: string[];
}

export function MilestonePlaceholder({
  moduleName,
  milestoneNumber,
  milestoneTitle,
  description,
  plannedFeatures,
  prerequisites,
}: MilestonePlaceholderProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-lg border border-portos-border bg-portos-surface p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-portos-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-portos-navy rounded text-white">
              <Layers className="h-5 w-5 text-portos-teal" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-portos-teal-dark bg-portos-teal-light px-2 py-0.5 rounded border border-portos-teal/30">
                {milestoneNumber}
              </span>
              <h2 className="text-lg font-bold text-portos-navy mt-1">
                {moduleName}: {milestoneTitle}
              </h2>
            </div>
          </div>
          <DataStatusBadge status="SIMULATED" size="sm" />
        </div>

        <p className="text-xs text-portos-navy/80 leading-relaxed">
          {description}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="rounded border border-portos-border bg-portos-bg/50 p-4 space-y-2">
            <h4 className="text-xs font-semibold text-portos-navy flex items-center gap-1.5">
              <CheckSquare className="h-4 w-4 text-portos-navy-secondary" />
              Planned Capabilities
            </h4>
            <ul className="space-y-1.5 text-xs text-portos-muted">
              {plannedFeatures.map((feat, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-portos-teal font-bold">•</span>
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded border border-portos-border bg-portos-bg/50 p-4 space-y-2">
            <h4 className="text-xs font-semibold text-portos-navy flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-portos-navy-secondary" />
              Architecture Prerequisites
            </h4>
            <ul className="space-y-1.5 text-xs text-portos-muted">
              {prerequisites.map((req, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-portos-amber-dark font-bold">•</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-3 border-t border-portos-border flex flex-wrap items-center justify-between text-xs text-portos-muted">
          <span>Implementation sequence conforms to Prompt Pack Prompts 00–17.</span>
          <Link
            href="/"
            className="inline-flex items-center gap-1 font-medium text-portos-navy hover:text-portos-teal transition-colors"
          >
            <span>Return to Overview</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

