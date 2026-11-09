import React from "react";
import clsx from "clsx";

export type OperationalStatus = "normal" | "watch" | "danger" | "neutral" | "info";

interface StatusBadgeProps {
  status: OperationalStatus;
  label: string;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export function StatusBadge({
  status,
  label,
  size = "sm",
  className,
  dot = true,
}: StatusBadgeProps) {
  const styles: Record<OperationalStatus, { bg: string; text: string; border: string; dot: string }> = {
    normal: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      border: "border-emerald-200",
      dot: "bg-emerald-500",
    },
    watch: {
      bg: "bg-amber-50",
      text: "text-amber-800",
      border: "border-amber-200",
      dot: "bg-amber-500",
    },
    danger: {
      bg: "bg-red-50",
      text: "text-red-800",
      border: "border-red-200",
      dot: "bg-red-500",
    },
    info: {
      bg: "bg-sky-50",
      text: "text-sky-800",
      border: "border-sky-200",
      dot: "bg-sky-500",
    },
    neutral: {
      bg: "bg-slate-100",
      text: "text-slate-700",
      border: "border-slate-200",
      dot: "bg-slate-400",
    },
  };

  const current = styles[status] || styles.neutral;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        current.bg,
        current.text,
        current.border,
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "rounded-full shrink-0",
            current.dot,
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2"
          )}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
    </span>
  );
}

