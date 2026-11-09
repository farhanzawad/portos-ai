import React from "react";
import { BerthPlannerView } from "@/components/berth-planner/BerthPlannerView";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { Compass, CalendarRange } from "lucide-react";

export default function BerthPlannerPage() {
  return (
    <div className="space-y-6 sm:space-y-7 font-sans">
      {/* Executive Clean Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100">
              <CalendarRange className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Intelligent Berth Planner
                </h1>
                <DataStatusBadge status="SIMULATED" size="sm" />
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Mathematical berth allocation, constraint validation, and multi-objective scheduling using Google OR-Tools CP-SAT.
              </p>
            </div>
          </div>
        </div>

        {/* Corridor Context Pill */}
        <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3.5 py-1.5 rounded-full border border-slate-200 shadow-2xs shrink-0">
          <Compass className="h-3.5 w-3.5 text-sky-600" />
          <span>Corridor: <strong className="text-slate-900 font-semibold">CCT / NCT Karnaphuli</strong></span>
          <span className="text-slate-300 font-bold">•</span>
          <span className="text-sky-700 font-semibold">Tide: High Gate</span>
        </div>
      </div>

      <BerthPlannerView />
    </div>
  );
}
