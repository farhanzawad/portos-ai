"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAISStatus, testAISConnection } from "@/lib/api-client";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  Radio,
  ShieldCheck,
  AlertTriangle,
  X,
  RefreshCw,
  Signal,
  CheckCircle2,
  ExternalLink,
  MapPin,
  Activity,
} from "lucide-react";

interface AISDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AISDiagnosticsModal({ isOpen, onClose }: AISDiagnosticsModalProps) {
  const [testResult, setTestResult] = useState<any | null>(null);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ["ais-status"],
    queryFn: getAISStatus,
    enabled: isOpen,
  });

  const testMutation = useMutation({
    mutationFn: testAISConnection,
    onSuccess: (data) => {
      setTestResult(data);
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 font-sans">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 px-6 py-4 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
              <Radio className="h-4.5 w-4.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-900">
                  AIS Provider Diagnostics
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  Telemetry Feed
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Transponder telemetry stream, provider status & audit logging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                <Signal className={`h-4 w-4 ${status?.api_key_configured ? "text-sky-600" : "text-amber-500"}`} />
              </div>
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>Feed Channel:</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      status?.api_key_configured
                        ? "bg-sky-50 text-sky-700 border border-sky-200"
                        : "bg-amber-50 text-amber-700 border border-amber-200"
                    }`}
                  >
                    {status?.api_key_configured ? "Live Feed Configured" : "Synthetic Hydrographic Replay"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                  Provider: <span className="font-bold text-slate-700">{status?.provider_name || "AISStream.io"}</span>
                </div>
              </div>
            </div>
            {status?.data_status && <DataStatusBadge status={status.data_status} />}
          </div>

          {/* Prime Directive 3 Truthfulness Disclosure */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-xs text-amber-800">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
              <span>Operational Truthfulness Audit (Directive 3)</span>
            </div>
            <p className="text-[11px] leading-relaxed font-medium">
              {status?.audit_note ||
                "No commercial AIS subscription key configured (AIS_STREAM_API_KEY). Operating in calibrated hydrographic replay mode with simulated Karnaphuli fairway trajectories."}
            </p>
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Monitored Corridor
              </span>
              <p className="font-bold text-slate-900 mt-1 text-xs truncate" title={status?.channel_monitored}>
                {status?.channel_monitored || "Chattogram Approach & Karnaphuli"}
              </p>
            </div>
            <div className="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Active AIS Targets
              </span>
              <p className="font-extrabold text-slate-900 mt-1 text-base tabular-nums">
                {status?.active_target_count ?? 12} Vessels
              </p>
            </div>
          </div>

          {/* Bounding Box Coordinates */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600 space-y-1 font-medium">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <MapPin className="h-3.5 w-3.5 text-sky-600" />
              <span>Spatial Geo-Fence Bounding Box:</span>
            </div>
            <div className="grid grid-cols-2 gap-1 pt-1 text-[10px] text-slate-500">
              <div>Min Coordinates: <strong>91.68°E, 22.12°N</strong></div>
              <div>Max Coordinates: <strong>91.86°E, 22.34°N</strong></div>
            </div>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-[11px] text-slate-600 leading-relaxed font-medium">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Advisory Notice</span>
            </div>
            {status?.disclaimer ||
              "All vessel telemetry is advisory. Never use simulated tracks for physical vessel maneuvering or marine safety operations."}
          </div>

          {/* Connection Test Output if executed */}
          {testResult && (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/70 text-emerald-900 text-xs space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Diagnostics Response Received:</span>
              </div>
              <div className="text-[11px] font-medium">
                Connection Status: <strong className="uppercase font-bold">{testResult.status}</strong>
              </div>
              <div className="text-[11px] font-medium">
                Live Key Configured: <strong>{testResult.api_key_configured ? "Yes" : "No (Operating in Replay Mode)"}</strong>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-3.5 bg-slate-50/70">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-bold transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Feed</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors shadow-xs disabled:opacity-50"
            >
              <Signal className="h-3.5 w-3.5" />
              <span>{testMutation.isPending ? "Testing Stream..." : "Test Connection"}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
