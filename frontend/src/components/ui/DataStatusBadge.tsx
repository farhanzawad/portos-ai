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
      bg: "bg-amber-500/15",
      text: "text-amber-400",
      border: "border-amber-500/30",
      dot: "bg-amber-400",
    },
    OBSERVED: {
      bg: "bg-emerald-500/15",
      text: "text-emerald-400",
      border: "border-emerald-500/30",
      dot: "bg-emerald-400",
    },
    FORECAST: {
      bg: "bg-sky-500/15",
      text: "text-sky-400",
      border: "border-sky-500/30",
      dot: "bg-sky-400",
    },
    DERIVED: {
      bg: "bg-violet-500/15",
      text: "text-violet-400",
      border: "border-violet-500/30",
      dot: "bg-violet-400",
    },
    UNAVAILABLE: {
      bg: "bg-rose-500/15",
      text: "text-rose-400",
      border: "border-rose-500/30 border-dashed",
      dot: "bg-rose-400",
    },
  };

  const current = styles[status] || styles.SIMULATED;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border transition-colors",
        current.bg,
        current.text,
        current.border,
        size === "sm" ? "px-2.5 py-0.5 text-[10px]" : "px-3 py-1 text-xs",
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

