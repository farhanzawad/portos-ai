"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getVesselCalls } from "@/lib/api-client";
import { VesselCallRead } from "@/types/api";
import { FairwayHeader } from "@/components/vessels/FairwayHeader";
import { EcdisRadarCanvasCard } from "@/components/vessels/EcdisRadarCanvasCard";
import { FairwayKpiStrip } from "@/components/vessels/FairwayKpiStrip";
import { ActiveFairwayTrafficCard } from "@/components/vessels/ActiveFairwayTrafficCard";
import { PilotageTugDossierCard } from "@/components/vessels/PilotageTugDossierCard";
import { FairwayFooterStatusBar } from "@/components/vessels/FairwayFooterStatusBar";
import { AISDiagnosticsModal } from "@/components/vessels/AISDiagnosticsModal";
import { VesselDetailDrawer } from "@/components/vessels/VesselDetailDrawer";

export default function VesselsPage() {
  const [selectedVesselName, setSelectedVesselName] = useState<string>("MV OOCL Singapore");
  const [isAISModalOpen, setIsAISModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCall, setSelectedCall] = useState<VesselCallRead | null>(null);

  // Fetch real vessel calls from API backend
  const { data: callsResponse } = useQuery({
    queryKey: ["vessel-calls-vts"],
    queryFn: () => getVesselCalls({ pageSize: 30 }),
  });

  const calls = callsResponse?.items || [];

  const handleSelectVessel = (name: string) => {
    setSelectedVesselName(name);
    if (calls.length > 0) {
      setSelectedCall(calls[0]);
      setIsDrawerOpen(true);
    }
  };

  const handleBroadcastNotice = () => {
    alert("Fairway Notice: Karnaphuli Ebb Stream 2.8 kts active. Deep-draft traffic clear to Gupta Cut.");
  };

  const handleDirectTug = () => {
    alert("Tug PB-02 'Meghna Guard' dispatched to escort standby position at Gupta Bend.");
  };

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 space-y-4 bg-[#0a0c10] text-[#e2e2e8] font-sans select-none">
      {/* 1. Sector Charlie-3 Fairway Navigation Header */}
      <FairwayHeader
        onBroadcastNotice={handleBroadcastNotice}
        onExportS57={() => alert("Exporting S-57 ECDIS Vector layer...")}
        aisLatency="1.2s"
        nextHwCrest="+3.84m at 14:40 BST"
        ukcMargin="+0.60m Safe"
      />

      {/* 2. Main High-Density Radar & Telemetry Split Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: ECDIS Radar Chart Card & KPI Telemetry Strip (7 Cols on LG, 7-8 on XL) */}
        <div className="lg:col-span-7 xl:col-span-7 space-y-4">
          <EcdisRadarCanvasCard
            selectedVessel={selectedVesselName}
            onSelectVessel={handleSelectVessel}
          />

          <FairwayKpiStrip
            inTransitCount={14}
            inboundQueueDelta={2}
            activePilots="4 / 4"
            pilotCapacityPct={100}
            minSafeUkc="+0.60 m"
            ukcRestrictionZone="Restricted at Gupta Bend"
            channelDepth="10.4 m"
          />
        </div>

        {/* Right Column: Active Traffic List & Pilotage/Tug Dossier (5 Cols on LG, 5 on XL) */}
        <div className="lg:col-span-5 xl:col-span-5 space-y-4">
          <ActiveFairwayTrafficCard
            selectedVessel={selectedVesselName}
            onSelectVessel={handleSelectVessel}
          />

          <PilotageTugDossierCard
            onAssignPilot={() => setIsAISModalOpen(true)}
            onDirectTug={handleDirectTug}
          />
        </div>
      </div>

      {/* 3. Global Synchronized Radar Telemetry Status Bar */}
      <FairwayFooterStatusBar />

      {/* AIS Diagnostics Modal */}
      <AISDiagnosticsModal
        isOpen={isAISModalOpen}
        onClose={() => setIsAISModalOpen(false)}
      />

      {/* Selected Vessel Inspector Drawer */}
      {isDrawerOpen && selectedCall && (
        <VesselDetailDrawer
          call={selectedCall}
          onClose={() => setIsDrawerOpen(false)}
          onOpenAISDiagnostics={() => setIsAISModalOpen(true)}
        />
      )}
    </div>
  );
}
