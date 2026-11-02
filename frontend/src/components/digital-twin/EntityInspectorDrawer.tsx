"use client";

import React from "react";
import Link from "next/link";
import { SelectedEntity } from "./types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  X,
  Ship,
  Anchor,
  Cpu,
  Grid3X3,
  ExternalLink,
  Clock,
  Compass,
  AlertTriangle,
  Activity,
  Layers,
} from "lucide-react";
import {
  BerthRead,
  VesselCallRead,
  EquipmentRead,
  YardBlockRead,
} from "@/types/api";

interface EntityInspectorDrawerProps {
  entity: SelectedEntity | null;
  onClose: () => void;
}

export function EntityInspectorDrawer({
  entity,
  onClose,
}: EntityInspectorDrawerProps) {
  if (!entity) return null;

  return (
    <div className="absolute top-4 right-4 z-20 w-80 sm:w-96 max-h-[calc(100%-2rem)] overflow-y-auto bg-white/95 backdrop-blur-md rounded-lg border border-portos-border shadow-xl text-portos-navy flex flex-col transition-all">
      {/* Drawer Header */}
      <div className="p-4 border-b border-portos-border flex items-center justify-between gap-3 bg-portos-surface">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-portos-navy text-portos-teal">
            {entity.type === "vessel" && <Ship className="h-4 w-4" />}
            {entity.type === "berth" && <Anchor className="h-4 w-4" />}
            {entity.type === "crane" && <Cpu className="h-4 w-4" />}
            {entity.type === "yard" && <Grid3X3 className="h-4 w-4" />}
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-portos-muted font-mono">
              {entity.type.toUpperCase()} INSPECTOR
            </span>
            <h3 className="text-sm font-bold text-portos-navy truncate max-w-[200px]">
              {getEntityTitle(entity)}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-portos-muted hover:text-portos-navy hover:bg-portos-border/50 rounded transition-colors"
          title="Close Inspector"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Body */}
      <div className="p-4 space-y-4 text-xs">
        {/* Status Strip */}
        <div className="flex items-center justify-between gap-2 p-2.5 bg-portos-bg rounded border border-portos-border/60">
          <span className="text-portos-muted font-medium">State & Status:</span>
          <div className="flex items-center gap-2">
            <StatusBadge
              status={getEntityStatusType(entity)}
              label={getEntityStatusLabel(entity)}
              size="sm"
            />
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
        </div>

        {/* Dynamic Detail Sections based on Entity Type */}
        {entity.type === "vessel" && (
          <VesselDetails call={entity.data as VesselCallRead} />
        )}
        {entity.type === "berth" && (
          <BerthDetails berth={entity.data as BerthRead} />
        )}
        {entity.type === "crane" && (
          <CraneDetails crane={entity.data as EquipmentRead} />
        )}
        {entity.type === "yard" && (
          <YardDetails block={entity.data as YardBlockRead} />
        )}

        {/* Provenance & Disclaimer Footer */}
        <div className="p-2.5 bg-portos-teal-light/20 rounded border border-portos-teal/30 text-[11px] text-portos-navy space-y-1">
          <div className="font-semibold flex items-center gap-1.5 text-portos-teal">
            <Layers className="h-3 w-3" />
            <span>Operational Provenance</span>
          </div>
          <p className="text-[10px] text-portos-muted">
            Source: <strong>Illustrative Seed Engine</strong> · Coordinates:{" "}
            <strong>Karnaphuli Channel Datum (CD +0.0m)</strong>. Synthetic data
            for decision evaluation only.
          </p>
        </div>
      </div>
    </div>
  );
}

function getEntityTitle(entity: SelectedEntity): string {
  switch (entity.type) {
    case "vessel": {
      const v = entity.data as VesselCallRead;
      return v.vessel?.name || v.call_number;
    }
    case "berth": {
      const b = entity.data as BerthRead;
      return `${b.code} - ${b.name}`;
    }
    case "crane": {
      const c = entity.data as EquipmentRead;
      return `${c.code} (${c.equipment_type.replace("_", " ")})`;
    }
    case "yard": {
      const y = entity.data as YardBlockRead;
      return `${y.code} · ${y.name}`;
    }
  }
}

