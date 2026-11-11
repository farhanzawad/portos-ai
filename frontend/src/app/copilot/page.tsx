import React from "react";
import { CopilotChatView } from "@/components/copilot/CopilotChatView";

export const metadata = {
  title: "Port Intelligence Copilot | PORTOS AI",
  description:
    "Grounded operational briefings and schedule explanations powered by Google Gemini and verified tool allowlists.",
};

export default function CopilotPage() {
  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 space-y-4 bg-[#0a0c10] text-[#e2e2e8] font-sans">
      <div className="pb-3 border-b border-white/[0.08]">
        <div className="text-[10px] font-mono tracking-wider uppercase text-[#8e9bae] flex items-center gap-2 mb-1">
          <span>PORT OPERATIONS</span>
          <span>•</span>
          <span>AI ADVISORY COPILOT</span>
          <span>•</span>
          <span className="text-secondary font-semibold">GOOGLE GEMINI 2.5 FLASH</span>
        </div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Port Intelligence Copilot
          </h1>
          <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            DEMO SIM
          </span>
        </div>
        <p className="text-xs text-[#8e9bae] mt-1 max-w-2xl">
          Grounded operational briefings and schedule explanations powered by Google Gemini and verified tool allowlists.
        </p>
      </div>

      <CopilotChatView />
    </div>
  );
}
