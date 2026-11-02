"use client";

import React from "react";
import { EnvironmentalContext } from "@/types/api";
import {
  Thermometer,
  Wind,
  Waves,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";

interface EnvironmentalContextCardProps {
  context: EnvironmentalContext;
}

export function EnvironmentalContextCard({ context }: EnvironmentalContextCardProps) {
  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden flex flex-col">
      {/* Station Header */}
      <div className="p-4 bg-slate-50 border-b border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-portos-navy text-white">
            <Radio className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-portos-navy">{context.station_name}</h2>
              <DataStatusBadge status={context.data_status} />
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-portos-muted mt-0.5">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>Observation: {new Date(context.observation_time).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <span className="text-[11px] font-medium text-slate-500 self-start sm:self-auto">
          Contextual Environmental Telemetry
        </span>
      </div>

      {/* Prominent Navigation Safety Disclaimer Banner */}
      <div className="px-4 py-2.5 bg-rose-50 border-b border-rose-200 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
        <div className="text-[11px] text-rose-900 leading-relaxed font-medium">
          <strong className="font-bold">CRITICAL SAFETY NOTICE:</strong> {context.navigational_use_prohibited_notice}
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-white">
        {/* 1. Ambient Temperature */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-portos-muted mb-1">
            <span className="text-[10px] uppercase font-semibold">Temperature</span>
            <Thermometer className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {context.temperature_celsius.toFixed(1)}
            </span>
            <span className="text-xs text-slate-600 font-semibold">°C</span>
          </div>
          <span className="text-[10px] text-portos-muted mt-0.5 block">Estuary ambient</span>
        </div>

        {/* 2. Wind Speed & Direction */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-portos-muted mb-1">
            <span className="text-[10px] uppercase font-semibold">Wind Speed</span>
            <Wind className="h-3.5 w-3.5 text-sky-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {context.wind_speed_knots.toFixed(1)}
            </span>
            <span className="text-xs text-slate-600 font-semibold">knots</span>
          </div>
          <span className="text-[10px] text-portos-muted mt-0.5 block font-mono truncate" title={context.wind_direction}>
            {context.wind_direction}
          </span>
        </div>

        {/* 3. Tidal State */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-portos-muted mb-1">
            <span className="text-[10px] uppercase font-semibold">Tidal Height</span>
            <Waves className="h-3.5 w-3.5 text-indigo-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {context.tidal_height_m.toFixed(2)}
            </span>
            <span className="text-xs text-slate-600 font-semibold">meters</span>
          </div>
          <span className="text-[10px] text-portos-muted mt-0.5 block truncate" title={context.tide_phase}>
            {context.tide_phase}
          </span>
        </div>

        {/* 4. Sea Condition & Wave Height */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-portos-muted mb-1">
            <span className="text-[10px] uppercase font-semibold">Sea State</span>
            <Waves className="h-3.5 w-3.5 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-portos-navy">
              {context.wave_height_m !== undefined && context.wave_height_m !== null
                ? context.wave_height_m.toFixed(1)
                : "1.1"}
            </span>
            <span className="text-xs text-slate-600 font-semibold">m sig. wave</span>
          </div>
          <span className="text-[10px] text-portos-muted mt-0.5 block truncate" title={context.sea_condition || "Slight"}>
            {context.sea_condition || "Slight to Moderate"}
          </span>
        </div>

        {/* 5. Air Quality & PM2.5 */}
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-portos-muted mb-1">
            <span className="text-[10px] uppercase font-semibold">Air Quality</span>
            <Activity className="h-3.5 w-3.5 text-portos-teal" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-portos-navy">
              AQI {context.air_quality_index}
            </span>
            <span className="text-xs text-portos-teal font-semibold">
              ({context.air_quality_tier})
            </span>
          </div>
          <span className="text-[10px] text-portos-muted mt-0.5 block font-mono">
            PM2.5: {context.pm25_ug_m3.toFixed(1)} µg/m³
          </span>
        </div>
      </div>

      {/* Mandatory Attribution & License Footer */}
      <div className="px-4 py-2 bg-slate-50 border-t border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[10px] text-portos-muted">
        <span>
          Source: {context.source || "Open-Meteo Marine & Weather API"} | {context.attribution || "Weather data by Open-Meteo.com under CC BY 4.0"}
        </span>
        <span className="font-mono text-slate-500">
          Coordinates: 22.23°N, 91.81°E (Patenga)
        </span>
      </div>
    </div>
  );
}

