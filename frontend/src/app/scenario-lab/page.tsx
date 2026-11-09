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
    <div className="space-y-4">
      <ScenarioLabView />
    </div>
  );
}
