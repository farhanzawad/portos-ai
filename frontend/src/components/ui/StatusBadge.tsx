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
      bg: "bg-teal-50",
      text: "text-portos-teal-dark",
      border: "border-portos-teal/30",
      dot: "bg-portos-teal",
    },
    watch: {
      bg: "bg-amber-50",
      text: "text-portos-amber-dark",
      border: "border-portos-amber/40",
      dot: "bg-portos-amber",
    },
    danger: {
      bg: "bg-red-50",
      text: "text-portos-red-dark",
      border: "border-portos-red/40",
      dot: "bg-portos-red",
    },
    info: {
      bg: "bg-blue-50",
      text: "text-blue-800",
      border: "border-blue-200",
      dot: "bg-blue-600",
    },
    neutral: {
      bg: "bg-slate-100",
      text: "text-portos-navy",
      border: "border-portos-border",
      dot: "bg-portos-muted",
    },
  };

  const current = styles[status] || styles.neutral;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 font-medium rounded border",
        current.bg,
        current.text,
        current.border,
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm",
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

