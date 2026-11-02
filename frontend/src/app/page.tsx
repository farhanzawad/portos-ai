import React from "react";
import { KPICard } from "@/components/ui/KPICard";
import { AlertRow } from "@/components/ui/AlertRow";
import { PageSection } from "@/components/ui/PageSection";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { BackendConnectionCard } from "@/components/status/BackendConnectionCard";
import {
  Ship,
  Anchor,
  Clock,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-portos-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
              Port Operations Overview
            </h1>
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
          <p className="text-xs text-portos-muted mt-0.5">
            Real-time status across outer anchorage queues, berth lanes, yard blocks, and simulated disruption events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/digital-twin"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-portos-navy text-white hover:bg-portos-navy-secondary transition-colors"
          >
            <span>Launch Digital Twin</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Vessels in System"
          value={12}
          unit="vessels"
          subtitle="4 at berth · 8 in approach queue"
          dataStatus="SIMULATED"
          icon={Ship}
          trend={{ value: "2 arrivals today", positive: true }}
        />
        <KPICard
          label="Berth Occupancy"
          value="66.7"
          unit="%"
          subtitle="4 of 6 berths occupied"
          dataStatus="SIMULATED"
          icon={Anchor}
          trend={{ value: "Optimal capacity", positive: true }}
        />
        <KPICard
          label="Mean Anchorage Waiting"
          value="14.2"
          unit="hrs"
          subtitle="Feeder queue average delay"
          dataStatus="FORECAST"
          icon={Clock}
          trend={{ value: "+2.1 hrs vs baseline", positive: false }}
        />
        <KPICard
          label="Active Disruption Alerts"
          value={3}
          unit="alerts"
          subtitle="1 high risk · 2 watch"
          dataStatus="SIMULATED"
          icon={AlertTriangle}
        />
      </div>

      {/* Main Two-Column Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Recent Operations Alerts & Milestone Architecture */}
        <div className="lg:col-span-7 space-y-6">
          <PageSection
            title="Operational Alerts & Disruption Timeline"
            subtitle="Recent simulated alerts requiring operational planner attention"
            badge={<DataStatusBadge status="SIMULATED" size="sm" />}
            actions={
              <Link
                href="/scenario-lab"
                className="text-xs font-medium text-portos-navy hover:text-portos-teal transition-colors"
              >
                Open Scenario Lab →
              </Link>
            }
          >
            <div className="space-y-2.5">
              <AlertRow
                severity="critical"
                title="Delay Risk: MV Karnaphuli Feeder"
                description="Simulated engine derating injected. Predicted outer anchorage arrival delayed by +4.2 hours; potential pilotage window miss."
                timestamp="16:42 BST"
                source="ML Delay Classifier"
                dataStatus="FORECAST"
                actionLabel="Inspect"
              />
              <AlertRow
                severity="warning"
                title="Crane Maintenance: STS-02 Gantry Offline"
                description="STS Crane 02 trolley sensor warning. Service rate reduced by 35% on Berth B-02 until 21:00 BST."
                timestamp="15:30 BST"
                source="Equipment Telemetry"
                dataStatus="SIMULATED"
                actionLabel="View Berth"
              />
              <AlertRow
                severity="normal"
                title="Berth Plan Feasibility Verified"
                description="OR-Tools CP-SAT generated conflict-free 48h schedule satisfying draft limits and vessel LOA boundaries."
                timestamp="14:15 BST"
                source="OR-Tools Optimizer"
                dataStatus="DERIVED"
                actionLabel="Review Plan"
              />
            </div>
          </PageSection>

          <PageSection
            title="System Capabilities & Milestone Progression"
            subtitle="Verified architectural foundations and upcoming analytical modules"
          >
            <div className="rounded border border-portos-border bg-portos-surface p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-portos-navy">
                <ShieldCheck className="h-4 w-4 text-portos-teal" />
                <span>Minimal Industrial Futurism Architecture</span>
              </div>
              <p className="text-xs text-portos-muted leading-relaxed">
                PORTOS AI operates with complete data transparency and operational guardrails. All demo records carry standardized 5-tier status labels, while optimization and simulation are partitioned into deterministic solvers (OR-Tools & SimPy).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-portos-navy font-mono">
                <div className="p-2 rounded bg-portos-bg border border-portos-border text-center">
                  <span className="text-[10px] text-portos-muted block">FRONTEND</span>
                  Next.js 14 / TS
                </div>
                <div className="p-2 rounded bg-portos-bg border border-portos-border text-center">
                  <span className="text-[10px] text-portos-muted block">BACKEND</span>
                  FastAPI / Py3.12
                </div>
                <div className="p-2 rounded bg-portos-bg border border-portos-border text-center">
                  <span className="text-[10px] text-portos-muted block">DATABASE</span>
                  PostgreSQL / PostGIS
                </div>
                <div className="p-2 rounded bg-portos-bg border border-portos-border text-center">
                  <span className="text-[10px] text-portos-muted block">APPLICATION AI</span>
                  Google GenAI SDK
                </div>
              </div>
            </div>
          </PageSection>
        </div>

        {/* Right Column: Backend Service Connection & Quick Links */}
        <div className="lg:col-span-5 space-y-6">
          <PageSection
            title="Service Layer Health"
            subtitle="FastAPI backend connectivity and demo mode telemetry"
          >
            <BackendConnectionCard />
          </PageSection>

          <div className="rounded border border-portos-border bg-portos-surface p-4 shadow-sm space-y-3">
            <h4 className="text-xs font-semibold text-portos-navy uppercase tracking-wide flex items-center gap-2">
              <Layers className="h-4 w-4 text-portos-navy-secondary" />
              Quick Module Navigation
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link
                href="/digital-twin"
                className="p-2.5 rounded border border-portos-border hover:border-portos-teal hover:bg-portos-teal-light/30 transition-all text-portos-navy font-medium"
              >
                Digital Twin
                <span className="block text-[10px] text-portos-muted font-normal">3D/2D Spatial View</span>
              </Link>
              <Link
                href="/vessels"
                className="p-2.5 rounded border border-portos-border hover:border-portos-teal hover:bg-portos-teal-light/30 transition-all text-portos-navy font-medium"
              >
                Vessel Intelligence
                <span className="block text-[10px] text-portos-muted font-normal">Track & ETA ML</span>
              </Link>
              <Link
                href="/berth-planner"
                className="p-2.5 rounded border border-portos-border hover:border-portos-teal hover:bg-portos-teal-light/30 transition-all text-portos-navy font-medium"
              >
                Berth Planner
                <span className="block text-[10px] text-portos-muted font-normal">OR-Tools Optimizer</span>
              </Link>
              <Link
                href="/scenario-lab"
                className="p-2.5 rounded border border-portos-border hover:border-portos-teal hover:bg-portos-teal-light/30 transition-all text-portos-navy font-medium"
              >
                Scenario Lab
                <span className="block text-[10px] text-portos-muted font-normal">SimPy Decision Lab</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
