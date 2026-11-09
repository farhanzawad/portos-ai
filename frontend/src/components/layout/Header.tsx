"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Menu,
  Bell,
  Clock,
  User,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  X,
  Search,
  Plus,
} from "lucide-react";
import { DataStatusBadge } from "@/components/ui/DataStatusBadge";
import { EventStreamPill } from "@/components/events/EventStreamPill";

interface HeaderProps {
  onToggleSidebar: () => void;
  reducedMotion: boolean;
  onToggleReducedMotion: () => void;
}

export function Header({
  onToggleSidebar,
  reducedMotion,
  onToggleReducedMotion,
}: HeaderProps) {
  const [mounted, setMounted] = useState<boolean>(false);
  const [timeString, setTimeString] = useState<string>("00:00:00 BST");
  const [activeProfile, setActiveProfile] = useState<string>("Berth Planner (Demo)");
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Update local clock formatted to Asia/Dhaka (UTC+6)
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString("en-GB", {
          timeZone: "Asia/Dhaka",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }) + " BST"
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const profiles = [
    "Berth Planner (Demo)",
    "Terminal Controller (Demo)",
    "Port Operations Analyst",
    "Competition Evaluator",
  ];

  const sampleNotifications = [
    { id: 1, title: "Berth Conflict Avoided", text: "Feeder 04 shifted to Berth B-03", time: "2m ago" },
    { id: 2, title: "Crane Outage Simulated", text: "STS-02 gantry maintenance window logged", time: "14m ago" },
    { id: 3, title: "Weather Advisory", text: "Karnaphuli Channel high-tide gate at 18:45", time: "1h ago" },
  ];

  return (
    <header className="sticky top-0 z-30 flex flex-col w-full border-b border-slate-200 bg-white shadow-xs font-sans">
      {/* Topmost Persistent DEMO ENVIRONMENT Banner */}
      <div className="w-full bg-[#0B132B] px-4 py-1.5 flex items-center justify-between text-white text-xs border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSidebar}
            className="p-1 -ml-1 text-slate-300 hover:text-white rounded lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
            DEMO ENVIRONMENT
          </span>
          <span className="text-slate-300 text-[11px] truncate hidden sm:inline">
            Illustrative Chattogram Container Terminal Digital Twin & Advisory Suite
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="hidden sm:flex items-center gap-1.5 text-sky-400">
            <Clock className="h-3.5 w-3.5" />
            <span className="tabular-nums font-semibold text-slate-200" suppressHydrationWarning>
              {mounted ? timeString : "00:00:00 BST"}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="hidden md:inline text-slate-400">Data:</span>
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
        </div>
      </div>

      {/* Primary Action & Search Bar */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
        {/* Search Input */}
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search vessels, berths, containers, or call IDs..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-500/20 transition-all shadow-2xs"
            />
          </div>
        </div>

        {/* Center Corridor Indicator */}
        <div className="hidden xl:flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-xs font-semibold text-sky-800">
            <Activity className="h-3.5 w-3.5 text-sky-600" />
            <span>CCT / NCT Container Terminal</span>
          </div>
          <span className="text-xs text-slate-500">
            Approach: <strong className="text-slate-800">Karnaphuli Channel</strong>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Simulate Vessel Button */}
          <Link
            href="/vessels"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs transition-all shadow-xs active:scale-[0.98]"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Simulate Vessel</span>
          </Link>

          {/* Live SSE Stream Indicator */}
          <EventStreamPill />

          {/* Reduced Motion Toggle */}
          <button
            onClick={onToggleReducedMotion}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border transition-colors ${
              reducedMotion
                ? "border-sky-500 bg-sky-50 text-sky-800 font-medium"
                : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
            title="Toggle Reduced Motion / Non-essential Animations"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden lg:inline text-[11px]">
              {reducedMotion ? "Motion: Off" : "Motion: On"}
            </span>
          </button>

          {/* Notifications Button */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowProfileMenu(false);
              }}
              className="relative p-2 text-slate-500 hover:text-slate-900 rounded-full border border-slate-200 hover:bg-slate-50 transition-colors"
              aria-label="View operational notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-lg z-50 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-900">Operational Alerts (3)</span>
                  <button
                    onClick={() => setShowNotificationMenu(false)}
                    className="text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sampleNotifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-500">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-0.5">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotificationMenu(false);
              }}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors shadow-2xs"
            >
              <div className="h-5 w-5 rounded-full bg-sky-600 text-white flex items-center justify-center text-[10px] font-bold">
                BP
              </div>
              <span className="hidden sm:inline max-w-[120px] truncate">{activeProfile}</span>
              <ChevronDown className="h-3 w-3 text-slate-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-lg z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Demo Evaluation Role
                </div>
                {profiles.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setActiveProfile(p);
                      setShowProfileMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                      activeProfile === p
                        ? "bg-sky-50 font-bold text-sky-800"
                        : "text-slate-800 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
