"use client";

import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Check, Ship } from "lucide-react";

interface VesselQueueItem {
  id: string;
  name: string;
  imo: string;
  flag: string;
  type: string;
  teu?: number;
  draft: string;
  loa: string;
  isDeepDraft?: boolean;
  eta: string;
  etaSubtext: string;
  pilotStation: string;
  status: "in-transit" | "pre-cleared" | "on-board" | "customs";
  statusLabel: string;
  actionText: string;
  actionCompleted?: boolean;
}

export function ActiveIngressQueueTable() {
  const [sortMode, setSortMode] = useState<"draft" | "tidal">("draft");
  const [page, setPage] = useState<number>(1);
  const [queue, setQueue] = useState<VesselQueueItem[]>([
    {
      id: "v-01",
      name: "MV OOCL SINGAPORE",
      imo: "9387421",
      flag: "HK",
      type: "Container (4,250 TEU)",
      draft: "11.4 m",
      loa: "222 m",
      isDeepDraft: true,
      eta: "14:10 BST",
      etaSubtext: "Tidal Window Peak",
      pilotStation: "Alpha Anchor (PB-02)",
      status: "in-transit",
      statusLabel: "Pilot In-Transit",
      actionText: "Authorize Ingress",
    },
    {
      id: "v-02",
      name: "MV WAN HAI 316",
      imo: "9297838",
      flag: "SGP",
      type: "Container (3,100 TEU)",
      draft: "10.6 m",
      loa: "213 m",
      isDeepDraft: false,
      eta: "14:35 BST",
      etaSubtext: "Queue Slot #2",
      pilotStation: "Alpha Anchor (PB-04)",
      status: "pre-cleared",
      statusLabel: "Pre-cleared",
      actionText: "Dispatch Tug",
    },
    {
      id: "v-03",
      name: "PACIFIC ENDEAVOR",
      imo: "9642019",
      flag: "PAN",
      type: "Bulk Carrier (Grain)",
      draft: "9.7 m",
      loa: "189 m",
      isDeepDraft: false,
      eta: "15:10 BST",
      etaSubtext: "Post-crest ebb",
      pilotStation: "Bravo Anchor (PB-01)",
      status: "on-board",
      statusLabel: "Pilot On Board",
      actionText: "Track Corridor",
    },
    {
      id: "v-04",
      name: "MV MEGHNA TRADER",
      imo: "9731284",
      flag: "BGD",
      type: "General Cargo",
      draft: "8.4 m",
      loa: "160 m",
      isDeepDraft: false,
      eta: "16:00 BST",
      etaSubtext: "Standard Draft",
      pilotStation: "Charlie Anchor",
      status: "customs",
      statusLabel: "Customs Check",
      actionText: "Review Docs",
    },
  ]);

  const handleActionClick = (id: string) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, actionCompleted: !item.actionCompleted } : item
      )
    );
  };

  return (
    <div className="bg-[#12151c] border border-white/[0.07] rounded-xl p-5 sm:p-6 shadow-sm">
      {/* Header & Sort Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">
            Active Vessel Ingress &amp; Pilot Boarding Queue
          </h2>
          <p className="text-xs text-[#8e9bae] mt-0.5">
            Priority sequence for Outer Anchorage ‘A’, ‘B’ and ‘C’ boarding points.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortMode("draft")}
            className={`px-2.5 py-1 text-xs border rounded transition-colors ${
              sortMode === "draft"
                ? "bg-[#222734] text-white border-white/20 font-semibold"
                : "bg-[#181c24] text-[#8e9bae] border-white/[0.08] hover:text-white"
            }`}
          >
            Sort: Draft (Desc)
          </button>
          <button
            onClick={() => setSortMode("tidal")}
            className={`px-2.5 py-1 text-xs border rounded transition-colors ${
              sortMode === "tidal"
                ? "bg-[#222734] text-white border-white/20 font-semibold"
                : "bg-[#181c24] text-[#8e9bae] border-white/[0.08] hover:text-white"
            }`}
          >
            Tidal Window Sync
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-[11px] font-mono text-[#64748b] border-b border-white/[0.06] pb-3">
              <th className="py-3 px-3 font-medium">VESSEL / IMO</th>
              <th className="py-3 px-3 font-medium">TYPE</th>
              <th className="py-3 px-3 font-medium">DRAFT / LOA</th>
              <th className="py-3 px-3 font-medium">ETA / BOARDING</th>
              <th className="py-3 px-3 font-medium">PILOT STATION</th>
              <th className="py-3 px-3 font-medium">STATUS</th>
              <th className="py-3 px-3 font-medium text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04] text-xs">
            {queue.map((v) => (
              <tr key={v.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-3">
                  <div className="font-semibold text-white">{v.name}</div>
                  <div className="text-[11px] text-[#64748b] font-mono">
                    IMO {v.imo} • Flag: {v.flag}
                  </div>
                </td>
                <td className="py-4 px-3 text-[#8e9bae]">{v.type}</td>
                <td className="py-4 px-3">
                  <span
                    className={`font-mono font-semibold ${
                      v.isDeepDraft ? "text-primary-container" : "text-white"
                    }`}
                  >
                    {v.draft}
                  </span>
                  <span className="text-[#64748b] text-[11px]"> / {v.loa}</span>
                </td>
                <td className="py-4 px-3">
                  <div className="text-white font-mono">{v.eta}</div>
                  <div
                    className={`text-[11px] ${
                      v.isDeepDraft ? "text-secondary font-medium" : "text-[#8e9bae]"
                    }`}
                  >
                    {v.etaSubtext}
                  </div>
                </td>
                <td className="py-4 px-3 text-[#8e9bae]">{v.pilotStation}</td>
                <td className="py-4 px-3">
                  {v.status === "in-transit" && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-primary-container/10 text-primary border border-primary-container/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-pulse" />
                      {v.statusLabel}
                    </span>
                  )}
                  {v.status === "pre-cleared" && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.06] text-[#8e9bae]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8e9bae]" />
                      {v.statusLabel}
                    </span>
                  )}
                  {v.status === "on-board" && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-secondary/10 text-secondary border border-secondary/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      {v.statusLabel}
                    </span>
                  )}
                  {v.status === "customs" && (
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-white/[0.06] text-[#8e9bae]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8e9bae]" />
                      {v.statusLabel}
                    </span>
                  )}
                </td>
                <td className="py-4 px-3 text-right">
                  <button
                    onClick={() => handleActionClick(v.id)}
                    className={`px-3 py-1 rounded border text-xs font-medium transition-all ${
                      v.actionCompleted
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : "bg-[#181c24] hover:bg-white/10 text-white border-white/[0.08]"
                    }`}
                  >
                    {v.actionCompleted ? (
                      <span className="inline-flex items-center gap-1">
                        <Check className="h-3 w-3" /> Done
                      </span>
                    ) : (
                      v.actionText
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-[#8e9bae]">
        <span>Showing 4 of 18 vessels scheduled for 24h ingress window</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            className="p-1 rounded bg-[#181c24] text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="px-2 text-white font-mono">Page {page} of 5</span>
          <button
            onClick={() => setPage(Math.min(5, page + 1))}
            className="p-1 rounded bg-[#181c24] text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
