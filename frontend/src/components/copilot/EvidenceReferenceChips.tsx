"use client";

import React from "react";
import Link from "next/link";
import { CopilotReference } from "@/types/api";
import { ExternalLink, Anchor, Calendar, Layers, Leaf, FileCheck, Navigation } from "lucide-react";

interface EvidenceReferenceChipsProps {
  references: CopilotReference[];
}

export function EvidenceReferenceChips({ references }: EvidenceReferenceChipsProps) {
  if (!references || references.length === 0) return null;

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "vessel":
        return <Anchor className="h-3 w-3 text-sky-600" />;
      case "berth":
        return <Calendar className="h-3 w-3 text-portos-teal" />;
      case "yard":
        return <Layers className="h-3 w-3 text-amber-600" />;
      case "scenario":
        return <Navigation className="h-3 w-3 text-indigo-600" />;
      case "sustainability":
        return <Leaf className="h-3 w-3 text-emerald-600" />;
      case "provenance":
      case "ingestion":
        return <FileCheck className="h-3 w-3 text-slate-600" />;
      default:
        return <ExternalLink className="h-3 w-3 text-portos-muted" />;
    }
  };

  return (
    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-2 flex-wrap">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-portos-muted">
        Citations & Evidence:
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {references.map((ref, idx) => (
          <Link
            key={`${ref.url}-${idx}`}
            href={ref.url}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white border border-slate-200 text-portos-navy hover:border-portos-teal hover:text-portos-teal hover:shadow-2xs transition-all"
          >
            {getCategoryIcon(ref.category)}
            <span>{ref.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

