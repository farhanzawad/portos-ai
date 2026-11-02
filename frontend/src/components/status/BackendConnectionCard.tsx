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
    <div className="w-full max-w-xl rounded border border-portos-border bg-portos-surface p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-portos-border">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-portos-navy-secondary" />
          <h3 className="text-base font-semibold text-portos-navy">Backend Service Connection</h3>
        </div>
        <button
          onClick={checkHealth}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-portos-navy border border-portos-border rounded hover:bg-portos-bg disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-portos-teal" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-portos-muted">Target Endpoint:</span>
          <span className="font-mono text-xs text-portos-navy">{apiUrl}/health</span>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-3 text-sm text-portos-muted">
            <Activity className="h-4 w-4 animate-spin text-portos-teal" />
            <span>Checking backend health...</span>
          </div>
        )}

        {!loading && data && (
          <div className="rounded border border-portos-teal/30 bg-portos-teal-light p-3.5">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="h-5 w-5 text-portos-teal shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-portos-teal-dark">Backend Online</span>
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-portos-teal/20 text-portos-teal-dark rounded">
                    v{data.version}
                  </span>
                </div>
                <p className="text-xs text-portos-navy/80">
                  Service <code className="font-mono">{data.service}</code> is healthy in <span className="font-medium">{data.environment}</span> mode.
                </p>
                <div className="pt-1 flex items-center gap-3 text-[11px] text-portos-muted">
                  <span>Demo Mode: <strong className="text-portos-navy">{data.demo_mode ? "ACTIVE" : "OFF"}</strong></span>
                  <span>Server Time: <strong className="text-portos-navy tabular-nums">{new Date(data.timestamp).toLocaleTimeString()}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="rounded border border-portos-amber/40 bg-portos-amber-light p-3.5">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-portos-amber-dark shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-portos-amber-dark">Backend Disconnected</span>
                  <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-portos-amber/20 text-portos-amber-dark rounded">
                    UNAVAILABLE
                  </span>
                </div>
                <p className="text-xs text-portos-navy/80">
                  Could not establish connection to <code className="font-mono text-xs">{apiUrl}/health</code>.
                </p>
                <p className="text-xs text-portos-muted pt-1">
                  Cause: <span className="font-mono text-[11px] text-portos-red">{error}</span>
                </p>
                <div className="mt-2 text-[11px] bg-white/70 p-2 rounded border border-portos-amber/20 text-portos-navy/90">
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

      <div className="mt-4 pt-3 border-t border-portos-border flex items-center justify-between text-[11px] text-portos-muted">
        <span className="flex items-center gap-1">
          <ShieldAlert className="h-3.5 w-3.5 text-portos-muted" />
          Controlled Graceful State
        </span>
        <span>Data Status: <strong>SIMULATED</strong></span>
      </div>
    </div>
  );
}

