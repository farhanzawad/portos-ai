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
      <div className="rounded-lg border border-portos-border bg-portos-surface p-5 shadow-sm space-y-3">
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
        let text = `<div style="font-size:11px; font-weight:bold; margin-bottom:4px;">${params[0].name}</div>`;
        params.forEach((p) => {
          text += `<div style="font-size:11px; display:flex; justify-content:space-between; gap:12px;">
            <span>${p.seriesName}:</span>
            <strong>${p.value} ${p.seriesName === "Quay Length" ? "m" : "m draft"}</strong>
          </div>`;
        });
        return text;
      },
    },
    legend: {
      data: ["Quay Length", "Depth Draft"],
      textStyle: { color: "#667085", fontSize: 11 },
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
      axisLine: { lineStyle: { color: "#DCE3EA" } },
      axisLabel: { color: "#102A43", fontSize: 11, fontWeight: 500 },
    },
    yAxis: [
      {
        type: "value",
        name: "Length (m)",
        nameTextStyle: { color: "#667085", fontSize: 10 },
        splitLine: { lineStyle: { color: "#F4F6F8" } },
        axisLabel: { color: "#667085", fontSize: 10 },
      },
      {
        type: "value",
        name: "Draft (m)",
        max: 15,
        nameTextStyle: { color: "#667085", fontSize: 10 },
        splitLine: { show: false },
        axisLabel: { color: "#667085", fontSize: 10 },
      },
    ],
    series: [
      {
        name: "Quay Length",
        type: "bar",
        data: lengths,
        itemStyle: { color: "#102A43", borderRadius: [2, 2, 0, 0] },
        barWidth: 16,
      },
      {
        name: "Depth Draft",
        type: "line",
        yAxisIndex: 1,
        data: drafts,
        itemStyle: { color: "#16A394" },
        lineStyle: { width: 2.5, color: "#16A394" },
        symbol: "circle",
        symbolSize: 6,
      },
    ],
  };

  return (
    <div className="rounded-lg border border-portos-border bg-portos-surface shadow-sm p-5 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-portos-border">
        <div className="flex items-center gap-2">
          <Anchor className="h-4 w-4 text-portos-navy-secondary" />
          <h3 className="text-sm font-bold text-portos-navy">
            Berth Physical Capacity & Draft Constraints
          </h3>
        </div>
        <DataStatusBadge status="SIMULATED" size="sm" />
      </div>

      <div className="h-56 w-full">
        <ReactECharts option={option} style={{ height: "100%", width: "100%" }} />
      </div>

      <div className="pt-2 border-t border-portos-border/60 flex items-center justify-between text-[11px] text-portos-muted">
        <span>Units: Length Overall & Depth in metres (m)</span>
        <span className="font-mono text-portos-teal-dark font-semibold">6 Berths Operational</span>
      </div>
    </div>
  );
}

