"use client";

import React, { useState } from "react";
import { ModelCentreView } from "@/components/models/ModelCentreView";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { BrainCircuit, UploadCloud, Database } from "lucide-react";

export default function DataCentrePage() {
  const [activeTab, setActiveTab] = useState<"models" | "ingestion">("models");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Model Centre & Data Management
            </h1>
            <DataStatusBadge status="SIMULATED" />
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Predictive machine learning pipeline registry, evaluation metrics, and port data ingestion.
          </p>
        </div>

        {/* Tab Switcher Controls */}
        <div className="flex items-center bg-portos-bg p-1 rounded-lg border border-portos-border text-xs font-medium">
          <button
            onClick={() => setActiveTab("models")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === "models"
                ? "bg-white text-portos-navy font-bold shadow-xs"
                : "text-portos-muted hover:text-portos-navy"
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-portos-teal" />
            <span>Model Centre (M08)</span>
          </button>

          <button
            onClick={() => setActiveTab("ingestion")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === "ingestion"
                ? "bg-white text-portos-navy font-bold shadow-xs"
                : "text-portos-muted hover:text-portos-navy"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5 text-portos-navy-secondary" />
            <span>Data Ingestion (M13)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Model Centre & Predictive Pipeline Evaluation */}
      {activeTab === "models" && <ModelCentreView />}

      {/* Tab 2: Milestone 13 Document Ingestion Placeholder */}
      {activeTab === "ingestion" && (
        <MilestonePlaceholder
          moduleName="Data Centre"
          milestoneNumber="Milestone 13"
          milestoneTitle="Port Data Bridge & Document Ingestion Pipeline"
          description="A secure document ingestion pipeline enabling port planners to import spreadsheets and public reports. Features text-based PDF extraction via pypdf, candidate column mapping, human-in-the-loop preview, and automatic provenance stamping."
          plannedFeatures={[
            "Secure upload interface supporting CSV, XLSX, and text-based PDFs (via pypdf)",
            "Human-in-the-loop candidate column mapping and unit normalization review",
            "Hardened security: directory traversal mitigation, file size caps, formula injection defense",
            "Full provenance recording: source checksum, reporting timeframe, and ingestion timestamp",
            "Clear refusal handling for scanned image PDFs requiring future OCR",
          ]}
          prerequisites={[
            "Milestone 03: DataSource, ImportedDataset, and ImportedRecord database schema",
            "Milestone 04: Upload staging and data normalization backend services",
            "Milestone 13: File parsing and column mapping review interfaces",
          ]}
        />
      )}
    </div>
  );
}
