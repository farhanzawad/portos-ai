import React from "react";
import { MilestonePlaceholder } from "@/components/ui/MilestonePlaceholder";

export default function CopilotPage() {
  return (
    <div className="space-y-6">
      <div className="pb-4 border-b border-portos-border">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-portos-navy">
          Port Intelligence Copilot
        </h1>
        <p className="text-xs text-portos-muted mt-0.5">
          Grounded operational briefings and schedule explanations powered by Google Gemini.
        </p>
      </div>

      <MilestonePlaceholder
        moduleName="AI Copilot"
        milestoneNumber="Milestone 14"
        milestoneTitle="Gemini Interactions API & Typed Tool Allowlist"
        description="A specialized operational assistant powered by the official Google GenAI SDK. Bound strictly to a typed allowlist of read-only query and safe simulation functions. Explains OR-Tools berth assignments, audits data provenance, and drafts shift briefings without hallucinating mathematical outcomes."
        plannedFeatures={[
          "Strict Pydantic-validated tool allowlist (vessel details, berth plans, yard status)",
          "Citation chips linking claims directly to verified database and model records",
          "Operational safety refusal: strictly rejects navigational or equipment control commands",
          "Controlled fallback to Offline Demo Mode when GEMINI_API_KEY is not configured",
          "Multi-turn conversational context with operational query suggestions",
        ]}
        prerequisites={[
          "Milestone 04: Structured backend query endpoints and response schemas",
          "Milestone 09 & 10: Berth optimizer and simulation result APIs",
          "Milestone 14: Google GenAI Python SDK integration and tool routing handlers",
        ]}
      />
    </div>
  );
}

