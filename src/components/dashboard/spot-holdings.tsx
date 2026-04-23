"use client";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useAggregate } from "@/lib/hooks/use-aggregate";
import { fmtNum, fmtPct, fmtUSD } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export function SpotHoldings() {
  const { result, hydrated } = useAggregate();
  const [open, setOpen] = useState(false);
  const [showDust, setShowDust] = useState(false);

  const visible = useMemo(() => {
    const arr = showDust ? result.spot : result.spot.filter((s) => s.usdValue >= 1);
    return arr;
  }, [result.spot, showDust]);

  const total = result.summary.spotUsdValue;

  if (!hydrated) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 text-left"
        >
          {open ? (
            <ChevronDown className="h-3 w-3 text-[var(--fg-subtle)]" />
          ) : (
            <ChevronRight className="h-3 w-3 text-[var(--fg-subtle)]" />
          )}
          <CardTitle>Spot Holdings</CardTitle>
          <span className="mono money text-xs text-[var(--fg)]">
            {fmtUSD(total, { compact: true })}
          </span>
          <span className="text-[10px] text-[var(--fg-subtle)]">
            {result.spot.length} positions
          </span>
        </button>
        {open && (
          <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[var(--fg-muted)]">
            <span>Show dust (&lt; $1)</span>
            <Switch checked={showDust} onCheckedChange={setShowDust} />
          </label>
        )}
      </CardHeader>
      {open && (
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            {visible.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[var(--fg-subtle)]">
                {showDust ? "No spot balances." : "No spot balances above $1. Toggle dust to see all."}
              </div>
            ) : (
              <table className="w-full min-w-[580px] text-[13px]">
                <thead className="border-b border-[var(--border)]">
                  <tr>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                      Wallet
                    </th>
                    <th className="px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                      Coin
                    </th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                      Balance
                    </th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                      USD Value
                    </th>
                    <th className="px-3 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                      % of Spot
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((s, i) => {
                    const pct = total > 0 ? (s.usdValue / total) * 100 : 0;
                    return (
                      <tr
                        key={`${s.walletId}:${s.rawCoin}:${i}`}
                        className={cn(
                          "border-b border-[var(--border)]/60",
                          "even:bg-[var(--surface-elevated)]/25 hover:bg-[var(--surface-elevated)]/50",
                        )}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{ background: s.walletColor }}
                            />
                            <span className="text-[var(--fg-muted)]">
                              {s.walletLabel}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-[var(--fg)]">{s.coin}</td>
                        <td className="mono px-3 py-2.5 text-right text-[var(--fg)]">
                          {fmtNum(s.total, 6)}
                        </td>
                        <td className="mono money px-3 py-2.5 text-right text-[var(--fg)]">
                          {fmtUSD(s.usdValue)}
                        </td>
                        <td className="mono px-3 py-2.5 text-right text-[var(--fg-muted)]">
                          {fmtPct(pct, 1)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
