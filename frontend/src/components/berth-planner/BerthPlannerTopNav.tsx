"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SlidersHorizontal,
  Download,
  RotateCw,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";

interface BerthPlannerTopNavProps {
  onResolve?: () => void;
  isResolving?: boolean;
}

export function BerthPlannerTopNav({ onResolve, isResolving = false }: BerthPlannerTopNavProps) {
  const pathname = usePathname();

  const navLinks = [
    { label: "Operations", href: "/" },
    { label: "Berth Planner", href: "/berth-planner" },
    { label: "Vessel Traffic", href: "/vessels" },
    { label: "Yard Stacking", href: "/yard" },
    { label: "Analytics", href: "/scenario-lab" },
  ];

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-white/[0.08] bg-[#111318] px-6 sm:px-8 py-2.5 shrink-0 z-30 select-none font-sans">
      {/* Brand & Origin Cluster */}
      <div className="flex items-center gap-4 text-white">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="size-5 rounded-full bg-primary-container flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-110">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5">
              <path
                d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white text-base font-bold leading-tight tracking-[-0.015em]">
                PORTOS AI
              </span>
              <span className="text-[10px] tracking-wider uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                DEMO SIM
              </span>
            </div>
            <span className="text-[10px] text-[#8e9bae] font-mono tracking-wider uppercase">
              CHITTAGONG CPA HUB
            </span>
          </div>
        </Link>
      </div>

      {/* Center Navigation Links */}
      <nav className="hidden lg:flex items-center gap-2 text-xs">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                isActive
                  ? "bg-[#22252c] text-white font-semibold shadow-xs border border-white/10"
                  : "text-[#8e9bae] hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Right Operational Controls & Avatar */}
      <div className="flex items-center gap-2.5">
        {/* Engine Status Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg bg-[#1a1d24] border border-white/[0.08] text-[11px] font-mono text-[#8e9bae]">
          <span className="size-2 rounded-full bg-secondary animate-pulse" />
          <span>ENGINE: CP-SAT v9.8.1 <span className="text-secondary font-semibold">(ACTIVE)</span></span>
        </div>

        {/* Tolerances Action */}
        <button
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1d24] hover:bg-[#252830] border border-white/[0.08] text-xs text-[#8e9bae] hover:text-white transition-colors"
          title="Configure Solver Tolerance Settings"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Tolerances</span>
        </button>

        {/* Export Plan Action */}
        <button
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1a1d24] hover:bg-[#252830] border border-white/[0.08] text-xs text-[#8e9bae] hover:text-white transition-colors"
          title="Export Berth Allocation Plan (CSV / PDF / JSON)"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Export Plan</span>
        </button>

        {/* Re-Solve Model Action */}
        <button
          onClick={onResolve}
          disabled={isResolving}
          className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-primary-container hover:bg-[#b02f00] text-white text-xs font-bold tracking-[0.015em] shadow-sm transition-all disabled:opacity-50"
        >
          <RotateCw className={`h-3.5 w-3.5 ${isResolving ? "animate-spin" : ""}`} />
          <span>Re-Solve Model</span>
        </button>

        {/* User / Chief Planner Avatar */}
        <div
          className="size-8 rounded-full bg-[#2a2d36] border border-white/15 flex items-center justify-center text-xs font-bold font-mono text-[#ffb5a0] shadow-xs"
          title="Chief Berth Planner Session"
        >
          CP
        </div>
      </div>
    </header>
  );
}
