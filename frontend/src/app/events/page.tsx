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
    <div className="space-y-4">
      {/* Page Title & Live Stream Status */}
      <div className="pb-3 border-b border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
            Event Stream & Workflow Sync
          </h1>
          <p className="text-xs text-portos-muted mt-0.5">
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

