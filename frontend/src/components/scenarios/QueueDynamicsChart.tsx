"use client";

import React, { useMemo } from "react";
import ReactECharts from "echarts-for-react";
import { SimulationRunResponse } from "@/types/api";
import { LineChart, Layers } from "lucide-react";

interface QueueDynamicsChartProps {
  baselineRun: SimulationRunResponse;
  alternativeRun: SimulationRunResponse;
}

export function QueueDynamicsChart({
  baselineRun,
  alternativeRun,
}: QueueDynamicsChartProps) {
  const chartOption = useMemo(() => {
    const hours = baselineRun.queue_length_series.map((s) => `${s.hour}h`);

    const baseQueue = baselineRun.queue_length_series.map((s) => s.value);
    const altQueue = alternativeRun.queue_length_series.map((s) => s.value);
    const altBerths = alternativeRun.berth_occupancy_series.map((s) => s.value);

    return {
      tooltip: {
        trigger: "axis",
        backgroundColor: "rgba(255, 255, 255, 0.96)",
        borderColor: "#DCE3EA",
        borderWidth: 1,
        textStyle: {
          color: "#102A43",
          fontSize: 11,
          fontFamily: "monospace",
        },
        padding: [8, 12],
      },
      legend: {
        right: "0",
        top: "0",
        icon: "roundRect",
        itemWidth: 14,
        itemHeight: 4,
        textStyle: {
          color: "#667085",
          fontSize: 11,
          fontFamily: "inherit",
        },
      },
      grid: {
        left: "3%",
        right: "3%",
        bottom: "6%",
        top: "16%",
        containLabel: true,
      },
      xAxis: {
        type: "category",
        boundaryGap: false,
        data: hours,
        axisLine: { lineStyle: { color: "#DCE3EA" } },
        axisLabel: {
          color: "#667085",
          fontSize: 10,
          fontFamily: "monospace",
          interval: 5,
        },
      },
      yAxis: {
        type: "value",
        name: "Vessels",
        nameTextStyle: {
          color: "#667085",
          fontSize: 10,
          fontFamily: "monospace",
        },
        minInterval: 1,
        splitLine: {
          lineStyle: {
            color: "#F4F6F8",
          },
        },
        axisLabel: {
          color: "#667085",
          fontSize: 10,
          fontFamily: "monospace",
        },
      },
      series: [
        {
          name: "Baseline Queue (Nominal)",
          type: "line",
          smooth: true,
          data: baseQueue,
          lineStyle: {
            color: "#667085",
            width: 2,
            type: "dashed",
          },
          itemStyle: {
            color: "#667085",
          },
          showSymbol: false,
        },
        {
          name: `${alternativeRun.scenario_name} (Queue)`,
          type: "line",
          smooth: true,
          data: altQueue,
          lineStyle: {
            color: "#D95454",
            width: 2.5,
          },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: "rgba(217, 84, 84, 0.25)" },
                { offset: 1, color: "rgba(217, 84, 84, 0.02)" },
              ],
            },
          },
          itemStyle: {
            color: "#D95454",
          },
          showSymbol: false,
        },
        {
          name: "Berths Occupied (Alternative)",
          type: "line",
          step: "end",
          data: altBerths,
          lineStyle: {
            color: "#16A394",
            width: 1.5,
          },
          itemStyle: {
            color: "#16A394",
          },
          showSymbol: false,
        },
      ],
    };
  }, [baselineRun, alternativeRun]);

  return (
    <div className="bg-white border border-portos-border rounded-lg p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-portos-border">
        <div className="flex items-center gap-2">
          <LineChart className="h-4 w-4 text-portos-teal" />
          <h3 className="text-sm font-bold text-portos-navy">
            Outer Anchorage Queue Dynamics & Quayside Occupancy Over Time
          </h3>
        </div>
        <span className="text-xs text-portos-muted font-mono">
          Simulated Timeline (72h)
        </span>
      </div>

      <div className="w-full h-[280px]">
        <ReactECharts
          option={chartOption}
          style={{ width: "100%", height: "100%" }}
          notMerge={true}
        />
      </div>
    </div>
  );
}
