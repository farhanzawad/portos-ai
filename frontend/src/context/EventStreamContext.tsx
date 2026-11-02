"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  EventMessage,
  IncidentPreset,
  IncidentInjectionResponse,
  IncidentResetResponse,
} from "@/types/api";
import {
  getEventStreamUrl,
  getEventHistory,
  getIncidentPresets,
  injectIncident as apiInjectIncident,
  resetIncident as apiResetIncident,
} from "@/lib/api-client";

export type ConnectionStatus = "CONNECTED" | "CONNECTING" | "RECONNECTING" | "DISCONNECTED";

interface EventStreamContextValue {
  connectionStatus: ConnectionStatus;
  events: EventMessage[];
  lastEvent: EventMessage | null;
  activeIncident: string | null;
  presets: IncidentPreset[];
  isInjecting: boolean;
  isResetting: boolean;
  injectIncidentAction: (incidentType: string, delayHours?: number) => Promise<IncidentInjectionResponse | null>;
  resetIncidentAction: () => Promise<IncidentResetResponse | null>;
  clearEventLog: () => void;
  reconnect: () => void;
}

const EventStreamContext = createContext<EventStreamContextValue | undefined>(undefined);

export function EventStreamProvider({ children }: { children: React.ReactNode }) {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("CONNECTING");
  const [events, setEvents] = useState<EventMessage[]>([]);
  const [lastEvent, setLastEvent] = useState<EventMessage | null>(null);
  const [activeIncident, setActiveIncident] = useState<string | null>(null);
  const [presets, setPresets] = useState<IncidentPreset[]>([]);
  const [isInjecting, setIsInjecting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial event history and presets on mount
  useEffect(() => {
    let mounted = true;
    async function loadInitial() {
      try {
        const [hist, p] = await Promise.all([
          getEventHistory(30).catch(() => []),
          getIncidentPresets().catch(() => []),
        ]);
        if (mounted) {
          if (hist.length > 0) {
            setEvents(hist.reverse());
            setLastEvent(hist[0]);
            lastEventIdRef.current = hist[0].id;
          }
          setPresets(p);
        }
      } catch (err) {
        console.error("Failed to fetch initial event stream history", err);
      }
    }
    loadInitial();
    return () => {
      mounted = false;
    };
  }, []);

  // Connect to SSE stream
  const connectSSE = useCallback(() => {
    if (typeof window === "undefined") return;

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setConnectionStatus((prev) => (prev === "DISCONNECTED" ? "CONNECTING" : "RECONNECTING"));

    const url = getEventStreamUrl(lastEventIdRef.current || undefined);
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnectionStatus("CONNECTED");
    };

    // Generic message handler
    es.onmessage = (e) => {
      try {
        const data: EventMessage = JSON.parse(e.data);
        if (data && data.id) {
          lastEventIdRef.current = data.id;
          setLastEvent(data);
          setEvents((prev) => [data, ...prev.slice(0, 99)]); // Keep latest 100 in view

          if (data.event_type === "incident.injected") {
            setActiveIncident(data.payload?.incident_type || "active_incident");
          } else if (data.event_type === "incident.reset") {
            setActiveIncident(null);
          }
        }
      } catch (err) {
        // SSE ping or format
      }
    };

    es.onerror = () => {
      setConnectionStatus("RECONNECTING");
      es.close();
      eventSourceRef.current = null;

      // Exponential or safe retry
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        connectSSE();
      }, 3500);
    };
  }, []);

  useEffect(() => {
    connectSSE();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectSSE]);

  const injectIncidentAction = async (
    incidentType: string,
    delayHours: number = 6.5
  ): Promise<IncidentInjectionResponse | null> => {
    setIsInjecting(true);
    try {
      const resp = await apiInjectIncident({
        incident_type: incidentType,
        delay_hours: delayHours,
      });
      setActiveIncident(incidentType);
      if (resp && resp.events) {
        setEvents((prev) => [...resp.events, ...prev.slice(0, 99)]);
        if (resp.events.length > 0) {
          setLastEvent(resp.events[0]);
          lastEventIdRef.current = resp.events[0].id;
        }
      }
      return resp;
    } catch (err) {
      console.error("Failed to inject operational incident", err);
      return null;
    } finally {
      setIsInjecting(false);
    }
  };

  const resetIncidentAction = async (): Promise<IncidentResetResponse | null> => {
    setIsResetting(true);
    try {
      const resp = await apiResetIncident();
      setActiveIncident(null);
      const resetEvt: EventMessage = {
        id: `evt_rst_${Date.now()}`,
        event_type: "incident.reset",
        emitted_at: new Date().toISOString(),
        entity_id: "system",
        payload_schema_version: "1.0.0",
        data_status: "SIMULATED",
        origin: "INCIDENT_INJECTOR",
        payload: { message: "Baseline restored" },
      };
      setEvents((prev) => [resetEvt, ...prev.slice(0, 99)]);
      setLastEvent(resetEvt);
      return resp;
    } catch (err) {
      console.error("Failed to reset operational incident", err);
      return null;
    } finally {
      setIsResetting(false);
    }
  };

  const clearEventLog = () => {
    setEvents([]);
  };

  return (
    <EventStreamContext.Provider
      value={{
        connectionStatus,
        events,
        lastEvent,
        activeIncident,
        presets,
        isInjecting,
        isResetting,
        injectIncidentAction,
        resetIncidentAction,
        clearEventLog,
        reconnect: connectSSE,
      }}
    >
      {children}
    </EventStreamContext.Provider>
  );
}

export function useEventStream() {
  const context = useContext(EventStreamContext);
  if (!context) {
    throw new Error("useEventStream must be used within an EventStreamProvider");
  }
  return context;
}
