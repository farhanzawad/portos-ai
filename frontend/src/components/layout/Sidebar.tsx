"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  Box,
  Ship,
  CalendarRange,
  FlaskConical,
  Grid3X3,
  Leaf,
  Bot,
  Database,
  Activity,
  Palette,
  Anchor,
  X,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  milestone?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/", icon: LayoutDashboard },
  { label: "Digital Twin", href: "/digital-twin", icon: Box, milestone: "M06" },
  { label: "Vessel Intelligence", href: "/vessels", icon: Ship, milestone: "M07" },
  { label: "Berth Planner", href: "/berth-planner", icon: CalendarRange, milestone: "M09" },
  { label: "Scenario Lab", href: "/scenario-lab", icon: FlaskConical, milestone: "M10" },
  { label: "Yard Intelligence", href: "/yard", icon: Grid3X3, milestone: "M11" },
  { label: "Green Port", href: "/green-port", icon: Leaf, milestone: "M12" },
  { label: "AI Copilot", href: "/copilot", icon: Bot, milestone: "M14" },
  { label: "Data Centre", href: "/data-centre", icon: Database, milestone: "M13" },
  { label: "Event Stream", href: "/events", icon: Activity, milestone: "M15" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-portos-navy text-white border-r border-portos-navy-secondary transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-portos-navy-secondary">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="p-1.5 bg-portos-navy-secondary rounded text-portos-teal">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white block">
                PORTOS AI
              </span>
              <span className="text-[10px] font-mono text-white/60 tracking-wider block">
                CHATTOGRAM CORRIDOR
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-white/70 hover:text-white rounded lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Operations Modules
          </div>

          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "relative flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-all duration-150 group",
                  isActive
                    ? "bg-portos-navy-secondary text-white font-semibold shadow-xs"
                    : "text-white/80 hover:bg-portos-navy-secondary/60 hover:text-white"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-portos-teal" />
                )}
                <div className="flex items-center gap-2.5 pl-1">
                  <Icon
                    className={clsx(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-portos-teal" : "text-white/60 group-hover:text-white"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.milestone && (
                  <span
                    className={clsx(
                      "text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors",
                      isActive
                        ? "border-portos-teal/50 bg-portos-teal/20 text-portos-teal font-semibold"
                        : "border-white/10 text-white/40 group-hover:border-white/20 group-hover:text-white/70"
                    )}
                  >
                    {item.milestone}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-4 px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/40">
            Standards & QA
          </div>
          <Link
            href="/design-system"
            onClick={onClose}
            className={clsx(
              "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded transition-colors group",
              pathname === "/design-system"
                ? "bg-portos-navy-secondary text-white font-semibold"
                : "text-white/80 hover:bg-portos-navy-secondary/50 hover:text-white"
            )}
          >
            <Palette
              className={clsx(
                "h-4 w-4 shrink-0",
                pathname === "/design-system" ? "text-portos-teal" : "text-white/60 group-hover:text-white"
              )}
            />
            <span>Design System</span>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-portos-navy-secondary/80 bg-portos-navy-dark/40 text-[11px] text-white/60 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span>System Mode</span>
            <span className="font-mono text-portos-teal font-semibold">DEMO MODE</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span>Advisory Status</span>
            <span className="font-mono text-portos-amber">PROPOSAL ONLY</span>
          </div>
        </div>
      </aside>
    </>
  );
}

