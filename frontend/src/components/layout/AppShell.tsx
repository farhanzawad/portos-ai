"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { UniversalSidebar } from "./UniversalSidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setReducedMotion(true);
    }

    const handler = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  return (
    <div
      className={`min-h-screen w-full flex bg-[#0A0C10] text-[#e2e2e8] font-sans antialiased selection:bg-primary-container selection:text-white ${
        mounted && reducedMotion ? "motion-reduce" : ""
      }`}
    >
      {/* Universal Left Collapsible Sticky Sidebar */}
      <UniversalSidebar />

      {/* Main Page Dynamic Workspace Canvas */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-y-auto overflow-x-hidden bg-[#0A0C10]">
        {children}
      </div>
    </div>
  );
}
