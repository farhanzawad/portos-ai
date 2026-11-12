import React from "react";
import { CopilotTacticalCockpitView } from "@/components/copilot/CopilotTacticalCockpitView";

export const metadata = {
  title: "Port Intelligence Copilot | PORTOS AI",
  description:
    "Grounded operational briefings and schedule explanations powered by Google Gemini and verified tool allowlists.",
};

export default function CopilotPage() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-[#0a0c10] text-[#e2e2e8] font-sans min-h-screen">
      <CopilotTacticalCockpitView />
    </div>
  );
}
