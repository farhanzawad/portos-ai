import React from "react";
import clsx from "clsx";
import { DataStatusBadge, DataStatus } from "./DataStatusBadge";
import { LucideIcon } from "lucide-react";

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
}: KPICardProps) {
  if (loading) {
    return (
      <div
        className={clsx(
          "rounded border border-portos-border bg-portos-surface p-4 shadow-sm animate-pulse space-y-3",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <div className="h-3 w-20 bg-slate-200 rounded" />
          <div className="h-4 w-12 bg-slate-200 rounded" />
        </div>
        <div className="h-7 w-28 bg-slate-200 rounded" />
        <div className="h-3 w-36 bg-slate-200 rounded" />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "rounded border border-portos-border bg-portos-surface p-4 shadow-sm transition-shadow hover:shadow-md flex flex-col justify-between",
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 pb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-portos-muted">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          {dataStatus && <DataStatusBadge status={dataStatus} size="sm" />}
          {Icon && <Icon className="h-4 w-4 text-portos-navy-secondary shrink-0" />}
        </div>
      </div>

      <div className="my-1 flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-portos-navy tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-portos-muted lowercase">
            {unit}
          </span>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="pt-2 border-t border-portos-border/60 flex items-center justify-between text-[11px] text-portos-muted">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend && (
            <span
              className={clsx(
                "tabular-nums font-semibold shrink-0 ml-auto",
                trend.positive ? "text-portos-teal-dark" : "text-portos-red-dark"
              )}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
              {trend.label && <span className="font-normal text-portos-muted ml-1">({trend.label})</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

