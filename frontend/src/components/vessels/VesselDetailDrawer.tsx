"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { VesselCallRead, VesselTrackResponse } from "@/types/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  X,
  Ship,
  Compass,
  Clock,
  MapPin,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Box,
} from "lucide-react";

interface VesselDetailDrawerProps {
  call: VesselCallRead;
  trackData?: VesselTrackResponse;
  isTrackLoading?: boolean;
  onClose: () => void;
}

export function VesselDetailDrawer({
  call,
  trackData,
  isTrackLoading = false,
  onClose,
}: VesselDetailDrawerProps) {
  const router = useRouter();
  const repDate = new Date(call.reported_eta);
  const predDate = call.predicted_eta ? new Date(call.predicted_eta) : null;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-portos-border shadow-sm overflow-hidden text-xs">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-portos-border bg-portos-surface flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded bg-portos-navy text-portos-teal">
            <Ship className="h-4 w-4" />
          </div>
          <div>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-portos-muted font-mono block">
              VESSEL DETAIL & TRACK TIMELINE
            </span>
            <h3 className="text-sm font-bold text-portos-navy truncate max-w-[220px]">
              {call.vessel?.name || "DEMO Vessel"}
            </h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-portos-muted hover:text-portos-navy hover:bg-portos-border/50 rounded transition-colors"
          title="Close Details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status & Identification Strip */}
        <div className="p-2.5 bg-portos-bg rounded border border-portos-border/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-mono text-[11px] text-portos-navy">
            <span>{call.call_number}</span>
            <span>·</span>
            <span>{call.vessel?.imo_number}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <StatusBadge
              status={
                call.delay_risk_status === "HIGH_RISK"
                  ? "danger"
                  : call.delay_risk_status === "WATCH"
                  ? "watch"
                  : "normal"
              }
              label={call.delay_risk_status || "NORMAL"}
              size="sm"
            />
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
        </div>

        {/* ETA & Predictive ML Analysis Card */}
        <div className="p-3 bg-white rounded border border-portos-border space-y-2.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-portos-navy text-xs">
              <Clock className="h-3.5 w-3.5 text-portos-navy-secondary" />
              <span>Arrival Schedule & ML Forecast</span>
            </div>
            <span className="text-[10px] font-mono text-portos-muted">
              BST (UTC+6)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-portos-bg rounded border border-portos-border/60">
              <span className="text-portos-muted block text-[10px]">
                Reported ETA
              </span>
              <strong className="font-mono text-portos-navy">
                {repDate.toLocaleDateString("en-GB", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                {repDate.toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </strong>
            </div>

            <div className="p-2 bg-portos-teal-light/30 rounded border border-portos-teal/40">
              <span className="text-portos-teal block text-[10px] font-semibold">
                ML Predicted ETA
              </span>
              <strong className="font-mono text-portos-navy">
                {predDate
                  ? `${predDate.toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })} ${predDate.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Same as reported"}
              </strong>
            </div>
          </div>

          <div className="flex items-center justify-between p-2 bg-portos-bg rounded text-[11px] font-mono">
            <span className="text-portos-muted">Predicted Delay Variance:</span>
            <span
              className={`font-bold ${
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

        {/* Vessel Specifications & Cargo Payload */}
        <div className="p-3 bg-white rounded border border-portos-border space-y-2 shadow-xs">
          <span className="text-[10px] font-semibold text-portos-muted tracking-wider uppercase block">
            Technical Specifications & Payload
          </span>
          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono">
            <div className="p-1.5 bg-portos-bg rounded text-center">
              <span className="text-portos-muted block text-[9px]">LOA</span>
              <strong className="text-portos-navy">
                {call.vessel?.length_overall_m} m
              </strong>
            </div>
            <div className="p-1.5 bg-portos-bg rounded text-center">
              <span className="text-portos-muted block text-[9px]">Beam</span>
              <strong className="text-portos-navy">{call.vessel?.beam_m} m</strong>
            </div>
            <div className="p-1.5 bg-portos-bg rounded text-center">
              <span className="text-portos-muted block text-[9px]">Draft</span>
              <strong className="text-portos-teal">
                {call.vessel?.max_draft_m} m
              </strong>
            </div>
          </div>

          <div className="flex justify-between items-center text-[11px] pt-1 border-t border-portos-border/50">
            <span className="text-portos-muted">Inbound / Outbound Cargo:</span>
            <span className="font-mono text-portos-navy font-semibold">
              {call.inbound_teu} TEU / {call.outbound_teu} TEU
            </span>
          </div>
        </div>

        {/* Simulated GPS/AIS Track Timeline */}
        <div className="p-3 bg-white rounded border border-portos-border space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-portos-navy text-xs">
              <Compass className="h-3.5 w-3.5 text-portos-teal" />
              <span>Simulated Route Waypoint Timeline</span>
            </div>
            <span className="text-[10px] font-mono text-portos-muted">
              {trackData?.positions?.length || 0} Points
            </span>
          </div>

          {isTrackLoading ? (
            <div className="space-y-2 py-2">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : !trackData?.positions || trackData.positions.length === 0 ? (
            <p className="text-xs text-portos-muted py-3 text-center">
              No historical track positions recorded for this call.
            </p>
          ) : (
            <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-portos-border">
              {trackData.positions.map((pos, idx) => {
                const posDate = new Date(pos.timestamp);
                const isCurrent = idx === trackData.positions.length - 1;

                return (
                  <div key={pos.id || idx} className="relative text-[11px]">
                    {/* Timeline Node Bullet */}
                    <div
                      className={`absolute -left-[19px] top-0.5 w-3 h-3 rounded-full border-2 border-white ${
                        isCurrent ? "bg-portos-teal animate-pulse" : "bg-portos-navy"
                      }`}
                    />

                    <div className="p-2 rounded bg-portos-bg border border-portos-border/60 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-portos-navy">
                          {pos.navigational_status || "In transit"}
                        </span>
                        <span className="font-mono text-[10px] text-portos-muted">
                          {posDate.toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          BST
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-mono text-portos-muted">
                        <span>
                          {pos.latitude.toFixed(4)}°N, {pos.longitude.toFixed(4)}°E
                        </span>
                        <span className="text-portos-navy font-semibold">
                          {pos.speed_knots} kts · {pos.heading_degrees}°
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-portos-muted pt-0.5 border-t border-portos-border/40">
                        <span>
                          Pilot Dist: {pos.distance_to_pilot_nm.toFixed(1)} NM
                        </span>
                        <DataStatusBadge status="SIMULATED" size="sm" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Launch in 3D Terminal Twin */}
        <button
          onClick={() => router.push(`/digital-twin?vessel=${call.id}`)}
          className="w-full py-2 px-3 bg-portos-navy hover:bg-portos-navy-secondary text-white rounded font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
        >
          <Box className="h-4 w-4 text-portos-teal" />
          <span>Inspect in 3D Terminal Twin</span>
        </button>

        {/* Operational Grounding Disclaimer */}
        <div className="p-2.5 bg-portos-teal-light/20 rounded border border-portos-teal/30 text-[10px] text-portos-muted space-y-1">
          <div className="flex items-center gap-1 font-semibold text-portos-navy">
            <ShieldCheck className="h-3.5 w-3.5 text-portos-teal" />
            <span>Operational Decision Support Notice</span>
          </div>
          <p>
            Positions represent synthetic simulated tracks for decision-support
            evaluation, not live AIS feeds or navigational safety aids. Channel:
            Karnaphuli River.
          </p>
        </div>
      </div>
    </div>
  );
}

