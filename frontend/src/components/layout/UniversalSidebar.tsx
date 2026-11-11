"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  CalendarRange,
  Compass,
  Box,
  Boxes,
  Cpu,
  Leaf,
  Sparkles,
  Database,
  Activity,
  PanelLeftClose,
  PanelLeftOpen,
  Waves,
  ShieldCheck,
  Anchor,
  CheckCircle2,
  Sliders,
} from "lucide-react";

export function UniversalSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  // Read saved preference from localStorage if available
  useEffect(() => {
    try {
      const saved = localStorage.getItem("portos_sidebar_collapsed");
      if (saved !== null) {
        setCollapsed(saved === "true");
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("portos_sidebar_collapsed", String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const navItems = [
    { label: "Executive Cockpit", href: "/", icon: LayoutGrid },
    { label: "Berth Planner", href: "/berth-planner", icon: CalendarRange },
    { label: "Fairway VTS Radar", href: "/vessels", icon: Compass },
    { label: "3D Digital Twin", href: "/digital-twin", icon: Box },
    { label: "Yard Stacking", href: "/yard", icon: Boxes },
    { label: "Decision Lab", href: "/scenario-lab", icon: Cpu },
    { label: "Green Port", href: "/green-port", icon: Leaf },
    { label: "Port Copilot", href: "/copilot", icon: Sparkles },
    { label: "Data Centre", href: "/data-centre", icon: Database },
    { label: "Event Stream", href: "/events", icon: Activity },
  ];

  return (
    <aside
      className={`h-screen sticky top-0 shrink-0 z-40 bg-[#111318] border-r border-white/[0.08] select-none flex flex-col justify-between transition-all duration-300 ${
        collapsed ? "w-16" : "w-60"
      }`}
    >
      {/* Top: Brand Header & Navigation List */}
      <div className="flex flex-col space-y-3 p-3">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-1 py-1 border-b border-white/[0.06] pb-3">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
            <div className="size-8 rounded-lg bg-gradient-to-br from-primary-container to-[#b02f00] flex items-center justify-center text-white shrink-0 shadow-md shadow-primary-container/20 group-hover:scale-105 transition-transform">
              <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                <path
                  d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
                  fill="currentColor"
                />
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1 truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-white text-sm font-bold tracking-tight">PORTOS AI</span>
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    SIM
                  </span>
                </div>
                <div className="text-[10px] text-[#8e9bae] font-mono truncate">
                  Chittagong CPA Hub
                </div>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Modules Section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-2 pt-1 pb-1 text-[9px] font-mono font-bold tracking-wider uppercase text-[#64748b]">
              Navigation Modules
            </div>
          )}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-[#222733] text-white font-semibold border border-white/10 shadow-xs"
                      : "text-[#8e9bae] hover:text-white hover:bg-white/[0.04]"
                  } ${collapsed ? "justify-center px-0" : ""}`}
                >
                  <Icon
                    className={`h-4 w-4 shrink-0 ${
                      isActive ? "text-primary-container" : "text-[#8e9bae]"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Environmental / Tidal Constraints Widget (when expanded) */}
        {!collapsed && (
          <div className="p-2.5 rounded-xl bg-[#161922] border border-white/[0.06] space-y-1.5 shadow-xs font-mono text-xs">
            <div className="flex items-center justify-between text-[10px] text-[#8e9bae] uppercase font-bold">
              <span>Tidal Gate</span>
              <span className="text-secondary">+3.84m HW</span>
            </div>
            <div className="text-[10px] text-[#8e9bae]">
              Estuary Sounding: <span className="text-white">10.4m LAT</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-secondary font-semibold pt-1 border-t border-white/[0.06]">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              <span>Gate Unobstructed</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Controls: Toggle Button + User Audit Badge */}
      <div className="p-3 border-t border-white/[0.08] space-y-2 bg-[#14171f]">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <div className="size-7 rounded-full bg-[#2a2d36] border border-white/15 flex items-center justify-center text-[10px] font-mono font-bold text-[#ffb5a0] shrink-0">
                HM
              </div>
              <div className="min-w-0 truncate">
                <div className="text-xs font-bold text-white truncate">Harbor Master</div>
                <div className="text-[9px] font-mono text-secondary flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span>Valid v4.2-revC</span>
                </div>
              </div>
            </div>

            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg bg-[#22252e] hover:bg-[#2c303c] text-[#8e9bae] hover:text-white transition-colors"
              title="Collapse Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="size-7 rounded-full bg-[#2a2d36] border border-white/15 flex items-center justify-center text-[10px] font-mono font-bold text-[#ffb5a0]">
              HM
            </div>
            <button
              onClick={toggleCollapsed}
              className="p-1.5 rounded-lg bg-[#22252e] hover:bg-[#2c303c] text-[#8e9bae] hover:text-white transition-colors"
              title="Expand Sidebar"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
