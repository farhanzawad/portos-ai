"use client";

import React from "react";
import Link from "next/link";
import { useEventStream } from "@/context/EventStreamContext";
import {
  Flame,
  TrendingUp,
  Bell,
  CalendarRange,
  FlaskConical,
  Box,
  Bot,
  UserCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
} from "lucide-react";

export function WorkflowProgressionCard() {
  const { activeIncident, events } = useEventStream();

  const hasInjected = events.some((e) => e.event_type === "incident.injected");
  const hasRiskChanged = events.some((e) => e.event_type === "vessel.delay.risk.changed");
  const hasAlertCreated = events.some((e) => e.event_type === "operational.alert.created");

  const steps = [
    {
      num: 1,
      title: "Incident Injected",
      desc: "Deterministic surge delay (+6.5h) injected",
      icon: Flame,
      status: hasInjected ? "COMPLETED" : "WAITING",
      href: "/events",
      tag: "incident.injected",
    },
    {
      num: 2,
      title: "Prediction Updated",
      desc: "scikit-learn escalates risk to HIGH_RISK",
      icon: TrendingUp,
      status: hasRiskChanged ? "COMPLETED" : "WAITING",
      href: "/vessels",
      tag: "vessel.delay.risk.changed",
    },
    {
      num: 3,
      title: "Overview Alert",
      desc: "Operational alert posted to terminal dashboard",
      icon: Bell,
      status: hasAlertCreated ? "COMPLETED" : "WAITING",
      href: "/",
      tag: "operational.alert.created",
    },
    {
      num: 4,
      title: "Berth Planner Proposal",
      desc: "OR-Tools CP-SAT generates feasible plan",
      icon: CalendarRange,
      status: hasInjected ? "READY" : "WAITING",
      href: "/berth-planner",
      tag: "berth.plan.proposed",
    },
    {
      num: 5,
      title: "Decision Lab Trade-Offs",
      desc: "SimPy compares baseline vs. monsoon delay",
      icon: FlaskConical,
      status: hasInjected ? "READY" : "WAITING",
      href: "/scenario-lab",
      tag: "scenario.run.completed",
    },
    {
      num: 6,
      title: "Digital Twin Spatial Sync",
      desc: "Vessel position & idle berth reflected on twin",
      icon: Box,
      status: hasInjected ? "READY" : "WAITING",
      href: "/digital-twin",
      tag: "vessel.position.updated",
    },
    {
      num: 7,
      title: "Copilot Explanation",
      desc: "Gemini synthesizes grounded root-cause",
      icon: Bot,
      status: hasInjected ? "READY" : "WAITING",
      href: "/copilot",
      tag: "copilot.grounded",
    },
    {
      num: 8,
      title: "Human Approval",
      desc: "Superintendent approves advisory proposal",
      icon: UserCheck,
      status: hasInjected ? "PENDING" : "WAITING",
      href: "/berth-planner",
      tag: "human_review",
    },
  ];

  return (
    <div className="bg-white rounded-lg border border-portos-border shadow-xs p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-portos-navy" />
          <h3 className="text-xs font-bold text-portos-navy uppercase tracking-wider">
            End-to-End Operational Incident Lifecycle
          </h3>
        </div>
        <span className="text-[10px] text-portos-muted font-mono">
          {activeIncident ? "Active Incident Flow Running" : "Awaiting Incident Injection"}
        </span>
      </div>

      {/* Grid of Steps */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((st) => {
          const Icon = st.icon;
          const isDone = st.status === "COMPLETED";
          const isReady = st.status === "READY";
          const isPending = st.status === "PENDING";

          return (
            <Link
              key={st.num}
              href={st.href}
              className={`p-2.5 rounded-md border text-xs flex flex-col justify-between space-y-2 transition-all hover:shadow-xs group ${
                isDone
                  ? "border-emerald-200 bg-emerald-50/40"
                  : isReady
                  ? "border-sky-200 bg-sky-50/30"
                  : isPending
                  ? "border-amber-200 bg-amber-50/40"
                  : "border-slate-200 bg-slate-50/50 opacity-60"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-portos-navy text-[11px]">
                  <span className="h-4 w-4 rounded-full bg-portos-navy text-white text-[9px] flex items-center justify-center font-mono">
                    {st.num}
                  </span>
                  <span>{st.title}</span>
                </div>
                <Icon
                  className={`h-3.5 w-3.5 ${
                    isDone
                      ? "text-emerald-600"
                      : isReady
                      ? "text-sky-600"
                      : isPending
                      ? "text-amber-600"
                      : "text-slate-400"
                  }`}
                />
              </div>

              <p className="text-[10px] text-slate-600 leading-tight">{st.desc}</p>

              <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9px] font-mono">
                <span className="text-portos-muted">{st.tag}</span>
                <span
                  className={`px-1.5 py-0.2 rounded font-bold ${
                    isDone
                      ? "bg-emerald-100 text-emerald-800"
                      : isReady
                      ? "bg-sky-100 text-sky-800"
                      : isPending
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {st.status}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

