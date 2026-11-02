import React, { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmationDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm Proposal",
  cancelLabel = "Cancel",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const btnVariants = {
    primary: "bg-portos-navy hover:bg-portos-navy-secondary text-white",
    warning: "bg-portos-amber hover:bg-portos-amber-dark text-portos-navy font-semibold",
    danger: "bg-portos-red hover:bg-portos-red-dark text-white",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg border border-portos-border bg-portos-surface p-6 shadow-xl space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-portos-bg border border-portos-border text-portos-amber">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <h3 className="text-base font-semibold text-portos-navy">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-portos-muted hover:text-portos-navy transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-portos-muted leading-relaxed">{description}</p>

        <div className="rounded border border-portos-amber/30 bg-portos-amber-light p-2.5 text-[11px] text-portos-navy/90">
          <strong>Advisory Notice:</strong> This action records an internal recommendation proposal. No live CPA vessel maneuvering or external equipment command will be executed.
        </div>

        <div className="pt-2 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-xs font-medium text-portos-navy border border-portos-border rounded hover:bg-portos-bg transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${btnVariants[variant]}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

