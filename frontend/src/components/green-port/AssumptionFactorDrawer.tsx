"use client";

import React, { useState } from "react";
import { EmissionFactorRead, PollutantType, FactorStatus } from "@/types/api";
import {
  X,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Filter,
  Calendar,
  Layers,
  Search,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface AssumptionFactorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  factors: EmissionFactorRead[];
}

export function AssumptionFactorDrawer({
  isOpen,
  onClose,
  factors,
}: AssumptionFactorDrawerProps) {
  const [pollutantFilter, setPollutantFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen) return null;

  const filteredFactors = factors.filter((f) => {
    if (pollutantFilter !== "ALL" && f.pollutant !== pollutantFilter) return false;
    if (statusFilter !== "ALL" && f.factor_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = `${f.activity_type} ${f.source_reference} ${f.applicability_notes || ""}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-portos-border animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-portos-border bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-portos-navy text-white">
              <FileSpreadsheet className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-portos-navy">
                  Emission Factor Dictionary
                </h2>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-800">
                  {factors.length} factors
                </span>
              </div>
              <p className="text-xs text-portos-muted mt-0.5">
                Audit lineage, publication metadata, and applicability scope notes.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-portos-muted hover:text-portos-navy hover:bg-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-3 bg-white border-b border-portos-border space-y-2">
          {/* Search bar */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-portos-muted" />
            <input
              type="text"
              placeholder="Filter by activity or source reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-portos-border rounded-md bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-portos-teal"
            />
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Pollutant Tabs */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-portos-muted font-medium mr-1">Gas:</span>
              {["ALL", "CO2E", "NOX", "SOX", "PM25"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPollutantFilter(p)}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    pollutantFilter === p
                      ? "bg-portos-navy text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-portos-muted font-medium mr-1">Status:</span>
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === "ALL"
                    ? "bg-portos-navy text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("VERIFIED_SOURCE")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === "VERIFIED_SOURCE"
                    ? "bg-emerald-700 text-white"
                    : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                Verified
              </button>
              <button
                onClick={() => setStatusFilter("ILLUSTRATIVE_ASSUMPTION")}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  statusFilter === "ILLUSTRATIVE_ASSUMPTION"
                    ? "bg-amber-700 text-white"
                    : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                }`}
              >
                Illustrative
              </button>
            </div>
          </div>
        </div>

        {/* Factors List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
          {filteredFactors.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-lg border border-dashed border-portos-border">
              <span className="text-xs text-portos-muted">No emission factors match the selected filter criteria.</span>
            </div>
          ) : (
            filteredFactors.map((f) => {
              const isVerified = f.factor_status === "VERIFIED_SOURCE";

              return (
                <div
                  key={f.id}
                  className="p-4 bg-white rounded-lg border border-portos-border shadow-2xs hover:border-slate-300 transition-colors"
                >
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-portos-navy">
                          {f.activity_type}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                          {f.pollutant}
                        </span>
                        <DataStatusBadge status={f.data_status} />
                      </div>
                      <span className="text-[11px] text-portos-muted block mt-0.5 font-medium">
                        {f.scope_category}
                      </span>
                    </div>

                    {/* Verified vs Illustrative Badge */}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${
                        isVerified
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {isVerified ? (
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <HelpCircle className="h-3 w-3 text-amber-600" />
                      )}
                      <span>
                        {isVerified ? "Verified Source" : "Illustrative Assumption"}
                      </span>
                    </span>
                  </div>

                  {/* Factor Value Box */}
                  <div className="my-2 p-2.5 bg-slate-50 rounded border border-slate-200 flex items-baseline justify-between">
                    <span className="text-xs text-portos-muted font-medium">Factor Value</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold font-mono text-portos-navy">
                        {f.factor_value}
                      </span>
                      <span className="text-xs font-semibold text-portos-navy">
                        {f.factor_unit}
                      </span>
                    </div>
                  </div>

                  {/* Source Reference & URL */}
                  <div className="text-xs text-slate-700 leading-relaxed mb-2">
                    <span className="font-semibold text-portos-navy block mb-0.5">
                      Source Lineage:
                    </span>
                    <p className="text-[11px] text-slate-600">{f.source_reference}</p>
                    <div className="mt-1 flex items-center justify-between text-[10px] text-portos-muted">
                      {f.publication_date && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          Published: {f.publication_date}
                        </span>
                      )}
                      {f.source_url && (
                        <a
                          href={f.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-portos-teal hover:underline font-medium ml-auto"
                        >
                          <span>Official Reference</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Applicability Notes */}
                  {f.applicability_notes && (
                    <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                      <strong className="text-slate-700">Scope Note:</strong> {f.applicability_notes}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-3 border-t border-portos-border bg-slate-50 text-[11px] text-portos-muted flex items-center justify-between">
          <span>Frozen configuration set: fs_cct_standard_v1</span>
          <button
            onClick={onClose}
            className="px-3 py-1 bg-white border border-portos-border rounded text-xs font-medium text-portos-navy hover:bg-slate-100 transition-colors"
          >
            Close Dictionary
          </button>
        </div>
      </div>
    </div>
  );
}

