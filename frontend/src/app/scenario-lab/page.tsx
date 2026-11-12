import React from "react";
import { Metadata } from "next";
import { DecisionLabSimulatorView } from "@/components/scenarios/DecisionLabSimulatorView";

export const metadata: Metadata = {
  title: "Decision Lab — Stochastic Disruption Simulator | PORTOS AI",
  description:
    "Discrete-event terminal disruption simulation and AI decision support powered by SimPy 4.1.2 and Google OR-Tools CP-SAT for Chattogram Port operations.",
};

export default function ScenarioLabPage() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-[#0a0c10] text-[#e2e2e8] font-sans min-h-screen">
      <DecisionLabSimulatorView />
    </div>
  );
}
