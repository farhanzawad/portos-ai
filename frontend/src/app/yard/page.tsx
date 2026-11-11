import React from "react";
import { YardIntelligenceView } from "@/components/yard/YardIntelligenceView";

export const metadata = {
  title: "Yard Intelligence & Congestion Heatmap — PORTOS AI",
  description:
    "Predictive container block density tracking, threshold alerts, and multi-horizon forecasting for port operations.",
};

export default function YardPage() {
  return (
    <div className="flex-1 p-4 sm:p-5 lg:p-6 space-y-4 bg-[#0a0c10] text-[#e2e2e8] font-sans">
      <YardIntelligenceView />
    </div>
  );
}
