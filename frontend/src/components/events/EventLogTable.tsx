"use client";

import React, { useState } from "react";
import { EventMessage } from "@/types/api";
import { useEventStream } from "@/context/EventStreamContext";
import {
  Activity,
  Search,
  Filter,
  Trash2,
  Code,
  Clock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function EventLogTable() {
  const { events, clearEventLog } = useEventStream();
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const filteredEvents = events.filter((e) => {
    if (filterType !== "ALL" && e.event_type !== filterType) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        e.id.toLowerCase().includes(term) ||
        e.event_type.toLowerCase().includes(term) ||
        e.entity_id.toLowerCase().includes(term) ||
        e.origin.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const getOriginBadge = (origin: string) => {
    let color = "bg-slate-100 text-slate-700 border-slate-200";
    if (origin.includes("INJECTOR")) color = "bg-rose-50 text-rose-700 border-rose-200";
    if (origin.includes("SCIKIT") || origin.includes("ML")) color = "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (origin.includes("OR_TOOLS") || origin.includes("OPTIMIZER")) color = "bg-sky-50 text-sky-700 border-sky-200";
    if (origin.includes("SIMPY") || origin.includes("SIMULATION")) color = "bg-indigo-50 text-indigo-700 border-indigo-200";
    if (origin.includes("AIS")) color = "bg-amber-50 text-amber-700 border-amber-200";

    return (
      <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-mono border ${color}`}>
        {origin}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden text-xs">
      {/* Table Header Controls */}
      <div className="p-3 bg-slate-50 border-b border-portos-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-portos-navy" />
          <h3 className="font-bold text-portos-navy text-xs uppercase tracking-wider">
            Live Operational Event Bus Log
          </h3>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white border border-slate-300 text-slate-700">
            {filteredEvents.length} events
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Box */}
          <div className="relative">
            <Search className="h-3 w-3 absolute left-2 top-2 text-portos-muted" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-2 py-1 text-xs bg-white border border-portos-border rounded focus:outline-none focus:ring-1 focus:ring-portos-teal w-36 sm:w-44"
            />
          </div>

          {/* Filter Dropdown */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1 text-xs bg-white border border-portos-border rounded focus:outline-none focus:ring-1 focus:ring-portos-teal text-slate-700"
          >
            <option value="ALL">All Event Types</option>
            <option value="incident.injected">incident.injected</option>
            <option value="vessel.delay.risk.changed">vessel.delay.risk.changed</option>
            <option value="vessel.position.updated">vessel.position.updated</option>
            <option value="vessel.eta.prediction.created">vessel.eta.prediction.created</option>
            <option value="operational.alert.created">operational.alert.created</option>
            <option value="incident.reset">incident.reset</option>
          </select>

          {/* Clear Log Button */}
          <button
            onClick={clearEventLog}
            className="p-1 rounded text-slate-500 hover:text-rose-700 hover:bg-slate-100 transition-colors"
            title="Clear Event Log View"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Table Feed */}
      <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/60 border-b border-portos-border text-[10px] font-bold uppercase tracking-wider text-portos-muted">
              <th className="py-2 px-3">Event ID</th>
              <th className="py-2 px-3">Event Type</th>
              <th className="py-2 px-3">Entity ID</th>
              <th className="py-2 px-3">Origin</th>
              <th className="py-2 px-3">Emitted Time</th>
              <th className="py-2 px-3 text-right">Payload</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-portos-muted font-sans text-xs">
                  No events received yet. Injected incidents and terminal telemetry will appear here in real-time.
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const isSelected = selectedEventId === evt.id;
                return (
                  <React.Fragment key={evt.id}>
                    <tr
                      className={`hover:bg-slate-50 transition-colors ${
                        isSelected ? "bg-slate-50" : ""
                      }`}
                    >
                      <td className="py-2 px-3 font-semibold text-portos-navy">{evt.id}</td>
                      <td className="py-2 px-3">
                        <span className="font-semibold text-portos-navy font-sans">
                          {evt.event_type}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-slate-600">{evt.entity_id}</td>
                      <td className="py-2 px-3">{getOriginBadge(evt.origin)}</td>
                      <td className="py-2 px-3 text-portos-muted font-sans text-[10px]">
                        {new Date(evt.emitted_at).toLocaleTimeString()}
                      </td>
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => setSelectedEventId(isSelected ? null : evt.id)}
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-white border border-slate-200 text-portos-navy hover:bg-slate-100 text-[10px] font-sans font-medium"
                        >
                          <Code className="h-3 w-3 text-slate-500" />
                          <span>{isSelected ? "Hide" : "Inspect"}</span>
                          {isSelected ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </td>
                    </tr>
                    {isSelected && (
                      <tr className="bg-slate-50/70 border-b border-slate-200">
                        <td colSpan={6} className="p-3">
                          <div className="bg-white p-2.5 rounded border border-slate-200 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-portos-muted font-sans">
                              <span>Payload Version: {evt.payload_schema_version}</span>
                              <span>Data Status: {evt.data_status}</span>
                            </div>
                            <pre className="text-[10px] text-slate-800 overflow-x-auto p-2 bg-slate-50 rounded">
                              {JSON.stringify(evt.payload, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

