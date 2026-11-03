"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getResearchModelEvaluation } from "@/lib/api-client";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  Scale,
  Calendar,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Layers,
  BarChart,
  ShieldCheck,
} from "lucide-react";

export function ResearchEvaluationCard() {
  const { data: report, isLoading, isError, refetch } = useQuery({
    queryKey: ["research-model-evaluation"],
    queryFn: getResearchModelEvaluation,
  });

  if (isLoading) {
    return <CardSkeleton />;
  }

  if (isError || !report) {
    return (
      <div className="p-4 bg-white rounded-lg border border-portos-border text-xs space-y-2">
        <div className="flex items-center gap-2 text-rose-600 font-semibold">
          <AlertCircle className="h-4 w-4" />
          <span>Could not retrieve research-grade model evaluation report.</span>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1 bg-portos-navy text-white rounded text-xs hover:bg-slate-800"
        >
          Retry Evaluation
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 bg-white rounded-lg border border-portos-border shadow-xs space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-portos-border">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-md bg-portos-navy text-white">
            <Scale className="h-5 w-5 text-portos-teal" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-portos-navy">
                Research-Grade Evaluation: Expanding-Window Cross-Validation & Calibration
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 font-mono font-medium">
                LEAKAGE-FREE TEMPORAL SPLIT
              </span>
            </div>
            <p className="text-xs text-portos-muted mt-0.5">
              Rigorous 5-fold temporal expanding window (`TimeSeriesSplit`) evaluating ETA regression and delay probability calibration (ECE & Brier Score).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DataStatusBadge status="DERIVED" />
          <span className="text-[10px] font-mono bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
            {report.model_name} v{report.model_version}
          </span>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-portos-muted font-semibold uppercase block">Mean Temporal MAE</span>
          <div className="text-xl font-bold font-mono text-portos-navy mt-1">
            {report.mean_temporal_mae_hours.toFixed(2)}h
          </div>
          <span className="text-[10px] text-slate-400">Mean absolute error</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-portos-muted font-semibold uppercase block">Mean Temporal RMSE</span>
          <div className="text-xl font-bold font-mono text-portos-navy mt-1">
            {report.mean_temporal_rmse_hours.toFixed(2)}h
          </div>
          <span className="text-[10px] text-slate-400">Root mean squared error</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-portos-muted font-semibold uppercase block">Brier Score</span>
          <div className="text-xl font-bold font-mono text-portos-teal mt-1">
            {report.overall_brier_score.toFixed(3)}
          </div>
          <span className="text-[10px] text-slate-400">&lt; 0.25 beats random chance</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <span className="text-[10px] text-portos-muted font-semibold uppercase block">ECE (Calibration Error)</span>
          <div className="text-xl font-bold font-mono text-portos-teal mt-1">
            {(report.expected_calibration_error * 100).toFixed(1)}%
          </div>
          <span className="text-[10px] text-slate-400">&lt; 10% is well calibrated</span>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-portos-muted font-semibold uppercase block">Temporal Samples</span>
          <div className="text-xl font-bold font-mono text-portos-navy mt-1">
            {report.total_samples}
          </div>
          <span className="text-[10px] text-slate-400">Vessel arrival records</span>
        </div>
      </div>

      {/* 2-Column Split: Temporal Cross-Validation Table + Calibration Bins */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: 5-Fold Expanding Window Cross-Validation */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-portos-navy uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-portos-navy-secondary" />
              5-Fold Temporal Expanding Window
            </span>
            <span className="text-[10px] text-portos-muted font-mono">
              Strictly non-leaking TimeSeriesSplit
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="py-2 px-3">Fold</th>
                  <th className="py-2 px-3">Train Window</th>
                  <th className="py-2 px-3">Test Window</th>
                  <th className="py-2 px-3 text-right">MAE</th>
                  <th className="py-2 px-3 text-right">RMSE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {report.splits.map((split) => {
                  const maxSamples = report.total_samples;
                  const trainPct = Math.round((split.train_size / maxSamples) * 100);
                  const testPct = Math.round((split.test_size / maxSamples) * 100);

                  return (
                    <tr key={split.split_index} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-portos-navy">
                        Fold #{split.split_index}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-800">{split.train_size}</span>
                          <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-portos-navy" style={{ width: `${trainPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-800">{split.test_size}</span>
                          <div className="w-8 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-portos-teal" style={{ width: `${testPct}%` }} />
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-portos-teal font-semibold">
                        {split.mae_hours.toFixed(2)}h
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600">
                        {split.rmse_hours.toFixed(2)}h
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Probability Calibration (Reliability Diagram) */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-portos-navy uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              Probability Calibration & Reliability Curve
            </span>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {report.is_well_calibrated ? "WELL CALIBRATED" : "MODERATE CALIBRATION"}
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
                <tr>
                  <th className="py-2 px-3">Pred Range</th>
                  <th className="py-2 px-3">Mean Pred (p̂)</th>
                  <th className="py-2 px-3">Observed (ȳ)</th>
                  <th className="py-2 px-3 text-right">Samples</th>
                  <th className="py-2 px-3 text-right">Calibration Error</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {report.calibration_bins.map((bin, idx) => {
                  const error = Math.abs(bin.mean_predicted_probability - bin.fraction_of_positives);
                  const isLowError = error < 0.08;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 font-medium text-slate-600">
                        Bin #{bin.bin_index}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800">
                        {(bin.mean_predicted_probability * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-portos-navy">
                        {(bin.fraction_of_positives * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500">
                        {bin.sample_count}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          isLowError ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>
                          {(error * 100).toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Methodology & Data Provenance Footer */}
      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 leading-relaxed">
        <span className="font-semibold text-portos-navy">Methodology & Academic Governance: </span>
        {report.methodology_note}
      </div>
    </div>
  );
}
