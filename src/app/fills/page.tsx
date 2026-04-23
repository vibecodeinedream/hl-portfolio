"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useWallets } from "@/lib/store/wallets";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { useFills, useFillsByTime } from "@/lib/hooks/use-fills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fmtDateTime,
  fmtPrice,
  fmtSize,
  fmtUSD,
  parseNum,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Fill } from "@/lib/hyperliquid/types";

type DecoratedFill = Fill & { walletId: string; walletLabel: string; walletColor: string };

const PAGE_SIZE = 50;

export default function FillsPage() {
  const hydrated = useHydrated();
  const wallets = useWallets((s) => s.wallets);
  const enabledWallets = wallets.filter((w) => w.enabled);

  const [walletFilter, setWalletFilter] = useState<string>("all");
  const [coinFilter, setCoinFilter] = useState<string>("all");
  const [sideFilter, setSideFilter] = useState<"all" | "B" | "A">("all");
  const [page, setPage] = useState(0);
  const [olderWindow, setOlderWindow] = useState<{ start: number; end: number } | null>(null);

  const recent = useFills(hydrated ? enabledWallets : []);
  const older = useFillsByTime(
    hydrated && olderWindow ? enabledWallets : [],
    olderWindow?.start ?? 0,
    olderWindow?.end,
  );

  const allFills: DecoratedFill[] = useMemo(() => {
    const recentArr = recent.flatMap((r) => r.fills);
    const olderArr = olderWindow ? older.flatMap((r) => r.fills) : [];
    const dedup = new Map<string, DecoratedFill>();
    for (const f of [...recentArr, ...olderArr]) {
      dedup.set(`${f.walletId}:${f.tid}:${f.hash}`, f);
    }
    return Array.from(dedup.values()).sort((a, b) => b.time - a.time);
  }, [recent, older, olderWindow]);

  const coins = useMemo(() => {
    const s = new Set(allFills.map((f) => f.coin));
    return Array.from(s).sort();
  }, [allFills]);

  const filtered = useMemo(() => {
    return allFills.filter((f) => {
      if (walletFilter !== "all" && f.walletId !== walletFilter) return false;
      if (coinFilter !== "all" && f.coin !== coinFilter) return false;
      if (sideFilter !== "all" && f.side !== sideFilter) return false;
      return true;
    });
  }, [allFills, walletFilter, coinFilter, sideFilter]);

  const closedPnlTotal = useMemo(
    () => filtered.reduce((acc, f) => acc + parseNum(f.closedPnl), 0),
    [filtered],
  );
  const feeTotal = useMemo(
    () => filtered.reduce((acc, f) => acc + parseNum(f.fee), 0),
    [filtered],
  );

  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  function loadOlder() {
    const oldest = allFills[allFills.length - 1]?.time ?? Date.now();
    const start = oldest - 30 * 24 * 60 * 60 * 1000;
    setOlderWindow({ start, end: oldest });
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-4 px-4 py-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Fills</h1>
        <div className="flex flex-wrap gap-2">
          <Select value={walletFilter} onValueChange={setWalletFilter}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All wallets</SelectItem>
              {enabledWallets.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={coinFilter} onValueChange={setCoinFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All coins</SelectItem>
              {coins.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sideFilter}
            onValueChange={(v) => setSideFilter(v as "all" | "B" | "A")}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Buy &amp; Sell</SelectItem>
              <SelectItem value="B">Buy</SelectItem>
              <SelectItem value="A">Sell</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-baseline gap-4">
            <CardTitle>Summary</CardTitle>
            <span className="text-[11px] text-[var(--fg-subtle)]">
              {filtered.length} fills
            </span>
          </div>
          <div className="flex items-baseline gap-6 text-[11px] text-[var(--fg-subtle)]">
            <span>
              Closed P&amp;L{" "}
              <span
                className={cn(
                  "mono text-sm",
                  closedPnlTotal > 0
                    ? "text-[var(--positive)]"
                    : closedPnlTotal < 0
                      ? "text-[var(--negative)]"
                      : "text-[var(--fg-muted)]",
                )}
              >
                {fmtUSD(closedPnlTotal, { sign: true })}
              </span>
            </span>
            <span>
              Fees{" "}
              <span className="mono text-sm text-[var(--fg-muted)]">
                {fmtUSD(feeTotal)}
              </span>
            </span>
            <span>
              Net{" "}
              <span
                className={cn(
                  "mono text-sm",
                  closedPnlTotal - feeTotal > 0
                    ? "text-[var(--positive)]"
                    : closedPnlTotal - feeTotal < 0
                      ? "text-[var(--negative)]"
                      : "text-[var(--fg-muted)]",
                )}
              >
                {fmtUSD(closedPnlTotal - feeTotal, { sign: true })}
              </span>
            </span>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-2">
          <div className="overflow-x-auto">
            {!hydrated ? (
              <div className="px-4 py-8 text-center text-xs text-[var(--fg-subtle)]">Loading…</div>
            ) : enabledWallets.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[var(--fg-subtle)]">
                Enable at least one wallet to see fills.
              </div>
            ) : paged.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[var(--fg-subtle)]">
                No fills match these filters.
              </div>
            ) : (
              <FillsTable fills={paged} />
            )}
          </div>

          <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-2 text-[11px]">
            <div className="text-[var(--fg-subtle)]">
              Page {page + 1} / {pageCount}
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ArrowLeft className="h-3 w-3" />
                Prev
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
              >
                Next
                <ArrowRight className="h-3 w-3" />
              </Button>
              <Button variant="outline" size="sm" onClick={loadOlder}>
                Load older
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FillsTable({ fills }: { fills: DecoratedFill[] }) {
  return (
    <table className="w-full min-w-[780px] text-xs">
      <thead className="border-b border-[var(--border)] bg-[var(--surface)]">
        <tr>
          <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Time
          </th>
          <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Wallet
          </th>
          <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Coin
          </th>
          <th className="px-3 py-2 text-left text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Side
          </th>
          <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Price
          </th>
          <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Size
          </th>
          <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Notional
          </th>
          <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Fee
          </th>
          <th className="px-3 py-2 text-right text-[10px] font-medium uppercase tracking-wider text-[var(--fg-subtle)]">
            Closed P&amp;L
          </th>
        </tr>
      </thead>
      <tbody>
        {fills.map((f) => {
          const px = parseNum(f.px);
          const sz = parseNum(f.sz);
          const fee = parseNum(f.fee);
          const closed = parseNum(f.closedPnl);
          const notional = px * sz;
          const buy = f.side === "B";
          const isClose = f.dir.toLowerCase().includes("close");
          return (
            <tr
              key={`${f.walletId}:${f.tid}:${f.hash}`}
              className="border-b border-[var(--border)]/60"
            >
              <td className="mono px-3 py-2 text-[var(--fg-muted)]">
                {fmtDateTime(f.time)}
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: f.walletColor }}
                  />
                  <span className="text-[var(--fg-muted)]">{f.walletLabel}</span>
                </div>
              </td>
              <td className="px-3 py-2 font-medium text-[var(--fg)]">{f.coin}</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1">
                  <Badge variant={buy ? "long" : "short"}>{buy ? "BUY" : "SELL"}</Badge>
                  <Badge variant="subtle">{isClose ? "CLOSE" : "OPEN"}</Badge>
                </div>
              </td>
              <td className="mono px-3 py-2 text-right text-[var(--fg)]">{fmtPrice(px)}</td>
              <td className="mono px-3 py-2 text-right text-[var(--fg)]">{fmtSize(sz)}</td>
              <td className="mono px-3 py-2 text-right text-[var(--fg)]">{fmtUSD(notional)}</td>
              <td className="mono px-3 py-2 text-right text-[var(--fg-muted)]">{fmtUSD(fee)}</td>
              <td
                className={cn(
                  "mono px-3 py-2 text-right",
                  closed > 0
                    ? "text-[var(--positive)]"
                    : closed < 0
                      ? "text-[var(--negative)]"
                      : "text-[var(--fg-subtle)]",
                )}
              >
                {closed !== 0 ? fmtUSD(closed, { sign: true }) : "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
