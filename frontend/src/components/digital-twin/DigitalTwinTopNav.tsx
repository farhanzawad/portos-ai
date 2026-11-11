"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ShieldCheck, User } from "lucide-react";

export function DigitalTwinTopNav() {
  const pathname = usePathname();
  const [showStatusModal, setShowStatusModal] = useState(false);

  return (
    <header className="flex items-center justify-between whitespace-nowrap border-b border-white/[0.08] bg-[#111318] px-4 sm:px-6 py-2.5 shrink-0 z-30 select-none font-sans">
      {/* Brand & Logo */}
      <div className="flex items-center gap-3 text-white">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="size-6 rounded-lg bg-gradient-to-br from-primary-container to-[#b02f00] flex items-center justify-center text-white shadow-sm transition-transform group-hover:scale-105">
            <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5">
              <path
                d="M13.8261 30.5736C16.7203 29.8826 20.2244 29.4783 24 29.4783C27.7756 29.4783 31.2797 29.8826 34.1739 30.5736C36.9144 31.2278 39.9967 32.7669 41.3563 33.8352L24.8486 7.36089C24.4571 6.73303 23.5429 6.73303 23.1514 7.36089L6.64374 33.8352C8.00331 32.7669 11.0856 31.2278 13.8261 30.5736Z"
                fill="currentColor"
              />
            </svg>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-bold leading-tight tracking-[-0.015em]">
                PORTOS AI
              </span>
              <span className="text-[9px] tracking-wider uppercase font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 font-mono">
                DEMO SIM
              </span>
            </div>
            <span className="text-[10px] text-[#8e9bae] font-mono tracking-wider uppercase">
              3D SPATIAL TELEMETRY • QUAYSIDE &amp; FAIRWAY
            </span>
          </div>
        </Link>
      </div>

      {/* Right Controls + Status Pills */}
      <div className="flex items-center gap-2.5">
        {/* WebGL FPS Pill */}
        <button
          onClick={() => setShowStatusModal(!showStatusModal)}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-primary-container hover:bg-[#b02f00] text-white text-xs font-bold tracking-[0.015em] shadow-sm transition-all"
        >
          <span className="truncate">WebGL 60 FPS • 12ms</span>
        </button>

        {/* Sensors Status Pill */}
        <div className="hidden sm:flex items-center gap-2 h-8 px-3 rounded-lg bg-[#1a1d24] border border-white/[0.08] text-white text-xs font-mono">
          <span className="size-2 rounded-full bg-secondary animate-pulse" />
          <span>Sensors: 142/142 Online</span>
        </div>

        {/* Harbor Master Avatar */}
        <div
          className="size-8 rounded-full bg-[#2a2d36] border border-white/15 flex items-center justify-center text-xs font-bold font-mono text-[#ffb5a0] shadow-xs"
          title="Harbor Master Session (Active)"
        >
          HM
        </div>
      </div>
    </header>
  );
}
