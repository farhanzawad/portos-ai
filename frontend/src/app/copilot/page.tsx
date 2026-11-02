import React from "react";
import { CopilotChatView } from "@/components/copilot/CopilotChatView";

export const metadata = {
  title: "Port Intelligence Copilot | PORTOS AI",
  description:
    "Grounded operational briefings and schedule explanations powered by Google Gemini and verified tool allowlists.",
};

export default function CopilotPage() {
  return (
    <div className="space-y-4">
      <div className="pb-3 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Port Intelligence Copilot
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          Grounded operational briefings and schedule explanations powered by Google Gemini and verified tool allowlists.
        </p>
      </div>

      <CopilotChatView />
    </div>
  );
}
