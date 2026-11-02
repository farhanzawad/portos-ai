"use client";

import React, { useState } from "react";
import { ScopeBoundaryDefinition } from "@/types/api";
import { ShieldCheck, ChevronDown, ChevronUp, AlertCircle, FileText, CheckCircle2, XCircle } from "lucide-react";

interface ScopeBoundaryBannerProps {
  scope: ScopeBoundaryDefinition;
}

export function ScopeBoundaryBanner({ scope }: ScopeBoundaryBannerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden">
      {/* Primary Banner Header */}
      <div className="p-4 bg-slate-50 border-b border-portos-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-portos-teal/10 text-portos-teal shrink-0 mt-0.5">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-portos-navy">
                Auditable Prototype Boundary & Accounting Scope
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                {scope.methodology_framework}
              </span>
            </div>
            <p className="text-xs text-portos-muted mt-1 leading-relaxed">
              Modeled boundary covers container handling at <strong className="text-portos-navy font-semibold">{scope.terminal_complex}</strong>. Operational energy variance is derived strictly within this perimeter.
            </p>
          </div>
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-portos-navy bg-white border border-portos-border rounded-md hover:bg-slate-50 transition-colors shadow-2xs self-start md:self-auto shrink-0"
        >
          <FileText className="h-3.5 w-3.5 text-portos-muted" />
          <span>{expanded ? "Hide Audit Scope" : "Inspect Boundary Details"}</span>
          {expanded ? <ChevronUp className="h-3.5 w-3.5 text-portos-muted" /> : <ChevronDown className="h-3.5 w-3.5 text-portos-muted" />}
        </button>
      </div>

      {/* Expandable Accounting Scope Specification */}
      {expanded && (
        <div className="p-4 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs animate-in fade-in duration-150">
          {/* Scope 1: Direct Terminal */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-portos-navy mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Scope 1 (Direct Fuel)</span>
              </div>
              <ul className="space-y-1 text-slate-600 pl-5 list-disc">
                {scope.scope_1_included.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <span className="text-[10px] text-portos-muted mt-3 pt-2 border-t border-slate-200">
              Terminal diesel combustion
            </span>
          </div>

          {/* Scope 2: Purchased Electricity */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-portos-navy mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Scope 2 (Indirect Grid)</span>
              </div>
              <ul className="space-y-1 text-slate-600 pl-5 list-disc">
                {scope.scope_2_included.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <span className="text-[10px] text-portos-muted mt-3 pt-2 border-t border-slate-200">
              National electric grid draw
            </span>
          </div>

          {/* Scope 3: Waterborne Modeled Fairway */}
          <div className="p-3 rounded-md bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-portos-navy mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Scope 3 (Waterborne Modeled)</span>
              </div>
              <ul className="space-y-1 text-slate-600 pl-5 list-disc">
                {scope.scope_3_included.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <span className="text-[10px] text-portos-muted mt-3 pt-2 border-t border-slate-200">
              Alongside berths & outer anchorage
            </span>
          </div>

          {/* Explicit Exclusions */}
          <div className="p-3 rounded-md bg-rose-50/50 border border-rose-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 font-semibold text-rose-900 mb-2">
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Explicitly Excluded</span>
              </div>
              <ul className="space-y-1 text-rose-800 pl-5 list-disc">
                {scope.explicitly_excluded.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <span className="text-[10px] text-rose-600 font-medium mt-3 pt-2 border-t border-rose-200">
              Strict audit boundary demarcation
            </span>
          </div>
        </div>
      )}

      {/* Non-regulatory disclaimer bar */}
      <div className="px-4 py-2 bg-amber-50/60 border-t border-amber-200/80 flex items-center gap-2 text-[11px] text-amber-900">
        <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
        <span>
          <strong>Non-Regulatory Notice:</strong> PORTOS AI calculates operational energy and emission variances across modeled container movements only. It does not certify port-wide greenhouse gas inventories or compliance under national or international regulatory bodies.
        </span>
      </div>
    </div>
  );
}

