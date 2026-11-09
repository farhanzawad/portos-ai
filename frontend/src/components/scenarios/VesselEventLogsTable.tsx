"use client";

import React, { useState } from "react";
import { VesselSimulationLog } from "@/types/api";
import { Ship, Clock, Search, ListFilter } from "lucide-react";

interface VesselEventLogsTableProps {
  logs: VesselSimulationLog[];
}

export function VesselEventLogsTable({ logs }: VesselEventLogsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = logs.filter(
    (l) =>
      l.vessel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.call_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden font-sans">
      {/* Table Header Controls */}
      <div className="p-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Ship className="h-4 w-4 text-sky-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Simulated Vessel Trajectory & Event Logs
          </h2>
          <span className="text-xs text-slate-500 font-medium tabular-nums">
            ({logs.length} calls simulated)
          </span>
        </div>

        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Filter vessel or call ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-sky-500 w-52"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] text-slate-500 font-semibold sticky top-0">
              <th className="p-2.5 pl-4 font-bold text-slate-900">Vessel Call</th>
              <th className="p-2.5">Arrival (T+)</th>
              <th className="p-2.5">Berth (T+)</th>
              <th className="p-2.5">Departure (T+)</th>
              <th className="p-2.5">Queue Delay</th>
              <th className="p-2.5">Handling Time</th>
              <th className="p-2.5 pr-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-[11px] tabular-nums font-medium">
            {filteredLogs.map((log) => (
              <tr key={log.vessel_id} className="hover:bg-slate-50/70 transition-colors">
                <td className="p-2.5 pl-4">
                  <span className="font-sans font-semibold text-portos-navy block">
                    {log.vessel_name}
                  </span>
                  <span className="text-[10px] text-portos-muted">{log.call_number}</span>
                </td>
                <td className="p-2.5 text-portos-navy font-semibold">{log.arrival_hour}h</td>
                <td className="p-2.5 text-portos-navy">{log.berth_hour ? `${log.berth_hour}h` : "—"}</td>
                <td className="p-2.5 text-portos-navy">{log.departure_hour ? `${log.departure_hour}h` : "—"}</td>
                <td className="p-2.5">
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      log.waiting_time_hours > 5.0
                        ? "bg-rose-50 text-rose-700"
                        : log.waiting_time_hours > 2.0
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {log.waiting_time_hours.toFixed(1)}h
                  </span>
                </td>
                <td className="p-2.5 text-portos-muted">{log.service_duration_hours}h</td>
                <td className="p-2.5 pr-4 text-right">
                  <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px]">
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

