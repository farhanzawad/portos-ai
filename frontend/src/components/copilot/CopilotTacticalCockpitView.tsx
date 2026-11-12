"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Trash2,
  ShieldCheck,
  Cpu,
  Waves,
  Ship,
  Boxes,
  Activity,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  ArrowRight,
  SlidersHorizontal,
  Compass,
  Terminal,
} from "lucide-react";

interface CopilotMessage {
  id: string;
  sender: "user" | "copilot";
  timestamp: string;
  text: string;
  toolCall?: {
    name: string;
    latencyMs: number;
    status: "OBSERVED" | "DERIVED" | "SIMULATED";
  };
  recommendation?: {
    title: string;
    summary: string;
    impact: string;
    actionLabel: string;
  };
}

const INITIAL_MESSAGES: CopilotMessage[] = [
  {
    id: "msg-1",
    sender: "user",
    timestamp: "14:32:10 BST",
    text: "Analyze current Karnaphuli tidal window #04-HW. Are any incoming feeder vessels at risk of under-keel clearance violation during peak crest?",
  },
  {
    id: "msg-2",
    sender: "copilot",
    timestamp: "14:32:12 BST",
    toolCall: {
      name: "get_terminal_status & list_vessels_at_risk",
      latencyMs: 24,
      status: "DERIVED",
    },
    text: `Based on verified hydrodynamic gauge stn. #3 telemetry (+4.04m above chart datum) and CP-SAT ingress schedule:

1. **Critical Under-Keel Margin Alert:** **MV OOCL Singapore** (Draft 11.4m LOA 222m) requires minimum water column of **12.0m LAT** to maintain the Port Authority required **+0.60m UKC buffer** across Gupta Bend.
2. **Current Alignment:** Scheduled at 14:10 BST (30 mins before the 14:40 peak crest of +3.84m). Water column is modeled at **12.1m**, leaving only **+0.10m surplus buffer**.
3. **Recommended Preemption:** Advancing MV OOCL Singapore ingress by 15 minutes aligns arrival precisely with crest flood stream, widening safety buffer to **+1.42m UKC** and eliminating $62,400 in potential demurrage.`,
    recommendation: {
      title: "Ingress Sequence Swap: Advance MV OOCL Singapore to Slot #1",
      summary: "Swap slot sequence with MV WAN HAI 316 (Draft 10.6m) to capture peak flood tide depth.",
      impact: "+1.42m UKC Buffer • $62,400 Demurrage Avoided • 0 Hard Violations",
      actionLabel: "Authorize Sequence Swap",
    },
  },
];

const VERIFIED_TOOLS = [
  { name: "get_terminal_status", desc: "Berths, quayside crane density & Karnaphuli hydrodynamics", latency: "18ms" },
  { name: "list_vessels_at_risk", desc: "Gradient boosting delay classifier & draft margin check", latency: "22ms" },
  { name: "get_berth_plan", desc: "Active CP-SAT deterministic quayside allocation envelope", latency: "28ms" },
  { name: "run_berth_optimization", desc: "Multi-berth integer programming schedule solver (<35ms)", latency: "34ms" },
  { name: "run_scenario_simulation", desc: "SimPy 4.1.2 discrete-event queue perturbation solver", latency: "42ms" },
  { name: "get_yard_risk_summary", desc: "GBRT 16-block yard stacking density & dwell analytics", latency: "16ms" },
  { name: "get_emissions_estimate", desc: "GLEC v3.0 compliant bunker fuel & aux CO2e tracking", latency: "14ms" },
  { name: "get_data_provenance", desc: "Non-repudiated audit trail & SHA256 verification hashes", latency: "10ms" },
];

