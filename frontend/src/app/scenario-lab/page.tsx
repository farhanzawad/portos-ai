import React from "react";
import { Metadata } from "next";
import { ScenarioLabView } from "@/components/scenarios/ScenarioLabView";

export const metadata: Metadata = {
  title: "Scenario Planning & Decision Lab | PORTOS AI",
  description:
    "Discrete-event terminal disruption simulation and AI decision support powered by SimPy for Chattogram Port operations.",
};

export default function ScenarioLabPage() {
  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 space-y-4 bg-[#0a0c10] text-[#e2e2e8] font-sans">
      <ScenarioLabView />
    </div>
  );
}
