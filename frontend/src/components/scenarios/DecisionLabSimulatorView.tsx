"use client";

import React, { useState } from "react";
import {
  Cpu,
  Wind,
  Waves,
  Wrench,
  Ship,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  TrendingUp,
  Download,
  Flame,
  CheckCircle2,
  Play,
  Activity,
  Layers,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";

interface AuditEvent {
  epoch: string;
  vessel: string;
  vesselType: string;
  draft: string;
  event: string;
  eventBadge: string;
  eventColor: string;
  resolution: string;
  confidence: number;
}

const DEFAULT_AUDIT_EVENTS: AuditEvent[] = [
  {
    epoch: "T+04:15",
    vessel: "MV Meghna Star",
    vesselType: "Feeder 172m",
    draft: "7.8m Draft",
    event: "Swell Hold at Kutubdia Alpha",
    eventBadge: "SWELL",
    eventColor: "amber",
    resolution: "+3.1h Swell Wait • Anchor slip probability mitigated",
    confidence: 96.8,
  },
  {
    epoch: "T+08:40",
    vessel: "MSC Algeciras",
    vesselType: "Direct Intra-Asia 194m",
    draft: "9.2m Draft",
    event: "Tide Gate Ingress Transit",
    eventBadge: "TIDAL GATE",
    eventColor: "emerald",
    resolution: "Speed Cap 4.5 kts • Synchronized arrival at NCT 01",
    confidence: 91.2,
  },
  {
    epoch: "T+14:00",
    vessel: "Ever Boomy",
    vesselType: "Feeder 185m",
    draft: "8.4m Draft",
    event: "Dynamic Preemption -> CCT-02",
    eventBadge: "DISPATCH",
    eventColor: "rose",
    resolution: "Saved $18,400 Demurrage • Slipped bulk feeder by 45 mins",
    confidence: 97.5,
  },
  {
    epoch: "T+21:30",
    vessel: "Banglar Samriddhi",
    vesselType: "Bulk / General 189m",
    draft: "8.2m Draft",
    event: "Crane Throttled at GCB-04",
    eventBadge: "GANG RE-ALLOC",
    eventColor: "cyan",
    resolution: "18 moves/hr Cap • Shifted 2 gang teams from CCT",
    confidence: 88.4,
  },
];

export function DecisionLabSimulatorView() {
  // Stochastic Levers State
  const [activePreset, setActivePreset] = useState<"monsoon" | "crane" | "shoal">("monsoon");
  const [windSpeed, setWindSpeed] = useState<number>(34);
  const [monsoonSurge, setMonsoonSurge] = useState<number>(2.5);
  const [shoalLimiter, setShoalLimiter] = useState<number>(-0.8);
  const [craneOperability, setCraneOperability] = useState<number>(68);
  const [mttrHours, setMttrHours] = useState<number>(3.5);
  const [tugsCount, setTugsCount] = useState<number>(4);
  const [poissonArrivals, setPoissonArrivals] = useState<number>(1.45);
  const [reeferPriority, setReeferPriority] = useState<boolean>(true);

  // Simulation Run Animation State
  const [isRunningSim, setIsRunningSim] = useState(false);
  const [simRunCount, setSimRunCount] = useState(1000);

  // Apply Presets
  const applyPreset = (preset: "monsoon" | "crane" | "shoal") => {
    setActivePreset(preset);
    if (preset === "monsoon") {
      setWindSpeed(38);
      setMonsoonSurge(2.5);
      setShoalLimiter(-0.8);
      setCraneOperability(65);
      setPoissonArrivals(1.5);
    } else if (preset === "crane") {
      setWindSpeed(22);
      setMonsoonSurge(0.8);
      setShoalLimiter(-0.3);
      setCraneOperability(45);
      setMttrHours(6.2);
    } else if (preset === "shoal") {
      setWindSpeed(26);
      setMonsoonSurge(1.2);
      setShoalLimiter(-1.4);
      setCraneOperability(82);
    }
  };

  const resetBaseline = () => {
    setWindSpeed(24);
    setMonsoonSurge(1.0);
    setShoalLimiter(0.0);
    setCraneOperability(90);
    setMttrHours(2.0);
    setTugsCount(3);
    setPoissonArrivals(1.0);
    setReeferPriority(true);
  };

  const handleRunSimulation = () => {
    setIsRunningSim(true);
    setTimeout(() => {
      setIsRunningSim(false);
      setSimRunCount((prev) => prev + 1000);
    }, 1100);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. Header Command Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111318] border border-white/[0.08] shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container text-white uppercase tracking-wider">
              Dynamic Solver
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="font-mono text-xs text-[#8e9bae]">
              SIMPY 4.1.2 ENGINE • DETERMINISTIC SEED #8841-B
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="font-mono text-xs text-secondary flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-secondary animate-pulse" />
              OR-TOOLS CP-SAT v9.8
            </span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Decision Lab — Stochastic Disruption Simulator
          </h1>
          <p className="font-sans text-xs text-[#8e9bae] max-w-4xl leading-relaxed">
            High-throughput synthetic perturbation model for Karnaphuli Fairway &amp; Chittagong berths. Simulates MetOcean swells, mechanical crane downtime, and fleet arrival bunching under non-linear boundary constraints.
          </p>
        </div>

        {/* Presets & Primary Execution Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl bg-[#0c0e12] border border-white/[0.08] text-xs font-mono">
            <button
              onClick={() => applyPreset("monsoon")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activePreset === "monsoon"
                  ? "bg-[#1e2024] text-white shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              <span className="size-1.5 rounded-full bg-primary-container" />
              <span>Monsoon Surge (+2.5m)</span>
            </button>
            <button
              onClick={() => applyPreset("crane")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activePreset === "crane"
                  ? "bg-[#1e2024] text-white shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              <span className="size-1.5 rounded-full bg-amber-400" />
              <span>STS Crane Outage</span>
            </button>
            <button
              onClick={() => applyPreset("shoal")}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activePreset === "shoal"
                  ? "bg-[#1e2024] text-white shadow-xs"
                  : "text-[#8e9bae] hover:text-white"
              }`}
            >
              <span className="size-1.5 rounded-full bg-slate-400" />
              <span>Silt Shoal (-0.8m)</span>
            </button>
          </div>

          <button className="px-3.5 py-2 rounded-xl bg-[#1e2024] hover:bg-[#282a2e] text-white text-xs font-medium border border-white/[0.08] flex items-center gap-2 transition-colors shadow-xs">
            <Download className="size-4 text-[#8e9bae]" />
            <span>Sensitivity Matrix</span>
          </button>

          <button
            onClick={handleRunSimulation}
            disabled={isRunningSim}
            className="px-4 py-2 rounded-xl bg-primary-container text-white text-xs font-bold hover:opacity-90 flex items-center gap-2 transition-all shadow-lg shadow-primary-container/20 active:scale-95"
          >
            <Play className={`size-4 fill-white ${isRunningSim ? "animate-spin" : ""}`} />
            <span>{isRunningSim ? "Solving 1,000 Runs..." : "Run 1,000 Iterations"}</span>
          </button>
        </div>
      </div>

      {/* 2. Disruption Impact KPI Strip (4 High-Impact Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Mean Anchorage Delay */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative overflow-hidden shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#8e9bae] uppercase tracking-wider font-bold">
              Mean Anchorage Delay
            </span>
            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-mono text-[10px] font-bold flex items-center gap-1">
              <TrendingUp className="size-3" />
              +118%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              4.8
            </span>
            <span className="font-mono text-xs text-[#8e9bae]">hrs / vessel</span>
          </div>
          <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
            <div className="bg-rose-500 h-full rounded-full w-[80%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8e9bae] pt-1">
            <span>Deterministic Base: 2.2 hrs</span>
            <span className="text-rose-400 font-bold">Critical Queue Drift</span>
          </div>
        </div>

        {/* Card 2: Quayside Bottleneck Probability */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative overflow-hidden shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#8e9bae] uppercase tracking-wider font-bold">
              Quayside Bottleneck
            </span>
            <span className="px-1.5 py-0.5 rounded bg-primary-container/20 text-primary font-mono text-[10px] font-bold">
              HIGH IMPACT
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              92%
            </span>
            <span className="font-mono text-xs text-[#8e9bae]">Probability</span>
          </div>
          <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
            <div className="bg-primary-container h-full rounded-full w-[92%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8e9bae] pt-1">
            <span>Epicenter: NCT Berth 01</span>
            <span className="text-primary font-bold">STS Lockout</span>
          </div>
        </div>

        {/* Card 3: Demurrage Exposure */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative overflow-hidden shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#8e9bae] uppercase tracking-wider font-bold">
              Demurrage Exposure
            </span>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-mono text-[10px] font-bold">
              P90 RISK
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              $148,500
            </span>
            <span className="font-mono text-xs text-[#8e9bae]">Est. Total</span>
          </div>
          <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
            <div className="bg-amber-400 h-full rounded-full w-[75%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8e9bae] pt-1">
            <span>Variance: +85.6%</span>
            <span className="text-secondary font-bold">CP-SAT Sav: $62.4k</span>
          </div>
        </div>

        {/* Card 4: Aux Carbon Penalty */}
        <div className="p-4 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-2 relative overflow-hidden shadow-sm hover:border-white/20 transition-all">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono text-[10px] text-[#8e9bae] uppercase tracking-wider font-bold">
              Aux Carbon Penalty
            </span>
            <span className="px-1.5 py-0.5 rounded bg-secondary-container/20 text-secondary font-mono text-[10px] font-bold">
              IMO CII
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-white">
              +34.2
            </span>
            <span className="font-mono text-xs text-[#8e9bae]">tCO2e (MGO)</span>
          </div>
          <div className="w-full bg-[#1e2024] h-1.5 rounded-full overflow-hidden">
            <div className="bg-secondary h-full rounded-full w-[65%]" />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#8e9bae] pt-1">
            <span>Kutubdia Idling Burn</span>
            <span className="text-[#cbd5e1]">Grade C → D Shift</span>
          </div>
        </div>
      </div>

      {/* 3. Main Simulator Workspace Grid (5 cols / 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Stochastic Levers (5 of 12 cols = ~42%) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-5 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <h2 className="font-headline text-base font-bold text-white">
                  Stochastic Levers
                </h2>
              </div>
              <span className="font-mono text-[10px] text-[#8e9bae] px-2 py-0.5 rounded bg-[#1e2024]">
                P-VAL SENSITIVITY: ±12.5%
              </span>
            </div>
            <p className="font-sans text-xs text-[#8e9bae] -mt-2 leading-relaxed">
              Adjust multi-variable disruptions. The SimPy discrete-event queue continuously re-solves berth allocations and tidal ingress windows.
            </p>

            {/* Sub-Group 1: Fairway MetOcean Constraints */}
            <div className="p-4 rounded-xl bg-[#0c0e12] border border-white/[0.06] space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Wind className="size-3.5 text-primary" />
                  Fairway MetOcean Constraints
                </span>
                <span className="text-[10px] text-[#64748b]">KUTUBDIA • KARNAPHULI</span>
              </div>

              {/* Slider 1: Wind Speed */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white">
                  <span className="font-sans">Sustained Fairway Wind Speed</span>
                  <span className="text-primary font-bold">
                    {windSpeed} kts <span className="text-[#8e9bae] font-normal">(Gusts {windSpeed + 14})</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="50"
                  value={windSpeed}
                  onChange={(e) => setWindSpeed(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1e2024] rounded-lg appearance-none cursor-pointer accent-primary-container"
                />
                <div className="flex justify-between text-[10px] text-[#64748b]">
                  <span>15 kts (Calm)</span>
                  <span className="text-amber-400 font-bold">30 kts Pilot Suspension</span>
                  <span>50 kts (Cyclone 1)</span>
                </div>
              </div>

              {/* Slider 2: Monsoon Tidal Ingress */}
              <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                <div className="flex justify-between text-xs text-white">
                  <span className="font-sans">Monsoon Tidal Ingress Surge</span>
                  <span className="text-secondary font-bold">+{monsoonSurge.toFixed(1)} m</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="4.0"
                  step="0.1"
                  value={monsoonSurge}
                  onChange={(e) => setMonsoonSurge(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1e2024] rounded-lg appearance-none cursor-pointer accent-secondary"
                />
                <div className="flex justify-between text-[10px] text-[#64748b]">
                  <span>0.0 m (Neap)</span>
                  <span>+1.8 m (Nominal Spring)</span>
                  <span>+4.0 m (Extreme Tide Gate)</span>
                </div>
              </div>

              {/* Slider 3: River Silt Shoaling Limiter */}
              <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                <div className="flex justify-between text-xs text-white">
                  <span className="font-sans">River Silt Shoaling Limiter</span>
                  <span className="text-rose-400 font-bold">{shoalLimiter.toFixed(1)} m (Bar Draft)</span>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="0.0"
                  step="0.1"
                  value={shoalLimiter}
                  onChange={(e) => setShoalLimiter(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1e2024] rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-[10px] text-[#64748b]">
                  <span>-2.0 m (Shoal Lockout)</span>
                  <span>-0.5 m (Moderate)</span>
                  <span>0.0 m (Dredged 9.5m)</span>
                </div>
              </div>
            </div>

            {/* Sub-Group 2: Terminal Equipment Resilience */}
            <div className="p-4 rounded-xl bg-[#0c0e12] border border-white/[0.06] space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Wrench className="size-3.5 text-secondary" />
                  Terminal Equipment Resilience
                </span>
                <span className="text-[10px] text-[#64748b]">CCT • NCT • GCB</span>
              </div>

              {/* Slider 4: STS Crane Operability */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white">
                  <span className="font-sans">STS Gantry Crane Operability</span>
                  <span className="text-secondary font-bold">
                    {craneOperability}% ({Math.round((craneOperability / 100) * 16)}/16 STS Active)
                  </span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="100"
                  value={craneOperability}
                  onChange={(e) => setCraneOperability(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1e2024] rounded-lg appearance-none cursor-pointer accent-secondary"
                />
              </div>

              {/* Slider 5: MTTR */}
              <div className="space-y-1 pt-2 border-t border-white/[0.04]">
                <div className="flex justify-between text-xs text-white">
                  <span className="font-sans">Mean Time to Repair (MTTR)</span>
                  <span className="text-amber-400 font-bold">{mttrHours.toFixed(1)} hrs (Weibull k=1.4)</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="8.0"
                  step="0.5"
                  value={mttrHours}
                  onChange={(e) => setMttrHours(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1e2024] rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Stepper: Escort Bollard Pull */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04] text-xs">
                <div>
                  <div className="font-sans text-white">Escort Bollard Pull</div>
                  <div className="text-[10px] text-[#8e9bae]">Tugs (80T High Pull)</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[3, 4, 6].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTugsCount(n)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        tugsCount === n
                          ? "bg-secondary text-black"
                          : "bg-[#1e2024] text-[#8e9bae] hover:text-white"
                      }`}
                    >
                      {n} Units
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Sub-Group 3: Inbound Arrival Dynamics */}
            <div className="p-4 rounded-xl bg-[#0c0e12] border border-white/[0.06] space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Ship className="size-3.5 text-amber-400" />
                  Inbound Arrival Dynamics
                </span>
                <span className="text-[10px] text-[#64748b]">POISSON λ • FEEDER</span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-white">
                  <span className="font-sans">Poisson Arrival Multiplier (λ)</span>
                  <span className="text-amber-400 font-bold">
                    {poissonArrivals.toFixed(2)}x (+{Math.round((poissonArrivals - 1) * 100)}% Bunching)
                  </span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.05"
                  value={poissonArrivals}
                  onChange={(e) => setPoissonArrivals(Number(e.target.value))}
                  className="w-full h-1.5 bg-[#1e2024] rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

              {/* Switch: Reefer Priority */}
              <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                <div>
                  <div className="font-sans text-xs text-white">Reefer Dynamic Preemption</div>
                  <div className="text-[10px] text-[#8e9bae]">28% volume with cold chain priority SLA</div>
                </div>
                <button
                  onClick={() => setReeferPriority(!reeferPriority)}
                  className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                    reeferPriority ? "bg-secondary" : "bg-[#282a2e]"
                  }`}
                >
                  <div
                    className={`size-5 rounded-full bg-black transition-transform ${
                      reeferPriority ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Recalculate Button & Seed Manifest */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleRunSimulation}
                disabled={isRunningSim}
                className="w-full py-2.5 rounded-xl bg-primary-container text-white font-bold text-xs hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-md shadow-primary-container/20 active:scale-98"
              >
                <Cpu className="size-4" />
                <span>Re-Calculate Monte Carlo Envelope ({simRunCount} Runs)</span>
              </button>

              <button
                onClick={resetBaseline}
                className="w-full text-center text-[11px] font-mono text-[#8e9bae] hover:text-white transition-colors"
              >
                ↺ Reset to CPA Baseline Configuration
              </button>
            </div>

            {/* Deterministic Seed Hash */}
            <div className="p-2.5 rounded-xl bg-[#0c0e12] border border-white/[0.04] flex items-center justify-between text-[10px] font-mono text-[#64748b]">
              <span>SHA256: e8b941...743b • 99.9% Reproducibility</span>
              <span className="text-secondary font-bold">SEED #8841-B</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: 72-Hour Inbound Queue Trajectory & Audit Ledger (7 of 12 cols = ~58%) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 72-Hour Inbound Queue Trajectory Chart */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Activity className="size-4 text-secondary" />
                <h3 className="font-headline text-base font-bold text-white">
                  72-Hour Inbound Queue Trajectory
                </h3>
              </div>
              <div className="flex items-center gap-4 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500" />
                  <span className="text-[#8e9bae]">Baseline FIFO Failure</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-secondary rounded-full" />
                  <span className="text-secondary font-bold">CP-SAT Optimized</span>
                </span>
              </div>
            </div>

            {/* SVG Synthetic Queue Envelope Trajectory */}
            <div className="relative h-64 rounded-xl bg-[#0c0e12] border border-white/[0.06] p-4 flex flex-col justify-between overflow-hidden font-mono">
              {/* Event Callouts inside Chart */}
              <div className="absolute top-3 left-[15%] z-10 px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-400">
                HIGH TIDE WINDOW (+3.84m)
              </div>
              <div className="absolute top-3 right-[15%] z-10 px-2.5 py-0.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-[10px] text-rose-400">
                WIND PEAK (GUSTS &gt;45k)
              </div>

              {/* Chart Grid Lines & SVGs */}
              <svg className="w-full h-44 overflow-visible" viewBox="0 0 500 160">
                <defs>
                  <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4edea3" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#4edea3" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal guide lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
                <line x1="0" y1="130" x2="500" y2="130" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

                {/* Baseline Area (Unmitigated) */}
                <path
                  d="M0,130 Q120,110 180,50 T320,30 T420,70 T500,80 L500,160 L0,160 Z"
                  fill="url(#baseGrad)"
                />
                <path
                  d="M0,130 Q120,110 180,50 T320,30 T420,70 T500,80"
                  fill="none"
                  stroke="#f43f5e"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />

                {/* CP-SAT Optimized Area */}
                <path
                  d="M0,130 Q120,120 180,95 T320,85 T420,110 T500,120 L500,160 L0,160 Z"
                  fill="url(#optGrad)"
                />
                <path
                  d="M0,130 Q120,120 180,95 T320,85 T420,110 T500,120"
                  fill="none"
                  stroke="#4edea3"
                  strokeWidth="3"
                />

                {/* Key Point Markers */}
                <circle cx="180" cy="50" r="4" fill="#f43f5e" />
                <circle cx="180" cy="95" r="4" fill="#4edea3" />
                <circle cx="320" cy="30" r="4" fill="#f43f5e" />
                <circle cx="320" cy="85" r="4" fill="#4edea3" />
              </svg>

              {/* Time Axis Labels */}
              <div className="flex items-center justify-between text-[10px] text-[#8e9bae] pt-2 border-t border-white/[0.06]">
                <span>T+00h (Now)</span>
                <span>T+12h</span>
                <span>T+24h</span>
                <span>T+36h (Monsoon Peak)</span>
                <span>T+48h</span>
                <span>T+60h</span>
                <span>T+72h Final</span>
              </div>
            </div>

            {/* Dynamic Slotted Re-Sequence Banner */}
            <div className="p-4 rounded-xl bg-[#1e2024] border border-white/[0.08] flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary-container/20 text-secondary border border-secondary-container/30">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white font-mono">
                    Dynamic Slotted Re-Sequence Active
                  </div>
                  <div className="text-[11px] text-[#8e9bae]">
                    Pre-empted 4 deep-draft bulkers into early High Water gate, avoiding 114.5 aggregate wait hours.
                  </div>
                </div>
              </div>
              <div className="text-right font-mono shrink-0">
                <div className="text-[10px] text-[#8e9bae] uppercase">Net Demurrage Mitigated</div>
                <div className="text-base font-bold text-secondary">$62,400</div>
              </div>
            </div>
          </div>

          {/* Discrete-Event Audit Ledger (4 Critical Schedule Perturbations) */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-primary" />
                <h3 className="font-headline text-base font-bold text-white">
                  Discrete-Event Audit Ledger
                </h3>
              </div>
              <span className="font-mono text-[10px] text-[#8e9bae]">
                4 CRITICAL SCHEDULE PERTURBATIONS
              </span>
            </div>

            {/* Audit Table */}
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="text-[10px] text-[#8e9bae] border-b border-white/[0.06] pb-2">
                    <th className="pb-2 font-normal">SIM EPOCH</th>
                    <th className="pb-2 font-normal">VESSEL IDENTIFICATION</th>
                    <th className="pb-2 font-normal">STOCHASTIC EVENT</th>
                    <th className="pb-2 font-normal">SOLVER RESOLUTION</th>
                    <th className="pb-2 font-normal text-right">CONFIDENCE (CI)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {DEFAULT_AUDIT_EVENTS.map((ev, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-bold text-white">{ev.epoch}</td>
                      <td className="py-3">
                        <div className="text-white font-semibold">{ev.vessel}</div>
                        <div className="text-[10px] text-[#8e9bae]">{ev.vesselType} • {ev.draft}</div>
                      </td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.eventColor === "amber"
                              ? "bg-amber-500/20 text-amber-400"
                              : ev.eventColor === "emerald"
                              ? "bg-secondary-container/20 text-secondary"
                              : ev.eventColor === "rose"
                              ? "bg-rose-500/20 text-rose-400"
                              : "bg-cyan-500/20 text-cyan-400"
                          }`}
                        >
                          {ev.eventBadge}
                        </span>
                        <div className="text-[11px] text-[#cbd5e1] mt-1">{ev.event}</div>
                      </td>
                      <td className="py-3 text-[11px] text-[#8e9bae]">
                        {ev.resolution}
                      </td>
                      <td className="py-3 text-right">
                        <span className="font-bold text-secondary">{ev.confidence}% CI</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#64748b] pt-2 border-t border-white/[0.06]">
              <span>All micro-events validated under GLEC v3.0 emissions parameters.</span>
              <span className="text-secondary font-bold">SHOWING 4 OF 1,000 SIMULATED EVENTS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom System Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c0e12] border border-white/[0.08] text-xs font-mono text-[#8e9bae]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-secondary font-bold">
            <span className="size-2 rounded-full bg-secondary animate-pulse" />
            SIMPY ENGINE ONLINE
          </span>
          <span>•</span>
          <span>16 PARALLEL WORKER THREADS</span>
          <span>•</span>
          <span>OR-TOOLS v9.8 SOLVED (0.34s)</span>
          <span>•</span>
          <span className="text-white">GLEC AUDITED</span>
        </div>
        <div className="flex items-center gap-3">
          <span>PORTOS ENGINE</span>
          <span>•</span>
          <span>PING: 12ms</span>
          <span>•</span>
          <span className="text-secondary font-bold">HIGH AVAILABILITY CLUSTER</span>
        </div>
      </div>
    </div>
  );
}
