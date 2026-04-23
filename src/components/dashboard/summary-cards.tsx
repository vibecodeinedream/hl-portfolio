"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAggregate } from "@/lib/hooks/use-aggregate";
import { fmtPct, fmtUSD } from "@/lib/utils/format";
import { Wallet as WalletIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function Delta({ n, className }: { n: number; className?: string }) {
  const sign = n > 0 ? "+" : n < 0 ? "" : "";
  const color =
    n > 0 ? "text-[var(--positive)]" : n < 0 ? "text-[var(--negative)]" : "text-[var(--fg-muted)]";
  return (
    <span className={cn("mono", color, className)}>
      {sign}
      {fmtUSD(n)}
    </span>
  );
}

export function SummaryCards() {
  const { result, isLoading, hydrated } = useAggregate();
  const s = result.summary;

  if (!hydrated) return <SummaryCardsSkeleton />;

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      <Card>
        <CardHeader>
          <CardTitle>Total Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mono text-xl font-semibold leading-tight tracking-tight sm:text-[1.5rem] md:text-[1.75rem] text-[var(--fg)]">
            {isLoading ? <Skeleton className="h-8 w-24" /> : fmtUSD(s.totalValue, { compact: true })}
          </div>
          <div className="mt-2 flex gap-3 text-[11px] text-[var(--fg-subtle)]">
            <span>
              Perp <span className="mono text-[var(--fg-muted)]">{fmtUSD(s.totalPerpValue, { compact: true })}</span>
            </span>
            <span>
              Spot <span className="mono text-[var(--fg-muted)]">{fmtUSD(s.spotUsdValue, { compact: true })}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unrealized P&amp;L</CardTitle>
        </CardHeader>
        <CardContent>
          <Delta n={s.totalUnrealizedPnl} className="text-xl font-semibold leading-tight tracking-tight sm:text-[1.5rem] md:text-[1.75rem]" />
          <div className="mt-2 flex gap-3 text-[11px] text-[var(--fg-subtle)]">
            <span>
              ROE <span className={cn(
                "mono",
                s.weightedRoePct > 0 ? "text-[var(--positive)]" : s.weightedRoePct < 0 ? "text-[var(--negative)]" : "text-[var(--fg-muted)]",
              )}>{fmtPct(s.weightedRoePct, 2, true)}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position Value</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mono text-xl font-semibold leading-tight tracking-tight sm:text-[1.5rem] md:text-[1.75rem] text-[var(--fg)]">
            {fmtUSD(s.totalPositionValue, { compact: true })}
          </div>
          <div className="mt-2 flex gap-3 text-[11px] text-[var(--fg-subtle)]">
            <span>
              Leverage <span className="mono text-[var(--fg-muted)]">{s.weightedLeverage.toFixed(2)}x</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Withdrawable</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mono text-xl font-semibold leading-tight tracking-tight sm:text-[1.5rem] md:text-[1.75rem] text-[var(--fg)]">
            {fmtUSD(s.totalWithdrawable, { compact: true })}
          </div>
          <div className="mt-2 flex gap-3 text-[11px] text-[var(--fg-subtle)]">
            <span>
              Margin used{" "}
              <span className={cn(
                "mono",
                s.marginUsagePct > 70 ? "text-[var(--warning)]" : s.marginUsagePct > 90 ? "text-[var(--negative)]" : "text-[var(--fg-muted)]",
              )}>{fmtPct(s.marginUsagePct, 1)}</span>
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-1.5">
            <WalletIcon className="h-3 w-3" /> Wallets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mono text-xl font-semibold leading-tight tracking-tight sm:text-[1.5rem] md:text-[1.75rem] text-[var(--fg)]">
            {s.activeWallets}
            <span className="text-[var(--fg-subtle)]"> / {s.totalWallets}</span>
          </div>
          <div className="mt-2 flex gap-3 text-[11px] text-[var(--fg-subtle)]">
            <span>enabled of total</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-3 w-16" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="mt-2 h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
