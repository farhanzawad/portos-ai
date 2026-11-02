"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Bell,
  Clock,
  User,
  Activity,
  SlidersHorizontal,
  ChevronDown,
  X,
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
    <header className="sticky top-0 z-30 flex flex-col w-full border-b border-portos-border bg-portos-surface shadow-xs">
      {/* Topmost Persistent DEMO ENVIRONMENT Banner */}
      <div className="w-full bg-portos-navy px-4 py-1.5 flex items-center justify-between text-white text-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleSidebar}
            className="p-1 -ml-1 text-white/80 hover:text-white rounded lg:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-4 w-4" />
          </button>
          <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-bold tracking-wider uppercase bg-portos-amber text-portos-navy">
            DEMO ENVIRONMENT
          </span>
          <span className="text-white/80 text-[11px] truncate">
            Illustrative Chattogram Terminal Simulation
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px]">
          <div className="hidden sm:flex items-center gap-1.5 text-white/70">
            <Clock className="h-3 w-3 text-portos-teal" />
            <span className="tabular-nums font-mono text-white/90" suppressHydrationWarning>{mounted ? timeString : "00:00:00 BST"}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="hidden md:inline text-white/60">Data:</span>
            <DataStatusBadge status="SIMULATED" size="sm" />
          </div>
        </div>
      </div>

      {/* Primary Action & Context Bar */}
      <div className="h-12 px-4 flex items-center justify-between gap-4">
        {/* Terminal Selector Context */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded border border-portos-border bg-portos-bg text-xs font-medium text-portos-navy">
            <Activity className="h-3.5 w-3.5 text-portos-teal" />
            <span className="truncate">CCT / NCT Container Terminal (Illustrative)</span>
          </div>
          <span className="text-xs text-portos-muted hidden md:inline">
            Channel: <strong>Karnaphuli Approach</strong>
          </span>
        </div>

        {/* Controls & User Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Live SSE Stream Indicator */}
          <EventStreamPill />

          {/* Reduced Motion Toggle */}
          <button
            onClick={onToggleReducedMotion}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
              reducedMotion
                ? "border-portos-teal bg-portos-teal-light text-portos-teal-dark font-medium"
                : "border-portos-border bg-portos-surface text-portos-muted hover:text-portos-navy"
            }`}
            title="Toggle Reduced Motion / Non-essential Animations"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span className="hidden lg:inline text-[11px]">
              {reducedMotion ? "Motion: Reduced" : "Motion: Standard"}
            </span>
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotificationMenu(!showNotificationMenu);
                setShowProfileMenu(false);
              }}
              className="relative p-1.5 text-portos-muted hover:text-portos-navy rounded border border-portos-border hover:bg-portos-bg transition-colors"
              aria-label="View operational notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-portos-amber ring-2 ring-white" />
            </button>

            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-md border border-portos-border bg-portos-surface p-3 shadow-lg z-50 text-xs space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-portos-border">
                  <span className="font-semibold text-portos-navy">Operational Alerts (3)</span>
                  <button
                    onClick={() => setShowNotificationMenu(false)}
                    className="text-portos-muted hover:text-portos-navy"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sampleNotifications.map((n) => (
                    <div key={n.id} className="p-2 rounded bg-portos-bg/70 border border-portos-border/60">
                      <div className="flex items-center justify-between font-medium text-portos-navy">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-portos-muted">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-portos-muted mt-0.5">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotificationMenu(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-portos-border bg-portos-surface hover:bg-portos-bg text-xs font-medium text-portos-navy transition-colors"
            >
              <User className="h-3.5 w-3.5 text-portos-navy-secondary" />
              <span className="hidden sm:inline max-w-[120px] truncate">{activeProfile}</span>
              <ChevronDown className="h-3 w-3 text-portos-muted" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-md border border-portos-border bg-portos-surface p-1 shadow-lg z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-semibold uppercase text-portos-muted border-b border-portos-border">
                  Demo Evaluation Role
                </div>
                {profiles.map((p) => (
                  <button
                    key={p}
                    onClick={() => {
                      setActiveProfile(p);
                      setShowProfileMenu(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded transition-colors ${
                      activeProfile === p
                        ? "bg-portos-bg font-semibold text-portos-navy"
                        : "text-portos-navy/80 hover:bg-portos-bg"
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