function getEntityStatusType(
  entity: SelectedEntity
): "normal" | "watch" | "danger" | "neutral" {
  switch (entity.type) {
    case "vessel": {
      const v = entity.data as VesselCallRead;
      if (v.delay_risk_status === "HIGH_RISK") return "danger";
      if (v.delay_risk_status === "WATCH") return "watch";
      return "normal";
    }
    case "berth": {
      const b = entity.data as BerthRead;
      if (b.status === "OCCUPIED") return "normal";
      if (b.status === "MAINTENANCE") return "watch";
      return "neutral";
    }
    case "crane": {
      const c = entity.data as EquipmentRead;
      if (c.status === "OPERATIONAL") return "normal";
      if (c.status === "DEGRADED") return "watch";
      return "danger";
    }
    case "yard": {
      return "normal";
    }
  }
}

function getEntityStatusLabel(entity: SelectedEntity): string {
  switch (entity.type) {
    case "vessel":
      return (entity.data as VesselCallRead).status.replace("_", " ");
    case "berth":
      return (entity.data as BerthRead).status;
    case "crane":
      return (entity.data as EquipmentRead).status;
    case "yard":
      return `${(entity.data as YardBlockRead).zone} ZONE`;
  }
}

function VesselDetails({ call }: { call: VesselCallRead }) {
  const repDate = new Date(call.reported_eta);
  const predDate = call.predicted_eta ? new Date(call.predicted_eta) : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">IMO Number</span>
          <strong className="font-mono">{call.vessel?.imo_number || "N/A"}</strong>
        </div>
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">Call Sign</span>
          <strong className="font-mono">{call.vessel?.call_sign || "N/A"}</strong>
        </div>
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">Flag State</span>
          <span>{call.vessel?.flag_country || "Bangladesh"}</span>
        </div>
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">Vessel Type</span>
          <span className="truncate block font-mono text-[10px]">
            {call.vessel?.vessel_type || "CONTAINER_FEEDER"}
          </span>
        </div>
      </div>

      {/* Dimensions */}
      <div className="p-2.5 bg-portos-surface rounded border border-portos-border space-y-1.5">
        <span className="text-[10px] font-semibold text-portos-muted tracking-wider uppercase">
          Physical Dimensions
        </span>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Length Overall (LOA):</span>
          <span className="font-mono font-bold tabular-nums">
            {call.vessel?.length_overall_m} m
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Beam:</span>
          <span className="font-mono font-bold tabular-nums">
            {call.vessel?.beam_m} m
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Design Draft:</span>
          <span className="font-mono font-bold tabular-nums text-portos-teal">
            {call.vessel?.max_draft_m} m
          </span>
        </div>
      </div>

      {/* ETA & ML Prediction */}
      <div className="p-2.5 bg-portos-surface rounded border border-portos-border space-y-2">
        <span className="text-[10px] font-semibold text-portos-muted tracking-wider uppercase flex items-center gap-1.5">
          <Clock className="h-3 w-3 text-portos-navy-secondary" />
          ETA & Delay Risk
        </span>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Reported ETA:</span>
          <span className="font-mono tabular-nums">
            {repDate.toLocaleTimeString("en-GB", {
              hour: "2-digit",
              minute: "2-digit",
            })}{" "}
            BST
          </span>
        </div>
        {predDate && (
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-portos-muted">ML Forecast ETA:</span>
            <span className="font-mono font-semibold text-portos-amber tabular-nums">
              {predDate.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              BST
            </span>
          </div>
        )}
        <div className="flex justify-between items-center text-[11px] pt-1 border-t border-portos-border/50">
          <span className="text-portos-muted">Predicted Delay:</span>
          <span
            className={`font-mono font-bold tabular-nums ${
              call.predicted_delay_hours > 2
                ? "text-portos-red"
                : call.predicted_delay_hours > 0
                ? "text-portos-amber"
                : "text-portos-teal"
            }`}
          >
            +{call.predicted_delay_hours} hrs
          </span>
        </div>
      </div>

      <Link
        href="/vessels"
        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-portos-navy text-white text-xs font-medium hover:bg-portos-navy-secondary transition-colors"
      >
        <span>View in Vessel Intelligence</span>
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}

function BerthDetails({ berth }: { berth: BerthRead }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">Quay Length</span>
          <strong className="font-mono text-sm">{berth.length_m} m</strong>
        </div>
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">Draft Depth</span>
          <strong className="font-mono text-sm text-portos-teal">
            {berth.depth_draft_m} m
          </strong>
        </div>
      </div>

      <div className="p-2.5 bg-portos-surface rounded border border-portos-border space-y-1.5">
        <span className="text-[10px] font-semibold text-portos-muted tracking-wider uppercase">
          Operational Limits
        </span>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Max Vessel LOA:</span>
          <span className="font-mono font-bold tabular-nums">
            {berth.max_vessel_loa_m} m
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Operational State:</span>
          <span className="font-semibold text-portos-navy">
            {berth.status === "OCCUPIED"
              ? "Cargo Operations Active"
              : berth.status === "MAINTENANCE"
              ? "Dredging / Maintenance"
              : "Clear & Available"}
          </span>
        </div>
      </div>

      <Link
        href="/berth-planner"
        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-portos-navy text-white text-xs font-medium hover:bg-portos-navy-secondary transition-colors"
      >
        <span>Open in Berth Planner</span>
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}

function CraneDetails({ crane }: { crane: EquipmentRead }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">Rated Moves</span>
          <strong className="font-mono text-sm">
            {crane.rated_moves_per_hour} /hr
          </strong>
        </div>
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">Max Lift</span>
          <strong className="font-mono text-sm">
            {crane.rated_capacity_tonnes} tonnes
          </strong>
        </div>
      </div>

      <div className="p-2.5 bg-portos-surface rounded border border-portos-border space-y-1.5">
        <span className="text-[10px] font-semibold text-portos-muted tracking-wider uppercase flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-portos-teal" />
          Telemetry Status
        </span>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Gantry Status:</span>
          <span className="font-mono text-portos-navy font-semibold">
            {crane.status === "OPERATIONAL" ? "Online · Synced" : crane.status}
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Trolley Cycle:</span>
          <span className="font-mono text-portos-teal tabular-nums">
            Normal Spreader Cycle
          </span>
        </div>
      </div>
    </div>
  );
}

function YardDetails({ block }: { block: YardBlockRead }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">TEU Capacity</span>
          <strong className="font-mono text-sm">{block.teu_capacity} TEU</strong>
        </div>
        <div className="p-2 bg-portos-bg rounded border border-portos-border">
          <span className="text-portos-muted block text-[10px]">Zone Type</span>
          <strong className="font-mono text-xs">{block.zone}</strong>
        </div>
      </div>

      <div className="p-2.5 bg-portos-surface rounded border border-portos-border space-y-1.5">
        <span className="text-[10px] font-semibold text-portos-muted tracking-wider uppercase">
          Threshold Safeguards
        </span>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Warning Threshold:</span>
          <span className="font-mono font-bold text-portos-amber tabular-nums">
            {block.warning_threshold_pct}%
          </span>
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className="text-portos-muted">Critical Threshold:</span>
          <span className="font-mono font-bold text-portos-red tabular-nums">
            {block.critical_threshold_pct}%
          </span>
        </div>
      </div>

      <Link
        href="/yard"
        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded bg-portos-navy text-white text-xs font-medium hover:bg-portos-navy-secondary transition-colors"
      >
        <span>Inspect Yard Intelligence</span>
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  );
}
