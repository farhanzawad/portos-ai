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
    <div className="flex-1 p-4 sm:p-5 lg:p-6 space-y-4 bg-[#0a0c10] text-[#e2e2e8] font-sans">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Model Centre &amp; Data Management
            </h1>
            <DataStatusBadge status={activeTab === "gov" ? "OBSERVED" : "SIMULATED"} />
          </div>
          <p className="text-xs text-[#8e9bae] mt-0.5">
            Predictive machine learning pipeline registry, official Bangladesh Government datasets, and port data ingestion.
          </p>
        </div>

        {/* Tab Switcher Controls */}
        <div className="flex items-center bg-[#181c24] p-1 rounded-xl border border-white/[0.08] text-xs font-medium">
          <button
            onClick={() => setActiveTab("models")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "models"
                ? "bg-[#222734] text-white font-bold shadow-xs border border-white/10"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            <BrainCircuit className="h-3.5 w-3.5 text-secondary" />
            <span>Model Centre (M08)</span>
          </button>

          <button
            onClick={() => setActiveTab("ingestion")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "ingestion"
                ? "bg-[#222734] text-white font-bold shadow-xs border border-white/10"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            <UploadCloud className="h-3.5 w-3.5 text-[#ffb5a0]" />
            <span>Data Ingestion (M13)</span>
          </button>

          <button
            onClick={() => setActiveTab("gov")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === "gov"
                ? "bg-[#222734] text-white font-bold shadow-xs border border-white/10"
                : "text-[#8e9bae] hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-secondary" />
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
