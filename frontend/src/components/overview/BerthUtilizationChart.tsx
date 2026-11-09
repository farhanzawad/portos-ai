"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useQuery } from "@tanstack/react-query";
import { getBerths } from "@/lib/api-client";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Skeleton } from "@/components/ui/LoadingSkeleton";
import { Anchor } from "lucide-react";

// Dynamically import ECharts to avoid SSR canvas initialization issues
const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

export function BerthUtilizationChart() {
  const { data: berths, isLoading } = useQuery({
    queryKey: ["terminal-berths"],
    queryFn: () => getBerths(),
  });

  if (isLoading || !berths || !Array.isArray(berths)) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const berthCodes = berths.map((b) => b.code);
  const lengths = berths.map((b) => b.length_m);
  const drafts = berths.map((b) => b.depth_draft_m);

  const option = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (params: any[]) => {
        let text = `<div style="font-size:11px; font-weight:bold; margin-bottom:4px; font-family:sans-serif;">${params[0].name}</div>`;
        params.forEach((p) => {
          text += `<div style="font-size:11px; display:flex; justify-content:space-between; gap:12px; font-family:sans-serif;">
            <span>${p.seriesName}:</span>
            <strong>${p.value} ${p.seriesName === "Quay Length" ? "m" : "m draft"}</strong>
          </div>`;
        });
        return text;
      },
    },
    legend: {
      data: ["Quay Length", "Depth Draft"],
      textStyle: { color: "#64748B", fontSize: 11, fontFamily: "sans-serif" },
      top: 0,
      right: 0,
    },
    grid: {
      top: 30,
      bottom: 25,
      left: 35,
      right: 15,
    },
    xAxis: {
      type: "category",
      data: berthCodes,
      axisLine: { lineStyle: { color: "#E2E8F0" } },
      axisLabel: { color: "#0F172A", fontSize: 11, fontWeight: 600, fontFamily: "sans-serif" },
    },
    yAxis: [
      {
        type: "value",
        name: "Length (m)",
        nameTextStyle: { color: "#64748B", fontSize: 10, fontFamily: "sans-serif" },
        splitLine: { lineStyle: { color: "#F1F5F9" } },
        axisLabel: { color: "#64748B", fontSize: 10, fontFamily: "sans-serif" },
      },
      {
        type: "value",
        name: "Draft (m)",
        max: 15,
        nameTextStyle: { color: "#64748B", fontSize: 10, fontFamily: "sans-serif" },
        splitLine: { show: false },
        axisLabel: { color: "#64748B", fontSize: 10, fontFamily: "sans-serif" },
      },
    ],
    series: [
      {
        name: "Quay Length",
        type: "bar",
        data: lengths,
        itemStyle: { color: "#0F172A", borderRadius: [6, 6, 0, 0] },
        barWidth: 20,
      },
      {
        name: "Depth Draft",
        type: "line",
        yAxisIndex: 1,
        data: drafts,
        itemStyle: { color: "#0284C7" },
        lineStyle: { width: 3, color: "#0284C7" },
        symbol: "circle",
        symbolSize: 8,
      },
    ],
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs p-5 space-y-3 font-sans">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
            <Anchor className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Berth Physical Capacity & Draft Constraints
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Operational LOA boundaries along Karnaphuli River
            </p>
          </div>
        </div>
        <DataStatusBadge status="SIMULATED" size="sm" />
      </div>

      <div className="h-56 w-full">
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Units: Length Overall & Depth in metres (m)</span>
        <span className="font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200/80 tabular-nums text-[11px]">
          6 Berths Operational
        </span>
      </div>
    </div>
  );
}
