"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ScenarioParameters,
  ScenarioRead,
  ScenarioComparisonResponse,
  SimulationRunResponse,
  ScenarioAnalystResponse,
  ProposeScenarioResponse,
  ScenarioCreateRequest,
} from "@/types/api";
import { ScenarioHeader } from "./ScenarioHeader";
import { ScenarioMacroLevers } from "./ScenarioMacroLevers";
import { SimulationGisMap } from "./SimulationGisMap";
import { ScenarioKpiDashboard } from "./ScenarioKpiDashboard";
import { ScenarioComparisonTable } from "./ScenarioComparisonTable";
import { ScenarioAnalystDrawer } from "./ScenarioAnalystDrawer";
import { ProposeScenarioModal } from "./ProposeScenarioModal";
import { SaveScenarioModal } from "./SaveScenarioModal";
import {
  Map,
  BarChart3,
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
} from "lucide-react";

export function ScenarioLabView() {
  const queryClient = useQueryClient();

  // Active Scenario & Modeler State
  const [activeScenarioId, setActiveScenarioId] = useState<string>("preset_inbound_feeder_surge");
  const [activeParameters, setActiveParameters] = useState<ScenarioParameters>({
    scenario_code: "inbound_feeder_surge",
    scenario_name: "Pre-Eid Inbound Feeder Surge (+30%)",
    description: "Seasonal transshipment cargo surge from Colombo/Singapore.",
    is_baseline: false,
    random_seed: 42,
    duration_hours: 72.0,
    target_reliability_pct: 80.0,
    delay_threshold_hours: 4.0,
    vessel_arrival_multiplier: 1.30,
    arrival_surge_pct: 30.0,
    arrival_concentration: "MORNING_PEAK",
    berth_outage_count: 0,
    crane_outage_count: 0,
    crane_service_rate_multiplier: 1.0,
    weather_disruption_factor: 1.0,
    yard_initial_occupancy_pct: 72.0,
    yard_congestion_threshold_pct: 85.0,
  });

  // Center Tab State: GIS Layer | KPI Dashboard | Scenario Comparison
  const [activeCenterTab, setActiveCenterTab] = useState<"GIS" | "KPI" | "COMPARISON">("GIS");

  // Sensitivity Mode & UI Modals
  const [sensitivityMode, setSensitivityMode] = useState<boolean>(true);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isProposeModalOpen, setIsProposeModalOpen] = useState(false);
  const [proposalSuccess, setProposalSuccess] = useState<ProposeScenarioResponse | null>(null);

  // Playback Scrubber State for GIS Map
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentHour, setCurrentHour] = useState<number>(18.0);

  // 1. Fetch All Scenarios (Presets + Saved from DB)
  const scenariosQuery = useQuery<ScenarioRead[]>({
    queryKey: ["scenarios-list"],
    queryFn: async () => {
      const res = await fetch("/api/v1/scenarios");
      if (!res.ok) throw new Error("Failed to load scenario list");
      return res.json();
    },
  });

  // 2. Fetch/Execute Comparative Simulation (Baseline vs Active Scenario)
  const comparisonQuery = useQuery<ScenarioComparisonResponse>({
    queryKey: ["scenario-comparison", activeParameters],
    queryFn: async () => {
      const res = await fetch("/api/v1/scenarios/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alternative_scenarios: [activeParameters],
        }),
      });
      if (!res.ok) throw new Error("SimPy discrete-event simulation failed");
      return res.json();
    },
  });

  const baseRun = comparisonQuery.data?.baseline_run;
  const activeRun = comparisonQuery.data?.alternative_runs[0] || baseRun;

  // 3. AI Scenario Analyst Query
  const analystQuery = useQuery<ScenarioAnalystResponse>({
    queryKey: ["scenario-analyst", activeParameters.scenario_code, activeRun?.run_id],
    queryFn: async () => {
      if (!baseRun || !activeRun) throw new Error("Awaiting simulation run");
      const res = await fetch("/api/v1/scenarios/analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenario_code: activeParameters.scenario_code,
          baseline_run: baseRun,
          scenario_run: activeRun,
        }),
      });
      if (!res.ok) throw new Error("AI Scenario Analyst request failed");
      return res.json();
    },
    enabled: !!baseRun && !!activeRun,
  });

  // Playback timer ticker for GIS Layer
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentHour((prev) => {
        const next = prev + 0.5 * playbackSpeed;
        if (next >= (activeRun?.duration_hours || 72.0)) {
          return 0.0;
        }
        return next;
      });
    }, 280);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, activeRun?.duration_hours]);

  // Handle Scenario Selection from Header Dropdown
  const handleSelectScenario = (id: string) => {
    setActiveScenarioId(id);
    const scen = scenariosQuery.data?.find((s) => s.id === id);
    if (scen) {
      setActiveParameters({ ...scen.parameters });
      setCurrentHour(12.0);
    }
  };

  // Reset to Nominal Baseline
  const handleResetToBaseline = () => {
    const basePreset = scenariosQuery.data?.find((s) => s.is_baseline);
    if (basePreset) {
      setActiveParameters({
        ...basePreset.parameters,
        is_baseline: false,
        scenario_name: "Modified Baseline",
        scenario_code: "custom_baseline_mod",
      });
    }
  };

  // Duplicate Current Scenario Mutation
  const duplicateMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/v1/scenarios/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to duplicate scenario");
      return res.json();
    },
    onSuccess: (newScen: ScenarioRead) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-list"] });
      setActiveScenarioId(newScen.id);
      setActiveParameters({ ...newScen.parameters });
    },
  });

  // Save Custom Scenario Mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: ScenarioCreateRequest) => {
      const res = await fetch("/api/v1/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save scenario");
      return res.json();
    },
    onSuccess: (newScen: ScenarioRead) => {
      queryClient.invalidateQueries({ queryKey: ["scenarios-list"] });
      setActiveScenarioId(newScen.id);
      setActiveParameters({ ...newScen.parameters });
      setIsSaveModalOpen(false);
    },
  });

  const isLoading = scenariosQuery.isLoading || comparisonQuery.isLoading;

  if (isLoading && !comparisonQuery.data) {
    return (
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-16 text-center shadow-sm text-slate-100 font-sans">
        <RefreshCw className="h-8 w-8 text-sky-400 animate-spin mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">
          Initializing SimPy Discrete-Event Simulation Runtime...
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Calibrating terminal resources: 6 quayside berths, 5 STS/RTG cranes, outer anchorage queue dynamics, and Green Port emissions accounting.
        </p>
      </div>
    );
  }

  if (comparisonQuery.isError || !comparisonQuery.data) {
    return (
      <div className="bg-rose-950/40 border border-rose-900/60 rounded-3xl p-8 text-center text-rose-200">
        <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-2" />
        <h3 className="font-bold text-sm">Simulation Engine Failure</h3>
        <p className="text-xs text-rose-300/80 mt-1">
          {comparisonQuery.error instanceof Error
            ? comparisonQuery.error.message
            : "An error occurred during SimPy simulation execution."}
        </p>
        <button
          onClick={() => comparisonQuery.refetch()}
          className="mt-4 px-4 py-2 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
        >
          Retry Simulation Run
        </button>
      </div>
    );
  }

  const compData = comparisonQuery.data;
  const currentActiveRun = compData.alternative_runs[0] || compData.baseline_run;

  return (
    <div className="space-y-4">
      {/* Top Header & Scenario Selector Bar */}
      <ScenarioHeader
        scenarios={scenariosQuery.data || []}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        sensitivityMode={sensitivityMode}
        onToggleSensitivity={() => setSensitivityMode(!sensitivityMode)}
        onOpenCreateModal={() => setIsSaveModalOpen(true)}
        onDuplicateScenario={() => duplicateMutation.mutate(activeScenarioId)}
        onOpenSaveModal={() => setIsSaveModalOpen(true)}
      />

      {/* Advisory Proposal Success Notice */}
      {proposalSuccess && (
        <div className="bg-slate-900 border border-sky-500/40 rounded-xl p-3.5 flex items-start justify-between gap-3 text-xs text-slate-200 shadow-md animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sky-300">
                Advisory Proposal Logged ({proposalSuccess.proposal_id}):{" "}
              </span>
              <span>{proposalSuccess.message}</span>
            </div>
          </div>
          <button
            onClick={() => setProposalSuccess(null)}
            className="text-slate-400 hover:text-white font-bold p-1 leading-none text-base"
          >
            &times;
          </button>
        </div>
      )}

      {/* Primary 3-Column Decision Lab Workspace (Sentient Ports Architecture) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Macro Levers Panel (4 cols on lg, 3 cols on xl) */}
        <div className="lg:col-span-4 xl:col-span-3">
          <ScenarioMacroLevers
            parameters={activeParameters}
            presets={scenariosQuery.data?.map((s) => s.parameters) || []}
            isLoading={comparisonQuery.isFetching}
            onParametersChange={setActiveParameters}
            onResetToBaseline={handleResetToBaseline}
            onRunSimulation={() => comparisonQuery.refetch()}
            onOpenSaveModal={() => setIsSaveModalOpen(true)}
            sensitivityMode={sensitivityMode}
          />
        </div>

        {/* Center Column: 3 Top Tabs (GIS Layer | KPI Dashboard | Scenario Comparison) (5 cols on lg, 6 cols on xl) */}
        <div className="lg:col-span-8 xl:col-span-6 space-y-4">
          {/* Top Center Workspace Tab Switcher */}
          <div className="flex items-center justify-between p-1.5 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-sm">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveCenterTab("GIS")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCenterTab === "GIS"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Map className="h-3.5 w-3.5" />
                <span>GIS Layer</span>
              </button>

              <button
                onClick={() => setActiveCenterTab("KPI")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCenterTab === "KPI"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>KPI</span>
              </button>

              <button
                onClick={() => setActiveCenterTab("COMPARISON")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeCenterTab === "COMPARISON"
                    ? "bg-sky-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Scenario Comparison</span>
              </button>
            </div>

            <div className="pr-3 text-[11px] text-slate-400 font-medium hidden sm:inline tabular-nums">
              SimPy Seed: {currentActiveRun.random_seed}
            </div>
          </div>

          {/* Tab 1: GIS Layer (Interactive Simulation Playback Map) */}
          {activeCenterTab === "GIS" && (
            <SimulationGisMap
              simulationRun={currentActiveRun}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              currentHour={currentHour}
              onTogglePlay={() => setIsPlaying(!isPlaying)}
              onSpeedChange={setPlaybackSpeed}
              onHourChange={setCurrentHour}
              onRunSimulation={() => comparisonQuery.refetch()}
              isSimulating={comparisonQuery.isFetching}
            />
          )}

          {/* Tab 2: KPI Dashboard (ECharts & Efficiency Visualizations) */}
          {activeCenterTab === "KPI" && (
            <ScenarioKpiDashboard
              baselineRun={compData.baseline_run}
              activeRun={currentActiveRun}
            />
          )}

          {/* Tab 3: Scenario Comparison Table */}
          {activeCenterTab === "COMPARISON" && (
            <ScenarioComparisonTable
              comparisonData={compData}
              onOpenProposeModal={() => setIsProposeModalOpen(true)}
            />
          )}
        </div>

        {/* Right Column: Output Summary & Comments (AI Scenario Analyst) (3 cols on xl, full width below xl) */}
        <div className="lg:col-span-12 xl:col-span-3">
          <ScenarioAnalystDrawer
            baselineRun={compData.baseline_run}
            scenarioRun={currentActiveRun}
            analystData={analystQuery.data || null}
            isLoading={analystQuery.isFetching}
            onRefreshAnalyst={() => analystQuery.refetch()}
            onOpenProposeModal={() => setIsProposeModalOpen(true)}
          />
        </div>
      </div>

      {/* Save Scenario Modal */}
      <SaveScenarioModal
        isOpen={isSaveModalOpen}
        parameters={activeParameters}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={async (payload) => {
          await saveMutation.mutateAsync(payload);
        }}
        isSaving={saveMutation.isPending}
      />

      {/* Propose Scenario for Harbour Master Review Modal */}
      <ProposeScenarioModal
        isOpen={isProposeModalOpen}
        simulationRun={currentActiveRun}
        onClose={() => setIsProposeModalOpen(false)}
        onSuccess={(data) => {
          setIsProposeModalOpen(false);
          setProposalSuccess(data);
        }}
      />
    </div>
  );
}
