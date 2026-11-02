import React from "react";
import clsx from "clsx";

export type DataStatus = "SIMULATED" | "OBSERVED" | "FORECAST" | "DERIVED" | "UNAVAILABLE";

interface DataStatusBadgeProps {
  status: DataStatus;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export function DataStatusBadge({
  status,
  size = "sm",
  className,
  showIcon = true,
}: DataStatusBadgeProps) {
  const styles: Record<DataStatus, { bg: string; text: string; border: string; dot: string }> = {
    SIMULATED: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-300",
      dot: "bg-slate-500",
    },
    OBSERVED: {
      bg: "bg-teal-50",
      text: "text-teal-800",
      border: "border-teal-300",
      dot: "bg-teal-600",
    },
    FORECAST: {
      bg: "bg-sky-50",
      text: "text-sky-800",
      border: "border-sky-300",
      dot: "bg-sky-600",
    },
    DERIVED: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-300",
      dot: "bg-amber-600",
    },
    UNAVAILABLE: {
      bg: "bg-rose-50",
      text: "text-rose-800",
      border: "border-rose-300 border-dashed",
      dot: "bg-rose-500",
    },
  };

  const current = styles[status] || styles.SIMULATED;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-mono font-semibold uppercase tracking-wider rounded border transition-colors",
        current.bg,
        current.text,
        current.border,
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs",
        className
      )}
      title={`Data Classification: ${status}`}
    >
      {showIcon && (
        <span
          className={clsx(
            "rounded-full shrink-0",
            current.dot,
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
          )}
          aria-hidden="true"
        />
      )}
      {status}
    </span>
  );
}

