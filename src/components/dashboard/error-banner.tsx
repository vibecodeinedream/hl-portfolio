"use client";
import { AlertTriangle } from "lucide-react";
import { useAggregate } from "@/lib/hooks/use-aggregate";

export function ErrorBanner() {
  const { errors, snapshots } = useAggregate();

  const emptyAgentWarnings = snapshots
    .filter((s) => s.wallet.enabled && s.perp)
    .filter((s) => {
      const ms = s.perp!.marginSummary;
      return (
        s.perp!.assetPositions.length === 0 &&
        parseFloat(ms.accountValue) === 0 &&
        parseFloat(ms.totalRawUsd) === 0 &&
        (!s.spot || s.spot.balances.length === 0)
      );
    });

  if (errors.length === 0 && emptyAgentWarnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {errors.map((e) => (
        <div
          key={e.wallet.id}
          className="flex items-start gap-2 rounded-md border border-[var(--negative)]/40 bg-[var(--negative)]/10 px-3 py-2 text-xs"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--negative)]" />
          <div className="flex-1">
            <span className="font-medium text-[var(--fg)]">{e.wallet.label}</span>
            <span className="mx-1.5 text-[var(--fg-subtle)]">·</span>
            <span className="mono text-[var(--fg-muted)]">{e.message}</span>
          </div>
        </div>
      ))}
      {emptyAgentWarnings.map((s) => (
        <div
          key={s.wallet.id}
          className="flex items-start gap-2 rounded-md border border-[var(--warning)]/40 bg-[var(--warning)]/10 px-3 py-2 text-xs"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--warning)]" />
          <div className="flex-1">
            <span className="font-medium text-[var(--fg)]">{s.wallet.label}</span>
            <span className="mx-1.5 text-[var(--fg-subtle)]">·</span>
            <span className="text-[var(--fg-muted)]">
              No data. Is this an agent wallet? Use the master address instead.
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
