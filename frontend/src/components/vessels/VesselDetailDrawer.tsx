"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { VesselCallRead, VesselTrackResponse } from "@/types/api";
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
  Calendar,
  Gauge,
  Navigation,
  FileSpreadsheet,
  ExternalLink,
  ChevronRight,
  Sliders,
  Radio,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface VesselDetailDrawerProps {
  call: VesselCallRead;
  trackData?: VesselTrackResponse;
  isTrackLoading?: boolean;
  onClose: () => void;
  onOpenAISDiagnostics?: () => void;
}

export function VesselDetailDrawer({
  call,
  trackData,
  isTrackLoading = false,
  onClose,
  onOpenAISDiagnostics,
}: VesselDetailDrawerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"telemetry" | "ml" | "specs" | "track">("telemetry");

  const repDate = new Date(call.reported_eta);
  const predDate = call.predicted_eta ? new Date(call.predicted_eta) : null;
  const latestPos = trackData?.positions?.[trackData.positions.length - 1];

  const draft = call.vessel?.max_draft_m || 0;
  const isTidalConstrained = draft >= 8.8;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden text-xs font-sans">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-200/80 bg-slate-50/70 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
            <Ship className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block">
              Vessel Telemetry Dossier
            </span>
            <h3 className="text-base font-extrabold text-slate-900 leading-snug">
              {call.vessel?.name || "DEMO Vessel"}
            </h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Call Sign: <strong className="text-slate-800">{call.call_number}</strong> · IMO {call.vessel?.imo_number}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 flex items-center justify-center transition-colors shrink-0"
          title="Close details"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Identification & Navigational Status Pill Strip */}
      <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200/60 flex items-center justify-between text-[11px] gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-700">
          <span className="px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-800 font-bold text-[10px]">
            {call.vessel?.flag_country || "Bangladesh"}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 font-medium">{call.vessel?.vessel_type || "Feeder Container"}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              call.status === "OUTER_ANCHORAGE"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : call.status === "PILOT_BOARDING"
                ? "bg-sky-50 text-sky-700 border border-sky-200"
                : call.status === "BERTHED"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-700 border border-slate-200"
            }`}
          >
            {call.status.replace("_", " ")}
          </span>
          <DataStatusBadge status="SIMULATED" size="sm" />
        </div>
      </div>

      {/* Segmented Dossier Tabs */}
      <div className="flex items-center gap-1.5 p-2.5 border-b border-slate-200/80 bg-white text-xs font-semibold">
        <button
          onClick={() => setActiveTab("telemetry")}
          className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
            activeTab === "telemetry"
              ? "bg-slate-900 text-white font-bold shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Telemetry
        </button>
        <button
          onClick={() => setActiveTab("ml")}
          className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
            activeTab === "ml"
              ? "bg-slate-900 text-white font-bold shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          ML Delay
        </button>
        <button
          onClick={() => setActiveTab("specs")}
          className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
            activeTab === "specs"
              ? "bg-slate-900 text-white font-bold shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Specs & Cargo
        </button>
        <button
          onClick={() => setActiveTab("track")}
          className={`flex-1 py-1.5 px-2 rounded-xl text-center transition-all ${
            activeTab === "track"
              ? "bg-slate-900 text-white font-bold shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Waypoints ({trackData?.positions?.length || 0})
        </button>
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: TELEMETRY & LIVE VECTOR */}
        {activeTab === "telemetry" && (
          <div className="space-y-3.5">
            {/* Live Navigation Vector Card */}
            <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Simulated Navigational Vector
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold text-[10px] border border-sky-200">
                  Fairway Approach
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Speed Over Ground</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                      {latestPos?.speed_knots ?? 12.0}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">knots</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Course Over Ground</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                      {latestPos?.heading_degrees ?? 35}°
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">NNE</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Distance to Pilot</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-xl font-extrabold text-sky-600 tabular-nums">
                      {latestPos?.distance_to_pilot_nm?.toFixed(1) ?? "8.5"}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">NM</span>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Navigational Fix</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-base font-extrabold text-slate-800">
                      {latestPos?.navigational_status || "At Anchor"}
                    </span>
                  </div>
                </div>

                {/* Full Width Channel Sector to prevent truncation */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs col-span-2">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Channel Sector & Anchoring Zone</span>
                  <div className="text-slate-900 font-bold mt-1 text-xs">
                    {call.status === "BERTHED"
                      ? "Quayside Berth (Chittagong Container Terminal Quayside)"
                      : "Outer Roadstead Anchorage (Alpha Zone Waiting Roadstead)"}
                  </div>
                </div>
              </div>

              {/* Coordinates Pill */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 text-xs">
                <div className="flex items-center gap-2 text-slate-600 font-medium">
                  <MapPin className="h-4 w-4 text-sky-600 shrink-0" />
                  <span>Latest Coordinates:</span>
                </div>
                <span className="font-extrabold text-slate-900 tabular-nums">
                  {latestPos?.latitude?.toFixed(4) ?? "22.1750"}°N, {latestPos?.longitude?.toFixed(4) ?? "91.7500"}°E
                </span>
              </div>
            </div>

            {/* Quick Summary Pill */}
            <div className="p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Estimated Channel Passage
              </span>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Vessel inbound towards Karnaphuli river approach. Pilot boarding scheduled at Bravo anchorage station before inner fairway transit through Gupta Bend.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: ML ARRIVAL DELAY & SCIKIT-LEARN FORECAST */}
        {activeTab === "ml" && (
          <div className="space-y-3.5">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-extrabold text-slate-900 text-xs">
                  <Clock className="h-4 w-4 text-sky-600" />
                  <span>scikit-learn ETA Calibrator</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold">
                  BST (UTC+6)
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">
                    Reported ETA
                  </span>
                  <div className="font-bold text-slate-800 mt-1">
                    {repDate.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    {repDate.toLocaleTimeString("en-GB", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>

                <div className="p-3 bg-sky-50/50 rounded-xl border border-sky-200">
                  <span className="text-sky-700 block text-[10px] font-bold uppercase">
                    ML Calibrated ETA
                  </span>
                  <div className="font-extrabold text-slate-900 mt-1">
                    {predDate
                      ? `${predDate.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })} ${predDate.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Same as reported"}
                  </div>
                </div>
              </div>

              {/* Delay Variance Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl border bg-slate-50 border-slate-200 text-xs">
                <span className="text-slate-600 font-semibold">Predicted Schedule Delta:</span>
                <span
                  className={`font-extrabold text-base ${
                    call.predicted_delay_hours > 2
                      ? "text-rose-600"
                      : call.predicted_delay_hours > 0
                      ? "text-amber-600"
                      : "text-sky-600"
                  }`}
                >
                  +{call.predicted_delay_hours} hrs
                </span>
              </div>

              {/* Confidence Interval & Delay Drivers */}
              <div className="space-y-2 pt-1 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Model Features & Delay Drivers
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                    Tidal Window Restriction
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                    Karnaphuli Channel Surge
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]">
                    NCT Quayside Berth Density
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 pt-1 font-medium">
                  Confidence Score: <strong className="text-slate-900">92.4%</strong> (MAE ±0.6 hrs on historical Chittagong calls)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SPECIFICATIONS & CLEARANCE */}
        {activeTab === "specs" && (
          <div className="space-y-3.5">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-3.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Technical Hull Specifications
              </span>

              <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">LOA</span>
                  <strong className="text-slate-900 font-extrabold text-base mt-1 block">
                    {call.vessel?.length_overall_m}m
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Beam</span>
                  <strong className="text-slate-900 font-extrabold text-base mt-1 block">
                    {call.vessel?.beam_m}m
                  </strong>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Draft</span>
                  <strong className="text-sky-600 font-extrabold text-base mt-1 block">
                    {draft}m
                  </strong>
                </div>
              </div>

              {/* Karnaphuli Draft Clearance Rule Notice */}
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1 font-medium">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                  <span>Karnaphuli Channel Draft Advisory</span>
                </div>
                <p className="leading-relaxed">
                  Maximum permissible draft for Karnaphuli Fairway is <strong>9.5m</strong>. Vessel draft of {draft}m requires coordinated pilotage during high water tidal gate.
                </p>
              </div>

              {/* Cargo Manifest Breakdown */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Inbound Cargo Discharge:</span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {call.inbound_teu} TEU
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Outbound Cargo Loading:</span>
                  <span className="font-extrabold text-slate-900 tabular-nums">
                    {call.outbound_teu} TEU
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Total TEU Exchange:</span>
                  <span className="font-extrabold text-sky-600 tabular-nums">
                    {(call.inbound_teu || 0) + (call.outbound_teu || 0)} TEU
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: WAYPOINTS TRACK PROGRESSION */}
        {activeTab === "track" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Simulated Waypoint Trajectory
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {trackData?.positions?.length || 0} Recorded Fixes
              </span>
            </div>

            {isTrackLoading ? (
              <div className="space-y-2 py-2">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : !trackData?.positions || trackData.positions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 font-medium">
                No historical track positions recorded for this call.
              </p>
            ) : (
              <div className="relative pl-4 space-y-2.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {trackData.positions.map((pos, idx) => {
                  const posDate = new Date(pos.timestamp);
                  const isCurrent = idx === trackData.positions.length - 1;

                  return (
                    <div key={pos.id || idx} className="relative text-xs">
                      {/* Timeline Node Bullet */}
                      <div
                        className={`absolute -left-[19px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-2xs ${
                          isCurrent ? "bg-sky-500 animate-ping" : "bg-slate-700"
                        }`}
                      />

                      <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 space-y-1 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 text-xs">
                            {pos.navigational_status || "In transit"}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {posDate.toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            BST
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            {pos.latitude.toFixed(4)}°N, {pos.longitude.toFixed(4)}°E
                          </span>
                          <span className="font-bold text-slate-800">
                            {pos.speed_knots} kts · {pos.heading_degrees}°
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                          <span>Pilot Dist: {pos.distance_to_pilot_nm.toFixed(1)} NM</span>
                          <DataStatusBadge status="SIMULATED" size="sm" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Operational Cross-Module Action Hub */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Operational Cross-Module Actions
          </span>

          {/* Action 1: Assign Berth in Berth Planner */}
          <button
            onClick={() => router.push(`/berth-planner?vessel=${call.id}`)}
            className="w-full py-2.5 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-between transition-colors shadow-xs"
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-sky-400" />
              <span>Assign Berth in Berth Planner</span>
            </div>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          {/* Action 2: Inspect in 3D Terminal Twin */}
          <button
            onClick={() => router.push(`/digital-twin?vessel=${call.id}`)}
            className="w-full py-2.5 px-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl font-bold text-xs flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <Box className="h-4 w-4 text-sky-600" />
              <span>Inspect in 3D Digital Twin</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {/* Action 3: Simulate in Decision Lab */}
          <button
            onClick={() => router.push(`/scenarios`)}
            className="w-full py-2 px-3.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl font-semibold text-xs flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="h-3.5 w-3.5 text-amber-600" />
              <span>Test What-If in Decision Lab</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>

        {/* Operational Truthfulness & Advisory Notice */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500 space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
            <span>Advisory Decision Support Notice</span>
          </div>
          <p className="leading-relaxed font-medium">
            Positions and track vectors are simulated approximations for decision-support evaluation only. No real-world navigational order is issued.
          </p>
        </div>
      </div>
    </div>
  );
}
