"use client";

import React, { useState } from "react";
import { ModelCentreView } from "@/components/models/ModelCentreView";
import { PortDataBridgeView } from "@/components/ingestion/PortDataBridgeView";
import { GovtDataCentreView } from "@/components/gov/GovtDataCentreView";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { BrainCircuit, UploadCloud, ShieldCheck } from "lucide-react";

export default function DataCentrePage() {
  const [activeTab, setActiveTab] = useState<"models" | "ingestion" | "gov">("models");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Model Centre & Data Management
            </h1>
            <DataStatusBadge status={activeTab === "gov" ? "OBSERVED" : "SIMULATED"} />
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Predictive machine learning pipeline registry, official Bangladesh Government datasets, and port data ingestion.
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

          <button
            onClick={() => setActiveTab("gov")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-colors ${
              activeTab === "gov"
                ? "bg-white text-portos-navy font-bold shadow-xs"
                : "text-portos-muted hover:text-portos-navy"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Official Govt Data (CPA/BMD)</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Model Centre & Predictive Pipeline Evaluation */}
      {activeTab === "models" && <ModelCentreView />}

      {/* Tab 2: Milestone 13 Document Ingestion & Port Data Bridge */}
      {activeTab === "ingestion" && <PortDataBridgeView />}

      {/* Tab 3: Official Bangladesh Government & CPA Reference Data */}
      {activeTab === "gov" && <GovtDataCentreView />}
    </div>
  );
}
