import React from "react";
import clsx from "clsx";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { DataStatusBadge, DataStatus } from "./DataStatusBadge";

export type AlertSeverity = "critical" | "warning" | "info" | "normal";

interface AlertRowProps {
  severity: AlertSeverity;
  title: string;
  description: string;
  timestamp: string;
  source?: string;
  dataStatus?: DataStatus;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function AlertRow({
  severity,
  title,
  description,
  timestamp,
  source = "Terminal System",
  dataStatus = "SIMULATED",
  actionLabel,
  onAction,
  className,
}: AlertRowProps) {
  const icons: Record<AlertSeverity, React.ReactNode> = {
    critical: <AlertCircle className="h-4 w-4 text-portos-red shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-4 w-4 text-portos-amber shrink-0 mt-0.5" />,
    info: <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />,
    normal: <CheckCircle2 className="h-4 w-4 text-portos-teal shrink-0 mt-0.5" />,
  };

  const borderStyles: Record<AlertSeverity, string> = {
    critical: "border-l-4 border-l-portos-red bg-portos-red-light/30 border-y-portos-border border-r-portos-border",
    warning: "border-l-4 border-l-portos-amber bg-portos-amber-light/30 border-y-portos-border border-r-portos-border",
    info: "border-l-4 border-l-blue-600 bg-blue-50/40 border-y-portos-border border-r-portos-border",
    normal: "border-l-4 border-l-portos-teal bg-teal-50/30 border-y-portos-border border-r-portos-border",
  };

  return (
    <div
      className={clsx(
        "rounded border p-3 flex items-start justify-between gap-3 text-xs transition-colors hover:bg-portos-bg/70",
        borderStyles[severity],
        className
      )}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {icons[severity]}
        <div className="space-y-0.5 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-portos-navy">{title}</span>
            <span className="text-[10px] text-portos-muted font-mono bg-portos-surface px-1.5 py-0.5 rounded border border-portos-border">
              {source}
            </span>
            <DataStatusBadge status={dataStatus} size="sm" />
          </div>
          <p className="text-portos-muted text-[11px] leading-relaxed line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-[10px] text-portos-muted tabular-nums whitespace-nowrap">
          {timestamp}
        </span>
        {actionLabel && (
          <button
            onClick={onAction}
            className="text-[11px] font-medium text-portos-navy px-2 py-0.5 bg-portos-surface border border-portos-border rounded hover:bg-portos-bg transition-colors"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

