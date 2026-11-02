"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ScenarioParameters,
  ScenarioComparisonResponse,
  ProposeScenarioResponse,
} from "@/types/api";
import { ScenarioConfigPanel } from "./ScenarioConfigPanel";
import { ScenarioComparisonCards } from "./ScenarioComparisonCards";
import { QueueDynamicsChart } from "./QueueDynamicsChart";
import { VesselEventLogsTable } from "./VesselEventLogsTable";
import { ProposeScenarioModal } from "./ProposeScenarioModal";
import { RefreshCw, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";

const defaultBaselineParams: ScenarioParameters = {
  scenario_code: "baseline_normal",
  scenario_name: "Standard Baseline Terminal Operations",
  description: "Nominal operational state with all 6 berths and 5 cranes active.",
  is_baseline: true,
  random_seed: 42,
  duration_hours: 72.0,
  vessel_arrival_multiplier: 1.0,
  berth_outage_count: 0,
  crane_outage_count: 0,
  crane_service_rate_multiplier: 1.0,
  weather_disruption_factor: 1.0,
  yard_congestion_threshold_pct: 85.0,
};

const defaultAlternativeParams: ScenarioParameters = {
  scenario_code: "monsoon_weather_squall",
  scenario_name: "Monsoon Weather Squall & Rough Sea",
  description: "High swells and squalls: 35% service slowdown and 15% degraded handling rate.",
  is_baseline: false,
  random_seed: 42,
  duration_hours: 72.0,
  vessel_arrival_multiplier: 1.0,
  berth_outage_count: 0,
  crane_outage_count: 0,
  crane_service_rate_multiplier: 0.85,
  weather_disruption_factor: 1.35,
  yard_congestion_threshold_pct: 85.0,
};

export function ScenarioLabView() {
  const [activeParams, setActiveParams] = useState<ScenarioParameters>(defaultAlternativeParams);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState<ProposeScenarioResponse | null>(null);

  // 1. Fetch Presets
  const presetsQuery = useQuery<ScenarioParameters[]>({
    queryKey: ["scenario-presets"],
    queryFn: async () => {
      const res = await fetch("/api/v1/scenarios/presets");
      if (!res.ok) throw new Error("Failed to load scenario presets");
      return res.json();
    },
  });

  // 2. Fetch/Execute Comparative Simulation
  const comparisonQuery = useQuery<ScenarioComparisonResponse>({
    queryKey: ["scenario-comparison", activeParams],
    queryFn: async () => {
      const res = await fetch("/api/v1/scenarios/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseline_parameters: defaultBaselineParams,
          alternative_scenarios: [activeParams],
        }),
      });
      if (!res.ok) throw new Error("SimPy discrete-event simulation failed");
      return res.json();
    },
  });

  const handleSelectPreset = (preset: ScenarioParameters) => {
    setActiveParams({ ...preset });
  };

  const handleResetToBaseline = () => {
    setActiveParams({ ...defaultBaselineParams, is_baseline: false, scenario_name: "Modified Baseline" });
  };

  const handleRunSimulation = () => {
    comparisonQuery.refetch();
  };

  const isLoading = comparisonQuery.isLoading || presetsQuery.isLoading;

  if (isLoading) {
    return (
      <div className="bg-white border border-portos-border rounded-lg p-12 text-center shadow-xs">
        <RefreshCw className="h-6 w-6 text-portos-teal animate-spin mx-auto mb-3" />
        <h3 className="text-sm font-bold text-portos-navy">
          Executing SimPy Discrete-Event Simulation Runtime...
        </h3>
        <p className="text-xs text-portos-muted mt-1">
          Modeling vessel arrivals, outer anchorage queue dynamics, and crane handling delays.
        </p>
      </div>
    );
  }

  if (comparisonQuery.isError || !comparisonQuery.data) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center text-xs text-rose-800">
        <AlertTriangle className="h-6 w-6 text-rose-600 mx-auto mb-2" />
        <h3 className="font-bold text-sm">Simulation Execution Failed</h3>
        <p className="mt-1">
          {comparisonQuery.error instanceof Error
            ? comparisonQuery.error.message
            : "An unexpected simulation engine error occurred."}
        </p>
        <button
          onClick={() => comparisonQuery.refetch()}
          className="mt-3 px-3 py-1.5 rounded bg-portos-navy text-white text-xs font-medium hover:bg-portos-navy-secondary transition-colors"
        >
          Retry Simulation
        </button>
      </div>
    );
  }

  const compData = comparisonQuery.data;
  const currentAltRun = compData.alternative_runs[0] || compData.baseline_run;

  return (
    <div className="space-y-4">
      {/* Parameter Configuration & Disruption Injection Panel */}
      <ScenarioConfigPanel
        parameters={activeParams}
        presets={presetsQuery.data || []}
        isLoading={comparisonQuery.isFetching}
        onParametersChange={setActiveParams}
        onSelectPreset={handleSelectPreset}
        onResetToBaseline={handleResetToBaseline}
        onRunSimulation={handleRunSimulation}
      />

      {/* Advisory Proposal Success Banner */}
      {proposalSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-start justify-between gap-2 text-xs text-emerald-900">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Scenario Recovery Proposal Logged ({proposalSuccess.proposal_id}): </span>
              <span>{proposalSuccess.message}</span>
            </div>
          </div>
          <button
            onClick={() => setProposalSuccess(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-sm leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Operational Disclaimer Notice */}
      <div className="bg-amber-50 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">DECISION SUPPORT ENVIRONMENT: </span>
          <span>
            Synthetic-data demonstration. Simulation outputs represent discrete-event model dynamics under user-specified assumptions.
            Outputs are mathematical estimates for human evaluation and must not be cited as observed Chattogram Port Authority KPIs.
          </span>
        </div>
      </div>

      {/* Comparative KPI & Trade-off Strip */}
      <ScenarioComparisonCards
        comparisonData={compData}
        onOpenProposeModal={() => setIsProposeModalOpen(true)}
      />

      {/* Queue Dynamics & Occupancy Time Series Chart */}
      <QueueDynamicsChart
        baselineRun={compData.baseline_run}
        alternativeRun={currentAltRun}
      />

      {/* Vessel Event Trajectory Logs Table */}
      <VesselEventLogsTable logs={currentAltRun.vessel_logs} />

      {/* Advisory Propose Modal */}
      <ProposeScenarioModal
        isOpen={isProposeModalOpen}
        simulationRun={currentAltRun}
        onClose={() => setIsProposeModalOpen(false)}
        onSuccess={(data) => {
          setIsProposeModalOpen(false);
          setProposalSuccess(data);
        }}
      />
    </div>
  );
}

