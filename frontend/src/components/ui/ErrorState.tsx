import React, { useState } from "react";
import clsx from "clsx";
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message: string;
  technicalDetails?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Failed to load data",
  message,
  technicalDetails,
  onRetry,
  className,
}: ErrorStateProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <div
      className={clsx(
        "rounded border border-portos-red/30 bg-portos-red-light/20 p-6 text-center space-y-3",
        className
      )}
    >
      <div className="mx-auto w-10 h-10 rounded-full bg-portos-red/10 flex items-center justify-center text-portos-red">
        <AlertCircle className="h-5 w-5" />
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <h4 className="text-sm font-semibold text-portos-navy">{title}</h4>
        <p className="text-xs text-portos-muted leading-relaxed">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-portos-navy rounded hover:bg-portos-navy-secondary transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Retry Request
        </button>
      )}

      {technicalDetails && (
        <div className="pt-2 text-left max-w-lg mx-auto">
          <button
            onClick={() => setShowTechnical(!showTechnical)}
            className="text-[11px] text-portos-muted flex items-center gap-1 hover:text-portos-navy"
          >
            <span>Technical details</span>
            {showTechnical ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>

          {showTechnical && (
            <pre className="mt-1.5 p-2 rounded bg-slate-900 text-slate-100 font-mono text-[10px] overflow-x-auto">
              {technicalDetails}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

