"use client";
import { useQueries } from "@tanstack/react-query";
import { fetchFills, fetchFillsByTime, stagger } from "@/lib/hyperliquid/client";
import type { Wallet } from "@/lib/store/wallets";
import type { Fill } from "@/lib/hyperliquid/types";
import { useSettings } from "@/lib/store/settings";

export type WalletFills = {
  wallet: Wallet;
  fills: (Fill & { walletId: string; walletLabel: string; walletColor: string })[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

// Recent fills — polled on same cadence as other wallet data.
export function useFills(wallets: Wallet[]): WalletFills[] {
  const refreshMs = useSettings((s) => s.refreshMs);
  const results = useQueries({
    queries: wallets.map((w, idx) => ({
      queryKey: ["fills", w.address],
      queryFn: async ({ signal }: { signal?: AbortSignal }) => {
        await stagger(idx, 120);
        return fetchFills(w.address, signal);
      },
      refetchInterval: refreshMs === 0 ? false : Math.max(refreshMs, 10_000),
      refetchIntervalInBackground: false,
      staleTime: 8_000,
    })),
  });

  return results.map((r, i) => ({
    wallet: wallets[i],
    fills: (r.data ?? []).map((f) => ({
      ...f,
      walletId: wallets[i].id,
      walletLabel: wallets[i].label,
      walletColor: wallets[i].color,
    })),
    isLoading: r.isLoading,
    isError: r.isError,
    error: r.error as Error | null,
  }));
}

// Historical paginated fills — fired explicitly when user pages past recent window.
export function useFillsByTime(wallets: Wallet[], startTime: number, endTime?: number) {
  const results = useQueries({
    queries: wallets.map((w, idx) => ({
      queryKey: ["fillsByTime", w.address, startTime, endTime ?? null],
      queryFn: async ({ signal }: { signal?: AbortSignal }) => {
        await stagger(idx, 120);
        return fetchFillsByTime(w.address, startTime, endTime, signal);
      },
      staleTime: 60_000,
    })),
  });
  return results.map((r, i) => ({
    wallet: wallets[i],
    fills: (r.data ?? []).map((f) => ({
      ...f,
      walletId: wallets[i].id,
      walletLabel: wallets[i].label,
      walletColor: wallets[i].color,
    })),
    isLoading: r.isLoading,
    isError: r.isError,
    error: r.error as Error | null,
  }));
}
