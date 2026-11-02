"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  CopilotStatusResponse,
  CopilotSuggestedPrompt,
  CopilotChatResponse,
} from "@/types/api";
import {
  sendCopilotMessage,
  getCopilotStatus,
  getCopilotPrompts,
} from "@/lib/api-client";
import { CopilotStatusBanner } from "./CopilotStatusBanner";
import { SuggestedPromptsBar } from "./SuggestedPromptsBar";
import { CopilotMessageBubble, ChatMessage } from "./CopilotMessageBubble";
import {
  Send,
  Trash2,
  Bot,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Terminal,
} from "lucide-react";

export function CopilotChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<CopilotStatusResponse | null>(null);
  const [prompts, setPrompts] = useState<CopilotSuggestedPrompt[]>([]);
  const [conversationId, setConversationId] = useState<string>(() => `conv_${Date.now()}`);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load status and suggested prompts on mount
  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const [stat, p] = await Promise.all([
          getCopilotStatus().catch(() => ({
            is_configured: false,
            model_name: "gemini-2.5-flash",
            demo_mode: true,
            tools_count: 10,
            allowlist: [
              "get_terminal_status",
              "get_vessel_details",
              "list_vessels_at_risk",
              "get_berth_availability",
              "get_berth_plan",
              "run_berth_optimization",
              "run_scenario_simulation",
              "get_yard_risk_summary",
              "get_emissions_estimate",
              "get_data_provenance",
            ],
          })),
          getCopilotPrompts().catch(() => [
            {
              label: "Terminal Overview & Draft",
              query: "What is the current terminal status, berth occupancy, and Karnaphuli environmental conditions?",
              category: "terminal",
            },
            {
              label: "Vessels at Delay Risk",
              query: "Which incoming feeder vessels are flagged with high delay risk and what are their draft requirements?",
              category: "vessel",
            },
            {
              label: "OR-Tools Berth Schedule",
              query: "Explain the current OR-Tools berth allocation proposal and turnaround performance.",
              category: "berth",
            },
            {
              label: "Monsoon Disruption Sim",
              query: "Run a SimPy scenario simulation for monsoon squall conditions and report anchorage queue impact.",
              category: "scenario",
            },
            {
              label: "Green Port Emissions",
              query: "Summarize modeled greenhouse gas emissions and environmental telemetry for the current shift.",
              category: "sustainability",
            },
          ]),
        ]);

        if (mounted) {
          setStatus(stat);
          setPrompts(p);
        }
      } catch (err) {
        console.error("Failed to load initial copilot metadata", err);
      }
    }
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isSubmitting) return;

    setError(null);
    setInputQuery("");

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: "user",
      content: query,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsSubmitting(true);

    try {
      const resp: CopilotChatResponse = await sendCopilotMessage({
        message: query,
        conversation_id: conversationId,
      });

      const assistantMsg: ChatMessage = {
        id: `ast_${Date.now()}`,
        sender: "copilot",
        content: resp.summary,
        responsePayload: resp,
        timestamp: resp.timestamp || new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: "copilot",
        content: `Error communicating with copilot service: ${err.message || "Request timed out"}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      setError(err.message || "Failed to contact copilot backend service.");
    } finally {
      setIsSubmitting(false);
      textareaRef.current?.focus();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    setConversationId(`conv_${Date.now()}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Status & Configuration Banner */}
      <CopilotStatusBanner status={status} />

      {/* Main Chat Workspace */}
      <div className="bg-white rounded-lg border border-portos-border shadow-xs overflow-hidden flex flex-col h-[700px]">
        {/* Chat Header Actions */}
        <div className="px-4 py-2.5 bg-slate-50 border-b border-portos-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-portos-navy" />
            <span className="text-xs font-bold text-portos-navy uppercase tracking-wider">
              Operational Advisory Session
            </span>
            <span className="text-[10px] text-portos-muted font-mono">
              ({conversationId.slice(0, 16)})
            </span>
          </div>

          <button
            onClick={handleClearChat}
            disabled={messages.length === 0}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-rose-700 bg-white border border-portos-border hover:border-rose-300 rounded transition-colors disabled:opacity-40 disabled:hover:text-slate-600 disabled:hover:border-portos-border shadow-2xs"
            title="Clear Chat History"
          >
            <Trash2 className="h-3 w-3" />
            <span>Reset Session</span>
          </button>
        </div>

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/30">
          {messages.length === 0 ? (
            /* Welcome Empty State */
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto py-8">
              <div className="p-3 rounded-full bg-portos-teal/10 text-portos-teal mb-3">
                <Sparkles className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold text-portos-navy">
                Port Intelligence Copilot
              </h3>
              <p className="text-xs text-portos-muted mt-1 leading-relaxed">
                Ask operational questions regarding Chattogram container traffic, OR-Tools berth allocations, Karnaphuli river drafts, yard density forecasts, and Green Port estimates.
              </p>

              {/* Guardrails Callout */}
              <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1 w-full shadow-2xs">
                <div className="flex items-center gap-1.5 font-bold text-amber-800">
                  <ShieldCheck className="h-4 w-4 text-amber-700" />
                  <span>Strict Advisory Separation</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-normal">
                  All suggestions are advisory decision support. Navigational commands, vessel maneuvers, and crane movements are automatically refused and require human port authority authorization.
                </p>
              </div>

              {/* Starter Query Suggestions */}
              <div className="mt-6 w-full space-y-2 text-left">
                <div className="text-[11px] font-semibold text-portos-muted uppercase tracking-wider text-center">
                  Select a starter inquiry:
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {prompts.slice(0, 4).map((p, idx) => {
                    const displayTitle = p.title || p.label || "Operational Inquiry";
                    const queryText = p.prompt || p.query || "";
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(queryText)}
                        className="p-2.5 rounded border border-portos-border bg-white hover:border-portos-teal hover:bg-slate-50 transition-all text-left text-xs text-portos-navy shadow-2xs flex flex-col justify-between"
                      >
                        <span className="font-semibold">{displayTitle}</span>
                        <span className="text-[11px] text-portos-muted mt-1 line-clamp-2">
                          {queryText}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Active Conversation Bubbles */
            messages.map((msg) => (
              <CopilotMessageBubble key={msg.id} message={msg} />
            ))
          )}

          {/* Thinking / Tool Invocation Progress Indicator */}
          {isSubmitting && (
            <div className="flex justify-start gap-2.5 items-start">
              <div className="h-7 w-7 rounded-full bg-portos-navy text-white flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <div className="rounded-lg p-3.5 bg-white border border-portos-border shadow-xs text-xs space-y-2 max-w-sm">
                <div className="flex items-center gap-2 text-portos-navy font-semibold">
                  <span className="h-2 w-2 rounded-full bg-portos-teal animate-ping" />
                  <span>Grounding via tool allowlist...</span>
                </div>
                <p className="text-[11px] text-portos-muted leading-relaxed">
                  Executing verified database queries, optimization models, and safety checks before synthesizing advisory response.
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input & Operational Prompts Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-portos-border space-y-3">
          {/* Quick Prompts Bar */}
          <SuggestedPromptsBar
            prompts={prompts}
            onSelectPrompt={(query) => handleSendMessage(query)}
            disabled={isSubmitting}
          />

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask the Port Intelligence Copilot (e.g., 'What is the current terminal status and Karnaphuli river draft?')..."
                rows={2}
                disabled={isSubmitting}
                className="w-full resize-none p-2.5 text-xs text-portos-navy bg-slate-50 border border-portos-border rounded-md focus:outline-none focus:ring-1 focus:ring-portos-teal focus:bg-white placeholder:text-portos-muted disabled:opacity-60 leading-relaxed"
              />
              <div className="absolute right-2 bottom-2 text-[10px] text-portos-muted">
                Press Enter to send
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !inputQuery.trim()}
              className="px-4 py-2.5 bg-portos-navy text-white text-xs font-semibold rounded-md hover:bg-portos-navy/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0 shadow-xs h-[52px]"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Inquire</span>
            </button>
          </form>

          {/* Error notice if present */}
          {error && (
            <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
