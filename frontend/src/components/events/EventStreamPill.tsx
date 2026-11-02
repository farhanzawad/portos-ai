"use client";

import React from "react";
import { useEventStream } from "@/context/EventStreamContext";
import { Activity, Wifi, WifiOff, RefreshCw } from "lucide-react";

interface EventStreamPillProps {
  showDetails?: boolean;
}

export function EventStreamPill({ showDetails = false }: EventStreamPillProps) {
  const { connectionStatus, events, reconnect } = useEventStream();

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "CONNECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>SSE Stream Live</span>
          </span>
        );
      case "CONNECTING":
      case "RECONNECTING":
        return (
          <button
            onClick={reconnect}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
            title="Click to manually reconnect"
          >
            <RefreshCw className="h-2.5 w-2.5 animate-spin text-amber-600" />
            <span>{connectionStatus === "CONNECTING" ? "Connecting..." : "Reconnecting..."}</span>
          </button>
        );
      case "DISCONNECTED":
      default:
        return (
          <button
            onClick={reconnect}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-colors"
            title="Click to reconnect"
          >
            <WifiOff className="h-2.5 w-2.5 text-rose-600" />
            <span>Stream Offline</span>
          </button>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getStatusBadge()}
      {showDetails && (
        <span className="text-[10px] font-mono text-portos-muted">
          ({events.length} events logged)
        </span>
      )}
    </div>
  );
}

