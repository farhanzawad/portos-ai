import React from "react";
import { BackendConnectionCard } from "@/components/status/BackendConnectionCard";
import { Anchor, Cpu, Database, GitBranch, Layers, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-portos-bg">
      {/* Persistent Demo Environment Banner */}
      <header className="w-full bg-portos-navy px-4 py-2 border-b border-portos-navy-secondary text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-portos-amber text-portos-navy">
              DEMO ENVIRONMENT
            </span>
            <span className="text-white/80">
              Illustrative Chattogram Container Terminal Prototype
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-white/70 text-[11px]">
            <span>Timezone: <strong>Asia/Dhaka (UTC+6)</strong></span>
            <span>Status: <strong className="text-portos-teal">SIMULATED</strong></span>
          </div>
        </div>
      </header>

      {/* Main Content Workspace */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 space-y-8">
        {/* Brand & Introduction */}
        <div className="space-y-2 pb-6 border-b border-portos-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-portos-navy rounded text-white">
              <Anchor className="h-6 w-6 text-portos-teal" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-portos-navy tracking-tight">
                PORTOS AI
              </h1>
              <p className="text-sm font-medium text-portos-muted">
                Port Operations Intelligence System — Blue AI Challenge 2026–27
              </p>
            </div>
          </div>
          <p className="text-sm text-portos-navy/80 max-w-3xl pt-2 leading-relaxed">
            A transparent decision-support platform combining an illustrative hybrid digital twin,
            predictive vessel delay analytics, constrained berth optimization (Google OR-Tools),
            discrete-event simulation (SimPy), and a grounded Gemini explanation copilot.
          </p>
        </div>

        {/* Milestone 01 Status & Backend Connection Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded border border-portos-border bg-portos-surface p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-portos-teal" />
                <h2 className="text-base font-semibold text-portos-navy">
                  Milestone 01: Monorepo & Runnable Foundation
                </h2>
              </div>
              <p className="text-xs text-portos-muted leading-relaxed">
                The core monorepo scaffold is operational with isolated frontend and backend services.
                The frontend operates gracefully without a running backend, fulfilling the resilient
                demonstration standard.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="border border-portos-border rounded p-3 bg-portos-bg/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-portos-navy">
                    <Layers className="h-4 w-4 text-portos-navy-secondary" />
                    Frontend Stack
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-portos-muted">
                    <li>• Next.js App Router (TypeScript)</li>
                    <li>• Tailwind CSS (Minimal Industrial)</li>
                    <li>• Resilient connection polling</li>
                    <li>• 3D / R3F compatible foundation</li>
                  </ul>
                </div>

                <div className="border border-portos-border rounded p-3 bg-portos-bg/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-portos-navy">
                    <Cpu className="h-4 w-4 text-portos-navy-secondary" />
                    Backend Stack
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-portos-muted">
                    <li>• FastAPI & Pydantic v2 schemas</li>
                    <li>• Strict CORS origin control</li>
                    <li>• Health check (/health & /api/v1)</li>
                    <li>• Offline Demo Mode enabled</li>
                  </ul>
                </div>

                <div className="border border-portos-border rounded p-3 bg-portos-bg/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-portos-navy">
                    <Database className="h-4 w-4 text-portos-navy-secondary" />
                    Data Architecture
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-portos-muted">
                    <li>• PostgreSQL 16 + PostGIS Docker</li>
                    <li>• 5-Tier Data Status Tagging</li>
                    <li>• UTC storage / Asia/Dhaka display</li>
                    <li>• Idempotent seed architecture</li>
                  </ul>
                </div>

                <div className="border border-portos-border rounded p-3 bg-portos-bg/50">
                  <div className="flex items-center gap-2 text-xs font-semibold text-portos-navy">
                    <GitBranch className="h-4 w-4 text-portos-navy-secondary" />
                    Operational Guardrails
                  </div>
                  <ul className="mt-2 space-y-1 text-[11px] text-portos-muted">
                    <li>• No live CPA/AIS connection claims</li>
                    <li>• Advisory-only decision support</li>
                    <li>• Human-in-the-loop review</li>
                    <li>• Zero secrets in client bundles</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col gap-4">
            <BackendConnectionCard />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full border-t border-portos-border bg-portos-surface py-4 px-4 text-center text-xs text-portos-muted">
        PORTOS AI Prototype — Designed for Blue AI Challenge 2026–27. All demo operational data is strictly SIMULATED.
      </footer>
    </main>
  );
}

