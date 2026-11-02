"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ImportSummaryReport } from "@/types/api";
import {
  ShieldCheck,
  CheckCircle2,
  Copy,
  Calendar,
  UserCheck,
  FileText,
  Ship,
  RotateCw,
  Hash,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface ImportSummaryReportCardProps {
  report: ImportSummaryReport;
  onStageAnother: () => void;
}

export function ImportSummaryReportCard({
  report,
  onStageAnother,
}: ImportSummaryReportCardProps) {
  const [copiedProvenance, setCopiedProvenance] = useState(false);

  const handleCopyProvenance = () => {
    navigator.clipboard.writeText(report.provenance_hash);
    setCopiedProvenance(true);
    setTimeout(() => setCopiedProvenance(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden flex flex-col animate-in fade-in duration-200">
      {/* Report Header */}
      <div className="p-4 bg-emerald-50/70 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-emerald-700 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-portos-navy">
                Ingestion Audit Report & Provenance Certificate
              </h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300">
                {report.ingestion_status}
              </span>
              <DataStatusBadge status={report.data_status} />
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Source file: <strong className="text-portos-navy">{report.file_name}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={onStageAnother}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-portos-navy bg-white border border-portos-border rounded-md hover:bg-slate-50 transition-colors shadow-2xs self-start sm:self-auto"
        >
          <RotateCw className="h-3.5 w-3.5" />
          <span>Stage Another File</span>
        </button>
      </div>

      {/* Provenance Key Card */}
      <div className="p-4 bg-slate-50/50 border-b border-portos-border space-y-3">
        <div className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Hash className="h-4 w-4 text-portos-teal" />
            <span className="text-portos-muted font-sans font-medium">Provenance Hash:</span>
            <span className="font-bold text-portos-navy">{report.provenance_hash}</span>
          </div>
          <button
            onClick={handleCopyProvenance}
            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded transition-colors self-start sm:self-auto"
          >
            <Copy className="h-3 w-3" />
            <span>{copiedProvenance ? "Copied!" : "Copy Hash"}</span>
          </button>
        </div>

        {/* Reviewer & Timestamp metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700">
            <UserCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              Certified Reviewer: <strong className="text-portos-navy">{report.reviewer_name}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
            <span>
              Committed: {new Date(report.committed_at).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Record Counts Breakdown */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border-b border-portos-border">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] uppercase font-semibold text-portos-muted block">
            Total Extracted
          </span>
          <span className="text-xl font-bold font-mono text-portos-navy mt-1 block">
            {report.total_records}
          </span>
        </div>

        <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200">
          <span className="text-[10px] uppercase font-semibold text-emerald-800 block">
            Accepted (Observed)
          </span>
          <span className="text-xl font-bold font-mono text-emerald-800 mt-1 block">
            {report.accepted_records}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] uppercase font-semibold text-slate-600 block">
            Rejected
          </span>
          <span className="text-xl font-bold font-mono text-slate-700 mt-1 block">
            {report.rejected_records}
          </span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] uppercase font-semibold text-slate-600 block">
            Duplicates Flagged
          </span>
          <span className="text-xl font-bold font-mono text-slate-700 mt-1 block">
            {report.duplicate_records}
          </span>
        </div>
      </div>

      {/* Audit Log Note & Navigation Footer */}
      <div className="p-4 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <p className="text-slate-600 leading-relaxed max-w-xl">
          {report.audit_message}
        </p>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/vessels"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-portos-navy hover:bg-portos-navy-secondary rounded-md shadow-xs transition-colors"
          >
            <Ship className="h-3.5 w-3.5" />
            <span>View Vessel Intelligence</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

