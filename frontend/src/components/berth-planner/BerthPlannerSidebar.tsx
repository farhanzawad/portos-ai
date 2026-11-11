"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  LayoutGrid,
  CalendarRange,
  Compass,
  Boxes,
  Cpu,
  Sliders,
  CheckCircle2,
  FileCheck2,
  ShieldCheck,
} from "lucide-react";

interface BerthPlannerSidebarProps {
  onProposeSchedule?: () => void;
  nextHwCrest?: string;
  crestWindow?: string;
}

export function BerthPlannerSidebar({
  onProposeSchedule,
  nextHwCrest = "+3.84m",
  crestWindow = "12:30 - 16:45 BST",
}: BerthPlannerSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", href: "/", icon: LayoutGrid },
    { label: "Berth Planner", href: "/berth-planner", icon: CalendarRange },
    { label: "Vessel Traffic", href: "/vessels", icon: Compass },
    { label: "Yard & Cranes", href: "/yard", icon: Boxes },
    { label: "Solver Engine", href: "/scenario-lab", icon: Cpu },
    { label: "Constraints & Rules", href: "#rules", icon: Sliders },
  ];

  return (
    <aside className="w-56 lg:w-60 bg-[#111318] border-r border-white/[0.08] flex flex-col justify-between p-3.5 select-none shrink-0 text-sm">
      <div className="space-y-4">
        {/* Hub / Station Identification Badge */}
        <div className="p-3 rounded-xl bg-[#171a22] border border-white/[0.06] flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-lg bg-[#222530] text-primary shrink-0 border border-white/[0.08]">
            <Anchor className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate">Chittagong CPA Hub</div>
            <div className="text-[10px] font-mono text-[#8e9bae] truncate">
              TCC Karnaphuli Estuary
            </div>
          </div>
        </div>

        {/* Navigation Modules Section */}
        <div className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-[#8e9bae]">
            Navigation Modules
          </div>
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = item.href === "/berth-planner";
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#222733] text-white font-semibold border border-white/10 shadow-xs"
                      : "text-[#8e9bae] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-primary-container" : "text-[#8e9bae]"
                    }`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Tidal Constraints Telemetry Box */}
        <div className="p-3 rounded-xl bg-[#161922] border border-white/[0.06] space-y-2 shadow-xs">
          <div className="text-[10px] font-mono font-bold tracking-wider uppercase text-[#8e9bae]">
            Tidal Constraints
          </div>

          <div className="space-y-1 text-xs font-mono">
            <div className="flex items-center justify-between">
              <span className="text-[#8e9bae] text-[11px]">Next HW Crest:</span>
              <span className="text-secondary font-bold text-xs">{nextHwCrest}</span>
            </div>
            <div className="text-[10px] text-[#8e9bae]">
              Window: <span className="text-white font-medium">{crestWindow}</span>
            </div>
          </div>

          <div className="pt-1.5 border-t border-white/[0.06] flex items-center gap-1.5 text-[10px] font-mono text-secondary">
            <CheckCircle2 className="h-3 w-3 shrink-0" />
            <span>Tidal window fully unobstructed</span>
          </div>
        </div>
      </div>

      {/* Bottom Propose Action & Verification Badge */}
      <div className="pt-3 space-y-2 border-t border-white/[0.08]">
        <button
          onClick={onProposeSchedule}
          className="w-full h-9 rounded-lg bg-primary-container hover:bg-[#b02f00] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Propose Schedule</span>
        </button>

        <div className="flex items-center justify-between px-1 text-[10px] font-mono text-[#8e9bae]">
          <span>Audit Status:</span>
          <span className="text-secondary font-semibold flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-secondary" />
            Valid v4.2-revC
          </span>
        </div>
      </div>
    </aside>
  );
}
