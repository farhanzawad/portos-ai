import React from "react";
import { EventStreamPill } from "@/components/events/EventStreamPill";
import { IncidentControlBanner } from "@/components/events/IncidentControlBanner";
import { WorkflowProgressionCard } from "@/components/events/WorkflowProgressionCard";
import { EventLogTable } from "@/components/events/EventLogTable";

export const metadata = {
  title: "Unified Event Stream & Workflow Sync | PORTOS AI",
  description:
    "Real-time Server-Sent Events (SSE) bus, deterministic incident injection, and synchronized cross-module operational workflow.",
};

export default function EventsPage() {
  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 space-y-4 bg-[#0a0c10] text-[#e2e2e8] font-sans">
      {/* Page Title & Live Stream Status */}
      <div className="pb-3 border-b border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-wider uppercase text-[#8e9bae] flex items-center gap-2 mb-1">
            <span>PORT OPERATIONS</span>
            <span>•</span>
            <span>REAL-TIME SSE BUS</span>
            <span>•</span>
            <span className="text-secondary font-semibold">STATE SYNCHRONIZATION</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Event Stream &amp; Workflow Sync
          </h1>
          <p className="text-xs text-[#8e9bae] mt-0.5">
            Real-time SSE event bus, deterministic incident injection, and cross-module operational state synchronization.
          </p>
        </div>

        <EventStreamPill showDetails />
      </div>

      {/* Incident Controls */}
      <IncidentControlBanner />

      {/* 8-Stage Lifecycle Visualization */}
      <WorkflowProgressionCard />

      {/* Live Event Stream Log */}
      <EventLogTable />
    </div>
  );
}

