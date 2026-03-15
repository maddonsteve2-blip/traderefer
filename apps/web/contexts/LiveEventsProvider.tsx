"use client";

import { ReactNode } from "react";
import { LiveEventsContext, useLiveEventsManager } from "@/hooks/useLiveEvents";

export function LiveEventsProvider({ children }: { children: ReactNode }) {
  const value = useLiveEventsManager();
  return (
    <LiveEventsContext.Provider value={value}>
      {children}
    </LiveEventsContext.Provider>
  );
}
