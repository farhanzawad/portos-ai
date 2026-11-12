import React from "react";
import { YardStackingCockpitView } from "@/components/yard/YardStackingCockpitView";

export const metadata = {
  title: "Yard Stacking & Spatial Optimization — PORTOS AI",
  description:
    "GBRT Spatial Optimization Engine v4.2 • Real-Time Yard Density, Stacking Tier Allocations & Predictive Micro-Slotting.",
};

export default function YardPage() {
  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 bg-[#0a0c10] text-[#e2e2e8] font-sans min-h-screen">
      <YardStackingCockpitView />
    </div>
  );
}
