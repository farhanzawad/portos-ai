"use client";

import React, { useState, useRef } from "react";
import { uploadDocument, getDownloadCsvTemplateUrl, getDownloadXlsxTemplateUrl } from "@/lib/api-client";
import { DocumentUploadResponse } from "@/types/api";
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Layers,
  Sparkles,
  Lock,
} from "lucide-react";

interface DocumentUploadCardProps {
  onUploadSuccess: (response: DocumentUploadResponse) => void;
}

const SYNTHETIC_SAMPLE_CSV = `vessel_name,imo_number,arrival_time,berth_code,draft_m,teu,length_overall_m,cargo_type
MV Karnaphuli Pioneer,9381024,2026-11-04 08:00,CCT-1,8.5,1450,172.0,Containerized Feeder
MV Bay Bengal,9412035,2026-11-04 14:30,CCT-2,9.1,1820,185.5,Containerized Feeder
MV Padma Express,9495018,2026-11-05 06:15,NCT-1,8.2,1200,165.0,Containerized Feeder
MV Meghna Star,9501122,2026-11-05 18:00,NCT-2,9.4,1950,188.0,Containerized Feeder
MV Surma Voyager,9399871,2026-11-06 07:45,CCT-3,8.0,1100,160.0,Containerized Feeder`;

export function DocumentUploadCard({ onUploadSuccess }: DocumentUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Client-side extension validation
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".csv") && !lowerName.endsWith(".xlsx") && !lowerName.endsWith(".pdf")) {
      setErrorMessage("Unsupported file type. Please upload a .CSV, .XLSX, or .PDF document.");
      return;
    }

    // Client-side size validation (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds 10 MB maximum upload limit.");
      return;
    }

    setIsUploading(true);
    try {
      const response = await uploadDocument(file);
      onUploadSuccess(response);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload and parse document.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSyntheticSample = async () => {
    const blob = new Blob([SYNTHETIC_SAMPLE_CSV], { type: "text/csv" });
    const file = new File([blob], "synthetic_chattogram_berthing_log.csv", { type: "text/csv" });
    await handleFile(file);
  };

  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden flex flex-col">
      {/* Card Header */}
      <div className="p-4 bg-slate-50 border-b border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="h-4 w-4 text-portos-navy" />
            <h2 className="text-sm font-bold text-portos-navy">
              Port Data Bridge — Secure Document Ingestion
            </h2>
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Stage public schedules or agent manifests with automatic provenance, hygiene validation, and human review.
          </p>
        </div>

        {/* Action Controls & Synthetic Sample Button */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleLoadSyntheticSample}
            disabled={isUploading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-portos-teal bg-portos-teal/10 hover:bg-portos-teal/20 border border-portos-teal/30 rounded-md transition-colors"
            title="Load synthetic test berthing schedule"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Load Synthetic Sample</span>
          </button>
        </div>
      </div>

      {/* Upload Zone */}
      <div className="p-6">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
            isDragging
              ? "border-portos-teal bg-portos-teal/5 scale-[1.005]"
              : "border-slate-300 hover:border-portos-teal/60 hover:bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFile(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          <div className="p-3 rounded-full bg-slate-100 text-portos-navy mb-3">
            {isUploading ? (
              <div className="h-6 w-6 border-2 border-portos-teal border-t-transparent rounded-full animate-spin" />
            ) : (
              <UploadCloud className="h-6 w-6 text-portos-teal" />
            )}
          </div>

          <p className="text-sm font-semibold text-portos-navy">
            {isUploading ? "Staging and parsing document..." : "Click to select or drag and drop document"}
          </p>
          <p className="text-xs text-portos-muted mt-1">
            Supported formats: <strong className="text-slate-700">CSV</strong>, <strong className="text-slate-700">XLSX</strong>, or <strong className="text-slate-700">Searchable PDF</strong> (Max 10 MB)
          </p>

          {/* Security & Pipeline Feature Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-slate-600">
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <Shield className="h-3 w-3 text-portos-teal" />
              SHA-256 Checksum Stamped
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <Lock className="h-3 w-3 text-emerald-600" />
              Formula Injection Sanitized
            </span>
            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              <Layers className="h-3 w-3 text-sky-600" />
              Human-in-the-Loop Review
            </span>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-800 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <strong className="font-semibold block">Upload Failed:</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Templates Bar */}
        <div className="mt-6 pt-4 border-t border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-portos-muted">
          <div className="flex items-center gap-1.5">
            <FileSpreadsheet className="h-4 w-4 text-portos-muted" />
            <span>Need a standardized template?</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={getDownloadCsvTemplateUrl()}
              download
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-portos-navy rounded border border-portos-border transition-colors"
            >
              <Download className="h-3 w-3 text-slate-500" />
              <span>CSV Template</span>
            </a>
            <a
              href={getDownloadXlsxTemplateUrl()}
              download
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-portos-navy rounded border border-portos-border transition-colors"
            >
              <Download className="h-3 w-3 text-slate-500" />
              <span>XLSX Template</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

