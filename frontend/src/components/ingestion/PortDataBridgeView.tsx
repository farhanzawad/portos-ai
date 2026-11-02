"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listDatasets,
  getDataset,
  correctRecord,
  commitDataset,
  listDataSources,
} from "@/lib/api-client";
import {
  DocumentUploadResponse,
  ImportedDatasetRead,
  ImportSummaryReport,
} from "@/types/api";
import { DocumentUploadCard } from "@/components/ingestion/DocumentUploadCard";
import { DatasetReviewTable } from "@/components/ingestion/DatasetReviewTable";
import { DatasetCommitModal } from "@/components/ingestion/DatasetCommitModal";
import { ImportSummaryReportCard } from "@/components/ingestion/ImportSummaryReportCard";
import {
  Database,
  History,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

export function PortDataBridgeView() {
  const queryClient = useQueryClient();
  const [currentUpload, setCurrentUpload] = useState<DocumentUploadResponse | ImportedDatasetRead | null>(null);
  const [committedReport, setCommittedReport] = useState<ImportSummaryReport | null>(null);
  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);

  // Fetch past datasets
  const { data: datasets = [], isLoading: isLoadingDatasets } = useQuery({
    queryKey: ["ingestion-datasets"],
    queryFn: () => listDatasets(15),
  });

  const handleUploadSuccess = (response: DocumentUploadResponse) => {
    setCurrentUpload(response);
    setCommittedReport(null);
    queryClient.invalidateQueries({ queryKey: ["ingestion-datasets"] });
  };

  const handleRecordUpdated = async (
    recordId: string,
    updatedFields: Record<string, any>,
    isAccepted?: boolean,
    rejectionReason?: string
  ) => {
    if (!currentUpload) return;
    const datasetId = "dataset_id" in currentUpload ? currentUpload.dataset_id : currentUpload.id;

    try {
      const updatedRec = await correctRecord(
        datasetId,
        recordId,
        updatedFields,
        isAccepted,
        rejectionReason
      );

      // Update state
      setCurrentUpload((prev: any) => {
        if (!prev) return prev;
        const newRecords = (prev.records || []).map((r: any) =>
          r.id === recordId ? { ...r, ...updatedRec } : r
        );
        return { ...prev, records: newRecords };
      });
    } catch (err) {
      console.error("Failed to correct record:", err);
    }
  };

  const handleCommit = async (reviewerName: string, operatorNotes?: string) => {
    if (!currentUpload) return;
    const datasetId = "dataset_id" in currentUpload ? currentUpload.dataset_id : currentUpload.id;

    const report = await commitDataset(datasetId, reviewerName, operatorNotes);
    setCommittedReport(report);
    setCurrentUpload(null);
    queryClient.invalidateQueries({ queryKey: ["ingestion-datasets"] });
  };

  const handleSelectPastDataset = async (datasetId: string) => {
    try {
      const fullDataset = await getDataset(datasetId);
      setCurrentUpload(fullDataset);
      setCommittedReport(null);
    } catch (err) {
      console.error("Failed to load past dataset:", err);
    }
  };

  const handleResetStaging = () => {
    setCurrentUpload(null);
    setCommittedReport(null);
  };

  return (
    <div className="space-y-6">
      {/* 1. Committed Summary Report */}
      {committedReport && (
        <ImportSummaryReportCard
          report={committedReport}
          onStageAnother={handleResetStaging}
        />
      )}

      {/* 2. Review Table (if file staged) */}
      {!committedReport && currentUpload && (
        <DatasetReviewTable
          dataset={currentUpload}
          onRecordUpdated={handleRecordUpdated}
          onOpenCommitModal={() => setIsCommitModalOpen(true)}
          onResetStaging={handleResetStaging}
        />
      )}

      {/* 3. Upload Staging Card (if nothing currently staged or after reset) */}
      {!committedReport && !currentUpload && (
        <DocumentUploadCard onUploadSuccess={handleUploadSuccess} />
      )}

      {/* 4. Human-in-the-loop Commit Modal */}
      {currentUpload && (
        <DatasetCommitModal
          isOpen={isCommitModalOpen}
          onClose={() => setIsCommitModalOpen(false)}
          onConfirm={handleCommit}
          acceptedCount={(currentUpload.records || []).filter((r) => r.is_accepted).length}
          rejectedCount={(currentUpload.records || []).filter((r) => !r.is_accepted).length}
          fileName={"file_name" in currentUpload ? currentUpload.file_name : "Uploaded Document"}
        />
      )}

      {/* 5. Ingestion History & Provenance Registry */}
      <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden flex flex-col">
        <div className="p-4 bg-slate-50 border-b border-portos-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-portos-navy" />
            <h2 className="text-sm font-bold text-portos-navy">
              Port Data Bridge Audit Trail & Provenance Registry
            </h2>
          </div>
          <span className="text-xs text-portos-muted font-mono">
            {datasets.length} historical ingestion batches
          </span>
        </div>

        <div className="divide-y divide-portos-border/70 text-xs">
          {datasets.length === 0 ? (
            <div className="p-8 text-center text-portos-muted italic">
              No previous datasets imported yet. Upload a schedule or load the synthetic sample above.
            </div>
          ) : (
            datasets.map((ds) => (
              <div
                key={ds.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-portos-navy">{ds.file_name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-100 text-slate-800">
                      {ds.file_format}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                        ds.ingestion_status === "VERIFIED"
                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                          : ds.ingestion_status === "PENDING_REVIEW"
                          ? "bg-amber-50 text-amber-800 border-amber-200"
                          : "bg-rose-50 text-rose-800 border-rose-200"
                      }`}
                    >
                      {ds.ingestion_status}
                    </span>
                    <DataStatusBadge status={ds.data_status} />
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-portos-muted font-mono">
                    <span>SHA-256: {ds.file_sha256.slice(0, 12)}...</span>
                    <span>•</span>
                    <span>{ds.record_count} extracted rows</span>
                    <span>•</span>
                    <span>{new Date(ds.uploaded_at).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleSelectPastDataset(ds.id)}
                  className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-portos-teal hover:text-teal-800 bg-portos-teal/10 hover:bg-portos-teal/20 rounded border border-portos-teal/30 transition-colors self-start sm:self-auto"
                >
                  <span>Inspect Audit Records</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

