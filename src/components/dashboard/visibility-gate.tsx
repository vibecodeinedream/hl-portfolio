"use client";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSettings } from "@/lib/store/settings";

// When "pauseWhenHidden" is off, kick a refetch on tab return.
// React Query already pauses intervals when hidden by default.
export function VisibilityGate() {
  const pauseWhenHidden = useSettings((s) => s.pauseWhenHidden);
  const client = useQueryClient();
  useEffect(() => {
    function onVis() {
      if (document.visibilityState === "visible") {
        client.invalidateQueries();
      }
    }
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [client, pauseWhenHidden]);
  return null;
}
