"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMaintenanceOverview,
  injectEquipmentAnomaly,
  resetEquipmentAnomalies,
} from "@/lib/api-client";
import { AnomalyAssessment } from "@/types/api";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import {
  X,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Zap,
  Gauge,
  Thermometer,
  Cpu,
  Clock,
  Wrench,
  ShieldAlert,
  Info,
} from "lucide-react";

interface EquipmentMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EquipmentMaintenanceModal({
  isOpen,
  onClose,
}: EquipmentMaintenanceModalProps) {
  const queryClient = useQueryClient();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [injectVibration, setInjectVibration] = useState(5.8);
  const [injectTemp, setInjectTemp] = useState(88.5);
  const [injectPower, setInjectPower] = useState(420.0);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const {
    data: overview,
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["equipment-maintenance-overview"],
    queryFn: getMaintenanceOverview,
    enabled: isOpen,
    refetchInterval: 10000,
  });

  const injectMutation = useMutation({
    mutationFn: (equipmentId: string) =>
      injectEquipmentAnomaly(
        equipmentId,
        injectVibration,
        injectTemp,
        injectPower
      ),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["equipment-maintenance-overview"] });
      setActionSuccessMsg(`Anomaly injected into equipment: Elevated sensor telemetry updated.`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetEquipmentAnomalies(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment-maintenance-overview"] });
      setActionSuccessMsg("Telemetry successfully reset to nominal baseline across all units.");
      setTimeout(() => setActionSuccessMsg(null), 5000);
    },
  });

  if (!isOpen) return null;

  const units = overview?.units || [];
  const selectedUnit: AnomalyAssessment | undefined =
    units.find((u) => u.equipment_id === selectedEquipmentId) || units[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col bg-white rounded-xl shadow-2xl border border-portos-border overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-portos-border bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-md bg-portos-navy text-white">
              <Cpu className="h-5 w-5 text-portos-teal" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-portos-navy">
                  Quayside Equipment Health & Telemetry Anomaly Detection
                </h2>
                <DataStatusBadge status="SIMULATED" />
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                  scikit-learn Isolation Forest
                </span>
              </div>
              <p className="text-xs text-portos-muted mt-0.5">
                Real-time multivariate sensor inference: hoist vibration, hydraulic core temperature, and motor power draw.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              disabled={isLoading || isRefetching}
              className="p-1.5 text-slate-500 hover:text-portos-navy rounded hover:bg-slate-200 transition-colors"
              title="Refresh telemetry"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin text-portos-teal" : ""}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-portos-navy rounded hover:bg-slate-200 transition-colors"
              title="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Operational Truthfulness Banner */}
        <div className="bg-amber-50 border-b border-amber-200/60 px-5 py-2.5 text-xs text-amber-900 flex items-start gap-2">
          <Info className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="leading-relaxed">
            <span className="font-semibold">Prime Directive 3 Notice:</span> Equipment sensor telemetry and crane anomaly scores are synthetically generated for demonstration. No physical IoT link to Chattogram Port cranes exists without verified authority gateways.
          </div>
        </div>

        {/* Action feedback banner */}
        {actionSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs text-emerald-800 flex items-center justify-between">
            <span className="font-medium flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              {actionSuccessMsg}
            </span>
            <button
              onClick={() => setActionSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Fleet Summary KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <span className="text-[10px] text-portos-muted font-semibold uppercase">Total Cranes</span>
              <div className="text-xl font-bold font-mono text-portos-navy mt-1">
                {overview?.total_units ?? 0}
              </div>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-200/60">
              <span className="text-[10px] text-emerald-700 font-semibold uppercase">Nominal / Healthy</span>
              <div className="text-xl font-bold font-mono text-emerald-700 mt-1">
                {overview?.operational_units ?? 0}
              </div>
            </div>

            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/60">
              <span className="text-[10px] text-amber-700 font-semibold uppercase">Watch Required</span>
              <div className="text-xl font-bold font-mono text-amber-700 mt-1">
                {overview?.watch_units ?? 0}
              </div>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200/60">
              <span className="text-[10px] text-rose-700 font-semibold uppercase">Critical Anomalies</span>
              <div className="text-xl font-bold font-mono text-rose-700 mt-1">
                {overview?.critical_units ?? 0}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
              <span className="text-[10px] text-portos-muted font-semibold uppercase">Mean Fleet Health</span>
              <div className="text-xl font-bold font-mono text-portos-teal mt-1">
                {overview?.mean_health_index?.toFixed(1) ?? "--"}%
              </div>
            </div>
          </div>

          {/* Main Inspection Layout: Grid of Units + Selected Unit Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: Unit Cards List */}
            <div className="lg:col-span-5 space-y-2.5">
              <div className="flex items-center justify-between pb-1">
                <span className="text-xs font-bold text-portos-navy uppercase tracking-wider">
                  Monitored Units ({units.length})
                </span>
                <button
                  onClick={() => resetMutation.mutate()}
                  disabled={resetMutation.isPending}
                  className="text-xs text-portos-teal hover:text-teal-700 font-medium flex items-center gap-1 hover:underline disabled:opacity-50"
                  title="Reset all cranes to nominal sensor levels"
                >
                  <RefreshCw className={`h-3 w-3 ${resetMutation.isPending ? "animate-spin" : ""}`} />
                  Reset All to Baseline
                </button>
              </div>

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {units.map((unit) => {
                  const isSelected = selectedUnit?.equipment_id === unit.equipment_id;
                  const isCritical = unit.risk_level === "CRITICAL";
                  const isWatch = unit.risk_level === "WATCH";

                  return (
                    <button
                      key={unit.equipment_id}
                      onClick={() => setSelectedEquipmentId(unit.equipment_id)}
                      className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-portos-teal bg-portos-teal-light/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold font-mono text-sm text-portos-navy">
                            {unit.equipment_code}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            {unit.equipment_type}
                          </span>
                          {isCritical && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold animate-pulse">
                              CRITICAL
                            </span>
                          )}
                          {isWatch && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                              WATCH
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-portos-muted flex items-center gap-3">
                          <span>Health: <strong className="text-slate-800 font-mono">{unit.health_index_pct.toFixed(0)}%</strong></span>
                          <span>Score: <strong className="text-slate-800 font-mono">{unit.anomaly_score.toFixed(2)}</strong></span>
                        </div>
                      </div>

                      {/* Mini health bar */}
                      <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200 shrink-0">
                        <div
                          className={`h-full transition-all duration-300 ${
                            isCritical ? "bg-rose-500" : isWatch ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${Math.max(8, unit.health_index_pct)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Unit Telemetry & Anomaly Simulator */}
            {selectedUnit ? (
              <div className="lg:col-span-7 bg-slate-50/70 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-portos-navy">
                        {selectedUnit.equipment_code} Telemetry Detail
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        selectedUnit.risk_level === "CRITICAL"
                          ? "bg-rose-100 text-rose-800"
                          : selectedUnit.risk_level === "WATCH"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {selectedUnit.risk_level}
                      </span>
                    </div>
                    <span className="text-xs text-portos-muted">
                      Isolation Forest model: {selectedUnit.model_version}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-portos-muted uppercase font-semibold block">Health Index</span>
                    <span className={`text-lg font-bold font-mono ${
                      selectedUnit.health_index_pct < 60
                        ? "text-rose-600"
                        : selectedUnit.health_index_pct < 80
                        ? "text-amber-600"
                        : "text-portos-teal"
                    }`}>
                      {selectedUnit.health_index_pct.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Telemetry Sensor Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-white rounded border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Activity className="h-3.5 w-3.5 text-slate-400" />
                      <span>Vibration</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                      {selectedUnit.telemetry.vibration_mm_s.toFixed(2)} mm/s
                    </div>
                    <div className="text-[10px] text-slate-400">Baseline: &lt; 2.5 mm/s</div>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Thermometer className="h-3.5 w-3.5 text-slate-400" />
                      <span>Hydraulic Temp</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                      {selectedUnit.telemetry.hydraulic_temp_c.toFixed(1)} °C
                    </div>
                    <div className="text-[10px] text-slate-400">Baseline: 45 - 65 °C</div>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Zap className="h-3.5 w-3.5 text-slate-400" />
                      <span>Power Draw</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                      {selectedUnit.telemetry.power_draw_kw.toFixed(1)} kW
                    </div>
                    <div className="text-[10px] text-slate-400">Baseline: 150 - 320 kW</div>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Hoist Cycle</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                      {selectedUnit.telemetry.hoist_cycle_time_s.toFixed(1)} s
                    </div>
                    <div className="text-[10px] text-slate-400">Baseline: 40 - 55 s</div>
                  </div>

                  <div className="p-2.5 bg-white rounded border border-slate-200 shadow-2xs col-span-2 sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Wrench className="h-3.5 w-3.5 text-slate-400" />
                      <span>Operating Hours</span>
                    </div>
                    <div className="text-sm font-mono font-bold text-slate-800 mt-1">
                      {selectedUnit.telemetry.operating_hours.toFixed(0)} h
                    </div>
                    <div className="text-[10px] text-slate-400">Scheduled maintenance cycle: 500h</div>
                  </div>
                </div>

                {/* Dominant Contributor & Recommended Action */}
                <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5">
                  <div className="text-xs">
                    <span className="font-semibold text-portos-navy">Dominant Anomaly Contributor: </span>
                    <span className="font-mono text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded">
                      {selectedUnit.dominant_contributing_feature}
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="font-semibold text-portos-navy">Recommended Action: </span>
                    {selectedUnit.recommended_action}
                  </div>
                </div>

                {/* Interactive Anomaly Simulator */}
                <div className="p-3.5 bg-slate-100/90 rounded-lg border border-slate-300 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-portos-navy flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-amber-600" />
                      Interactive Anomaly Injection (Demonstration)
                    </span>
                    <span className="text-[10px] text-slate-500">Simulate hardware stress</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-slate-600 font-medium block">Vibration (mm/s)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={injectVibration}
                        onChange={(e) => setInjectVibration(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-medium block">Temp (°C)</label>
                      <input
                        type="number"
                        step="1"
                        value={injectTemp}
                        onChange={(e) => setInjectTemp(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-600 font-medium block">Power (kW)</label>
                      <input
                        type="number"
                        step="10"
                        value={injectPower}
                        onChange={(e) => setInjectPower(parseFloat(e.target.value) || 0)}
                        className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => injectMutation.mutate(selectedUnit.equipment_id)}
                      disabled={injectMutation.isPending}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      <span>{injectMutation.isPending ? "Evaluating..." : `Inject Anomaly into ${selectedUnit.equipment_code}`}</span>
                    </button>
                    <button
                      onClick={() => resetMutation.mutate()}
                      disabled={resetMutation.isPending}
                      className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-xs font-medium transition-colors"
                    >
                      Reset Unit
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-portos-border bg-slate-50 flex items-center justify-between text-xs text-portos-muted">
          <span>Model: Isolation Forest (n_estimators=100, contamination=0.15)</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-portos-navy hover:bg-slate-800 text-white rounded text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