export function CopilotTacticalCockpitView() {
  const [messages, setMessages] = useState<CopilotMessage[]>(INITIAL_MESSAGES);
  const [inputQuery, setInputQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (customText?: string) => {
    const textToSend = customText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }) + " BST",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsSubmitting(true);

    setTimeout(() => {
      const isReeferQuery = textToSend.toLowerCase().includes("yard") || textToSend.toLowerCase().includes("reefer");
      const isBerthQuery = textToSend.toLowerCase().includes("berth") || textToSend.toLowerCase().includes("schedule");

      let replyText = "";
      let toolName = "get_terminal_status";

      if (isReeferQuery) {
        toolName = "get_yard_risk_summary";
        replyText = `**Yard Saturation & Cold-Chain Diagnostic:**
- **Yard Saturation:** Overall container density is **91.4%** across 16 blocks (38,420 TEU stored).
- **High-Risk Block A4:** Reefer plug capacity is at **96.4%** (420 plugs committed). 2 temperature alerts flagged on Bay 04.
- **AI Recommendation:** Automated night shuffling will move 8 buried reefers scheduled for tomorrow's unberthing to top tiers (Tier 4/5) to save 38 minutes crane idle time.`;
      } else if (isBerthQuery) {
        toolName = "get_berth_plan & run_berth_optimization";
        replyText = `**Google OR-Tools CP-SAT Quayside Schedule Synthesis:**
- **Solver Performance:** Optimal solution found in **28.4ms** with **0 Hard Constraint Violations**.
- **Berth Utilization:** **88.4%** quayside envelope across 6 berths (CCT 01-02, NCT 01-03, GCB-01).
- **Turnaround Velocity:** MV Maersk Karun currently achieving **54.2 gross moves/hr** on Berth CCT-01 with 2x ZPMC gantry crane gang. Scheduled departure on falling tide (18:30 BST).`;
      } else {
        toolName = "get_terminal_status & list_vessels_at_risk";
        replyText = `**Karnaphuli Channel & Fairway Telemetry Briefing:**
- **Estuary Tidal Stage:** Flood tide active (+3.84m peak crest at 14:40 BST). Estuary sounding verified at **10.4m LAT**.
- **Fairway Traffic:** 14 vessels in navigational fairway (8 inbound, 6 outbound).
- **Pilotage Operations:** 4 pilot boarding stations fully deployed. Pilot boat PB-02 escorting deep-draft container vessels through Gupta Bend.`;
      }

      const copilotMsg: CopilotMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "copilot",
        timestamp: new Date().toLocaleTimeString("en-GB", { hour12: false }) + " BST",
        toolCall: {
          name: toolName,
          latencyMs: Math.floor(Math.random() * 20) + 15,
          status: "DERIVED",
        },
        text: replyText,
      };

      setMessages((prev) => [...prev, copilotMsg]);
      setIsSubmitting(false);
    }, 850);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* 1. Header Command Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-5 rounded-2xl bg-[#111318] border border-white/[0.08] shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-primary-container text-white uppercase tracking-wider">
              Mission Console
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="font-mono text-xs text-[#8e9bae]">
              AI ADVISORY COPILOT
            </span>
            <span className="text-[#64748b]">•</span>
            <span className="font-mono text-xs text-secondary flex items-center gap-1.5">
              <span className="size-2 rounded-full bg-secondary animate-pulse" />
              GOOGLE GEMINI 2.5 FLASH GROUNDED
            </span>
          </div>
          <h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Port Intelligence Copilot — Tactical Advisory Console
          </h1>
          <p className="font-sans text-xs text-[#8e9bae] max-w-4xl leading-relaxed">
            Deterministic tool-grounded operational briefings, Karnaphuli hydrodynamics verification, and OR-Tools schedule rationale. Zero unverified navigational commands.
          </p>
        </div>

        {/* Badges & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
            DEMO SIMULATED
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-secondary-container/20 text-secondary border border-secondary-container/30 text-xs font-mono font-bold flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" />
            10 Tools Verified
          </span>
          <button
            onClick={handleClearChat}
            className="p-2 rounded-xl bg-[#1e2024] hover:bg-[#282a2e] text-[#8e9bae] hover:text-white border border-white/[0.08] transition-colors"
            title="Reset Session"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* 2. Main 2-Column Split: Chat Stream (7 cols) & Tool Registry (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Tactical Advisory Stream (7 of 12 cols = ~58%) */}
        <div className="lg:col-span-7 flex flex-col h-[750px] rounded-2xl bg-[#111318] border border-white/[0.08] shadow-md overflow-hidden">
          {/* Top Session Subbar */}
          <div className="px-5 py-3 border-b border-white/[0.06] bg-[#0c0e12] flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-white font-bold">Active Operational Dialogue</span>
              <span className="text-[#64748b]">|</span>
              <span className="text-[#8e9bae]">SESSION_ID: #CPA-ADVISORY-2026</span>
            </div>
            <span className="text-secondary">Latency: 24ms</span>
          </div>

          {/* Messages Scroll Area */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 p-8">
                <div className="p-3.5 rounded-2xl bg-secondary-container/20 text-secondary border border-secondary-container/30">
                  <Sparkles className="size-8" />
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-white">
                    Operational AI Ready for Queries
                  </h3>
                  <p className="font-sans text-xs text-[#8e9bae] max-w-md mt-1">
                    Select a starter prompt below or enter an operational query regarding vessel drafts, tidal windows, berth optimization, or yard stacking.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col space-y-2 ${
                    msg.sender === "user" ? "items-end" : "items-start"
                  }`}
                >
                  {/* Sender Header */}
                  <div className="flex items-center gap-2 text-[10px] font-mono text-[#8e9bae] px-1">
                    <span className="font-bold text-white">
                      {msg.sender === "user" ? "OPERATIONS DIRECTOR" : "GEMINI MARITIME COPILOT"}
                    </span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl max-w-[92%] space-y-3 font-sans text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary-container/15 text-white border border-primary-container/30"
                        : "bg-[#181c24] text-[#e2e2e8] border border-white/[0.08]"
                    }`}
                  >
                    {/* Tool Call Badge if assistant */}
                    {msg.toolCall && (
                      <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] font-mono text-[10px]">
                        <span className="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary font-bold flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          TOOL EXECUTED: {msg.toolCall.name}
                        </span>
                        <span className="text-[#8e9bae]">• {msg.toolCall.latencyMs}ms</span>
                        <span className="text-[#8e9bae]">• {msg.toolCall.status}</span>
                      </div>
                    )}

                    <div className="whitespace-pre-line space-y-2">
                      {msg.text}
                    </div>

                    {/* Actionable Recommendation Card if present */}
                    {msg.recommendation && (
                      <div className="p-3 rounded-xl bg-[#0c0e12] border border-secondary/30 space-y-2 mt-2 font-mono">
                        <div className="flex items-center justify-between text-xs font-bold text-secondary">
                          <span className="flex items-center gap-1.5">
                            <Zap className="size-3.5" />
                            {msg.recommendation.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#cbd5e1] font-sans">
                          {msg.recommendation.summary}
                        </p>
                        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-white/[0.04] text-[10px]">
                          <span className="text-secondary font-bold">
                            {msg.recommendation.impact}
                          </span>
                          <button className="px-3 py-1 rounded-lg bg-primary-container text-white font-bold hover:opacity-90 transition-all shadow-xs">
                            {msg.recommendation.actionLabel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {isSubmitting && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-[#181c24] border border-white/[0.08] text-xs font-mono text-[#8e9bae] w-fit">
                <span className="size-2 rounded-full bg-secondary animate-ping" />
                <span>Gemini 2.5 Flash evaluating verified tool allowlist...</span>
              </div>
            )}
          </div>

          {/* Prompt Chips Bar */}
          <div className="p-3 border-t border-white/[0.06] bg-[#0c0e12] flex items-center gap-2 overflow-x-auto text-[11px] font-mono">
            <span className="text-[#64748b] text-[10px] uppercase shrink-0">Inquiries:</span>
            <button
              onClick={() => handleSendMessage("Analyze under-keel clearance for incoming deep-draft feeder vessels during peak flood crest.")}
              className="px-2.5 py-1 rounded-lg bg-[#1e2024] hover:bg-[#282a2e] text-[#8e9bae] hover:text-white whitespace-nowrap transition-colors border border-white/[0.06]"
            >
              Tidal UKC Check
            </button>
            <button
              onClick={() => handleSendMessage("Which container blocks currently exceed 90% stacking density and have reefer temperature alarms?")}
              className="px-2.5 py-1 rounded-lg bg-[#1e2024] hover:bg-[#282a2e] text-[#8e9bae] hover:text-white whitespace-nowrap transition-colors border border-white/[0.06]"
            >
              Yard Cold Chain
            </button>
            <button
              onClick={() => handleSendMessage("Explain the Google OR-Tools CP-SAT berth schedule optimization and turnaround velocities.")}
              className="px-2.5 py-1 rounded-lg bg-[#1e2024] hover:bg-[#282a2e] text-[#8e9bae] hover:text-white whitespace-nowrap transition-colors border border-white/[0.06]"
            >
              OR-Tools Schedule
            </button>
            <button
              onClick={() => handleSendMessage("Run a SimPy stochastic disruption check for monsoon surge (+2.5m) and crane downtime.")}
              className="px-2.5 py-1 rounded-lg bg-[#1e2024] hover:bg-[#282a2e] text-[#8e9bae] hover:text-white whitespace-nowrap transition-colors border border-white/[0.06]"
            >
              Monsoon SimPy
            </button>
          </div>

          {/* Interactive Input Console */}
          <div className="p-4 border-t border-white/[0.06] bg-[#111318] flex items-center gap-3">
            <textarea
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              rows={1}
              placeholder="Ask Port Copilot regarding vessel drafts, tidal crests, OR-Tools schedules, or yard bottlenecks..."
              className="flex-1 bg-[#0c0e12] border border-white/[0.1] rounded-xl px-4 py-3 text-xs text-white placeholder-[#64748b] font-mono focus:outline-hidden focus:border-primary-container resize-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isSubmitting || !inputQuery.trim()}
              className="px-4 py-3 rounded-xl bg-primary-container text-white font-bold hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-1.5 shadow-md shadow-primary-container/20"
            >
              <Send className="size-4" />
              <span className="hidden sm:inline text-xs font-mono">Send</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Grounded Tool Registry & Operational Radar (5 of 12 cols = ~42%) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Grounded Tool Allowlist Card */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-4 shadow-md">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-secondary" />
                <h3 className="font-headline text-base font-bold text-white">
                  Grounded Tool Allowlist (10/10)
                </h3>
              </div>
              <span className="font-mono text-[10px] text-secondary font-bold px-2 py-0.5 rounded bg-secondary-container/20">
                ACTIVE ALLOWLIST
              </span>
            </div>

            <p className="font-sans text-xs text-[#8e9bae] leading-relaxed">
              Google Gemini function-calling is restricted to strictly verifiable backend endpoints. The model cannot issue ungrounded navigational directives.
            </p>

            <div className="space-y-2 font-mono text-xs max-h-80 overflow-y-auto pr-1">
              {VERIFIED_TOOLS.map((t, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-[#0c0e12] border border-white/[0.04] flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                      <span className="size-1.5 rounded-full bg-secondary" />
                      <span>{t.name}</span>
                    </div>
                    <div className="text-[10px] text-[#8e9bae] font-sans">
                      {t.desc}
                    </div>
                  </div>
                  <span className="text-[10px] text-secondary font-bold shrink-0">
                    {t.latency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Current Operational Datum Context Card */}
          <div className="p-5 rounded-2xl bg-[#111318] border border-white/[0.08] space-y-3 shadow-md">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Compass className="size-4 text-primary" />
                <h4 className="font-headline text-sm font-bold text-white">
                  Karnaphuli Operational Datum
                </h4>
              </div>
              <span className="font-mono text-[10px] text-[#8e9bae]">
                Active Ingress Slot #04
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e9bae]">HIGH TIDE CREST</div>
                <div className="text-base font-bold text-white mt-0.5">+3.84 m</div>
                <div className="text-[10px] text-secondary mt-0.5">Peak at 14:40 BST</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e9bae]">ESTUARY SOUNDING</div>
                <div className="text-base font-bold text-white mt-0.5">10.4 m LAT</div>
                <div className="text-[10px] text-secondary mt-0.5">Gauge #3 Online</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e9bae]">BERTH UTILIZATION</div>
                <div className="text-base font-bold text-amber-400 mt-0.5">88.4%</div>
                <div className="text-[10px] text-[#8e9bae] mt-0.5">5/6 Slots Moored</div>
              </div>

              <div className="p-3 rounded-xl bg-[#0c0e12] border border-white/[0.06]">
                <div className="text-[10px] text-[#8e9bae]">SAFE UKC MARGIN</div>
                <div className="text-base font-bold text-secondary mt-0.5">+0.60 m Safe</div>
                <div className="text-[10px] text-[#8e9bae] mt-0.5">Gupta Bend Restr.</div>
              </div>
            </div>
          </div>

          {/* Strict Advisory Guardrail Notice */}
          <div className="p-4 rounded-2xl bg-[#0c0e12] border border-amber-500/30 space-y-2">
            <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400">
              <ShieldCheck className="size-4 text-amber-400" />
              <span>STRICT ADVISORY SEPARATION</span>
            </div>
            <p className="font-sans text-[11px] text-[#cbd5e1] leading-relaxed">
              PORTOS AI provides decision support proposals only. No real-world navigational clearances, vessel maneuvering commands, or equipment movements can ever be initiated by the software. All schedule modifications require explicit human Port Authority authorization.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Bottom Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-[#0c0e12] border border-white/[0.08] text-xs font-mono text-[#8e9bae]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-secondary font-bold">
            <span className="size-2 rounded-full bg-secondary animate-pulse" />
            COPILOT AGENT ONLINE
          </span>
          <span>•</span>
          <span>STRICT ALLOWLIST: 10/10 TOOLS</span>
          <span>•</span>
          <span>MODEL: GEMINI 2.5 FLASH</span>
        </div>
        <div className="flex items-center gap-3">
          <span>PORTOS AI EXECUTIVE SUITE</span>
          <span>•</span>
          <span className="text-white font-semibold">CPA OFFICIAL MARITIME PROTOCOL</span>
        </div>
      </div>
    </div>
  );
}
