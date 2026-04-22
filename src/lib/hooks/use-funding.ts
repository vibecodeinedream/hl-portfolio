"use client";
import { useQueries } from "@tanstack/react-query";
import { fetchFunding, stagger } from "@/lib/hyperliquid/client";
import type { Wallet } from "@/lib/store/wallets";
import type { FundingEvent } from "@/lib/hyperliquid/types";
import { useSettings } from "@/lib/store/settings";

export type WalletFunding = {
  wallet: Wallet;
  events: (FundingEvent & { walletId: string; walletLabel: string; walletColor: string })[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
};

export function useFunding(
  wallets: Wallet[],
  startTime: number,
  endTime?: number,
): WalletFunding[] {
  const refreshMs = useSettings((s) => s.refreshMs);
  const results = useQueries({
    queries: wallets.map((w, idx) => ({
      queryKey: ["funding", w.address, startTime, endTime ?? null],
      queryFn: async ({ signal }: { signal?: AbortSignal }) => {
        await stagger(idx, 120);
        return fetchFunding(w.address, startTime, endTime, signal);
      },
      refetchInterval: refreshMs === 0 ? false : Math.max(refreshMs, 30_000),
      refetchIntervalInBackground: false,
      staleTime: 20_000,
    })),
  });

  return results.map((r, i) => ({
    wallet: wallets[i],
    events: (r.data ?? []).map((e) => ({
      ...e,
      walletId: wallets[i].id,
      walletLabel: wallets[i].label,
      walletColor: wallets[i].color,
    })),
    isLoading: r.isLoading,
    isError: r.isError,
    error: r.error as Error | null,
  }));
}
