"use client";

import React, { useState } from "react";
import { KPICard } from "@/components/ui/KPICard";
import { DataStatusBadge, DataStatus } from "@/components/ui/DataStatusBadge";
import { StatusBadge, OperationalStatus } from "@/components/ui/StatusBadge";
import { AlertRow } from "@/components/ui/AlertRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton, TableRowSkeleton } from "@/components/ui/LoadingSkeleton";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { PageSection } from "@/components/ui/PageSection";
import {
  Ship,
  Anchor,
  Clock,
  Layers,
  Palette,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

export default function DesignSystemPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogResult, setDialogResult] = useState<string | null>(null);

  const colors = [
    { name: "Navy (Primary)", hex: "#102A43", token: "portos-navy", bg: "bg-portos-navy", text: "text-white" },
    { name: "Secondary Navy", hex: "#1E4967", token: "portos-navy-secondary", bg: "bg-portos-navy-secondary", text: "text-white" },
    { name: "Muted Teal", hex: "#16A394", token: "portos-teal", bg: "bg-portos-teal", text: "text-white" },
    { name: "Warm Amber", hex: "#E5A23B", token: "portos-amber", bg: "bg-portos-amber", text: "text-portos-navy" },
    { name: "Restrained Red", hex: "#D95454", token: "portos-red", bg: "bg-portos-red", text: "text-white" },
    { name: "Twin Canvas", hex: "#132B3F", token: "portos-canvas", bg: "bg-portos-canvas", text: "text-white" },
    { name: "Main Background", hex: "#F4F6F8", token: "portos-bg", bg: "bg-portos-bg", text: "text-portos-navy" },
    { name: "Surface White", hex: "#FFFFFF", token: "portos-surface", bg: "bg-white", text: "text-portos-navy", border: true },
    { name: "Muted Text", hex: "#667085", token: "portos-muted", bg: "bg-portos-muted", text: "text-white" },
    { name: "Border Color", hex: "#DCE3EA", token: "portos-border", bg: "bg-portos-border", text: "text-portos-navy" },
  ];

  const dataStatuses: DataStatus[] = ["SIMULATED", "OBSERVED", "FORECAST", "DERIVED", "UNAVAILABLE"];
  const operationalStatuses: { status: OperationalStatus; label: string }[] = [
    { status: "normal", label: "Berth Clear" },
    { status: "watch", label: "Occupancy High" },
    { status: "danger", label: "Delay Critical" },
    { status: "info", label: "In Transit" },
    { status: "neutral", label: "Scheduled" },
  ];

  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 space-y-6 max-w-6xl text-[#e2e2e8]">
      {/* Header */}
      <div className="pb-4 border-b border-portos-border">
        <div className="flex items-center gap-2">
          <Palette className="h-6 w-6 text-portos-teal" />
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
            Design System & Component Gallery
          </h1>
        </div>
        <p className="text-xs text-portos-muted mt-0.5">
          Design direction: <strong>Minimal Industrial Futurism</strong>. Centralized color tokens, typography scales, data badges, and state patterns.
        </p>
      </div>

      {/* 1. Color Palette Tokens */}
      <PageSection
        title="1. Core Color Palette Tokens"
        subtitle="Standardized maritime palette. No neon gradients or unapproved saturated tones."
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {colors.map((c) => (
            <div
              key={c.hex}
              className={`rounded border ${c.border ? "border-portos-border" : "border-transparent"} p-3 shadow-xs space-y-2 bg-portos-surface`}
            >
              <div className={`h-12 w-full rounded ${c.bg} flex items-end p-1.5`}>
                <span className={`text-[10px] font-mono font-bold ${c.text}`}>{c.hex}</span>
              </div>
              <div>
                <span className="text-xs font-semibold text-portos-navy block">{c.name}</span>
                <span className="text-[10px] font-mono text-portos-muted block">{c.token}</span>
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* 2. Standard Data-Status Badges */}
      <PageSection
        title="2. 5-Tier Data Status Badges"
        subtitle="Mandatory classification tags ensuring complete operational truthfulness across all views."
      >
        <div className="rounded border border-portos-border bg-portos-surface p-4 shadow-sm flex flex-wrap gap-4 items-center">
          {dataStatuses.map((st) => (
            <div key={st} className="flex items-center gap-2">
              <DataStatusBadge status={st} size="md" />
            </div>
          ))}
        </div>
      </PageSection>

      {/* 3. Operational State Badges */}
      <PageSection
        title="3. Operational State Badges"
        subtitle="Standard badges for terminal equipment, vessel states, and alert levels."
      >
        <div className="rounded border border-portos-border bg-portos-surface p-4 shadow-sm flex flex-wrap gap-3 items-center">
          {operationalStatuses.map((os) => (
            <StatusBadge key={os.status} status={os.status} label={os.label} size="sm" />
          ))}
        </div>
      </PageSection>

      {/* 4. Metric & KPI Cards */}
      <PageSection
        title="4. Metric & KPI Cards"
        subtitle="Tabular figures, trend tracking, and integrated data classification."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            label="Outer Anchorage Queue"
            value="8"
            unit="vessels"
            subtitle="Queue depth over 72h horizon"
            dataStatus="SIMULATED"
            icon={Ship}
            trend={{ value: "+2 vessels", positive: false, label: "vs baseline" }}
          />
          <KPICard
            label="Berth Efficiency"
            value="94.2"
            unit="%"
            subtitle="STS Crane utilization"
            dataStatus="DERIVED"
            icon={Anchor}
            trend={{ value: "High productivity", positive: true }}
          />
          <CardSkeleton />
        </div>
      </PageSection>

      {/* 5. Alert Rows */}
      <PageSection
        title="5. Operational Alert Rows"
        subtitle="Timestamped operational disruption messages with source tags and actions."
      >
        <div className="space-y-2">
          <AlertRow
            severity="critical"
            title="Outer Anchorage Delay Shock"
            description="Feeder vessel MV-005 reported speed loss. Predicted delay +5.1 hours exceeds Karnaphuli high water window."
            timestamp="18:30 BST"
            source="ML ETA Regressor"
            dataStatus="FORECAST"
            actionLabel="Inspect Vessel"
            onAction={() => alert("Action triggered: Inspect Vessel")}
          />
          <AlertRow
            severity="warning"
            title="Yard Block YB-04 High Density"
            description="Occupancy reached 88% capacity. Exceeds warning threshold of 85%."
            timestamp="17:45 BST"
            source="Yard Telemetry"
            dataStatus="SIMULATED"
            actionLabel="View Heatmap"
            onAction={() => alert("Action triggered: View Heatmap")}
          />
          <AlertRow
            severity="normal"
            title="Berth B-01 Operation Concluded"
            description="Discharge finished 25 minutes ahead of schedule. Berth ready for pilotage inbound."
            timestamp="16:00 BST"
            source="TOS Simulator"
            dataStatus="SIMULATED"
          />
        </div>
      </PageSection>

      {/* 6. Lifecycle States: Empty & Error States */}
      <PageSection
        title="6. Empty & Error State Handling"
        subtitle="Resilient fallback designs for missing feeds or failed network queries."
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            title="No Active Disruption Scenarios"
            description="The current operational schedule is running under baseline parameters without injected disruption events."
            icon={Layers}
            actionLabel="Configure Scenario"
            onAction={() => alert("Navigate to Scenario Lab")}
          />
          <ErrorState
            title="AIS Telemetry Stream Disconnected"
            message="Could not reach the simulated position feed. Verify backend event broker status."
            technicalDetails="ConnectionRefusedError: [Errno 111] Connection refused at ws://localhost:8000/api/v1/stream"
            onRetry={() => alert("Retrying connection...")}
          />
        </div>
      </PageSection>

      {/* 7. Accessible Confirmation Modal */}
      <PageSection
        title="7. Accessible Confirmation Dialog"
        subtitle="Used for human-in-the-loop review before accepting optimizer or simulation proposals."
      >
        <div className="rounded border border-portos-border bg-portos-surface p-4 shadow-sm flex items-center justify-between">
          <div>
            <h4 className="text-xs font-semibold text-portos-navy">Test Modal Dialog Workflow</h4>
            <p className="text-xs text-portos-muted">
              Trigger the proposal confirmation modal with accessible keyboard and backdrop dismissal.
            </p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="px-3 py-1.5 text-xs font-medium bg-portos-navy text-white rounded hover:bg-portos-navy-secondary transition-colors"
          >
            Open Proposal Dialog
          </button>
        </div>

        {dialogResult && (
          <div className="mt-2 text-xs font-mono text-portos-teal-dark bg-portos-teal-light p-2 rounded border border-portos-teal/30">
            {dialogResult}
          </div>
        )}

        <ConfirmationDialog
          isOpen={dialogOpen}
          title="Approve Advisory Berth Schedule Proposal"
          description="You are reviewing a proposed schedule change generated by Google OR-Tools CP-SAT. This will shift MV-002 from Berth B-01 to Berth B-03 to resolve an arrival delay conflict."
          confirmLabel="Record Approval"
          cancelLabel="Reject Proposal"
          onConfirm={() => {
            setDialogResult("Proposal approved and recorded in audit log at " + new Date().toLocaleTimeString());
            setDialogOpen(false);
          }}
          onCancel={() => {
            setDialogResult("Proposal cancelled by operator.");
            setDialogOpen(false);
          }}
        />
      </PageSection>
    </div>
  );
}

