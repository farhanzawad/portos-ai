"use client";

import React, { useState } from "react";
import { ExecutiveTopNav } from "@/components/cockpit/ExecutiveTopNav";
import { ExecutiveSubheader } from "@/components/cockpit/ExecutiveSubheader";
import { ExecutiveKpiStrip } from "@/components/cockpit/ExecutiveKpiStrip";
import { BerthAllocationMatrix } from "@/components/cockpit/BerthAllocationMatrix";
import { ActiveIngressQueueTable } from "@/components/cockpit/ActiveIngressQueueTable";
import { FairwayRadarCard } from "@/components/cockpit/FairwayRadarCard";
import { YardSaturationCard } from "@/components/cockpit/YardSaturationCard";
import { OperationalAIAdvisoryCard } from "@/components/cockpit/OperationalAIAdvisoryCard";
import { ExecutiveFooter } from "@/components/cockpit/ExecutiveFooter";
import { ExecutiveSitrepModal } from "@/components/cockpit/ExecutiveSitrepModal";

export default function OverviewPage() {
  const [isSitrepOpen, setIsSitrepOpen] = useState(false);

  return (
    <>
      {/* 1. Top Executive Navigation Bar */}
      <ExecutiveTopNav />

      {/* 2. Horizon / Page Subheader */}
      <ExecutiveSubheader onExportSitrep={() => setIsSitrepOpen(true)} />

      {/* 3. Main Content Area */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
        {/* Row 1: 4 Top KPI Cards */}
        <ExecutiveKpiStrip />

        {/* Row 2: 68% / 32% (8 Cols / 4 Cols) Main Operational Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* LEFT COLUMN (Operational Core): 8 Cols */}
          <div className="xl:col-span-8 space-y-6 sm:space-y-8">
            {/* Component A: Berth Allocation & Tidal Horizon Matrix */}
            <BerthAllocationMatrix />

            {/* Component B: Ingress & Pilot Queue Management Table */}
            <ActiveIngressQueueTable />
          </div>

          {/* RIGHT COLUMN (Situational Awareness & Advisory): 4 Cols */}
          <div className="xl:col-span-4 space-y-6 sm:space-y-8">
            {/* Component C: Fairway Navigation & Corridor Radar */}
            <FairwayRadarCard />

            {/* Component D: Yard Saturation & Dwell Index */}
            <YardSaturationCard />

            {/* Component E: Operational AI Advisory (Gemini Copilot) */}
            <OperationalAIAdvisoryCard />
          </div>
        </div>
      </main>

      {/* 4. Clean Bottom Status Bar */}
      <ExecutiveFooter />

      {/* 5. SITREP Export Modal */}
      <ExecutiveSitrepModal
        isOpen={isSitrepOpen}
        onClose={() => setIsSitrepOpen(false)}
      />
    </>
  );
}
