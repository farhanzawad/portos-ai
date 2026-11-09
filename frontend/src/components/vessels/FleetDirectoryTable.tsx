"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VesselCallRead } from "@/types/api";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  Ship,
  Clock,
  Compass,
  ArrowRight,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Box,
  Calendar,
  AlertTriangle,
  Anchor,
  Filter,
} from "lucide-react";

interface FleetDirectoryTableProps {
  calls: VesselCallRead[];
  onSelectCall: (call: VesselCallRead) => void;
  selectedCallId?: string | null;
}

export function FleetDirectoryTable({
  calls,
  onSelectCall,
  selectedCallId,
}: FleetDirectoryTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [riskFilter, setRiskFilter] = useState("ALL");

  const filteredCalls = calls.filter((call) => {
    if (search) {
      const q = search.toLowerCase();
      const matchName = call.vessel?.name?.toLowerCase().includes(q);
      const matchImo = call.vessel?.imo_number?.toLowerCase().includes(q);
      const matchCall = call.call_number?.toLowerCase().includes(q);
      if (!matchName && !matchImo && !matchCall) return false;
    }
    if (statusFilter !== "ALL" && call.status !== statusFilter) return false;
    if (riskFilter !== "ALL" && call.delay_risk_status !== riskFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "OUTER_ANCHORAGE":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
            OUTER ANCHORAGE
          </span>
        );
      case "PILOT_BOARDING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
            PILOT BOARDING
          </span>
        );
      case "BERTHED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
            QUAYSIDE BERTHED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
            {status.replace("_", " ")}
          </span>
        );
    }
  };

  const getRiskBadge = (risk: string, delay: number) => {
    if (risk === "HIGH_RISK" || delay >= 3.0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          +{delay}h Delay
        </span>
      );
    }
    if (risk === "WATCH" || delay > 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap">
          +{delay}h Delay
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
        On Schedule
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col font-sans">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vessel name, IMO number, call sign..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-2xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
            >
              <option value="ALL">All Statuses ({calls.length})</option>
              <option value="OUTER_ANCHORAGE">Outer Anchorage</option>
              <option value="PILOT_BOARDING">Pilotage Boarding</option>
              <option value="BERTHED">Quayside Berthed</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-2xs"
            >
              <option value="ALL">All Delay Risks</option>
              <option value="NORMAL">Normal / On Time</option>
              <option value="WATCH">Watch Tier</option>
              <option value="HIGH_RISK">High Risk</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>
            Showing <strong className="text-slate-900">{filteredCalls.length}</strong> of {calls.length} vessels
          </span>
          <DataStatusBadge status="SIMULATED" size="sm" />
        </div>
      </div>

      {/* Directory Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4">Vessel Name & Identity</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Dimensions (LOA/Draft)</th>
              <th className="py-3 px-3">Channel Clearance</th>
              <th className="py-3 px-3">Reported ETA</th>
              <th className="py-3 px-3">ML Predicted ETA</th>
              <th className="py-3 px-3">Delay Variance</th>
              <th className="py-3 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCalls.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <Ship className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold text-slate-700 text-xs">No vessels matched the filter criteria</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try clearing the search query or status filter</p>
                </td>
              </tr>
            ) : (
              filteredCalls.map((call) => {
                const isSelected = selectedCallId === call.id;
                const repDate = new Date(call.reported_eta);
                const predDate = call.predicted_eta ? new Date(call.predicted_eta) : null;
                const draft = call.vessel?.max_draft_m || 0;
                const isTidalConstrained = draft >= 8.8;

                return (
                  <tr
                    key={call.id}
                    onClick={() => onSelectCall(call)}
                    className={`cursor-pointer transition-colors hover:bg-slate-50/80 ${
                      isSelected ? "bg-sky-50/40 font-medium" : ""
                    }`}
                  >
                    {/* Vessel Name & Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
                          <Ship className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-xs block hover:text-sky-600">
                            {call.vessel?.name || "DEMO Vessel"}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {call.call_number} · IMO {call.vessel?.imo_number} · {call.vessel?.flag_country || "Bangladesh"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-3">
                      {getStatusBadge(call.status)}
                    </td>

                    {/* Dimensions */}
                    <td className="py-3.5 px-3">
                      <div className="text-slate-800 font-semibold">
                        LOA {call.vessel?.length_overall_m}m · Draft {draft}m
                      </div>
                      <span className="text-[10px] text-slate-400">
                        Beam {call.vessel?.beam_m}m · {(call.inbound_teu || 0) + (call.outbound_teu || 0)} TEU
                      </span>
                    </td>

                    {/* Channel Clearance */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isTidalConstrained
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-sky-50 text-sky-700 border border-sky-200"
                          }`}
                        >
                          {isTidalConstrained ? "High Tide Req." : "Clear Draft"}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Max 9.5m
                        </span>
                      </div>
                    </td>

                    {/* Reported ETA */}
                    <td className="py-3.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                      {repDate.toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}{" "}
                      {repDate.toLocaleTimeString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>

                    {/* ML Predicted ETA */}
                    <td className="py-3.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {predDate
                        ? `${predDate.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })} ${predDate.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : "Nominal"}
                    </td>

                    {/* Delay Variance */}
                    <td className="py-3.5 px-3">
                      {getRiskBadge(call.delay_risk_status, call.predicted_delay_hours)}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/berth-planner?vessel=${call.id}`);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                          title="Assign Berth in Berth Planner"
                        >
                          <Calendar className="h-3.5 w-3.5 text-slate-700" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/digital-twin?vessel=${call.id}`);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 transition-colors shadow-2xs"
                          title="Inspect in 3D Terminal Twin"
                        >
                          <Box className="h-3.5 w-3.5 text-sky-600" />
                        </button>
                        <button
                          onClick={() => onSelectCall(call)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] transition-colors shadow-xs flex items-center gap-1"
                        >
                          <span>Dossier</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
