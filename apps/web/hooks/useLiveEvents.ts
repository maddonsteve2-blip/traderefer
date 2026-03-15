"use client";

import { useEffect, useRef, useCallback, createContext, useContext, useState } from "react";
import { useAuth } from "@clerk/nextjs";

export interface LiveEvent {
  type: string;
  payload: Record<string, unknown>;
}

type Listener = (event: LiveEvent) => void;

interface LiveEventsContextValue {
  subscribe: (eventType: string, listener: Listener) => () => void;
  connected: boolean;
}

export const LiveEventsContext = createContext<LiveEventsContextValue>({
  subscribe: () => () => {},
  connected: false,
});

export function useLiveEvent(eventType: string, listener: Listener) {
  const { subscribe } = useContext(LiveEventsContext);
  const listenerRef = useRef(listener);
  listenerRef.current = listener;

  useEffect(() => {
    const unsub = subscribe(eventType, (e) => listenerRef.current(e));
    return unsub;
  }, [eventType, subscribe]);
}

/**
 * Manages the SSE connection to the backend.
 * Returns context value to provide to LiveEventsContext.Provider.
 */
export function useLiveEventsManager(): LiveEventsContextValue {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const listenersRef = useRef<Map<string, Set<Listener>>>(new Map());
  const esRef = useRef<EventSource | null>(null);
  const [connected, setConnected] = useState(false);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dispatch = useCallback((event: LiveEvent) => {
    // Dispatch to type-specific listeners
    const typeListeners = listenersRef.current.get(event.type);
    if (typeListeners) {
      typeListeners.forEach((fn) => {
        try { fn(event); } catch {}
      });
    }
    // Also dispatch to wildcard listeners
    const wildcardListeners = listenersRef.current.get("*");
    if (wildcardListeners) {
      wildcardListeners.forEach((fn) => {
        try { fn(event); } catch {}
      });
    }
  }, []);

  const subscribe = useCallback((eventType: string, listener: Listener) => {
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set());
    }
    listenersRef.current.get(eventType)!.add(listener);
    return () => {
      listenersRef.current.get(eventType)?.delete(listener);
    };
  }, []);

  const connect = useCallback(async () => {
    if (esRef.current) {
      esRef.current.close();
      esRef.current = null;
    }

    try {
      const token = await getToken();
      if (!token) return;

      // Connect directly to Railway API for SSE (Vercel serverless can't hold long connections)
      const apiBase = (process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
      const sseUrl = `${apiBase}/api/events/stream?token=${encodeURIComponent(token)}`;

      const es = new EventSource(sseUrl);
      esRef.current = es;

      es.onopen = () => {
        setConnected(true);
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type && data.type !== "connected") {
            dispatch(data);
          }
        } catch {}
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        esRef.current = null;
        // Reconnect after 5s
        reconnectTimer.current = setTimeout(() => connect(), 5000);
      };
    } catch {
      // Retry after 10s on auth failure
      reconnectTimer.current = setTimeout(() => connect(), 10000);
    }
  }, [getToken, dispatch]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    connect();

    return () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
      }
    };
  }, [isLoaded, isSignedIn, connect]);

  return { subscribe, connected };
}
