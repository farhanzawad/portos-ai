"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getGovDataSources,
  getGovTides,
  checkGovTideCompliance,
  getGovBerthSpecs,
  getGovMetBulletins,
  getGovThroughputBenchmarks,
} from "@/lib/api-client";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  GovDataSourceRead,
  GovTideRecord,
  GovTideComplianceResult,
  GovBerthSpec,
  GovMetBulletin,
  GovThroughputBenchmark,
} from "@/types/api";
import {
  ShieldCheck,
  Compass,
  Waves,
  Building2,
  Wind,
  BarChart3,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileDown,
  Info,
  Calendar,
  Anchor,
  Clock,
  Layers,
  Search,
} from "lucide-react";

export function GovtDataCentreView() {
  const [activeSubTab, setActiveSubTab] = useState<"tides" | "berths" | "met" | "stats">("tides");
  const [searchFilter, setSearchFilter] = useState("");
  const [terminalFilter, setTerminalFilter] = useState<string>("ALL");

  // Compliance checker form state
  const [testDraft, setTestDraft] = useState<number>(8.9);
  const [testLoa, setTestLoa] = useState<number>(182.0);
  const [testDate, setTestDate] = useState<string>("2026-11-04");
  const [complianceResult, setComplianceResult] = useState<GovTideComplianceResult | null>(null);
  const [isCheckingCompliance, setIsCheckingCompliance] = useState<boolean>(false);

  // Queries
  const { data: sources = [], isLoading: isLoadingSources } = useQuery({
    queryKey: ["gov-sources"],
    queryFn: getGovDataSources,
  });

  const { data: tides = [], isLoading: isLoadingTides } = useQuery({
    queryKey: ["gov-tides"],
    queryFn: () => getGovTides(),
  });

  const { data: berths = [], isLoading: isLoadingBerths } = useQuery({
    queryKey: ["gov-berths"],
    queryFn: () => getGovBerthSpecs(),
  });

  const { data: bulletins = [], isLoading: isLoadingBulletins } = useQuery({
    queryKey: ["gov-met-bulletins"],
    queryFn: () => getGovMetBulletins(),
  });

  const { data: stats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ["gov-throughput-benchmarks"],
    queryFn: getGovThroughputBenchmarks,
  });

  const handleRunComplianceCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingCompliance(true);
    try {
      const res = await checkGovTideCompliance(testDraft, testLoa, testDate);
      setComplianceResult(res);
    } catch (err) {
      console.error("Compliance evaluation failed:", err);
    } finally {
      setIsCheckingCompliance(false);
    }
  };

  const filteredBerths = berths.filter((b) => {
    if (terminalFilter !== "ALL" && b.terminal_code !== terminalFilter) return false;
    if (searchFilter) {
      const query = searchFilter.toLowerCase();
      return (
        b.berth_code.toLowerCase().includes(query) ||
        b.terminal_name.toLowerCase().includes(query)
      );
    }
    return true;
  });

  const filteredTides = tides.filter((t) => {
    if (!searchFilter) return true;
    const query = searchFilter.toLowerCase();
    return (
      t.date.includes(query) ||
      t.navigation_restriction.toLowerCase().includes(query) ||
      t.circular_id.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Official Government Data Banner */}
      <div className="bg-white rounded-lg border border-portos-border p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-800">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-portos-navy">
                  Bangladesh Government & Chattogram Port Authority Official Reference Data
                </h2>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-900 rounded-full border border-emerald-200">
                  Govt Verified Repository
                </span>
                <DataStatusBadge status="OBSERVED" />
              </div>
              <p className="text-xs text-portos-muted mt-1 leading-relaxed max-w-3xl">
                Official publications and regulatory standards issued by the <strong>Chattogram Port Authority (CPA)</strong> Hydrography & Traffic Departments and the <strong>Bangladesh Meteorological Department (BMD)</strong>. These verified records serve as empirical benchmarks for tidal draft clearance, quay dimensions, and marine warning signals.
              </p>
            </div>
          </div>

          {/* Direct Government Portal Deep-Links */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://cpa.gov.bd/site/page/87e07662-3c22-498c-8c0c-7b00bfd21ebc/Tide-Table"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-portos-bg hover:bg-slate-200 text-portos-navy border border-portos-border transition-colors"
            >
              <span>CPA Tide Portal</span>
              <ExternalLink className="h-3 w-3 text-portos-muted" />
            </a>
            <a
              href="https://bmd.gov.bd/coastal-bulletin"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-portos-bg hover:bg-slate-200 text-portos-navy border border-portos-border transition-colors"
            >
              <span>BMD Storm Portal</span>
              <ExternalLink className="h-3 w-3 text-portos-muted" />
            </a>
          </div>
        </div>

        {/* Registered Source Cards Grid */}
        <div className="mt-4 pt-4 border-t border-portos-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {sources.map((src) => (
            <div
              key={src.id}
              className="p-2.5 rounded bg-portos-bg/70 border border-portos-border/70 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-semibold text-portos-navy truncate">{src.code}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-teal-50 text-teal-800 font-mono rounded border border-teal-200">
                    {src.data_status}
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-800 truncate">{src.name}</p>
                <p className="text-[10px] text-portos-muted mt-0.5 line-clamp-2">{src.organization}</p>
              </div>
              {src.url && (
                <a
                  href={src.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 text-[10px] font-medium text-portos-teal hover:underline flex items-center gap-1"
                >
                  <span>Official Circular Reference</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sub-Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-portos-border pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("tides")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === "tides"
                ? "bg-portos-navy text-white shadow-xs"
                : "bg-white text-portos-muted hover:text-portos-navy border border-portos-border"
            }`}
          >
            <Waves className="h-3.5 w-3.5 text-teal-400" />
            <span>CPA Tides & Fairway Drafts</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/50 text-slate-200">
              {tides.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("berths")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === "berths"
                ? "bg-portos-navy text-white shadow-xs"
                : "bg-white text-portos-muted hover:text-portos-navy border border-portos-border"
            }`}
          >
            <Building2 className="h-3.5 w-3.5 text-teal-400" />
            <span>CPA Berth Specifications</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/50 text-slate-200">
              {berths.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("met")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === "met"
                ? "bg-portos-navy text-white shadow-xs"
                : "bg-white text-portos-muted hover:text-portos-navy border border-portos-border"
            }`}
          >
            <Wind className="h-3.5 w-3.5 text-teal-400" />
            <span>BMD Marine Weather & Cyclone Signals</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/50 text-slate-200">
              {bulletins.length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("stats")}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeSubTab === "stats"
                ? "bg-portos-navy text-white shadow-xs"
                : "bg-white text-portos-muted hover:text-portos-navy border border-portos-border"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5 text-teal-400" />
            <span>CPA Annual Throughput Statistics</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700/50 text-slate-200">
              5Y
            </span>
          </button>
        </div>

        {/* Search bar */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-portos-muted" />
          <input
            type="text"
            placeholder="Search records, dates, circulars..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-portos-border bg-white text-portos-navy focus:outline-hidden focus:ring-1 focus:ring-portos-teal"
          />
        </div>
      </div>

      {/* Sub-Tab 1: CPA Tides & Draft Compliance */}
      {activeSubTab === "tides" && (
        <div className="space-y-6">
          {/* Interactive Compliance Checker Card */}
          <div className="bg-white rounded-lg border border-portos-border p-5 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Compass className="h-4 w-4 text-portos-teal" />
              <h3 className="text-sm font-bold text-portos-navy">
                CPA Fairway Permissible Draft & Daylight Compliance Checker
              </h3>
            </div>
            <p className="text-xs text-portos-muted mb-4">
              Real-time evaluation against the CPA Hydrography Department Tide Circular (Outer Bar & Gupta Bend limits). Tests whether a container feeder complies with daylight high-water slack navigation rules.
            </p>

            <form onSubmit={handleRunComplianceCheck} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Arrival Draft (meters)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="5.0"
                  max="15.0"
                  value={testDraft}
                  onChange={(e) => setTestDraft(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-portos-border font-mono text-portos-navy focus:ring-1 focus:ring-portos-teal"
                />
                <span className="text-[10px] text-portos-muted">Karnaphuli max: 9.50m</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Length Overall / LOA (meters)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="50.0"
                  max="350.0"
                  value={testLoa}
                  onChange={(e) => setTestLoa(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-portos-border font-mono text-portos-navy focus:ring-1 focus:ring-portos-teal"
                />
                <span className="text-[10px] text-portos-muted">Daylight limit: &gt;175.0m</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Transit Date (Tidal Table)
                </label>
                <input
                  type="date"
                  value={testDate}
                  min="2026-11-01"
                  max="2026-11-30"
                  onChange={(e) => setTestDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded border border-portos-border font-mono text-portos-navy focus:ring-1 focus:ring-portos-teal"
                />
                <span className="text-[10px] text-portos-muted">Nov 2026 semi-diurnal</span>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isCheckingCompliance}
                  className="w-full px-4 py-2 bg-portos-navy hover:bg-portos-navy-secondary text-white text-xs font-semibold rounded transition-colors flex items-center justify-center gap-1.5"
                >
                  <Compass className="h-3.5 w-3.5" />
                  <span>{isCheckingCompliance ? "Evaluating..." : "Check Circular Rules"}</span>
                </button>
              </div>
            </form>

            {/* Compliance Results Card */}
            {complianceResult && (
              <div
                className={`mt-4 p-4 rounded-lg border text-xs ${
                  complianceResult.is_compliant
                    ? "bg-emerald-50/70 border-emerald-200"
                    : "bg-rose-50/70 border-rose-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {complianceResult.is_compliant ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-rose-600 shrink-0" />
                    )}
                    <div>
                      <h4
                        className={`font-bold ${
                          complianceResult.is_compliant ? "text-emerald-900" : "text-rose-900"
                        }`}
                      >
                        {complianceResult.is_compliant
                          ? "COMPLIANT WITH CPA NAVIGATION CIRCULAR"
                          : "CIRCULAR VIOLATION: FAIRWAY TRANSIT RESTRICTED"}
                      </h4>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Permissible Draft for {complianceResult.date}:{" "}
                        <strong className="font-mono text-portos-navy">
                          {complianceResult.max_permissible_draft_m.toFixed(2)}m
                        </strong>{" "}
                        | Vessel Draft:{" "}
                        <strong className="font-mono text-portos-navy">
                          {complianceResult.vessel_draft_m.toFixed(2)}m
                        </strong>{" "}
                        | Tidal State:{" "}
                        <span className="px-1.5 py-0.2 bg-white rounded border border-slate-300 font-medium">
                          {complianceResult.tidal_phase}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-portos-muted font-mono">
                      {complianceResult.source_circular}
                    </span>
                  </div>
                </div>

                {/* Violations */}
                {complianceResult.violations.length > 0 && (
                  <div className="mt-3 p-2.5 bg-white/80 rounded border border-rose-200 space-y-1">
                    <p className="font-semibold text-rose-900 text-[11px]">Violations Identified:</p>
                    {complianceResult.violations.map((v, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-rose-800 text-[11px]">
                        <XCircle className="h-3 w-3 shrink-0 mt-0.5 text-rose-600" />
                        <span>{v}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Advisories & Daylight Requirements */}
                {complianceResult.advisories.length > 0 && (
                  <div className="mt-2 p-2.5 bg-white/80 rounded border border-amber-200 space-y-1">
                    <p className="font-semibold text-amber-900 text-[11px]">
                      Mandatory CPA Operational Directives:
                    </p>
                    {complianceResult.advisories.map((a, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-amber-800 text-[11px]">
                        <Info className="h-3 w-3 shrink-0 mt-0.5 text-amber-600" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 30-Day November 2026 Tide Table */}
          <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-portos-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-portos-navy">
                  Chattogram Port Authority (CPA) Hydrography Department Tide Table
                </h3>
                <p className="text-xs text-portos-muted mt-0.5">
                  Official semi-diurnal astronomical predictions for Karnaphuli river approach (Chart Datum).
                </p>
              </div>
              <a
                href="/api/v1/gov/sample-file?file_type=tides"
                download="cpa_tide_circular_2026.csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-portos-bg hover:bg-slate-200 text-portos-navy border border-portos-border transition-colors"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Export Tide CSV</span>
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-portos-bg text-portos-navy font-semibold border-b border-portos-border">
                  <tr>
                    <th className="px-3.5 py-2.5">Date</th>
                    <th className="px-3.5 py-2.5">HW 1 (m)</th>
                    <th className="px-3.5 py-2.5">LW 1 (m)</th>
                    <th className="px-3.5 py-2.5">HW 2 (m)</th>
                    <th className="px-3.5 py-2.5">LW 2 (m)</th>
                    <th className="px-3.5 py-2.5">Max Draft</th>
                    <th className="px-3.5 py-2.5">Daylight Window</th>
                    <th className="px-3.5 py-2.5">Navigation Directives</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-portos-border">
                  {filteredTides.map((t) => (
                    <tr key={t.date} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono font-medium text-portos-navy">
                        {t.date}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono">
                        {t.hw_time_1} ({t.hw_height_1_m.toFixed(2)}m)
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-portos-muted">
                        {t.lw_time_1} ({t.lw_height_1_m.toFixed(2)}m)
                      </td>
                      <td className="px-3.5 py-2.5 font-mono">
                        {t.hw_time_2} ({t.hw_height_2_m.toFixed(2)}m)
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-portos-muted">
                        {t.lw_time_2} ({t.lw_height_2_m.toFixed(2)}m)
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-portos-teal">
                        {t.max_permissible_draft_m.toFixed(2)}m
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-700">
                        {t.day_nav_start} - {t.day_nav_end}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            t.navigation_restriction.includes("SPRING")
                              ? "bg-teal-50 text-teal-800 border border-teal-200"
                              : t.navigation_restriction.includes("NEAP")
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-800 border border-slate-200"
                          }`}
                        >
                          {t.navigation_restriction}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: CPA Berth Specifications Circular */}
      {activeSubTab === "berths" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-portos-navy">
                  Chattogram Port Authority Technical Berth Specification Circular
                </h3>
                <p className="text-xs text-portos-muted mt-0.5">
                  Official quay dimensions, designed depths, crane gauges, and LOA boundaries for CCT, NCT, and GCB.
                </p>
              </div>

              {/* Terminal filter buttons */}
              <div className="flex items-center gap-1.5 bg-portos-bg p-1 rounded-lg border border-portos-border text-xs">
                {["ALL", "CCT", "NCT", "GCB"].map((term) => (
                  <button
                    key={term}
                    onClick={() => setTerminalFilter(term)}
                    className={`px-2.5 py-1 rounded transition-colors font-medium ${
                      terminalFilter === term
                        ? "bg-white text-portos-navy font-bold shadow-xs"
                        : "text-portos-muted hover:text-portos-navy"
                    }`}
                  >
                    {term === "ALL" ? "All Terminals" : term}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-portos-bg text-portos-navy font-semibold border-b border-portos-border">
                  <tr>
                    <th className="px-3.5 py-2.5">Berth Code</th>
                    <th className="px-3.5 py-2.5">Terminal</th>
                    <th className="px-3.5 py-2.5">Quay Length</th>
                    <th className="px-3.5 py-2.5">Design Depth (CD)</th>
                    <th className="px-3.5 py-2.5">Max LOA</th>
                    <th className="px-3.5 py-2.5">Max Draft</th>
                    <th className="px-3.5 py-2.5">STS Crane</th>
                    <th className="px-3.5 py-2.5">Rail Gauge</th>
                    <th className="px-3.5 py-2.5">Bollard Pull</th>
                    <th className="px-3.5 py-2.5">Night Navigation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-portos-border">
                  {filteredBerths.map((b) => (
                    <tr key={b.berth_code} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-mono font-bold text-portos-navy">
                        {b.berth_code}
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-800">{b.terminal_name}</td>
                      <td className="px-3.5 py-2.5 font-mono">{b.quay_length_m.toFixed(1)}m</td>
                      <td className="px-3.5 py-2.5 font-mono">{b.designed_depth_cd_m.toFixed(2)}m</td>
                      <td className="px-3.5 py-2.5 font-mono font-medium text-slate-900">
                        {b.max_permissible_loa_m.toFixed(1)}m
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-portos-teal">
                        {b.max_permissible_draft_m.toFixed(2)}m
                      </td>
                      <td className="px-3.5 py-2.5">
                        {b.sts_crane_equipped ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            STS Gantry
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            Geared Only
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600">
                        {b.crane_rail_gauge_m > 0 ? `${b.crane_rail_gauge_m}m` : "N/A"}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono">{b.bollard_capacity_tonnes} T</td>
                      <td className="px-3.5 py-2.5">
                        {b.night_navigation_allowed ? (
                          <span className="text-emerald-700 font-semibold text-[11px]">Permitted</span>
                        ) : (
                          <span className="text-amber-700 font-medium text-[11px]">Daylight Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: BMD Marine Weather & Cyclone Warnings */}
      {activeSubTab === "met" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-portos-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-portos-navy">
                  Bangladesh Meteorological Department (BMD) Patenga Coastal Maritime Bulletins
                </h3>
                <p className="text-xs text-portos-muted mt-0.5">
                  Official national maritime warning signals, squall criteria, and outer anchorage lighterage advisories.
                </p>
              </div>
              <a
                href="https://bmd.gov.bd/coastal-bulletin"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-portos-bg hover:bg-slate-200 text-portos-navy border border-portos-border transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>BMD Live Portal</span>
              </a>
            </div>

            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {bulletins.map((b) => (
                <div
                  key={b.bulletin_id}
                  className={`p-4 rounded-lg border text-xs flex flex-col justify-between ${
                    b.signal_number >= 3
                      ? "bg-amber-50/60 border-amber-300"
                      : b.signal_number >= 1
                      ? "bg-slate-50 border-slate-300"
                      : "bg-white border-portos-border"
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="font-mono text-[10px] text-portos-muted">
                          {b.bulletin_id}
                        </span>
                        <h4 className="font-bold text-sm text-portos-navy mt-0.5">
                          {b.maritime_signal_name}
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-xs font-bold rounded-full border ${
                          b.signal_number >= 3
                            ? "bg-amber-100 text-amber-900 border-amber-300"
                            : b.signal_number >= 1
                            ? "bg-blue-100 text-blue-900 border-blue-300"
                            : "bg-slate-100 text-slate-700 border-slate-300"
                        }`}
                      >
                        Signal {b.signal_number}
                      </span>
                    </div>

                    <p className="text-slate-600 text-[11px] mb-3 leading-relaxed">
                      {b.advisory_text}
                    </p>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-white/80 rounded border border-portos-border text-[11px]">
                      <div>
                        <span className="text-portos-muted block text-[10px]">Wind Force</span>
                        <span className="font-mono font-bold text-portos-navy">
                          {b.sustained_wind_knots} kts ({b.wind_direction})
                        </span>
                      </div>
                      <div>
                        <span className="text-portos-muted block text-[10px]">Significant Wave</span>
                        <span className="font-mono font-bold text-portos-navy">
                          {b.wave_height_m} m
                        </span>
                      </div>
                      <div>
                        <span className="text-portos-muted block text-[10px]">Port Impact</span>
                        <span
                          className={`font-semibold ${
                            b.port_operations_impact === "SUSPEND_LIGHTERAGE"
                              ? "text-rose-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {b.port_operations_impact}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-portos-muted">
                    <span>{b.station_name}</span>
                    <span>{new Date(b.issue_datetime).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: CPA Annual Throughput Statistics */}
      {activeSubTab === "stats" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden">
            <div className="p-4 border-b border-portos-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-portos-navy">
                  Chattogram Port Authority (CPA) 5-Year Historical Performance Benchmarks
                </h3>
                <p className="text-xs text-portos-muted mt-0.5">
                  Published administrative performance metrics: container throughput, vessel turnaround, and berth occupancy.
                </p>
              </div>
              <a
                href="/api/v1/gov/sample-file?file_type=stats"
                download="cpa_annual_statistics_2025.csv"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-portos-bg hover:bg-slate-200 text-portos-navy border border-portos-border transition-colors"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-portos-bg text-portos-navy font-semibold border-b border-portos-border">
                  <tr>
                    <th className="px-3.5 py-2.5">Fiscal Year</th>
                    <th className="px-3.5 py-2.5">Total Throughput</th>
                    <th className="px-3.5 py-2.5">Import TEU</th>
                    <th className="px-3.5 py-2.5">Export TEU</th>
                    <th className="px-3.5 py-2.5">Vessel Calls</th>
                    <th className="px-3.5 py-2.5">Avg Turnaround</th>
                    <th className="px-3.5 py-2.5">Berth Occupancy</th>
                    <th className="px-3.5 py-2.5">Crane Moves/Hr</th>
                    <th className="px-3.5 py-2.5">Import Dwell</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-portos-border">
                  {stats.map((s) => (
                    <tr key={s.fiscal_year} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3.5 py-2.5 font-bold text-portos-navy font-mono">
                        {s.fiscal_year}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono font-bold text-portos-teal">
                        {s.total_container_throughput_teu.toLocaleString()} TEU
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-700">
                        {s.import_container_teu.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-700">
                        {s.export_container_teu.toLocaleString()}
                      </td>
                      <td className="px-3.5 py-2.5 font-mono">{s.total_vessel_calls}</td>
                      <td className="px-3.5 py-2.5 font-mono font-semibold text-portos-navy">
                        {s.avg_turnaround_time_days.toFixed(2)} days
                      </td>
                      <td className="px-3.5 py-2.5 font-mono">{s.avg_berth_occupancy_rate_pct.toFixed(1)}%</td>
                      <td className="px-3.5 py-2.5 font-mono">{s.avg_crane_productivity_moves_hr.toFixed(1)}</td>
                      <td className="px-3.5 py-2.5 font-mono text-slate-600">
                        {s.dwell_time_import_days.toFixed(1)} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

