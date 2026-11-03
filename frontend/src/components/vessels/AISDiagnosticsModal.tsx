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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-xl border border-portos-border bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-portos-border px-5 py-3.5 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portos-teal/10 text-portos-teal border border-portos-teal/20">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-portos-navy flex items-center gap-2">
                Commercial AIS Provider Diagnostics
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  Optional B
                </span>
              </h3>
              <p className="text-[11px] text-portos-muted">
                Transponder telemetry gating, provider status & audit logging
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-slate-50 border-slate-200">
            <div className="flex items-center gap-2">
              <Signal className={`h-4 w-4 ${status?.api_key_configured ? "text-emerald-500" : "text-amber-500"}`} />
              <div>
                <div className="font-semibold text-portos-navy flex items-center gap-2">
                  <span>Feed Mode:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                    status?.api_key_configured 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {status?.api_key_configured ? "Live Feed Active" : "Synthetic Replay Mode"}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Provider: <span className="font-medium text-slate-700">{status?.provider_name || "AISStream.io"}</span>
                </div>
              </div>
            </div>
            {status?.data_status && <DataStatusBadge status={status.data_status} />}
          </div>

          {/* Prime Directive 3 Truthfulness Disclosure */}
          <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-[11px] text-amber-800">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-700" />
              <span>Operational Truthfulness Audit (Directive 3)</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              {status?.audit_note || "No live commercial AIS subscription key configured (AIS_STREAM_API_KEY). Operating in synthetic hydrographic replay mode."}
            </p>
          </div>

          {/* Diagnostic Metrics */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-2.5 rounded-lg border border-portos-border bg-white shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Monitored Corridor</span>
              <p className="font-medium text-portos-navy mt-0.5 text-[11px] truncate" title={status?.channel_monitored}>
                {status?.channel_monitored || "Chattogram Approach & Karnaphuli"}
              </p>
            </div>
            <div className="p-2.5 rounded-lg border border-portos-border bg-white shadow-2xs">
              <span className="text-[10px] uppercase font-semibold text-slate-400">Active AIS Targets</span>
              <p className="font-bold text-portos-navy mt-0.5 text-sm tabular-nums">
                {status?.active_target_count ?? 12} Vessels
              </p>
            </div>
          </div>

          {/* Bounding Box Coordinates */}
          <div className="p-2.5 rounded-lg border border-portos-border bg-slate-50 font-mono text-[10px] text-slate-600">
            <div className="font-semibold text-slate-700 mb-1">Spatial Filter Bounding Box:</div>
            <div>Min Lon: 91.68°E | Min Lat: 22.12°N</div>
            <div>Max Lon: 91.86°E | Max Lat: 22.34°N</div>
          </div>

          {/* Safety Disclaimer */}
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-[11px] text-slate-600 leading-relaxed">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 mb-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
              <span>Maritime Safety Restriction</span>
            </div>
            {status?.disclaimer}
          </div>

          {/* Connection Test Output if executed */}
          {testResult && (
            <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/60 text-emerald-900 text-[11px] space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span>Diagnostics Response Received:</span>
              </div>
              <div>Status: <span className="font-mono font-bold uppercase">{testResult.status}</span></div>
              <div>API Key Configured: <span className="font-mono">{testResult.api_key_configured ? "YES" : "NO (Demo)"}</span></div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-portos-border px-5 py-3 bg-slate-50">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => testMutation.mutate()}
              disabled={testMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-portos-navy hover:bg-portos-navy-secondary text-white text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
            >
              <Signal className="h-3.5 w-3.5" />
              <span>{testMutation.isPending ? "Testing..." : "Test Connection"}</span>
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-portos-border bg-white text-slate-700 text-xs font-medium hover:bg-slate-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

