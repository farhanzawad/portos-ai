import React from "react";
import clsx from "clsx";

interface PageSectionProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PageSection({
  title,
  subtitle,
  badge,
  actions,
  children,
  className,
}: PageSectionProps) {
  return (
    <section className={clsx("space-y-3", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-portos-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-portos-navy uppercase tracking-wide">
              {title}
            </h3>
            {badge}
          </div>
          {subtitle && (
            <p className="text-xs text-portos-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>

      <div>{children}</div>
    </section>
  );
}

