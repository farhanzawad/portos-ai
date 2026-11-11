"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Anchor,
  Search,
  Bell,
  ShieldCheck,
  ChevronDown,
  Activity,
  Layers,
  Sparkles,
  Ship,
  CalendarRange,
  Grid3X3,
  Leaf,
  FlaskConical,
  Database,
  X,
  CheckCircle2,
} from "lucide-react";

export function ExecutiveTopNav() {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMoreModules, setShowMoreModules] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "Tidal Ingress Gate Open",
      desc: "Karnaphuli Channel high water window (+4.62m) active until 16:30 BST",
      time: "4m ago",
      unread: true,
    },
    {
      id: 2,
      title: "Pilot Assigned",
      desc: "Pilot boat PB-02 en route to MV OOCL SINGAPORE at Alpha Anchorage",
      time: "12m ago",
      unread: true,
    },
    {
      id: 3,
      title: "Berth Turnaround Optimization",
      desc: "OR-Tools schedule proposal locked. Zero hard draft violations.",
      time: "28m ago",
      unread: false,
    },
  ]);

  const navLinks = [
    { label: "Operations", href: "/" },
    { label: "Berth Planner", href: "/berth-planner" },
    { label: "Vessel Traffic", href: "/vessels" },
    { label: "Yard Telemetry", href: "/yard" },
    { label: "Sustainability", href: "/green-port" },
  ];

  const moreModules = [
    { label: "3D Digital Twin", href: "/digital-twin", icon: Layers },
    { label: "Decision Lab (SimPy)", href: "/scenario-lab", icon: FlaskConical },
    { label: "Gemini Copilot", href: "/copilot", icon: Sparkles },
    { label: "Port Data Centre", href: "/data-centre", icon: Database },
    { label: "Event Stream", href: "/events", icon: Activity },
    { label: "Design System Tokens", href: "/design-system", icon: Grid3X3 },
  ];

  const unreadCount = notifications.filter((n) => n.unread).length;

  return (
    <header className="w-full bg-[#11141b]/95 backdrop-blur-md border-b border-white/[0.08] sticky top-0 z-50">
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left: Brand, Enterprise Badge & Search */}
        <div className="flex items-center gap-5 sm:gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-container to-[#b02f00] flex items-center justify-center shadow-md shadow-primary-container/20 transition-transform group-hover:scale-105">
              <Anchor className="text-white h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">PORTOS</span>
                <span className="text-[10px] tracking-wider uppercase font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  DEMO ENVIRONMENT
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold px-1.5 py-0.5 rounded bg-white/[0.06] text-primary border border-white/[0.08] hidden sm:inline">
                  Enterprise
                </span>
              </div>
              <span className="text-[11px] text-[#8e9bae] font-normal leading-tight hidden xs:block">
                Chittagong Port Authority • BST UTC+6
              </span>
            </div>
          </Link>

          <div className="h-5 w-[1px] bg-white/[0.1] hidden md:block" />

          {/* Global Search Bar */}
          <div className="relative hidden lg:block w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8e9bae] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vessel, berth, IMO, or pilot..."
              className="w-full pl-9 pr-10 py-1.5 bg-[#181c24] border border-white/[0.08] rounded-lg text-xs text-white placeholder-[#64748b] focus:outline-none focus:border-primary-container/60 transition-colors"
            />
            <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-[#11141b] text-[#8e9bae] px-1.5 py-0.5 rounded border border-white/[0.06] font-mono">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Center: High-Level Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 text-sm font-medium text-[#8e9bae]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3.5 py-1.5 rounded-md transition-colors ${
                  isActive
                    ? "text-white bg-white/[0.08] font-semibold"
                    : "hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}

          {/* More Modules Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMoreModules(!showMoreModules)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-[#8e9bae] hover:text-white hover:bg-white/[0.03] rounded-md transition-colors"
            >
              <span>More</span>
              <ChevronDown className="h-3.5 w-3.5" />
            </button>

            {showMoreModules && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#181c24] border border-white/10 rounded-xl shadow-2xl p-2 z-50 divide-y divide-white/[0.06]">
                <div className="space-y-1 pb-1.5">
                  {moreModules.map((m) => {
                    const Icon = m.icon;
                    return (
                      <Link
                        key={m.href}
                        href={m.href}
                        onClick={() => setShowMoreModules(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs text-[#cbd5e1] hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
                      >
                        <Icon className="h-4 w-4 text-primary" />
                        <span>{m.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Right: Live AIS Heartbeat, Notifications & Profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Live AIS Ping */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-[#181c24] border border-white/[0.06] rounded-md text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            <span className="text-[#8e9bae] font-label-code text-[11px] font-mono">
              AIS FEED: 14ms
            </span>
          </div>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-[#8e9bae] hover:text-white hover:bg-[#181c24] transition-colors relative"
              title="Operational Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary-container" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#181c24] border border-white/10 rounded-xl shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-white">Operational Alerts</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-primary-container/20 text-primary text-[10px] font-bold">
                      {unreadCount} New
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setNotifications(notifications.map((n) => ({ ...n, unread: false })))
                    }
                    className="text-[11px] text-[#8e9bae] hover:text-white"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="divide-y divide-white/[0.04] mt-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div key={n.id} className="py-2.5 space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium text-white">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-[#64748b]">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#8e9bae] leading-relaxed">{n.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* System Audit Link */}
          <Link
            href="/data-centre"
            className="p-2 rounded-lg text-[#8e9bae] hover:text-white hover:bg-[#181c24] transition-colors"
            title="System Audit & Lineage"
          >
            <ShieldCheck className="h-5 w-5" />
          </Link>

          <div className="h-5 w-[1px] bg-white/[0.1] hidden sm:block" />

          {/* Harbor Master Profile */}
          <div className="flex items-center gap-2.5 sm:gap-3 pl-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#1E3A8A] to-[#0284C7] ring-1 ring-white/10 flex items-center justify-center text-white font-bold text-xs uppercase shadow-xs">
              KR
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-white leading-tight">Cmdr. K. Rahman</span>
              <span className="text-[11px] text-[#8e9bae] leading-tight">Harbor Master</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
