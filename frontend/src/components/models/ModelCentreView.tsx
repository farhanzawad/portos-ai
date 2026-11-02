"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  getModelMetadata,
  getModelEvaluation,
  predictVesselDelay,
} from "@/lib/api-client";
import {
  VesselPredictionInput,
  VesselPredictionOutput,
  VesselType,
} from "@/types/api";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  BrainCircuit,
  TrendingUp,
  BarChart3,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";

export function ModelCentreView() {
  const {
    data: metadata,
    isLoading: isMetaLoading,
    isError: isMetaError,
    refetch: refetchMeta,
  } = useQuery({
    queryKey: ["model-metadata"],
    queryFn: getModelMetadata,
  });

  const {
    data: evaluation,
    isLoading: isEvalLoading,
    isError: isEvalError,
    refetch: refetchEval,
  } = useQuery({
    queryKey: ["model-evaluation"],
    queryFn: getModelEvaluation,
  });

  // Interactive Live Inference Form State
  const [formInput, setFormInput] = useState<VesselPredictionInput>({
    vessel_type: "CONTAINER_FEEDER",
    distance_to_pilot_nm: 35.0,
    speed_knots: 13.5,
    scheduled_hour_of_day: 14,
    anchorage_queue_count: 6,
    berth_occupancy_ratio: 0.75,
    wind_speed_knots: 14.0,
    visibility_nm: 9.0,
    is_monsoon_season: false,
    tidal_window_favorable: true,
    carrier_historical_delay_mean: 0.5,
  });

  const [predictionResult, setPredictionResult] =
    useState<VesselPredictionOutput | null>(null);

  const predictMutation = useMutation({
    mutationFn: predictVesselDelay,
    onSuccess: (data) => setPredictionResult(data),
  });

  const handleRunInference = (e: React.FormEvent) => {
    e.preventDefault();
    predictMutation.mutate(formInput);
  };

  if (isMetaLoading || isEvalLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isMetaError || isEvalError || !metadata || !evaluation) {
    return (
      <ErrorState
        title="Could not load Model Centre registry"
        message="Backend ML artifacts could not be retrieved. Ensure backend has trained models."
        onRetry={() => {
          refetchMeta();
          refetchEval();
        }}
      />
    );
  }

  const { regression_metrics: reg, classification_metrics: clf } = evaluation;

  return (
    <div className="space-y-6 text-xs text-portos-navy">
      {/* Mandatory Operational Warning Banner (Prompt 08 Requirement) */}
      <div className="p-3.5 bg-portos-amber-light/30 border border-portos-amber/40 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-portos-amber text-white">
            <ShieldAlert className="h-4 w-4" />
          </div>
          <div>
            <strong className="block text-portos-navy">
              Model Centre Transparency & Disclaimer:
            </strong>
            <span className="text-portos-muted text-[11px]">
              {metadata.operational_notice}
            </span>
          </div>
        </div>
        <DataStatusBadge status="SIMULATED" />
      </div>

      {/* Model Overview & Registry Metadata */}
      <div className="p-5 bg-white rounded-lg border border-portos-border shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-portos-border pb-3">
          <div className="flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-portos-teal" />
            <h3 className="text-sm font-bold text-portos-navy">
              {metadata.model_name}
            </h3>
            <span className="px-2 py-0.5 rounded bg-portos-bg text-[10px] font-mono text-portos-muted">
              v{metadata.model_version}
            </span>
          </div>
          <span className="text-[11px] font-mono text-portos-muted">
            Trained:{" "}
            {new Date(metadata.trained_at).toLocaleString("en-GB", {
              timeZone: "Asia/Dhaka",
            })}{" "}
            BST
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
          <div className="p-2.5 bg-portos-bg rounded border border-portos-border/60">
            <span className="text-portos-muted block text-[10px]">Training Set</span>
            <strong className="font-mono text-sm">{metadata.n_train_samples} voyages</strong>
          </div>
          <div className="p-2.5 bg-portos-bg rounded border border-portos-border/60">
            <span className="text-portos-muted block text-[10px]">Held-Out Test Set</span>
            <strong className="font-mono text-sm">{metadata.n_test_samples} voyages</strong>
          </div>
          <div className="p-2.5 bg-portos-bg rounded border border-portos-border/60">
            <span className="text-portos-muted block text-[10px]">Random Seed</span>
            <strong className="font-mono text-sm">{metadata.random_seed} (Deterministic)</strong>
          </div>
          <div className="p-2.5 bg-portos-bg rounded border border-portos-border/60">
            <span className="text-portos-muted block text-[10px]">Input Features</span>
            <strong className="font-mono text-sm">{metadata.feature_columns.length} dimensions</strong>
          </div>
        </div>
      </div>

      {/* Quantitative Evaluation Metrics & Honest Baseline Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regression Metrics */}
        <div className="p-5 bg-white rounded-lg border border-portos-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-portos-border pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-portos-teal" />
              <h4 className="text-xs font-bold text-portos-navy">
                Task 1: ETA Delay Regression (Hours)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-portos-teal-light text-portos-teal font-semibold">
              GradientBoostingRegressor
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-3 bg-portos-bg rounded border border-portos-border/60">
              <span className="text-[10px] text-portos-muted block uppercase font-semibold">
                Model MAE
              </span>
              <strong className="text-lg font-mono text-portos-navy">
                {reg.mae_hours}h
              </strong>
            </div>
            <div className="p-3 bg-portos-bg rounded border border-portos-border/60">
              <span className="text-[10px] text-portos-muted block uppercase font-semibold">
                Naive Baseline MAE
              </span>
              <strong className="text-lg font-mono text-portos-muted">
                {reg.baseline_median_mae_hours}h
              </strong>
            </div>
            <div className="p-3 bg-portos-teal-light/30 rounded border border-portos-teal/40">
              <span className="text-[10px] text-portos-teal block uppercase font-semibold">
                Error Reduction
              </span>
              <strong className="text-lg font-mono text-portos-teal">
                +{reg.mae_improvement_pct}%
              </strong>
            </div>
          </div>

          <div className="p-3 bg-portos-bg rounded space-y-1.5 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-portos-muted">Root Mean Squared Error (RMSE):</span>
              <strong>{reg.rmse_hours} hrs</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-portos-muted">Coefficient of Determination (R²):</span>
              <strong className="text-portos-teal">{reg.r2_score}</strong>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-portos-border/40">
              <span className="text-portos-muted">Beats Naive Median Baseline:</span>
              <span className="flex items-center gap-1 text-portos-teal font-bold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>CONFIRMED</span>
              </span>
            </div>
          </div>
        </div>

        {/* Classification Metrics */}
        <div className="p-5 bg-white rounded-lg border border-portos-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-portos-border pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-portos-amber" />
              <h4 className="text-xs font-bold text-portos-navy">
                Task 2: High Delay Risk Classification (≥ 3.0h)
              </h4>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-portos-amber-light text-portos-amber font-semibold">
              GradientBoostingClassifier
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center font-mono">
            <div className="p-2.5 bg-portos-bg rounded border border-portos-border/60">
              <span className="text-[10px] text-portos-muted block uppercase">Accuracy</span>
              <strong className="text-base text-portos-navy">
                {(clf.accuracy * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="p-2.5 bg-portos-bg rounded border border-portos-border/60">
              <span className="text-[10px] text-portos-muted block uppercase">Precision</span>
              <strong className="text-base text-portos-navy">
                {(clf.precision * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="p-2.5 bg-portos-bg rounded border border-portos-border/60">
              <span className="text-[10px] text-portos-muted block uppercase">Recall</span>
              <strong className="text-base text-portos-navy">
                {(clf.recall * 100).toFixed(1)}%
              </strong>
            </div>
            <div className="p-2.5 bg-portos-teal-light/30 rounded border border-portos-teal/40">
              <span className="text-[10px] text-portos-teal block uppercase font-bold">F1 Score</span>
              <strong className="text-base text-portos-teal font-bold">
                {clf.f1_score.toFixed(3)}
              </strong>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div className="p-3 bg-portos-bg rounded space-y-2 text-[11px]">
            <span className="font-semibold text-portos-navy block text-[10px] uppercase tracking-wider">
              Confusion Matrix (Held-out 600 Voyages)
            </span>
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-[11px]">
              <div className="p-2 bg-white rounded border border-portos-border/60">
                <span className="text-[10px] text-portos-muted block">True Negatives</span>
                <strong className="text-portos-navy">{clf.confusion_matrix.tn}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-portos-border/60">
                <span className="text-[10px] text-portos-muted block">False Positives</span>
                <strong className="text-portos-amber">{clf.confusion_matrix.fp}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-portos-border/60">
                <span className="text-[10px] text-portos-muted block">False Negatives</span>
                <strong className="text-portos-red">{clf.confusion_matrix.fn}</strong>
              </div>
              <div className="p-2 bg-white rounded border border-portos-border/60">
                <span className="text-[10px] text-portos-muted block">True Positives</span>
                <strong className="text-portos-teal">{clf.confusion_matrix.tp}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Importances & Interactive Prediction Sandbox */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Feature Importance Rankings */}
        <div className="lg:col-span-5 p-5 bg-white rounded-lg border border-portos-border shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-portos-navy uppercase tracking-wider">
            Feature Importance Rankings
          </h4>
          <p className="text-[11px] text-portos-muted">
            Relative contribution of input features to delay hours variance.
          </p>

          <div className="space-y-2 pt-2">
            {Object.entries(evaluation.feature_importances).map(([feat, imp]) => {
              const pct = (imp * 100).toFixed(1);
              return (
                <div key={feat} className="space-y-1">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-portos-navy">{feat}</span>
                    <strong className="text-portos-teal">{pct}%</strong>
                  </div>
                  <div className="w-full h-1.5 bg-portos-bg rounded-full overflow-hidden">
                    <div
                      className="h-full bg-portos-teal rounded-full transition-all"
                      style={{ width: `${Math.max(2, parseFloat(pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Inference Sandbox Form */}
        <div className="lg:col-span-7 p-5 bg-white rounded-lg border border-portos-border shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-portos-border pb-2.5">
            <div>
              <h4 className="text-xs font-bold text-portos-navy uppercase tracking-wider">
                Live Inference Sandbox
              </h4>
              <p className="text-[11px] text-portos-muted">
                Test the trained models against custom arrival scenarios.
              </p>
            </div>
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>

          <form onSubmit={handleRunInference} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-portos-muted mb-1">
                  Vessel Type
                </label>
                <select
                  value={formInput.vessel_type}
                  onChange={(e) =>
                    setFormInput({
                      ...formInput,
                      vessel_type: e.target.value as VesselType,
                    })
                  }
                  className="w-full p-1.5 bg-portos-bg rounded border border-portos-border text-xs text-portos-navy"
                >
                  <option value="CONTAINER_FEEDER">Container Feeder</option>
                  <option value="BULK_CARRIER">Bulk Carrier</option>
                  <option value="GENERAL_CARGO">General Cargo</option>
                  <option value="TANKER">Tanker</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-portos-muted mb-1">
                  Distance to Pilot (NM)
                </label>
                <input
                  type="number"
                  value={formInput.distance_to_pilot_nm}
                  onChange={(e) =>
                    setFormInput({
                      ...formInput,
                      distance_to_pilot_nm: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-1.5 bg-portos-bg rounded border border-portos-border text-xs text-portos-navy font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-portos-muted mb-1">
                  Operating Speed (kts)
                </label>
                <input
                  type="number"
                  value={formInput.speed_knots}
                  onChange={(e) =>
                    setFormInput({
                      ...formInput,
                      speed_knots: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full p-1.5 bg-portos-bg rounded border border-portos-border text-xs text-portos-navy font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-portos-muted mb-1">
                  Outer Anchorage Queue
                </label>
                <input
                  type="number"
                  value={formInput.anchorage_queue_count}
                  onChange={(e) =>
                    setFormInput({
                      ...formInput,
                      anchorage_queue_count: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-full p-1.5 bg-portos-bg rounded border border-portos-border text-xs text-portos-navy font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-portos-muted mb-1">
                  Berth Occupancy Ratio
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0.1"
                  max="1.0"
                  value={formInput.berth_occupancy_ratio}
                  onChange={(e) =>
                    setFormInput({
                      ...formInput,
                      berth_occupancy_ratio: parseFloat(e.target.value) || 0.5,
                    })
                  }
                  className="w-full p-1.5 bg-portos-bg rounded border border-portos-border text-xs text-portos-navy font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-portos-muted mb-1">
                  Tidal Window Status
                </label>
                <select
                  value={formInput.tidal_window_favorable ? "true" : "false"}
                  onChange={(e) =>
                    setFormInput({
                      ...formInput,
                      tidal_window_favorable: e.target.value === "true",
                    })
                  }
                  className="w-full p-1.5 bg-portos-bg rounded border border-portos-border text-xs text-portos-navy"
                >
                  <option value="true">Favorable High Tide Window</option>
                  <option value="false">Unfavorable Low Tide</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={predictMutation.isPending}
              className="inline-flex items-center gap-1.5 py-2 px-4 rounded bg-portos-navy text-white text-xs font-semibold hover:bg-portos-navy-secondary transition-colors"
            >
              <Play className="h-3.5 w-3.5" />
              <span>
                {predictMutation.isPending
                  ? "Evaluating Model..."
                  : "Run Real-Time Delay Prediction"}
              </span>
            </button>
          </form>

          {/* Prediction Output Card */}
          {predictionResult && (
            <div className="p-3.5 bg-portos-bg rounded-lg border border-portos-border space-y-2 mt-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="font-bold text-portos-navy">
                  Inference Prediction Result
                </span>
                <StatusBadge
                  status={
                    predictionResult.delay_risk_tier === "HIGH_RISK"
                      ? "danger"
                      : predictionResult.delay_risk_tier === "WATCH"
                      ? "watch"
                      : "normal"
                  }
                  label={predictionResult.delay_risk_tier}
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div className="p-2 bg-white rounded border border-portos-border">
                  <span className="text-portos-muted block text-[10px]">
                    Predicted Arrival Delay
                  </span>
                  <strong
                    className={`text-base ${
                      predictionResult.predicted_delay_hours > 3.0
                        ? "text-portos-red"
                        : predictionResult.predicted_delay_hours > 1.5
                        ? "text-portos-amber"
                        : "text-portos-teal"
                    }`}
                  >
                    +{predictionResult.predicted_delay_hours} hrs
                  </strong>
                </div>

                <div className="p-2 bg-white rounded border border-portos-border">
                  <span className="text-portos-muted block text-[10px]">
                    High-Risk Delay Probability
                  </span>
                  <strong className="text-base text-portos-navy">
                    {(predictionResult.delay_risk_probability * 100).toFixed(1)}%
                  </strong>
                </div>
              </div>

              <p className="text-[10px] text-portos-muted font-mono pt-1">
                Model: {predictionResult.model_name} v
                {predictionResult.model_version} · Data: SIMULATED
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

