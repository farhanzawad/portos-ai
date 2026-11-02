import React from "react";
import clsx from "clsx";
import { LucideIcon, Inbox } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        "rounded border border-dashed border-portos-border bg-portos-surface/60 p-8 text-center flex flex-col items-center justify-center space-y-3",
        className
      )}
    >
      <div className="p-3 bg-portos-bg rounded-full border border-portos-border text-portos-muted">
        <Icon className="h-6 w-6" />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className="text-sm font-semibold text-portos-navy">{title}</h4>
        <p className="text-xs text-portos-muted leading-relaxed">{description}</p>
      </div>
      {actionLabel && (
        <button
          onClick={onAction}
          className="mt-2 text-xs font-medium px-3 py-1.5 bg-portos-navy text-white rounded hover:bg-portos-navy-secondary transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

