"use client";
import { useQueries } from "@tanstack/react-query";
import { fetchPerp, fetchPortfolio, fetchSpot, stagger } from "@/lib/hyperliquid/client";
import type { Wallet } from "@/lib/store/wallets";
import { useSettings } from "@/lib/store/settings";
import type {
  ClearinghouseState,
  PortfolioResponse,
  SpotClearinghouseState,
} from "@/lib/hyperliquid/types";

type WalletFetch = {
  perp: ClearinghouseState;
  spot: SpotClearinghouseState;
  portfolio: PortfolioResponse;
};

export function useWalletData(wallets: Wallet[]) {
  const refreshMs = useSettings((s) => s.refreshMs);

  const results = useQueries({
    queries: wallets.map((w, idx) => ({
      queryKey: ["walletData", w.address],
      queryFn: async ({ signal }: { signal?: AbortSignal }): Promise<WalletFetch> => {
        // Stagger requests across wallets to smooth rate-limit load.
        await stagger(idx, 120);
        const [perp, spot, portfolio] = await Promise.all([
          fetchPerp(w.address, signal),
          fetchSpot(w.address, signal),
          fetchPortfolio(w.address, signal),
        ]);
        return { perp, spot, portfolio };
      },
      refetchInterval: refreshMs === 0 ? false : refreshMs,
      refetchIntervalInBackground: false,
      staleTime: Math.max(2_000, refreshMs - 1000),
      retry: 1,
    })),
  });

  return results.map((r, i) => ({
    wallet: wallets[i],
    data: r.data ?? null,
    isLoading: r.isLoading,
    isError: r.isError,
    error: r.error as Error | null,
    isFetching: r.isFetching,
    dataUpdatedAt: r.dataUpdatedAt,
  }));
}
