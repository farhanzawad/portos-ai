import React from "react";
import { YardIntelligenceView } from "@/components/yard/YardIntelligenceView";

export const metadata = {
  title: "Yard Intelligence & Congestion Heatmap — PORTOS AI",
  description:
    "Predictive container block density tracking, threshold alerts, and multi-horizon forecasting for port operations.",
};

export default function YardPage() {
  return <YardIntelligenceView />;
}
