"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Activity, CheckCircle2, AlertTriangle, RefreshCw, Server, ShieldAlert } from "lucide-react";

interface HealthData {
  status: string;
  service: string;
  version: string;
  timestamp: string;
  demo_mode: boolean;
  environment: string;
}

export function BackendConnectionCard() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [apiUrl, setApiUrl] = useState<string>("http://localhost:8000");

  const checkHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    const targetUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    setApiUrl(targetUrl);

    try {
      const response = await fetch(`${targetUrl}/health`, {
        method: "GET",
        headers: { "Accept": "application/json" },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const json: HealthData = await response.json();
      setData(json);
    } catch (err: unknown) {
      setData(null);
      const msg = err instanceof Error ? err.message : "Connection failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  return (
    <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xs font-sans">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-slate-700" />
          <h3 className="text-base font-bold text-slate-900">Backend Service Connection</h3>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-full hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-2xs"
        >
          <RefreshCw className={`h-3.5 w-3.5 text-sky-600 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 font-medium">Target Endpoint:</span>
          <span className="text-xs text-slate-800 font-semibold tabular-nums">{apiUrl}/health</span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
            <Activity className="h-4 w-4 animate-spin text-sky-600" />
            <span>Checking backend health...</span>
          </div>
        )}

        {!loading && data && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sky-950">Backend Online</span>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 rounded-full border border-sky-200">
                    v{data.version}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  Service <strong className="font-semibold text-slate-900">{data.service}</strong> is healthy in <span className="font-semibold">{data.environment}</span> mode.
                </p>
                <div className="pt-1 flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                  <span>Demo Mode: <strong className="text-slate-900">{data.demo_mode ? "ACTIVE" : "OFF"}</strong></span>
                  <span>Server Time: <strong className="text-slate-900 tabular-nums">{new Date(data.timestamp).toLocaleTimeString()}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-950">Backend Disconnected</span>
                  <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 rounded-full border border-amber-200">
                    UNAVAILABLE
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  Could not establish connection to <code className="font-mono text-xs">{apiUrl}/health</code>.
                </p>
                <p className="text-xs text-slate-500 pt-1 font-medium">
                  Cause: <span className="font-medium text-rose-700">{error}</span>
                </p>
                <div className="mt-2 text-[11px] bg-white p-2.5 rounded-xl border border-amber-200 text-slate-800">
                  <strong>Startup Command:</strong><br />
                  <code className="font-mono text-[11px] select-all">
                    cd backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span className="flex items-center gap-1 font-medium">
          <ShieldAlert className="h-3.5 w-3.5 text-slate-400" />
          Controlled Graceful State
        </span>
        <span className="font-semibold">Data Status: <strong className="text-slate-800">SIMULATED</strong></span>
      </div>
    </div>
  );
}

