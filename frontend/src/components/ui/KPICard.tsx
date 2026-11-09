"use client";

import React from "react";
import clsx from "clsx";
import { DataStatusBadge, DataStatus } from "./DataStatusBadge";
import { LucideIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";

export type CardAccent = "sky" | "emerald" | "amber" | "rose" | "indigo";

export interface KPICardSegment {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  dataStatus?: DataStatus;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  icon?: LucideIcon;
  loading?: boolean;
  className?: string;
  accent?: CardAccent;
  sparkBars?: number[]; // Values 0-100 for telemetry sparkline
  segments?: KPICardSegment[];
}

export function KPICard({
  label,
  value,
  unit,
  subtitle,
  dataStatus = "SIMULATED",
  trend,
  icon: Icon,
  loading = false,
  className,
  accent = "sky",
  sparkBars,
  segments,
}: KPICardProps) {
  const accentTheme: Record<
    CardAccent,
    { iconBg: string; iconColor: string; barFill: string; pillBg: string }
  > = {
    sky: {
      iconBg: "bg-sky-50",
      iconColor: "text-sky-600",
      barFill: "bg-sky-500",
      pillBg: "bg-sky-50 text-sky-700 border-sky-200",
    },
    emerald: {
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      barFill: "bg-emerald-500",
      pillBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    amber: {
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      barFill: "bg-amber-500",
      pillBg: "bg-amber-50 text-amber-700 border-amber-200",
    },
    rose: {
      iconBg: "bg-rose-50",
      iconColor: "text-rose-600",
      barFill: "bg-rose-500",
      pillBg: "bg-rose-50 text-rose-700 border-rose-200",
    },
    indigo: {
      iconBg: "bg-indigo-50",
      iconColor: "text-indigo-600",
      barFill: "bg-indigo-500",
      pillBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
    },
  };

  const currentTheme = accentTheme[accent] || accentTheme.sky;
  const defaultSpark = [35, 50, 45, 70, 60, 85, 75];
  const bars = sparkBars && sparkBars.length > 0 ? sparkBars : defaultSpark;

  if (loading) {
    return (
      <div
        className={clsx(
          "rounded-2xl border border-slate-200 bg-white p-5 shadow-xs animate-pulse space-y-3 font-sans",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 bg-slate-200 rounded-full" />
          <div className="h-7 w-7 bg-slate-200 rounded-full" />
        </div>
        <div className="h-8 w-32 bg-slate-200 rounded" />
        <div className="h-3 w-40 bg-slate-200 rounded-full" />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group font-sans",
        className
      )}
    >
      {/* Top Eyebrow Header Row */}
      <div className="flex items-start justify-between gap-2 pb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-sans">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {Icon && (
            <div
              className={clsx(
                "p-2 rounded-xl shrink-0 transition-transform group-hover:scale-105",
                currentTheme.iconBg
              )}
            >
              <Icon className={clsx("h-4 w-4", currentTheme.iconColor)} />
            </div>
          )}
        </div>
      </div>

      {/* Main Metric & Subtle Micro-Telemetry Bars */}
      <div className="my-2 flex items-end justify-between gap-3">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-xs font-semibold text-slate-500 lowercase">
                {unit}
              </span>
            )}
          </div>
          {dataStatus && (
            <div className="mt-1">
              <DataStatusBadge status={dataStatus} size="sm" />
            </div>
          )}
        </div>

        {/* Micro-Telemetry Spark Bars */}
        <div
          className="flex items-end gap-1 h-9 px-1 pb-0.5 shrink-0"
          title="Telemetry distribution"
        >
          {bars.map((h, idx) => (
            <div
              key={idx}
              className="w-1.5 rounded-full bg-slate-100 flex items-end overflow-hidden"
              style={{ height: "34px" }}
            >
              <div
                className={clsx(
                  "w-full rounded-full transition-all duration-300",
                  idx === bars.length - 1 ? currentTheme.barFill : "bg-slate-300"
                )}
                style={{ height: `${Math.min(100, Math.max(15, h))}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Optional Multi-Segments */}
      {segments && segments.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100">
          {segments.map((seg, idx) => {
            const SegIcon = seg.icon;
            return (
              <div
                key={idx}
                className="bg-slate-50/80 p-2 rounded-xl border border-slate-200/60 flex items-center gap-2"
              >
                {SegIcon && <SegIcon className="h-3.5 w-3.5 text-slate-600 shrink-0" />}
                <div className="truncate">
                  <span className="text-[10px] text-slate-500 block font-medium truncate">
                    {seg.label}
                  </span>
                  <span className="text-xs font-bold text-slate-900 tabular-nums">
                    {seg.value}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Subtitle & Trend */}
      {(subtitle || trend) && (
        <div className="pt-2.5 mt-1 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 gap-2">
          {subtitle && (
            <span className="truncate max-w-[150px] sm:max-w-none font-medium">
              {subtitle}
            </span>
          )}
          {trend && (
            <span
              className={clsx(
                "inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums shrink-0 ml-auto border shadow-2xs",
                trend.positive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              )}
            >
              {trend.positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {trend.value}
              {trend.label && (
                <span className="font-normal opacity-80 ml-0.5">{trend.label}</span>
              )}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
