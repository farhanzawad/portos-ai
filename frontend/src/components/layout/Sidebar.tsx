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
  Anchor,
  Search,
  Settings,
  X,
  Compass,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isNew?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Digital Twin", href: "/digital-twin", icon: Box },
  { label: "Vessel Intelligence", href: "/vessels", icon: Ship },
  { label: "Berth Planner", href: "/berth-planner", icon: CalendarRange, badge: "AI Solver", isNew: true },
  { label: "Scenario Planning", href: "/scenario-lab", icon: FlaskConical, badge: "SimPy", isNew: true },
  { label: "Yard Intelligence", href: "/yard", icon: Grid3X3 },
  { label: "Green Port", href: "/green-port", icon: Leaf },
  { label: "AI Copilot", href: "/copilot", icon: Bot },
  { label: "Data Centre", href: "/data-centre", icon: Database },
  { label: "Event Stream", href: "/events", icon: Activity },
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
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-xs"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container (Executive Maritime Dark Navy Slate) */}
      <aside
        className={clsx(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-[#0B132B] text-slate-100 border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-auto shadow-xl font-sans",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 bg-gradient-to-br from-sky-500 to-blue-600 rounded-xl text-white shadow-sm transition-transform group-hover:scale-105">
              <Anchor className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-bold tracking-tight text-white block">
                  PORTOS AI
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30 font-bold">
                  v0.1
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 tracking-wider block">
                CHATTOGRAM CORRIDOR
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Switcher Pill */}
        <div className="px-3 pt-3 pb-2">
          <div className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 shadow-inner">
            <div className="flex items-center gap-2 truncate">
              <div className="h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <div className="truncate">
                <span className="text-[10px] text-slate-500 block leading-tight font-medium uppercase tracking-wider">Terminal</span>
                <span className="font-semibold text-slate-200 truncate block">Chattogram Port</span>
              </div>
            </div>
            <span className="text-[9px] font-semibold bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
              ⌘K
            </span>
          </div>
        </div>

        {/* Quick Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Quick search..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>
        </div>

        {/* Section Header */}
        <div className="px-4 pt-2 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">
            Navigation
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={clsx(
                  "group relative flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150",
                  isActive
                    ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                )}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-sky-400" />
                )}

                <div className="flex items-center gap-2.5 truncate">
                  <Icon
                    className={clsx(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-105",
                      isActive ? "text-sky-400" : "text-slate-400 group-hover:text-slate-200"
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={clsx(
                      "text-[9px] px-2 py-0.5 rounded-full font-bold",
                      isActive
                        ? "bg-sky-400 text-slate-950"
                        : "bg-slate-800 text-slate-400 border border-slate-700/80"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Account / Settings Footer */}
        <div className="p-3 border-t border-slate-800 bg-[#080E20]">
          <Link
            href="/design-system"
            className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors mb-2"
          >
            <Settings className="h-3.5 w-3.5" />
            <span>Design Tokens</span>
          </Link>

          <div className="flex items-center justify-between px-2 pt-1 border-t border-slate-800/70">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                AW
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-200 block leading-tight">
                  Alex Williamson
                </span>
                <span className="text-[10px] text-sky-400/80 font-medium">
                  #cpa-1974 · Controller
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
