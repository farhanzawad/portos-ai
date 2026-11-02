"use client";

import React, { useState } from "react";
import {
  DocumentUploadResponse,
  ImportedDatasetRead,
  ImportedRecordRead,
  ValidationStatus,
} from "@/types/api";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Edit2,
  Check,
  X,
  ShieldCheck,
  AlertOctagon,
  RotateCcw,
  Layers,
  ArrowRight,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface DatasetReviewTableProps {
  dataset: DocumentUploadResponse | ImportedDatasetRead;
  onRecordUpdated: (
    recordId: string,
    updatedFields: Record<string, any>,
    isAccepted?: boolean,
    rejectionReason?: string
  ) => Promise<void>;
  onOpenCommitModal: () => void;
  onResetStaging: () => void;
}

export function DatasetReviewTable({
  dataset,
  onRecordUpdated,
  onOpenCommitModal,
  onResetStaging,
}: DatasetReviewTableProps) {
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [copiedSha, setCopiedSha] = useState(false);

  const records = dataset.records || [];
  const acceptedCount = records.filter((r) => r.is_accepted).length;
  const rejectedCount = records.filter((r) => !r.is_accepted).length;

  const validCount = records.filter((r) => r.validation_status === "VALID").length;
  const warningCount = records.filter((r) => r.validation_status === "WARNING").length;
  const invalidCount = records.filter((r) => r.validation_status === "INVALID").length;
  const duplicateCount = records.filter((r) => r.validation_status === "DUPLICATE").length;

  const handleCopySha = () => {
    navigator.clipboard.writeText(dataset.file_sha256);
    setCopiedSha(true);
    setTimeout(() => setCopiedSha(false), 2000);
  };

  const startEdit = (record: ImportedRecordRead) => {
    setEditingRowId(record.id);
    setEditForm({ ...record.normalized_payload_json });
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setEditForm({});
  };

  const saveEdit = async (recordId: string) => {
    await onRecordUpdated(recordId, editForm, true);
    setEditingRowId(null);
    setEditForm({});
  };

  const toggleAcceptance = async (record: ImportedRecordRead) => {
    const newAccepted = !record.is_accepted;
    const reason = !newAccepted ? "Flagged by operator during human review" : undefined;
    await onRecordUpdated(record.id, record.normalized_payload_json, newAccepted, reason);
  };

  const getStatusBadge = (status: ValidationStatus) => {
    switch (status) {
      case "VALID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            <span>VALID</span>
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="h-3 w-3 text-amber-600" />
            <span>WARNING</span>
          </span>
        );
      case "INVALID":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            <span>INVALID</span>
          </span>
        );
      case "DUPLICATE":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            <Layers className="h-3 w-3 text-purple-600" />
            <span>DUPLICATE</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="p-4 bg-slate-50 border-b border-portos-border flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-portos-navy flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-portos-teal" />
              <span>{dataset.file_name}</span>
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-800">
              {dataset.file_format}
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
              {dataset.ingestion_status}
            </span>
            <DataStatusBadge status={dataset.data_status} />
          </div>

          {/* SHA-256 Checksum Line */}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-portos-muted font-mono">
            <span>SHA-256: {dataset.file_sha256.slice(0, 16)}...</span>
            <button
              onClick={handleCopySha}
              className="hover:text-portos-navy p-0.5 rounded transition-colors"
              title="Copy full SHA-256 checksum"
            >
              <Copy className="h-3 w-3" />
            </button>
            {copiedSha && <span className="text-[10px] text-emerald-600 font-sans font-medium">Copied!</span>}
            <span className="text-slate-400">•</span>
            <span>{Math.round(dataset.file_size_bytes / 1024)} KB</span>
          </div>
        </div>

        <button
          onClick={onResetStaging}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-portos-border rounded-md hover:bg-slate-100 transition-colors self-start md:self-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Stage Different File</span>
        </button>
      </div>

      {/* Scanned PDF Refusal Warning (Zero Hallucination Protocol) */}
      {dataset.scanned_pdf_detected && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <AlertOctagon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold block text-sm">Scanned Image PDF Detected</strong>
            <p className="mt-1 leading-relaxed">
              {"scanned_message" in dataset && dataset.scanned_message
                ? dataset.scanned_message
                : "Scanned PDF detected with no digital text stream. OCR processing is not implemented in this prototype milestone; manual entry or a searchable text PDF is required."}
            </p>
          </div>
        </div>
      )}

      {/* Summary Count Strip */}
      <div className="px-4 py-2.5 bg-white border-b border-portos-border grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
        <div className="p-2 rounded bg-slate-50 border border-slate-200">
          <span className="text-[10px] uppercase font-semibold text-portos-muted block">Total Parsed</span>
          <span className="text-base font-bold font-mono text-portos-navy">{records.length}</span>
        </div>
        <div className="p-2 rounded bg-emerald-50/50 border border-emerald-200">
          <span className="text-[10px] uppercase font-semibold text-emerald-800 block">Valid Rows</span>
          <span className="text-base font-bold font-mono text-emerald-800">{validCount}</span>
        </div>
        <div className="p-2 rounded bg-amber-50/50 border border-amber-200">
          <span className="text-[10px] uppercase font-semibold text-amber-800 block">Warnings</span>
          <span className="text-base font-bold font-mono text-amber-800">{warningCount}</span>
        </div>
        <div className="p-2 rounded bg-rose-50/50 border border-rose-200">
          <span className="text-[10px] uppercase font-semibold text-rose-800 block">Invalid</span>
          <span className="text-base font-bold font-mono text-rose-800">{invalidCount}</span>
        </div>
        <div className="p-2 rounded bg-purple-50/50 border border-purple-200">
          <span className="text-[10px] uppercase font-semibold text-purple-800 block">Duplicates</span>
          <span className="text-base font-bold font-mono text-purple-800">{duplicateCount}</span>
        </div>
      </div>

      {/* Records Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/75 border-b border-portos-border text-portos-muted font-semibold">
              <th className="py-2.5 px-3 w-16 text-center">Audit</th>
              <th className="py-2.5 px-3">Location</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Vessel Name</th>
              <th className="py-2.5 px-3 font-mono">IMO No.</th>
              <th className="py-2.5 px-3">Arrival Time</th>
              <th className="py-2.5 px-3">Berth</th>
              <th className="py-2.5 px-3 font-mono">Draft (m)</th>
              <th className="py-2.5 px-3 font-mono">TEU</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-portos-border/70">
            {records.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-portos-muted italic">
                  No tabular records extracted from this document.
                </td>
              </tr>
            ) : (
              records.map((rec) => {
                const isEditing = editingRowId === rec.id;
                const norm = rec.normalized_payload_json;

                return (
                  <tr
                    key={rec.id}
                    className={`transition-colors ${
                      !rec.is_accepted
                        ? "bg-slate-100/60 opacity-60"
                        : rec.validation_status === "INVALID"
                        ? "bg-rose-50/30"
                        : rec.validation_status === "WARNING"
                        ? "bg-amber-50/20"
                        : "hover:bg-slate-50/50"
                    }`}
                  >
                    {/* Acceptance Checkbox */}
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="checkbox"
                        checked={rec.is_accepted}
                        onChange={() => toggleAcceptance(rec)}
                        className="rounded border-slate-300 text-portos-teal focus:ring-portos-teal"
                        title={rec.is_accepted ? "Mark as rejected" : "Mark as accepted"}
                      />
                    </td>

                    {/* Source Location */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {rec.source_location || `Row ${rec.row_index}`}
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      {getStatusBadge(rec.validation_status)}
                    </td>

                    {/* Vessel Name */}
                    <td className="py-2.5 px-3 font-medium text-portos-navy">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.vessel_name || ""}
                          onChange={(e) => setEditForm({ ...editForm, vessel_name: e.target.value })}
                          className="w-full text-xs px-2 py-1 border rounded bg-white"
                        />
                      ) : (
                        <span>{norm.vessel_name || <em className="text-rose-500">Missing</em>}</span>
                      )}
                    </td>

                    {/* IMO Number */}
                    <td className="py-2.5 px-3 font-mono">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.imo_number || ""}
                          onChange={(e) => setEditForm({ ...editForm, imo_number: e.target.value })}
                          className="w-24 text-xs px-2 py-1 border rounded bg-white"
                        />
                      ) : (
                        <span className={!norm.imo_number ? "text-rose-500 font-bold" : "text-slate-800"}>
                          {norm.imo_number || "—"}
                        </span>
                      )}
                    </td>

                    {/* Arrival Time */}
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.arrival_time || ""}
                          onChange={(e) => setEditForm({ ...editForm, arrival_time: e.target.value })}
                          className="w-32 text-xs px-2 py-1 border rounded bg-white"
                        />
                      ) : (
                        <span>{norm.arrival_time || "—"}</span>
                      )}
                    </td>

                    {/* Berth Code */}
                    <td className="py-2.5 px-3 font-medium text-portos-navy">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.berth_code || ""}
                          onChange={(e) => setEditForm({ ...editForm, berth_code: e.target.value })}
                          className="w-20 text-xs px-2 py-1 border rounded bg-white uppercase"
                        />
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px]">
                          {norm.berth_code || "—"}
                        </span>
                      )}
                    </td>

                    {/* Draft (m) */}
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.draft_m || ""}
                          onChange={(e) => setEditForm({ ...editForm, draft_m: e.target.value })}
                          className="w-16 text-xs px-2 py-1 border rounded bg-white"
                        />
                      ) : (
                        <span>{norm.draft_m ? `${norm.draft_m}m` : "—"}</span>
                      )}
                    </td>

                    {/* TEU */}
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editForm.teu || ""}
                          onChange={(e) => setEditForm({ ...editForm, teu: e.target.value })}
                          className="w-20 text-xs px-2 py-1 border rounded bg-white"
                        />
                      ) : (
                        <span>{norm.teu ? Number(norm.teu).toLocaleString() : "—"}</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      {isEditing ? (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => saveEdit(rec.id)}
                            className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Save corrections"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                            title="Cancel edit"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => startEdit(rec)}
                            className="p-1 rounded text-slate-500 hover:text-portos-navy hover:bg-slate-100"
                            title="Edit row candidate values"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toggleAcceptance(rec)}
                            className={`p-1 rounded text-xs font-medium ${
                              rec.is_accepted
                                ? "text-slate-400 hover:text-rose-600"
                                : "text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={rec.is_accepted ? "Reject row" : "Accept row"}
                          >
                            {rec.is_accepted ? "Reject" : "Accept"}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 border-t border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs">
          <ShieldCheck className="h-4 w-4 text-portos-teal" />
          <span className="text-slate-700">
            <strong>{acceptedCount}</strong> records approved, <strong>{rejectedCount}</strong> marked for rejection.
          </span>
        </div>

        <button
          onClick={onOpenCommitModal}
          disabled={acceptedCount === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-portos-navy hover:bg-portos-navy-secondary rounded-md shadow-xs disabled:opacity-50 transition-colors"
        >
          <span>Confirm & Ingest Selected ({acceptedCount})</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

