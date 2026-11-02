"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertCircle, X, Check } from "lucide-react";

interface DatasetCommitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reviewerName: string, operatorNotes?: string) => Promise<void>;
  acceptedCount: number;
  rejectedCount: number;
  fileName: string;
}

export function DatasetCommitModal({
  isOpen,
  onClose,
  onConfirm,
  acceptedCount,
  rejectedCount,
  fileName,
}: DatasetCommitModalProps) {
  const [reviewerName, setReviewerName] = useState("Operations Officer Rahman");
  const [operatorNotes, setOperatorNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      setErrorMsg("Reviewer name / operator ID is required for audit provenance.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onConfirm(reviewerName.trim(), operatorNotes.trim() || undefined);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to commit dataset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg bg-white rounded-lg shadow-2xl border border-portos-border overflow-hidden animate-in fade-in-50 zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-4 bg-slate-50 border-b border-portos-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-portos-navy text-white">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-portos-navy">
                Human Review & Operational Commitment
              </h3>
              <p className="text-xs text-portos-muted mt-0.5">
                Target Document: <strong className="text-slate-700">{fileName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-portos-muted hover:text-portos-navy transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Summary Box */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] uppercase font-semibold text-portos-muted block">
                Approved Records
              </span>
              <span className="text-lg font-bold font-mono text-emerald-800">
                {acceptedCount}
              </span>
              <span className="text-[10px] text-portos-muted block">Tagged as OBSERVED</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-semibold text-portos-muted block">
                Rejected Records
              </span>
              <span className="text-lg font-bold font-mono text-slate-600">
                {rejectedCount}
              </span>
              <span className="text-[10px] text-portos-muted block">Excluded from pipeline</span>
            </div>
          </div>

          {/* Reviewer Name Input */}
          <div>
            <label htmlFor="reviewer-name" className="block text-xs font-semibold text-portos-navy mb-1">
              Reviewer Name / Operator ID <span className="text-rose-600">*</span>
            </label>
            <input
              id="reviewer-name"
              type="text"
              required
              value={reviewerName}
              onChange={(e) => setReviewerName(e.target.value)}
              placeholder="e.g. Operations Officer Rahman"
              className="w-full text-xs px-3 py-2 border border-portos-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-portos-teal"
            />
            <span className="text-[10px] text-portos-muted mt-1 block">
              Recorded in the immutable provenance ledger and export certificates.
            </span>
          </div>

          {/* Operator Justification Notes */}
          <div>
            <label htmlFor="operator-notes" className="block text-xs font-semibold text-portos-navy mb-1">
              Audit Notes / Reconciliation Justification (Optional)
            </label>
            <textarea
              id="operator-notes"
              rows={3}
              value={operatorNotes}
              onChange={(e) => setOperatorNotes(e.target.value)}
              placeholder="e.g. Reconciled berth assignments and draft figures against CPA shipping agent bulletin."
              className="w-full text-xs px-3 py-2 border border-portos-border rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-portos-teal resize-none"
            />
          </div>

          {/* Operational Assurance Warning */}
          <div className="p-3 bg-sky-50 border border-sky-200 rounded-md text-[11px] text-sky-950 flex items-start gap-2 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-sky-700 shrink-0 mt-0.5" />
            <span>
              <strong>Audit Protocol:</strong> By committing, you confirm human review of these records. A cryptographic SHA-256 provenance stamp linking to the source document will be generated.
            </span>
          </div>

          {/* Error alert */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-portos-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-portos-border rounded-md hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-portos-navy hover:bg-portos-navy-secondary rounded-md shadow-xs transition-colors disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              <span>{isSubmitting ? "Committing..." : "Confirm & Ingest"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

