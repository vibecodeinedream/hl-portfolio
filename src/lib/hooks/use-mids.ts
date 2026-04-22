"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchAllMids, fetchSpotMeta } from "@/lib/hyperliquid/client";
import { useSettings } from "@/lib/store/settings";

export function useMids() {
  const refreshMs = useSettings((s) => s.refreshMs);
  return useQuery({
    queryKey: ["allMids"],
    queryFn: ({ signal }) => fetchAllMids(signal),
    refetchInterval: refreshMs === 0 ? false : refreshMs,
    refetchIntervalInBackground: false,
    staleTime: Math.max(2_000, refreshMs - 1000),
  });
}

export function useSpotMeta() {
  return useQuery({
    queryKey: ["spotMeta"],
    queryFn: ({ signal }) => fetchSpotMeta(signal),
    staleTime: 1000 * 60 * 60, // 1h — rarely changes
    gcTime: 1000 * 60 * 60 * 2,
  });
}
