import React from "react";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";

export default function DataCentrePage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Port Data Bridge & Data Centre
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          Public and user report ingestion (CSV, XLSX, PDF) with full provenance tracking.
        </p>
      </div>

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
    </div>
  );
}

