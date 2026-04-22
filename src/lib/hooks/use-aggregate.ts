"use client";
import { useMemo } from "react";
import { useWallets } from "@/lib/store/wallets";
import { useWalletData } from "./use-wallet-data";
import { useMids, useSpotMeta } from "./use-mids";
import { aggregate, type WalletSnapshot } from "@/lib/hyperliquid/aggregate";
import { useHydrated } from "./use-hydrated";

export function useAggregate() {
  const hydrated = useHydrated();
  const wallets = useWallets((s) => s.wallets);
  const walletResults = useWalletData(hydrated ? wallets : []);
  const mids = useMids();
  const spotMeta = useSpotMeta();

  const snapshots: WalletSnapshot[] = useMemo(
    () =>
      walletResults.map((r) => ({
        wallet: r.wallet,
        perp: r.data?.perp ?? null,
        spot: r.data?.spot ?? null,
        portfolio: r.data?.portfolio ?? null,
        error: r.error?.message,
      })),
    [walletResults],
  );

  const result = useMemo(
    () => aggregate(snapshots, mids.data ?? null, spotMeta.data ?? null),
    [snapshots, mids.data, spotMeta.data],
  );

  const isLoading =
    !hydrated ||
    walletResults.some((r) => r.isLoading) ||
    mids.isLoading ||
    spotMeta.isLoading;

  const isFetching =
    walletResults.some((r) => r.isFetching) ||
    mids.isFetching ||
    spotMeta.isFetching;

  const errors = walletResults
    .filter((r) => r.isError)
    .map((r) => ({ wallet: r.wallet, message: r.error?.message ?? "unknown" }));

  const lastUpdated = walletResults.reduce(
    (acc, r) => Math.max(acc, r.dataUpdatedAt || 0),
    0,
  );

  return {
    hydrated,
    snapshots,
    result,
    isLoading,
    isFetching,
    errors,
    lastUpdated,
    walletCount: wallets.length,
    activeCount: wallets.filter((w) => w.enabled).length,
  };
}
